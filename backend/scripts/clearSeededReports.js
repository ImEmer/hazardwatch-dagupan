import 'dotenv/config';
import readline from 'node:readline/promises';
import mongoose from 'mongoose';
import Report from '../models/Report.js';
import { connectDB } from '../config/db.js';

if (process.env.NODE_ENV === 'production') {
  console.error('Clearing seeded reports is disabled when NODE_ENV=production.');
  process.exitCode = 1;
} else {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await prompt.question('Type DELETE to remove all seeded reports: ');
    if (answer.trim() !== 'DELETE') {
      console.log('Cancelled. No reports were deleted.');
    } else {
      await connectDB();
      const result = await Report.deleteMany({ seeded: true });
      console.log(`Deleted ${result.deletedCount} seeded report(s). Manual reports were preserved.`);
    }
  } catch (error) {
    console.error(`Failed to clear seeded reports: ${error.message}`);
    process.exitCode = 1;
  } finally {
    prompt.close();
    await mongoose.disconnect();
  }
}