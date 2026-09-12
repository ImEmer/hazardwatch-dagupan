import ActivityLog from '../models/ActivityLog.js';

const getActivityScope = (role) => {
  switch (role) {
    case 'superadmin':
    case 'admin':
      return {};
    case 'barangay':
      return { $or: [{ scope: 'barangay' }, { role: 'barangay' }] };
    default:
      return { role: role || 'user' };
  }
};

const sendActivity = (filter) => async (req, res, next) => {
  try {
    const logs = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, activities: logs });
  } catch (error) {
    next(error);
  }
};

export const getActivityLogs = async (req, res, next) => {
  const filter = req.user.role === 'superadmin'
    ? {}
    : req.user.role === 'admin'
      ? { $or: [{ actorRole: { $in: ['barangay', 'user'] } }, { actorRole: { $exists: false }, role: { $in: ['barangay', 'user'] } }] }
      : getActivityScope(req.user.role);
  return sendActivity(filter)(req, res, next);
};

export const getAllActivity = sendActivity({});
export const getPublicActivity = sendActivity({ $or: [{ actorRole: { $in: ['barangay', 'user'] } }, { actorRole: { $exists: false }, role: { $in: ['barangay', 'user'] } }] });
