// One-time maintenance script: repair the canonical SuperAdmin account only.
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

const email = 'superadmin@hazardwatch.com';

try {
  await connectDB();
  const user = await User.findOne({ email }).select('name email role');
  if (!user) {
    throw new Error(`No account found for ${email}.`);
  }

  const beforeRole = user.role;
  const beforeName = user.name;
  user.role = 'superadmin';
  if (!user.name || user.name.toLowerCase().replace(/\s+/g, ' ') !== 'super admin') user.name = 'Super Admin';
  await user.save({ validateBeforeSave: false });

  console.log(`Role for ${email}: ${beforeRole} -> ${user.role}`);
  console.log(`Name for ${email}: ${beforeName} -> ${user.name}`);

  const userRoleAccounts = await User.find({ role: 'user' }).select('name email role').sort({ email: 1 }).lean();
  console.log(`Accounts still using role user: ${userRoleAccounts.length}`);
  userRoleAccounts.forEach((account) => console.log(`- ${account.email} (${account.name})`));
} catch (error) {
  console.error(`SuperAdmin role repair failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
