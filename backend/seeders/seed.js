import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Report from '../models/Report.js';
import { connectDB } from '../config/db.js';

const users = [
  {
    name: 'Super Admin',
    email: 'superadmin@hazardwatch.com',
    password: 'password123',
    role: 'superadmin',
  },
  {
    name: 'Admin User',
    email: 'admin@hazardwatch.com',
    password: 'password123',
    role: 'admin',
  },
  {
    name: 'Bonuan Barangay Captain',
    email: 'bonuan@hazardwatch.com',
    password: 'password123',
    role: 'barangay',
    barangay: 'Bonuan',
  },
  {
    name: 'Lucao Barangay Captain',
    email: 'lucao@hazardwatch.com',
    password: 'password123',
    role: 'barangay',
    barangay: 'Lucao',
  },
  {
    name: 'Tapuac Barangay Captain',
    email: 'tapuac@hazardwatch.com',
    password: 'password123',
    role: 'barangay',
    barangay: 'Tapuac',
  },
];

await connectDB();
await Report.deleteMany({});
await User.deleteMany({ email: { $in: users.map((user) => user.email) } });
await User.deleteMany({ email: 'barangay@hazardwatch.com' });
await User.create(users);

await mongoose.disconnect();
