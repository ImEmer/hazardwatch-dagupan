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

export const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find(getActivityScope(req.user.role)).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, activities: logs });
  } catch (error) {
    next(error);
  }
};
