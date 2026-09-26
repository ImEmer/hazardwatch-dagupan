import User from '../models/User.js';
import { logActivity } from '../utils/logActivity.js';
import { createNotification } from '../utils/createNotification.js';

const fields = 'name email role barangay phone status isActive suspendedUntil suspensionReason suspendedBy lastLogin profileImage createdAt';
const listFields = 'name email role barangay status isActive lastLogin createdAt';
const ROLE_LEVELS = { user: 1, barangay: 2, staff: 2, admin: 3, superadmin: 4 };
const preferenceKeys = {
  notifications: ['newHazardReports', 'criticalReports', 'statusUpdates', 'systemNotifications', 'emailNotifications', 'inAppNotifications'],
  map: ['showResolved', 'showClusters', 'defaultView', 'defaultZoom', 'mapStyle', 'markerStyle'],
};

const mergePreferences = (current, updates) => {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) return { error: 'Preferences must be an object.' };
  const allowedSections = ['theme', 'notifications', 'map'];
  const unknownSection = Object.keys(updates).find((key) => !allowedSections.includes(key));
  if (unknownSection) return { error: `Unknown preference section: ${unknownSection}.` };
  const next = current?.toObject ? current.toObject() : { ...(current || {}) };

  if (Object.hasOwn(updates, 'theme')) {
    if (!['light', 'dark', 'system'].includes(updates.theme)) return { error: 'Theme must be light, dark, or system.' };
    next.theme = updates.theme;
  }

  for (const section of ['notifications', 'map']) {
    if (!Object.hasOwn(updates, section)) continue;
    const values = updates[section];
    if (!values || typeof values !== 'object' || Array.isArray(values)) return { error: `${section} preferences must be an object.` };
    const unknownKey = Object.keys(values).find((key) => !preferenceKeys[section].includes(key));
    if (unknownKey) return { error: `Unknown ${section} preference: ${unknownKey}.` };
    next[section] = { ...(next[section]?.toObject?.() || next[section] || {}) };
    for (const [key, value] of Object.entries(values)) {
      if (['showResolved', 'showClusters', 'newHazardReports', 'criticalReports', 'statusUpdates', 'systemNotifications', 'emailNotifications', 'inAppNotifications'].includes(key) && typeof value !== 'boolean') {
        return { error: `${key} must be a boolean.` };
      }
      if (key === 'defaultView' && !['city', 'barangay', 'my-location'].includes(value)) return { error: 'Default map view is invalid.' };
      if (key === 'mapStyle' && !['streets', 'satellite', 'terrain'].includes(value)) return { error: 'Map style is invalid.' };
      if (key === 'markerStyle' && !['pin', 'circle'].includes(value)) return { error: 'Marker style is invalid.' };
      if (key === 'defaultZoom' && (!Number.isInteger(value) || value < 1 || value > 18)) return { error: 'Default zoom must be an integer from 1 to 18.' };
      next[section][key] = value;
    }
  }
  return { preferences: next };
};

export const getMyPreferences = (req, res) => res.json({ success: true, preferences: req.user.preferences });

export const updateMyPreferences = async (req, res, next) => {
  try {
    const result = mergePreferences(req.user.preferences, req.body);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    req.user.preferences = result.preferences;
    await req.user.save({ validateBeforeSave: false });
    res.json({ success: true, preferences: req.user.preferences });
  } catch (error) { next(error); }
};

export const updateUserPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const result = mergePreferences(user.preferences, req.body);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    user.preferences = result.preferences;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, preferences: user.preferences });
  } catch (error) { next(error); }
};

const enforceUserManagementRules = (actor, targetUser, nextRole = null) => {
  if (actor.role !== 'admin' && actor.role !== 'superadmin') return false;
  if (targetUser?.role === 'superadmin' || nextRole === 'superadmin') return false;
  return (ROLE_LEVELS[actor.role] || 0) > (ROLE_LEVELS[targetUser?.role] || 0);
};

const managementError = (actor, targetUser, action) => {
  if (String(targetUser._id) === String(actor._id)) return `You cannot ${action} your own account.`;
  if (!['admin', 'superadmin'].includes(actor.role) || !['user', 'barangay'].includes(targetUser.role)) return `You do not have permission to ${action} a user with role ${targetUser.role}.`;
  if ((ROLE_LEVELS[actor.role] || 0) <= (ROLE_LEVELS[targetUser.role] || 0)) return `You do not have permission to ${action} a user with role ${targetUser.role}.`;
  return null;
};

const normalizeUserStatus = (user) => {
  if (user.status === 'suspended' && user.suspendedUntil && new Date(user.suspendedUntil) < new Date()) {
    user.status = 'active';
    user.isActive = true;
    user.suspendedUntil = undefined;
    user.suspensionReason = undefined;
    user.suspendedBy = undefined;
  }
  return user;
};

const isLastSuperadmin = async (user) => user.role === 'superadmin' && await User.countDocuments({ role: 'superadmin', status: { $ne: 'deleted' } }) <= 1;

export const getUserStats = async (req, res, next) => {
  try {
    const stats = await User.aggregate([
      { $match: { status: { $ne: 'deleted' } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const counts = Object.fromEntries(stats.map(({ _id, count }) => [_id, count]));
    res.json({
      success: true,
      stats: {
        total: stats.reduce((total, { count }) => total + count, 0),
        citizens: counts.user || 0,
        barangay: counts.barangay || 0,
        admins: (counts.admin || 0) + (counts.superadmin || 0),
      },
    });
  } catch (e) { next(e); }
};

export const getUsers = async (req, res, next) => {
  try {
    const requestedPage = Number.parseInt(req.query.page, 10) || 1;
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const search = String(req.query.search || '').trim();
    const filter = { status: { $ne: 'deleted' } };
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
        { role: { $regex: escapedSearch, $options: 'i' } },
        { barangay: { $regex: escapedSearch, $options: 'i' } },
      ];
    }
    const safeRequestedPage = Math.max(1, requestedPage);
    const startedAt = performance.now();
    const [users, total] = await Promise.all([
      User.find(filter).select(listFields).sort({ createdAt: -1 }).skip((safeRequestedPage - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(safeRequestedPage, pages);
    console.log('[users] list query', { page, limit, search: search || undefined, total, durationMs: Math.round(performance.now() - startedAt) });
    res.json({ success: true, users: users.map(normalizeUserStatus), pagination: { total, page, pages, limit } });
  } catch (e) { next(e); }
};
export const getUser = async (req, res, next) => { try { const user = await User.findById(req.params.id).select(fields); if (!user) return res.status(404).json({ success: false, message: 'User not found.' }); normalizeUserStatus(user); res.json({ success: true, user }); } catch (e) { next(e); } };
export const createUser = async (req, res, next) => {
  try {
    const role = req.body.role || 'user';
    if (req.user.role === 'admin' && !['user', 'barangay'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Admins can only create citizen or barangay accounts.' });
    }
    if (req.user.role === 'superadmin' && ['superadmin', 'staff'].includes(role)) {
      return res.status(403).json({ success: false, message: 'SuperAdmin cannot create superadmin or staff accounts through the UI.' });
    }
    if (typeof req.body.email === 'string' && /\s/.test(req.body.email)) return res.status(400).json({ success: false, message: 'Email and password cannot contain spaces.' });
    if (typeof req.body.password === 'string' && /\s/.test(req.body.password)) return res.status(400).json({ success: false, message: 'Email and password cannot contain spaces.' });
    const user = await User.create({ ...req.body, email: String(req.body.email || '').trim().toLowerCase(), role, status: 'active', isActive: true, deletedAt: undefined });
    await logActivity({ actor: req.user, action: 'user_created', message: `${req.user.name} created user ${user.name}`, scope: 'admin', entityType: 'user', entityId: user._id }).catch(() => {});
    res.status(201).json({ success: true, user: user.toJSON() });
  } catch (e) { next(e); }
};
export const updateUser = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

    const nextRole = req.body.role;
    if (nextRole !== undefined && nextRole !== targetUser.role) {
      return res.status(403).json({ success: false, message: 'User roles cannot be changed through this update flow.' });
    }
    if (!enforceUserManagementRules(req.user, targetUser, nextRole)) {
      return res.status(403).json({ success: false, message: 'You are not allowed to modify this user.' });
    }

    const payload = { ...req.body };
    delete payload.role;
    if (targetUser.role === 'barangay') delete payload.barangay;
    if (payload.status && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
      payload.isActive = payload.status !== 'banned' && payload.status !== 'deleted';
    }

    const user = await User.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).select(fields);
    const changes = [];
    if (payload.name && payload.name !== targetUser.name) changes.push(['user_name_updated', `updated ${user.name}'s name`]);
    if (payload.email && payload.email !== targetUser.email) changes.push(['user_email_updated', `updated ${user.name}'s email`]);
    if (nextRole && nextRole !== targetUser.role) changes.push(['user_role_changed', `changed role of ${user.name} to ${user.role}`]);
    if (payload.barangay !== undefined && payload.barangay !== (targetUser.barangay || '')) changes.push(['user_barangay_changed', `changed barangay of ${user.name} to ${user.barangay || 'none'}`]);
    if (!changes.length) changes.push(['user_updated', `updated user ${user.name}`]);
    await Promise.all(changes.map(([action, message]) => logActivity({ actor: req.user, action, message, scope: 'admin', entityType: 'user', entityId: user._id }).catch(() => {})));
    res.json({ success: true, user });
  } catch (e) { next(e); }
};
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const permissionError = managementError(req.user, user, user.status === 'active' ? 'suspend' : 'modify');
    if (permissionError) return res.status(403).json({ success: false, message: permissionError });
    if (user.status === 'active' && await isLastSuperadmin(user)) return res.status(403).json({ success: false, message: 'The last superadmin account cannot be suspended.' });
    user.status = user.status === 'active' ? 'suspended' : 'active';
    user.isActive = user.status === 'active';
    if (user.status === 'suspended') {
      user.suspendedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      user.suspensionReason = 'Temporarily suspended by admin';
    } else {
      user.suspendedUntil = undefined;
      user.suspensionReason = undefined;
    }
    await user.save();
    await logActivity({ actor: req.user, action: user.isActive ? 'user_activated' : 'user_deactivated', message: `${req.user.name} ${user.isActive ? 'activated' : 'deactivated'} user ${user.name}`, scope: 'admin', entityType: 'user', entityId: user._id }).catch(() => {});
    res.json({ success: true, user: user.toJSON() });
  } catch (e) { next(e); }
};
export const deleteUser = async (req, res, next) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ success: false, message: 'User not found.' });
    const permissionError = managementError(req.user, userToDelete, 'delete');
    if (permissionError) return res.status(403).json({ success: false, message: permissionError });
    if (await isLastSuperadmin(userToDelete)) return res.status(403).json({ success: false, message: 'The last superadmin account cannot be deleted.' });
    userToDelete.status = 'deleted';
    userToDelete.isActive = false;
    userToDelete.deletedAt = new Date();
    await userToDelete.save({ validateBeforeSave: false });
    await logActivity({ actor: req.user, action: 'user_deleted', message: `${req.user.name} deleted user ${userToDelete.name}`, scope: 'admin', entityType: 'user', entityId: userToDelete._id }).catch(() => {});
    res.json({ success: true, message: 'User deleted.' });
  } catch (e) { next(e); }
};

const getDurationMs = (duration) => {
  if (duration === 'custom') return null;
  const days = Number(duration);
  return [1, 3, 7, 30].includes(days) ? days * 24 * 60 * 60 * 1000 : null;
};

export const suspendUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });
    const permissionError = managementError(req.user, target, 'suspend');
    if (permissionError) return res.status(403).json({ success: false, message: permissionError });
    if (await isLastSuperadmin(target)) return res.status(403).json({ success: false, message: 'The last superadmin account cannot be suspended.' });
    const requestedDuration = req.body.durationInDays ?? req.body.duration;
    const durationMs = getDurationMs(requestedDuration);
    const until = requestedDuration === 'custom' ? new Date(req.body.suspendedUntil) : new Date(Date.now() + durationMs);
    if (!Number.isFinite(until.getTime()) || until <= new Date()) return res.status(400).json({ success: false, message: 'A valid suspension duration is required.' });
    target.status = 'suspended'; target.isActive = false; target.suspendedUntil = until; target.suspensionReason = String(req.body.reason || 'Temporarily suspended by administrator').trim(); target.suspendedBy = req.user._id;
    await target.save({ validateBeforeSave: false });
    if (['superadmin', 'admin', 'barangay'].includes(target.role)) {
      await createNotification({
        recipientId: target._id,
        recipientRole: target.role,
        type: 'account_suspended',
        title: 'Account Suspended',
        message: `Your account has been suspended until ${until.toLocaleDateString()}.`,
        reference: target._id,
        referenceModel: 'User',
      });
    }
    res.json({ success: true, user: target.toJSON() });
  } catch (error) { next(error); }
};

export const banUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });
    const permissionError = managementError(req.user, target, 'ban');
    if (permissionError) return res.status(403).json({ success: false, message: permissionError });
    if (await isLastSuperadmin(target)) return res.status(403).json({ success: false, message: 'The last superadmin account cannot be banned.' });
    target.status = 'banned'; target.isActive = false; target.suspendedUntil = undefined; target.suspensionReason = String(req.body.reason || 'Account permanently banned.').trim(); target.suspendedBy = req.user._id;
    await target.save({ validateBeforeSave: false });
    if (['superadmin', 'admin', 'barangay'].includes(target.role)) {
      await createNotification({
        recipientId: target._id,
        recipientRole: target.role,
        type: 'account_banned',
        title: 'Account Banned',
        message: 'Your account has been permanently banned.',
        reference: target._id,
        referenceModel: 'User',
      });
    }
    res.json({ success: true, user: target.toJSON() });
  } catch (error) { next(error); }
};

export const unsuspendUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });
    const permissionError = managementError(req.user, target, 'modify');
    if (permissionError) return res.status(403).json({ success: false, message: permissionError });
    target.status = 'active'; target.isActive = true; target.suspendedUntil = undefined; target.suspensionReason = undefined; target.suspendedBy = undefined;
    await target.save({ validateBeforeSave: false });
    res.json({ success: true, user: target.toJSON() });
  } catch (error) { next(error); }
};
