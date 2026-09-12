import ActivityLog from '../models/ActivityLog.js';

const legacyRoleFilter = (roles) => ({ $or: [{ actorRole: { $in: roles } }, { actorRole: { $exists: false }, role: { $in: roles } }] });

const buildQuery = (req, baseFilter = {}) => {
  const { page = 1, limit = 20, role, search, startDate, endDate, sort = 'desc' } = req.query;
  const filter = { ...baseFilter };
  if (role) filter.$and = [...(filter.$and || []), { $or: [{ actorRole: role }, { actorRole: { $exists: false }, role }] }];
  if (search) {
    const pattern = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$and = [...(filter.$and || []), { $or: [{ actorName: pattern }, { action: pattern }, { message: pattern }, { details: pattern }] }];
  }
  if (startDate || endDate) filter.createdAt = { ...(startDate ? { $gte: new Date(startDate) } : {}), ...(endDate ? { $lte: new Date(`${endDate}T23:59:59.999Z`) } : {}) };
  return { filter, page: Math.max(1, Number(page)), limit: Math.min(100, Math.max(1, Number(limit))), sort: sort === 'asc' ? 1 : -1 };
};

const sendActivity = (baseFilter = {}) => async (req, res, next) => {
  try {
    const { filter, page, limit, sort } = buildQuery(req, baseFilter);
    const [activities, total] = await Promise.all([ActivityLog.find(filter).sort({ createdAt: sort }).skip((page - 1) * limit).limit(limit), ActivityLog.countDocuments(filter)]);
    res.json({ success: true, entries: activities, activities, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

export const getAllActivity = sendActivity({});
export const getPublicActivity = sendActivity(legacyRoleFilter(['barangay', 'user']));
export const getMyActivity = async (req, res, next) => sendActivity({ user: req.user._id })(req, res, next);
export const getBarangayActivity = async (req, res, next) => {
  if (req.user.role === 'barangay' && req.params.barangay.toLowerCase() !== String(req.user.barangay || '').toLowerCase()) return res.status(403).json({ success: false, message: 'You can only view your own barangay activity.' });
  return sendActivity({ actorBarangay: req.params.barangay })(req, res, next);
};
export const getActivityLogs = async (req, res, next) => {
  if (req.user.role === 'superadmin') return getAllActivity(req, res, next);
  if (req.user.role === 'admin') return getPublicActivity(req, res, next);
  if (req.user.role === 'barangay') return sendActivity({ actorBarangay: req.user.barangay })(req, res, next);
  return getMyActivity(req, res, next);
};
