// One-time maintenance script: delete report documents only.
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Report from '../models/Report.js';

try {
  await connectDB();
  const result = await Report.deleteMany({});
  console.log(`Deleted ${result.deletedCount} report(s).`);
  console.log(`Remaining reports: ${await Report.countDocuments({})}`);
} catch (error) {
  console.error(`Report cleanup failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
