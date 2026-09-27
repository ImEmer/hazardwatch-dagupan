import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const privilegedRoles = ['superadmin', 'admin', 'barangay'];
const notificationEmail = 'emersonisla06@gmail.com';

try {
  await connectDB();
  const [privilegedResult, citizenResult] = await Promise.all([
    User.updateMany({ role: { $in: privilegedRoles } }, { $set: { notificationEmail } }),
    User.updateMany({ role: { $nin: privilegedRoles } }, { $set: { notificationEmail: null } }),
  ]);
  console.log(`Updated ${privilegedResult.modifiedCount} privileged users.`);
  console.log(`Cleared notification emails for ${citizenResult.modifiedCount} non-privileged users.`);
} catch (error) {
  console.error(`Notification email migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}