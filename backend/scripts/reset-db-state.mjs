import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Report from '../models/Report.js';

const requiredUsers = [
  { name: 'Super Admin', email: 'superadmin@hazardwatch.com', password: 'password123', role: 'superadmin' },
  { name: 'Admin User', email: 'admin@hazardwatch.com', password: 'password123', role: 'admin' },
  { name: 'Bonuan Barangay Captain', email: 'bonuan@hazardwatch.com', password: 'password123', role: 'barangay', barangay: 'Bonuan' },
  { name: 'Lucao Barangay Captain', email: 'lucao@hazardwatch.com', password: 'password123', role: 'barangay', barangay: 'Lucao' },
  { name: 'Tapuac Barangay Captain', email: 'tapuac@hazardwatch.com', password: 'password123', role: 'barangay', barangay: 'Tapuac' },
];

try {
  await connectDB();
  await Report.deleteMany({});
  await User.deleteMany({ email: { $in: requiredUsers.map((user) => user.email) } });
  await User.deleteMany({ email: 'barangay@hazardwatch.com' });
  await User.insertMany(requiredUsers);

  const users = await User.find({}).sort({ email: 1 }).lean();
  const reportCount = await Report.countDocuments({});
  const genericExists = await User.exists({ email: 'barangay@hazardwatch.com' });

  console.log('REPORT_COUNT=' + reportCount);
  console.log('USER_COUNT=' + users.length);
  console.log('USER_EMAILS=' + users.map((user) => user.email).join(', '));
  console.log('GENERIC_EXISTS=' + !!genericExists);
} catch (error) {
  console.error('DB_RESET_ERROR=' + error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
