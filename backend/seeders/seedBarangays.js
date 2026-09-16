import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

const barangays = [
  'Bacayao Norte', 'Bacayao Sur', 'Banaoang', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV',
  'Bolosan', 'Bonuan Binloc', 'Bonuan Boquig', 'Bonuan Gueset', 'Calmay', 'Carael', 'Caranglaan',
  'Herrero', 'Herrero-Perez', 'Lasip Chico', 'Lasip Grande', 'Lomboy', 'Lucao', 'Malued', 'Mamalingling',
  'Mangin', 'Mayombo', 'Pantal', 'Pogo Chico', 'Pogo Grande', 'Pugaro', 'Salapingao', 'San Fabian',
  'Sapanglang', 'Tambac', 'Tapuac', 'Tebeng', 'Tondaligan',
];

const toEmail = (barangay) => {
  const normalized = barangay
    .replace(/^Barangay I$/, 'Barangay 1')
    .replace(/^Barangay II$/, 'Barangay 2')
    .replace(/^Barangay III$/, 'Barangay 3')
    .replace(/^Barangay IV$/, 'Barangay 4')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
  return `${normalized}@hazardwatch.com`;
};

const users = barangays.map((barangay) => ({
  name: `${barangay} Barangay Captain`,
  email: toEmail(barangay),
  password: 'Barangay@123',
  role: 'barangay',
  barangay,
  isActive: true,
}));

try {
  await connectDB();
  const emails = users.map((user) => user.email);
  await User.deleteMany({ email: { $in: emails } });
  const createdUsers = await User.create(users);

  console.log(`Created ${createdUsers.length} barangay accounts.`);
  createdUsers.forEach((user) => console.log(user.email));
} finally {
  await mongoose.disconnect();
}