import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const privilegedRoles = ['superadmin', 'admin', 'barangay'];

try {
  console.log('Connecting to MongoDB...');
  await connectDB();

  const privilegedFilter = { role: { $in: privilegedRoles } };
  const [privilegedCount, disabledCount] = await Promise.all([
    User.countDocuments(privilegedFilter),
    User.countDocuments({ ...privilegedFilter, twoFactorEnabled: { $ne: true } }),
  ]);
  console.log(`Found ${privilegedCount} privileged users; ${disabledCount} need 2FA enabled.`);

  const [enabledResult, citizenResult] = await Promise.all([
    User.updateMany(privilegedFilter, { $set: { twoFactorEnabled: true } }),
    User.updateMany({ role: { $nin: privilegedRoles } }, { $set: { twoFactorEnabled: false } }),
  ]);

  const remainingDisabled = await User.countDocuments({ ...privilegedFilter, twoFactorEnabled: { $ne: true } });
  console.log(`Enabled 2FA for ${enabledResult.modifiedCount} privileged users (matched ${enabledResult.matchedCount}).`);
  console.log(`Set 2FA disabled for ${citizenResult.modifiedCount} non-privileged users (matched ${citizenResult.matchedCount}).`);
  console.log(`Verification: ${remainingDisabled} privileged users remain without 2FA.`);
  if (remainingDisabled) process.exitCode = 1;
} catch (error) {
  console.error(`2FA migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}