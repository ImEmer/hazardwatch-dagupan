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
const MAX_REPORTS = Number.parseInt(process.env.MAX_REPORTS || '15000', 10);
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
    if (!onlyDuplicateErrors) throw error;

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

  console.log(`[seed-reports] Reading ${CSV_PATH}`);
  console.log(`[seed-reports] Maximum reports: ${MAX_REPORTS}; batch size: ${BATCH_SIZE}`);
  await connectDB();

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
    for await (const row of fs.createReadStream(CSV_PATH).pipe(csv())) {
      if (stats.inserted + batch.length >= MAX_REPORTS) break;
      stats.totalRead += 1;
      if (stats.totalRead > MAX_REPORTS) break;

      if (!row['Request Type'] && !row.Category) {
        stats.skipped += 1;
        continue;
      }

      batch.push(mapReport(row, citizenUsers));
      if (batch.length === BATCH_SIZE) {
        const inserted = await insertBatch(batch);
        if (inserted === 0) throw new Error('A report batch inserted zero documents; stopping to prevent an unbounded import.');
        stats.inserted += inserted;
        batch = [];
        console.log(`[seed-reports] Progress: ${stats.totalRead} read, ${stats.inserted} inserted.`);
      }
    }

    if (batch.length > 0) {
      const inserted = await insertBatch(batch);
      if (inserted === 0) throw new Error('The final report batch inserted zero documents.');
      stats.inserted += inserted;
    }
  } finally {
    await mongoose.disconnect();
  }

  stats.skipped += stats.totalRead - stats.inserted - stats.skipped;
  console.log('[seed-reports] Seeding complete.');
  console.log(`Total read: ${stats.totalRead}`);
  console.log(`Total skipped: ${stats.skipped}`);
  console.log(`Total inserted: ${stats.inserted}`);
}

try {
  await seedReports();
} catch (error) {
  console.error(`[seed-reports] Failed: ${error.message}`);
  await mongoose.disconnect();
  process.exitCode = 1;
}