import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import User from '../models/User.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const args = new Set(process.argv.slice(2));
const isConfirmed = args.has('--confirm');

const run = async () => {
  if ([...args].some((argument) => argument !== '--confirm')) {
    throw new Error('Usage: node scripts/migrateLogin2FA.js [--confirm]');
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured.');
  if (process.env.NODE_ENV === 'production' && !isConfirmed) {
    throw new Error('Refusing to update production without --confirm.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    console.log(`Target database: ${mongoose.connection.name}`);
    const filter = { login2FAEnabled: { $exists: false } };
    const count = await User.countDocuments(filter);
    if (!isConfirmed) {
      console.log(`Dry run: ${count} users would be set to login2FAEnabled=false.`);
      console.log('Updated 0 users. Run with --confirm to apply.');
      return;
    }
    const result = await User.updateMany(filter, { $set: { login2FAEnabled: false } });
    console.log(`Set login2FAEnabled=false for ${result.modifiedCount} users (matched ${result.matchedCount}).`);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
