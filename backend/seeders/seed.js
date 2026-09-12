import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Report from '../models/Report.js';
import ActivityLog from '../models/ActivityLog.js';
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
const seededUsers = await User.create(users);
if (await ActivityLog.countDocuments() === 0) {
  const [superAdmin, admin, barangay] = seededUsers;
  await ActivityLog.insertMany([
    { user: superAdmin._id, actorId: superAdmin._id, actorName: superAdmin.name, actorRole: superAdmin.role, role: superAdmin.role, actorBarangay: '', scope: 'admin', action: 'login', message: `${superAdmin.name} logged in`, details: 'Demo activity entry', targetType: 'auth', entityType: 'auth', targetId: superAdmin._id, entityId: superAdmin._id },
    { user: barangay._id, actorId: barangay._id, actorName: barangay.name, actorRole: barangay.role, role: barangay.role, actorBarangay: barangay.barangay, scope: 'barangay', action: 'profile_updated', message: `${barangay.name} updated their profile`, details: 'Demo activity entry', targetType: 'profile', entityType: 'profile', targetId: barangay._id, entityId: barangay._id },
    { user: admin._id, actorId: admin._id, actorName: admin.name, actorRole: admin.role, role: admin.role, actorBarangay: '', scope: 'admin', action: 'user_created', message: `${admin.name} created a user`, details: 'Demo activity entry', targetType: 'user', entityType: 'user', targetId: admin._id, entityId: admin._id },
  ]);
}

await mongoose.disconnect();
