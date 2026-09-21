import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import Report from '../models/Report.js';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';
import { DAGUPAN_BARANGAYS, DAGUPAN_BOUNDS } from '../utils/dagupanBarangays.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '../seeders/data/sf311_cases.csv');
const MAX_REPORTS = Number.parseInt(process.env.MAX_REPORTS || '45000', 10);
const MAX_TOTAL = MAX_REPORTS;
const MAX_DATABASE_SIZE_MB = 400;
const BATCH_SIZE = 500;
const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
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

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
const randomBetween = (minimum, maximum) => minimum + Math.random() * (maximum - minimum);

function randomDateWithinLast30Days() {
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  return new Date(randomBetween(thirtyDaysAgo, now));
}

function randomLocation() {
  return {
    type: 'Point',
    coordinates: [
      randomBetween(DAGUPAN_BOUNDS.minLng, DAGUPAN_BOUNDS.maxLng),
      randomBetween(DAGUPAN_BOUNDS.minLat, DAGUPAN_BOUNDS.maxLat),
    ],
  };
}

function mapReport(row, citizenUsers) {
  const reportedBy = randomItem(citizenUsers);
  const createdAt = randomDateWithinLast30Days();
  const title = String(row['Request Type'] || row.Category || 'General Hazard').trim() || 'General Hazard';

  return {
    title: title.slice(0, 100),
    category: CATEGORY_MAPPING[String(row.Category || '').trim()] || 'Other',
    description: '',
    location: randomLocation(),
    address: '',
    barangay: randomItem(DAGUPAN_BARANGAYS),
    images: [],
    comments: [],
    status: randomItem(STATUSES),
    priority: randomItem(PRIORITIES),
    reportedBy: { userId: reportedBy._id, name: reportedBy.name, email: reportedBy.email },
    views: Math.floor(Math.random() * 51),
    isActive: true,
    archived: false,
    seeded: true,
    createdAt,
    updatedAt: createdAt,
  };
}

async function insertBatch(batch) {
  if (batch.length === 0) return 0;

  try {
    const inserted = await Report.insertMany(batch, { ordered: false });
    return inserted.length;
  } catch (error) {
    const writeErrors = error.writeErrors || [];
    const onlyDuplicateErrors = error.code === 11000 || (writeErrors.length > 0 && writeErrors.every(({ code }) => code === 11000));
    if (!onlyDuplicateErrors) {
      console.error(`[seedReports] Batch failed: ${error.message}`);
      return 0;
    }

    const duplicateCount = writeErrors.filter(({ code }) => code === 11000).length || 1;
    const insertedCount = error.insertedDocs?.length || batch.length - duplicateCount;
    console.warn(`[seed-reports] Skipped ${batch.length - insertedCount} duplicate report(s).`);
    return insertedCount;
  }
}

async function seedReports() {
  if (process.env.NODE_ENV === 'production') throw new Error('Report seeding is disabled when NODE_ENV=production.');
  if (!Number.isInteger(MAX_REPORTS) || MAX_REPORTS < 1) throw new Error('MAX_REPORTS must be a positive integer.');
  if (!fs.existsSync(CSV_PATH)) throw new Error(`CSV file not found: ${CSV_PATH}`);

  console.log(`[seedReports] Reading ${CSV_PATH}`);
  console.log(`[seedReports] Target reports: ${MAX_TOTAL}`);
  await connectDB();

  const existingReports = await Report.countDocuments();
  const reportsToAdd = Math.max(0, MAX_TOTAL - existingReports);
  console.log(`[seedReports] Existing reports: ${existingReports}`);
  console.log(`[seedReports] Adding: ${reportsToAdd}`);
  if (await getDatabaseSizeMb() >= MAX_DATABASE_SIZE_MB) {
    console.warn('[seed] Database size is above 400 MB. Skipping.');
    await mongoose.disconnect();
    return;
  }
  if (reportsToAdd === 0) {
    console.log(`[seedReports] Done. Total reports: ${existingReports}`);
    await mongoose.disconnect();
    return;
  }

  const citizenUsers = await User.aggregate([
    { $match: { role: 'user' } },
    { $sample: { size: 100 } },
    { $project: { name: 1, email: 1 } },
  ]);
  if (citizenUsers.length === 0) throw new Error('No citizen users found. Seed citizen users first.');
  console.log(`[seed-reports] Loaded ${citizenUsers.length} citizen reporters.`);

  const stats = { totalRead: 0, skipped: 0, inserted: 0 };
  let batch = [];

  try {
    const totalBatches = Math.ceil(reportsToAdd / BATCH_SIZE);
    let batchNumber = 0;
    for await (const row of fs.createReadStream(CSV_PATH).pipe(csv())) {
      if (stats.inserted + batch.length >= reportsToAdd) break;
      stats.totalRead += 1;

      if (!row['Request Type'] && !row.Category) {
        stats.skipped += 1;
        continue;
      }

      batch.push(mapReport(row, citizenUsers));
      if (batch.length === BATCH_SIZE || stats.inserted + batch.length >= reportsToAdd) {
        if (await getDatabaseSizeMb() >= MAX_DATABASE_SIZE_MB) {
          console.warn('[seed] Database size is above 400 MB. Stopping before the next batch.');
          break;
        }
        const inserted = await insertBatch(batch);
        stats.inserted += inserted;
        batchNumber += 1;
        batch = [];
        console.log(`[seedReports] Inserted batch ${batchNumber} / ${totalBatches}`);
      }
    }

    if (batch.length > 0) {
      if (await getDatabaseSizeMb() < MAX_DATABASE_SIZE_MB) {
        const inserted = await insertBatch(batch);
        stats.inserted += inserted;
      } else {
        console.warn('[seed] Database size is above 400 MB. Skipping final batch.');
      }
    }
    const finalCount = await Report.countDocuments();
    console.log(`[seedReports] Done. Total reports: ${finalCount}`);
  } finally {
    await mongoose.disconnect();
  }
}

try {
  await seedReports();
} catch (error) {
  console.error(`[seedReports] Failed: ${error.message}`);
  await mongoose.disconnect();
  process.exitCode = 1;
}

async function getDatabaseSizeMb() {
  const stats = await mongoose.connection.db.stats();
  return ((stats.dataSize || 0) + (stats.indexSize || 0)) / (1024 * 1024);
}