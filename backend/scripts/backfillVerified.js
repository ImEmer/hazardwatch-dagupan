import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const backfill = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await User.updateMany(
      { emailVerified: { $ne: true } },
      { $set: { emailVerified: true, verificationRequired: false, isActive: true, status: 'active' } },
    );
    console.log('Updated:', result.modifiedCount, 'users');
  } finally {
    await mongoose.disconnect();
  }
};

backfill().catch((error) => {
  console.error('Backfill failed:', error);
  process.exitCode = 1;
});