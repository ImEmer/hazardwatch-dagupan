import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import csv from 'csv-parser';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '../seeders/data/crm_customers.csv');
const TARGET_DATABASE = 'hazardwatch';
const TARGET_CITIZENS = 100_000;
const BATCH_SIZE = 500;
const MAX_DATABASE_SIZE_BYTES = 400 * 1024 * 1024;
const ESTIMATED_BYTES_PER_USER = 4 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DRY_RUN = process.argv.includes('--dry-run');
const CONFIRMED = process.argv.includes('--confirm-production-seed');

function getConfiguredDatabaseName() {
  const match = process.env.MONGO_URI?.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^/?#]*)/i);
  return match?.[1] || null;
}

function makeUserName(row) {
  return `${String(row.first_name || '').trim()} ${String(row.last_name || '').trim()}`.trim();
}

function makeAlias(email, sourceRow, aliasRound) {
  const at = email.lastIndexOf('@');
  const suffix = aliasRound === 1
    ? `.seed${sourceRow}`
    : `.seed${sourceRow}-${aliasRound}`;
  return `${email.slice(0, at)}${suffix}${email.slice(at)}`;
}

function randomSeptemberDate() {
  const start = Date.parse('2026-09-01T00:00:00.000Z');
  const end = Date.parse('2026-09-30T23:59:59.999Z');
  return new Date(start + Math.random() * (end - start));
}

async function readCsv() {
  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });
  return rows;
}

function makeSeedPlan(rows, existingEmails, needed) {
  const candidates = [];
  const plannedEmails = new Set(existingEmails);
  const uniqueSourceEmails = new Set();
  const validRows = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const email = String(row.email || '').trim().toLowerCase();
    const name = makeUserName(row);
    if (!EMAIL_PATTERN.test(email) || name.length < 2 || name.length > 50) continue;

    validRows.push({ email, name, sourceRow: index + 1 });
    if (uniqueSourceEmails.has(email)) continue;
    uniqueSourceEmails.add(email);
    if (plannedEmails.has(email)) continue;

    plannedEmails.add(email);
    candidates.push({ email, name });
    if (candidates.length === needed) return { candidates, validRows };
  }

  for (let aliasRound = 1; candidates.length < needed; aliasRound += 1) {
    let addedThisRound = 0;
    for (const row of validRows) {
      if (candidates.length === needed) break;
      const email = makeAlias(row.email, row.sourceRow, aliasRound);
      if (plannedEmails.has(email)) continue;
      plannedEmails.add(email);
      candidates.push({ email, name: row.name });
      addedThisRound += 1;
    }
    if (addedThisRound === 0) {
      throw new Error('CSV did not contain enough valid rows to reach the target.');
    }
  }

  return { candidates, validRows };
}

async function insertBatch(batch) {
  try {
    const inserted = await User.insertMany(batch, { ordered: false });
    return inserted.length;
  } catch (error) {
    const writeErrors = error.writeErrors || [];
    const nonDuplicateErrors = writeErrors.filter(({ code }) => code !== 11000);
    if (error.code !== 11000 && (writeErrors.length === 0 || nonDuplicateErrors.length > 0)) {
      throw error;
    }
    const insertedCount = error.insertedDocs?.length
      ?? error.result?.insertedCount
      ?? batch.length - writeErrors.length;
    console.warn(`[seedFromExistingCSV] Skipped ${writeErrors.length} duplicate/conflicting row(s) in a batch.`);
    return insertedCount;
  }
}

async function seed() {
  if (!fs.existsSync(CSV_PATH)) throw new Error(`CSV file not found: ${CSV_PATH}`);
  if (getConfiguredDatabaseName() !== TARGET_DATABASE) {
    throw new Error(`MONGO_URI must target ${TARGET_DATABASE}; no database writes attempted.`);
  }
  if (!DRY_RUN && !CONFIRMED) {
    throw new Error('Production insertion requires the --confirm-production-seed flag.');
  }

  await connectDB();
  if (mongoose.connection.name !== TARGET_DATABASE) {
    throw new Error(`Connected to ${mongoose.connection.name}, not ${TARGET_DATABASE}; refusing to continue.`);
  }

  try {
    const db = mongoose.connection.db;
    const [citizenCount, stats, existingUsers, rows] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      db.stats(),
      User.find({}, { email: 1 }).lean(),
      readCsv(),
    ]);
    const needed = Math.max(0, TARGET_CITIZENS - citizenCount);
    if (needed === 0) {
      console.log(`[seedFromExistingCSV] Already at target: ${citizenCount} citizen users.`);
      return;
    }

    const existingEmails = new Set(
      existingUsers.map(({ email }) => String(email || '').toLowerCase()).filter(Boolean),
    );
    const { candidates, validRows } = makeSeedPlan(rows, existingEmails, needed);
    const currentBytes = (stats.dataSize || 0) + (stats.indexSize || 0);
    const projectedBytes = currentBytes + candidates.length * ESTIMATED_BYTES_PER_USER;
    console.log(JSON.stringify({
      database: mongoose.connection.name,
      csvRows: rows.length,
      validCsvRows: validRows.length,
      citizenUsersBefore: citizenCount,
      plannedInsertions: candidates.length,
      targetCitizenUsers: TARGET_CITIZENS,
      estimatedCurrentDataAndIndexBytes: currentBytes,
      estimatedProjectedDataAndIndexBytes: projectedBytes,
      mode: DRY_RUN ? 'dry-run' : 'insert',
    }));
    if (projectedBytes > MAX_DATABASE_SIZE_BYTES) {
      throw new Error('Estimated database usage exceeds the 400 MiB safety limit; no inserts attempted.');
    }
    if (DRY_RUN) return;

    const password = process.env.SEED_CITIZEN_PASSWORD || randomBytes(32).toString('base64url');
    const passwordHash = await bcrypt.hash(password, 12);
    let insertedCount = 0;

    for (let offset = 0; offset < candidates.length; offset += BATCH_SIZE) {
      const batchCandidates = candidates.slice(offset, offset + BATCH_SIZE);
      const batch = batchCandidates.map(({ email, name }) => {
        const createdAt = randomSeptemberDate();
        return {
          name,
          email,
          password: passwordHash,
          role: 'user',
          barangay: null,
          status: 'active',
          isActive: true,
          emailVerified: false,
          verificationRequired: true,
          createdAt,
          updatedAt: createdAt,
        };
      });

      const currentCitizenCount = await User.countDocuments({ role: 'user' });
      const remaining = TARGET_CITIZENS - currentCitizenCount;
      if (remaining <= 0) break;
      insertedCount += await insertBatch(batch.slice(0, remaining));

      if (insertedCount >= 10_000 && insertedCount % 10_000 < batch.length) {
        console.log(`[seedFromExistingCSV] Inserted ${insertedCount} new user(s).`);
      }
      const liveStats = await db.stats();
      if ((liveStats.dataSize || 0) + (liveStats.indexSize || 0) > MAX_DATABASE_SIZE_BYTES) {
        throw new Error('Database usage exceeded the 400 MiB safety limit; stopped after the current batch.');
      }
    }

    const [finalCitizenCount, finalStats] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      db.stats(),
    ]);
    console.log(JSON.stringify({
      database: mongoose.connection.name,
      inserted: insertedCount,
      skippedExistingOrConflicting: candidates.length - insertedCount,
      finalCitizenCount,
      finalDataAndIndexBytes: (finalStats.dataSize || 0) + (finalStats.indexSize || 0),
    }));
    if (finalCitizenCount < TARGET_CITIZENS) {
      throw new Error(`Seed completed below target (${finalCitizenCount}/${TARGET_CITIZENS}); inspect duplicate/conflict logs.`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

try {
  await seed();
} catch (error) {
  console.error(`[seedFromExistingCSV] ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
}
