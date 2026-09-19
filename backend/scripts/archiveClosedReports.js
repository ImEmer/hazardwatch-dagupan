import 'dotenv/config';
import mongoose from 'mongoose';
import Report from '../models/Report.js';
import { connectDB } from '../config/db.js';

if (process.env.NODE_ENV === 'production') {
  console.error('Archiving closed reports is disabled when NODE_ENV=production.');
  process.exitCode = 1;
} else {
  try {
    await connectDB();
    const result = await Report.updateMany(
      { status: 'Closed', archived: { $ne: true } },
      { $set: { archived: true, archivedAt: new Date() } },
    );
    console.log(`Archived ${result.modifiedCount} closed report(s).`);
  } catch (error) {
    console.error(`Failed to archive closed reports: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}