import 'dotenv/config';
import readline from 'node:readline/promises';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

if (process.env.NODE_ENV === 'production') {
  console.error('Clearing citizen users is disabled when NODE_ENV=production.');
  process.exitCode = 1;
} else {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const answer = await prompt.question('Type DELETE to remove all users with role "user": ');
    if (answer.trim() !== 'DELETE') {
      console.log('Cancelled. No users were deleted.');
    } else {
      await connectDB();
      const result = await User.deleteMany({ role: 'user' });
      console.log(`Deleted ${result.deletedCount} citizen user(s). Admin and barangay users were preserved.`);
    }
  } catch (error) {
    console.error(`Failed to clear citizen users: ${error.message}`);
    process.exitCode = 1;
  } finally {
    prompt.close();
    await mongoose.disconnect();
  }
}