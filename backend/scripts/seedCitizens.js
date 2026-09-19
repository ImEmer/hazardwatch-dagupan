import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import csv from 'csv-parser';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '../seeders/data/crm_customers.csv');
const MAX_USERS = Number.parseInt(process.env.MAX_USERS || '10000', 10);
const BATCH_SIZE = 500;
const SEED_PASSWORD = process.env.SEED_CITIZEN_PASSWORD || 'Citizen@12345';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DRY_RUN = process.argv.includes('--dry-run');

function cleanName(value) {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^\p{L}\s'-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  return cleaned.replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toUpperCase());
}

function getName(row) {
  return cleanName(`${row.first_name || ''} ${row.last_name || ''}`);
}

function getEmail(row) {
  const email = String(row.email || '').trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

async function insertBatch(batch) {
  if (batch.length === 0) return 0;

  try {
    const result = await User.insertMany(batch, { ordered: false });
    return result.length;
  } catch (error) {
    const hasOnlyDuplicateErrors = error.writeErrors?.every(({ code }) => code === 11000);
    if (error.code !== 11000 && !hasOnlyDuplicateErrors) {
      throw error;
    }

    const duplicateErrors = error.writeErrors?.filter(({ code }) => code === 11000).length || 0;
    const inserted = error.insertedDocs?.length
      || error.result?.result?.nInserted
      || error.result?.insertedCount
      || batch.length - (duplicateErrors || 1);
    console.warn(`Batch completed with ${batch.length - inserted} duplicate user(s) skipped.`);
    return inserted;
  }
}

async function seedCitizens() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Citizen seeding is disabled when NODE_ENV=production.');
  }
  if (!Number.isInteger(MAX_USERS) || MAX_USERS < 1) {
    throw new Error('MAX_USERS must be a positive integer.');
  }
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV file not found: ${CSV_PATH}`);
  }

  console.log(`Reading ${CSV_PATH}`);
  console.log(`Maximum users: ${MAX_USERS}; batch size: ${BATCH_SIZE}`);
  console.log(`[seed] Mode: ${DRY_RUN ? 'dry run (MongoDB disabled)' : 'insert'}`);
  if (!DRY_RUN) await connectDB();

  const password = DRY_RUN ? null : await bcrypt.hash(SEED_PASSWORD, 12);
  const seenEmails = new Set();
  const stats = { totalRead: 0, totalParsed: 0, skipped: 0, inserted: 0 };
  const preview = [];
  let acceptedCount = 0;
  let batch = [];

  try {
    for await (const row of fs.createReadStream(CSV_PATH).pipe(csv())) {
      stats.totalRead += 1;
      if (stats.totalRead === 1) {
        console.log('[seed] CSV columns:', Object.keys(row));
      }

      if (acceptedCount >= MAX_USERS) {
        continue;
      }

      const email = getEmail(row);
      const name = getName(row);
      if (!email || seenEmails.has(email) || name.length < 2) {
        continue;
      }

      seenEmails.add(email);
      acceptedCount += 1;
      stats.totalParsed += 1;
      if (DRY_RUN && preview.length < 5) {
        preview.push({ name: name.slice(0, 50), email, role: 'user', barangay: null, isActive: true, status: 'active' });
      }

      batch.push({
        name: name.slice(0, 50),
        email,
        password,
        role: 'user',
        barangay: null,
        isActive: true,
        status: 'active',
      });

      if (!DRY_RUN && batch.length === BATCH_SIZE) {
        stats.inserted += await insertBatch(batch);
        batch = [];
        console.log(`Progress: ${stats.totalRead} read, ${stats.inserted} inserted.`);
      }
    }

    if (!DRY_RUN && batch.length > 0) {
      stats.inserted += await insertBatch(batch);
    }
  } finally {
    if (!DRY_RUN) await mongoose.disconnect();
  }

  stats.skipped = stats.totalRead - (DRY_RUN ? stats.totalParsed : stats.inserted);
  if (DRY_RUN) {
    console.log('[seed] First 5 parsed users:', preview);
    console.log(`[seed] Total parsed: ${stats.totalParsed}`);
  }
  console.log(DRY_RUN ? 'Citizen dry run complete.' : 'Citizen seeding complete.');
  console.log(`Total read: ${stats.totalRead}`);
  console.log(`Total skipped: ${stats.skipped}`);
  console.log(`Total inserted: ${DRY_RUN ? 0 : stats.inserted}`);
}

try {
  await seedCitizens();
} catch (error) {
  console.error(`Citizen seeding failed: ${error.message}`);
  await mongoose.disconnect();
  process.exitCode = 1;
}