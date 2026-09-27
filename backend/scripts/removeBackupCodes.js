import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

try {
  await connectDB();
  const result = await User.updateMany(
    { $or: [{ backupCodes: { $exists: true } }, { twoFactorSetupBackupCodes: { $exists: true } }] },
    { $unset: { backupCodes: 1, twoFactorSetupBackupCodes: 1 } },
  );
  console.log(`Removed backup-code fields from ${result.modifiedCount} users (matched ${result.matchedCount}).`);
} catch (error) {
  console.error(`Backup-code cleanup failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}