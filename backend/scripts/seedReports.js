import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import Report from '../models/Report.js';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';
import { DAGUPAN_BOUNDS, resolveBarangayFromCoords } from '../utils/dagupanBarangays.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '../seeders/data/sf311_cases.csv');
const MAX_REPORTS = Number.parseInt(process.env.MAX_REPORTS || '250000', 10);
const MAX_DATABASE_SIZE_BYTES = 400 * 1024 * 1024;
const BATCH_SIZE = 1_000;
const PROGRESS_INTERVAL = 50_000;
const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];
const CATEGORY_MAPPING = {
  'Street and Sidewalk Cleaning': 'Waste / Sanitation',
  Streetlights: 'Electrical / Streetlight',
  'Sewer Issues': 'Flood',
  'Sidewalk or Curb': 'Infrastructure',
  'Roadway Defects': 'Traffic / Road',
  'Tree Maintenance': 'Environmental',
  Graffiti: 'Public Safety',
  'Abandoned Vehicle': 'Traffic / Road',
  'Illegal Dumping': 'Waste / Sanitation',
  'Noise Report': 'Public Safety',
  'Damaged Property': 'Infrastructure',
  'General Requests': 'Other',
  'Rec and Park Requests': 'Environmental',
  'SFHA Requests': 'Infrastructure',
  '311 External Request': 'Other',
  'Street Defects': 'Traffic / Road',
  'Illegal Postings': 'Public Safety',
  'Signal Issues': 'Electrical / Streetlight',
};
const STREET_NAMES = [
  'Arellano', 'Avenida', 'Bonuan', 'Cacandungan', 'Fronda', 'Gomez', 'Luna',
  'Mabini', 'Natividad', 'Pangasinan', 'Perez', 'Quezon', 'Roxas', 'Sampaloc',
  'Tapuac', 'Talon', 'Villanueva', 'Zamora', 'Rizal', 'Bautista', 'Gonzales',
];
const DRY_RUN_LIMIT = process.argv.includes('--dry-run')
  ? 1_000
  : Number.parseInt(process.argv.find((arg) => arg.startsWith('--dry-run='))?.split('=')[1] || '0', 10);
const DRY_RUN = process.argv.includes('--dry-run') || DRY_RUN_LIMIT > 0;
const CONFIRMED = process.argv.includes('--confirm-production-seed');

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
const randomBetween = (minimum, maximum) => minimum + Math.random() * (maximum - minimum);

function configuredDatabaseName() {
  return process.env.MONGO_URI?.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^/?#]*)/i)?.[1] || null;
}

function randomSeptemberDate() {
  const start = Date.parse('2026-09-01T00:00:00.000Z');
  const end = Date.parse('2026-09-30T23:59:59.999Z');
  return new Date(randomBetween(start, end));
}

function randomDagupanLocation() {
  const { minLng, maxLng, minLat, maxLat } = DAGUPAN_BOUNDS;
  for (let attempt = 0; attempt < 10_000; attempt += 1) {
    const lng = randomBetween(minLng, maxLng);
    const lat = randomBetween(minLat, maxLat);
    const result = resolveBarangayFromCoords(lat, lng);
    if (result.status === 'resolved' && result.barangay) {
      return {
        barangay: result.barangay,
        location: { type: 'Point', coordinates: [lng, lat] },
      };
    }
  }
  throw new Error('Could not find a coordinate inside a Dagupan barangay polygon.');
}

function mapReport(row, citizenUsers) {
  const reportedBy = randomItem(citizenUsers);
  const { barangay, location } = randomDagupanLocation();
  const createdAt = randomSeptemberDate();
  const title = String(row['Request Type'] || row.Category || 'General Hazard').trim() || 'General Hazard';
  const sourceDescription = String(row['Request Details'] || row['Status Notes'] || '').trim();
  const description = sourceDescription || `${title} reported in the area.`;
  const category = CATEGORY_MAPPING[String(row.Category || '').trim()] || 'Other';
  const streetName = randomItem(STREET_NAMES);

  return {
    title: title.slice(0, 100),
    category,
    description: description.slice(0, 2_000),
    location,
    address: `${streetName} St, ${barangay}, Dagupan City`,
    barangay,
    images: [],
    status: randomItem(STATUSES),
    priority: randomItem(PRIORITIES),
    reportedBy: { userId: reportedBy._id, name: reportedBy.name, email: reportedBy.email },
    views: 0,
    isActive: true,
    archived: false,
    seeded: true,
    createdAt,
    updatedAt: createdAt,
  };
}

async function getStorageEstimate(db, additionalReports) {
  const [databaseStats, reportStats] = await Promise.all([
    db.stats(),
    db.command({ collStats: 'reports', scale: 1 }),
  ]);
  const currentDatabaseBytes = (databaseStats.dataSize || 0) + (databaseStats.indexSize || 0);
  const reportsCount = reportStats.count || 0;
  if (additionalReports > 0 && reportsCount === 0) {
    throw new Error('Cannot estimate storage without existing report documents.');
  }
  const bytesPerReport = reportsCount
    ? ((reportStats.size || 0) + (reportStats.totalIndexSize || 0)) / reportsCount
    : 0;
  return {
    currentDatabaseBytes,
    reportBytesPerDocument: bytesPerReport,
    additionalReports,
    estimatedAdditionalBytes: Math.ceil(bytesPerReport * additionalReports),
    estimatedProjectedBytes: Math.ceil(currentDatabaseBytes + (bytesPerReport * additionalReports)),
  };
}

async function insertBatch(batch) {
  const result = await Report.insertMany(batch, { ordered: false });
  return result.length;
}

async function seedReports() {
  if (!Number.isInteger(MAX_REPORTS) || MAX_REPORTS < 1) {
    throw new Error('MAX_REPORTS must be a positive integer.');
  }
  if (!fs.existsSync(CSV_PATH)) throw new Error(`CSV file not found: ${CSV_PATH}`);
  if (configuredDatabaseName() !== 'hazardwatch') {
    throw new Error('MONGO_URI must target hazardwatch; no database writes attempted.');
  }
  if (!DRY_RUN && !CONFIRMED) {
    throw new Error('Production insertion requires --confirm-production-seed.');
  }

  await connectDB();
  if (mongoose.connection.name !== 'hazardwatch') {
    throw new Error(`Connected to ${mongoose.connection.name}, not hazardwatch; refusing to continue.`);
  }

  try {
    const [existingSeeded, citizenUsers] = await Promise.all([
      Report.countDocuments({ seeded: true }),
      User.find({ role: 'user' }, { name: 1, email: 1 }).lean(),
    ]);
    if (citizenUsers.length === 0) throw new Error('No citizen users found to assign as reporters.');

    const targetReportsToAdd = Math.max(0, MAX_REPORTS - existingSeeded);
    const reportsToAdd = DRY_RUN ? DRY_RUN_LIMIT : targetReportsToAdd;
    const storage = await getStorageEstimate(mongoose.connection.db, targetReportsToAdd);
    console.log(JSON.stringify({
      database: mongoose.connection.name,
      targetSeededReports: MAX_REPORTS,
      existingSeededReports: existingSeeded,
      reportsToAdd,
      availableCitizenReporters: citizenUsers.length,
      storage,
      mode: DRY_RUN ? 'dry-run' : 'insert',
    }));

    if (DRY_RUN) {
      const reports = [];
      let rowsRead = 0;
      for await (const row of fs.createReadStream(CSV_PATH).pipe(csv())) {
        if (!row['Request Type'] && !row.Category) continue;
        const reportData = mapReport(row, citizenUsers);
        const validationError = new Report(reportData).validateSync();
        if (validationError) throw validationError;
        reports.push(reportData);
        rowsRead += 1;
        if (reports.length === DRY_RUN_LIMIT) break;
      }
      if (reports.length !== DRY_RUN_LIMIT) {
        throw new Error(`Dry run could validate only ${reports.length} report(s), expected ${DRY_RUN_LIMIT}.`);
      }
      const datesOutsideSeptember = reports.filter(({ createdAt, updatedAt }) => (
        createdAt < new Date('2026-09-01T00:00:00.000Z')
        || createdAt >= new Date('2026-10-01T00:00:00.000Z')
        || updatedAt.getTime() !== createdAt.getTime()
      )).length;
      const results = {
        validatedReports: reports.length,
        csvRowsRead: rowsRead,
        sampleCategory: reports[0].category,
        sampleBarangay: reports[0].barangay,
        sampleReporterAssigned: Boolean(reports[0].reportedBy.userId),
        datesOutsideSeptember,
        databaseWrites: 0,
        fullTargetFits400MiB: storage.estimatedProjectedBytes <= MAX_DATABASE_SIZE_BYTES,
      };
      console.log(JSON.stringify(results));
      if (!results.fullTargetFits400MiB) {
        console.warn('[seedReports] Full target exceeds the 400 MiB safety limit; production insertion is blocked.');
      }
      return;
    }

    if (storage.estimatedProjectedBytes > MAX_DATABASE_SIZE_BYTES) {
      throw new Error('Projected database usage exceeds the 400 MiB safety limit; no reports were inserted.');
    }
    if (reportsToAdd === 0) {
      console.log(`[seedReports] Already at target: ${existingSeeded} seeded reports.`);
      return;
    }

    let inserted = 0;
    let batch = [];
    for await (const row of fs.createReadStream(CSV_PATH).pipe(csv())) {
      if (inserted + batch.length >= reportsToAdd) break;
      if (!row['Request Type'] && !row.Category) continue;

      batch.push(mapReport(row, citizenUsers));
      if (batch.length < BATCH_SIZE && inserted + batch.length < reportsToAdd) continue;

      const liveStorage = await getStorageEstimate(
        mongoose.connection.db,
        Math.max(0, reportsToAdd - inserted),
      );
      if (liveStorage.estimatedProjectedBytes > MAX_DATABASE_SIZE_BYTES) {
        throw new Error('Projected database usage exceeds 400 MiB; stopped before inserting the next batch.');
      }
      inserted += await insertBatch(batch);
      batch = [];

      const currentStorage = await getStorageEstimate(mongoose.connection.db, 0);
      if (currentStorage.currentDatabaseBytes > MAX_DATABASE_SIZE_BYTES) {
        throw new Error('Database usage exceeded 400 MiB after the previous batch; stopped immediately.');
      }
      if (inserted > 0 && inserted % PROGRESS_INTERVAL === 0) {
        console.log(`[seedReports] Inserted ${inserted} report(s).`);
      }
    }

    const [finalSeededCount, finalStorage] = await Promise.all([
      Report.countDocuments({ seeded: true }),
      getStorageEstimate(mongoose.connection.db, 0),
    ]);
    console.log(JSON.stringify({
      inserted,
      finalSeededReportCount: finalSeededCount,
      finalDatabaseBytes: finalStorage.currentDatabaseBytes,
    }));
  } finally {
    await mongoose.disconnect();
  }
}

try {
  await seedReports();
} catch (error) {
  console.error(`[seedReports] Failed: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
}
