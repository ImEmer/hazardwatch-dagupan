import 'dotenv/config';
import mongoose from 'mongoose';
import ActivityLog from '../models/ActivityLog.js';

const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run');
const isConfirmed = args.has('--confirm');
const knownArgs = new Set(['--dry-run', '--confirm']);

if ([...args].some((arg) => !knownArgs.has(arg)) || isDryRun === isConfirmed) {
  console.error('Usage: node scripts/removeStaffRole.js --dry-run | --confirm');
  process.exitCode = 1;
} else if (process.env.NODE_ENV === 'production' && !isConfirmed && !isDryRun) {
  console.error('Refusing to modify production without --confirm.');
  process.exitCode = 1;
} else {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required.');
    await mongoose.connect(process.env.MONGO_URI);

    const users = mongoose.connection.collection('users');
    const legacyUsers = await users.find(
      { role: 'staff' },
      { projection: { _id: 1, name: 1, email: 1 } },
    ).toArray();

    console.log(`${isDryRun ? 'Would migrate' : 'Migrating'} ${legacyUsers.length} user(s).`);
    for (const user of legacyUsers) console.log(`${user._id} ${user.email || ''} ${user.name || ''}`.trim());

    if (isConfirmed) {
      for (const user of legacyUsers) {
        const result = await users.updateOne(
          { _id: user._id, role: 'staff' },
          { $set: { role: 'user' } },
        );
        if (result.modifiedCount !== 1) {
          throw new Error(`Could not migrate account ${user._id}; the role changed during migration.`);
        }
        await ActivityLog.create({
          user: user._id,
          actorId: user._id,
          actorName: user.name || 'Migrated account',
          actorRole: 'user',
          role: 'user',
          scope: 'user',
          action: 'legacy_role_migrated',
          message: 'Account role migrated to user.',
          details: 'Legacy role migration.',
          entityType: 'user',
          entityId: user._id,
          targetType: 'user',
          targetId: user._id,
        });
      }

      await mongoose.connection.collection('systemsettings').updateOne(
        { key: 'global' },
        { $pull: { userRoles: 'staff' }, $unset: { 'roleHierarchy.staff': '' } },
      );
      console.log(`Migrated ${legacyUsers.length} user(s).`);
    }
  } catch (error) {
    console.error('Role migration failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
