import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run');
const isConfirmed = args.has('--confirm');
const validArgs = [...args].every((arg) => arg === '--dry-run' || arg === '--confirm');
const privilegedRoles = ['superadmin', 'admin', 'barangay'];

const run = async () => {
  if (!validArgs || (isDryRun && isConfirmed)) {
    throw new Error('Usage: node scripts/enforce2FAPrivileged.js [--dry-run | --confirm]');
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured.');
  if (process.env.NODE_ENV === 'production' && !isConfirmed) {
    throw new Error('Refusing to run in production without --confirm.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    console.log(`Target database: ${mongoose.connection.name}`);
    const filter = {
      role: { $in: privilegedRoles },
      twoFactorEnabled: { $ne: true },
    };
    const users = await User.find(filter).select('_id role').lean();

    if (!isConfirmed) {
      console.log(`Dry run: ${users.length} privileged users would be updated.`);
      for (const user of users) {
        console.log(`- id: ${String(user._id).slice(0, 8)}..., role: ${user.role}`);
      }
      console.log('Updated 0 users. Skipped 0.');
      return;
    }

    let updated = 0;
    let skipped = 0;
    for (const user of users) {
      const result = await User.updateOne(
        { _id: user._id, role: { $in: privilegedRoles }, twoFactorEnabled: { $ne: true } },
        { $set: { twoFactorEnabled: true } },
      );
      if (result.modifiedCount !== 1) {
        skipped += 1;
        continue;
      }

      try {
        await ActivityLog.create({
          user: user._id,
          actorName: '2FA enforcement migration',
          role: user.role,
          scope: 'system',
          action: '2FA_ENFORCED',
          message: 'Two-factor authentication enforced for privileged role.',
          entityType: 'user',
          entityId: user._id,
          targetType: 'user',
          targetId: user._id,
        });
      } catch (error) {
        await User.updateOne(
          { _id: user._id, twoFactorEnabled: true },
          { $set: { twoFactorEnabled: false } },
        );
        throw new Error(`Failed to record the 2FA enforcement activity for user ${String(user._id).slice(0, 8)}...: ${error.message}`);
      }
      updated += 1;
    }

    console.log(`Updated ${updated} users. Skipped ${skipped}.`);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
