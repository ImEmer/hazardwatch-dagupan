import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

const users = [
  { name: 'Super Admin', email: 'superadmin@hazardwatch.com', password: 'password123', role: 'superadmin' },
  { name: 'Admin User', email: 'admin@hazardwatch.com', password: 'password123', role: 'admin' },
  { name: 'Staff User', email: 'staff@hazardwatch.com', password: 'password123', role: 'staff' },
  { name: 'Barangay User', email: 'barangay@hazardwatch.com', password: 'password123', role: 'barangay', barangay: 'Bonuan' },
];

await connectDB();
await User.deleteMany({ email: { $in: users.map((user) => user.email) } });
await User.create(users);
console.log('Seed users created.');
await mongoose.disconnect();
