import User from '../models/User.js';
import { logActivity } from '../utils/logActivity.js';

const fields = 'name email role barangay phone status isActive suspendedUntil suspensionReason suspendedBy lastLogin profileImage createdAt';

const enforceUserManagementRules = (actor, targetUser, nextRole = null) => {
  if (actor.role === 'superadmin') return true;
  if (actor.role !== 'admin') return false;
  if (targetUser?.role === 'superadmin') return false;
  if (nextRole === 'superadmin') return false;
  return true;
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

export const getUsers = async (req, res, next) => { try { const users = await User.find().select(fields).sort({ createdAt: -1 }); res.json({ success: true, users: users.map((user) => normalizeUserStatus(user).toObject()) }); } catch (e) { next(e); } };
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
    if (!enforceUserManagementRules(req.user, targetUser, nextRole)) {
      return res.status(403).json({ success: false, message: 'You are not allowed to modify this user.' });
    }

    const payload = { ...req.body };
    if (req.user.role === 'admin') {
      delete payload.role;
    }
    if (payload.role && req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      delete payload.role;
    }
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
export const toggleUserStatus = async (req, res, next) => { try { const user = await User.findById(req.params.id); if (!user) return res.status(404).json({ success: false, message: 'User not found.' }); if (req.user.role === 'admin' && user.role === 'superadmin') return res.status(403).json({ success: false, message: 'You are not allowed to modify this user.' }); user.status = user.status === 'active' ? 'suspended' : 'active'; user.isActive = user.status === 'active'; if (user.status === 'suspended') { user.suspendedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); user.suspensionReason = 'Temporarily suspended by admin'; } else { user.suspendedUntil = undefined; user.suspensionReason = undefined; } await user.save(); await logActivity({ actor: req.user, action: user.isActive ? 'user_activated' : 'user_deactivated', message: `${req.user.name} ${user.isActive ? 'activated' : 'deactivated'} user ${user.name}`, scope: 'admin', entityType: 'user', entityId: user._id }).catch(() => {}); res.json({ success: true, user: user.toJSON() }); } catch (e) { next(e); } };
export const deleteUser = async (req, res, next) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ success: false, message: 'User not found.' });
    if (String(userToDelete._id) === String(req.user._id)) return res.status(403).json({ success: false, message: 'You cannot delete your own account.' });
    if (req.user.role === 'admin' && !['user', 'barangay'].includes(userToDelete.role)) return res.status(403).json({ success: false, message: 'Admins can only delete citizen or barangay accounts.' });
    if (!enforceUserManagementRules(req.user, userToDelete)) return res.status(403).json({ success: false, message: 'You are not allowed to delete this user.' });
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
    if (String(target._id) === String(req.user._id) || !enforceUserManagementRules(req.user, target)) return res.status(403).json({ success: false, message: 'You are not allowed to suspend this user.' });
    const requestedDuration = req.body.durationInDays ?? req.body.duration;
    const durationMs = getDurationMs(requestedDuration);
    const until = requestedDuration === 'custom' ? new Date(req.body.suspendedUntil) : new Date(Date.now() + durationMs);
    if (!Number.isFinite(until.getTime()) || until <= new Date()) return res.status(400).json({ success: false, message: 'A valid suspension duration is required.' });
    target.status = 'suspended'; target.isActive = false; target.suspendedUntil = until; target.suspensionReason = String(req.body.reason || 'Temporarily suspended by administrator').trim(); target.suspendedBy = req.user._id;
    await target.save({ validateBeforeSave: false });
    res.json({ success: true, user: target.toJSON() });
  } catch (error) { next(error); }
};

export const banUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });
    if (String(target._id) === String(req.user._id) || !enforceUserManagementRules(req.user, target)) return res.status(403).json({ success: false, message: 'You are not allowed to ban this user.' });
    target.status = 'banned'; target.isActive = false; target.suspendedUntil = undefined; target.suspensionReason = String(req.body.reason || 'Account permanently banned.').trim(); target.suspendedBy = req.user._id;
    await target.save({ validateBeforeSave: false });
    res.json({ success: true, user: target.toJSON() });
  } catch (error) { next(error); }
};

export const unsuspendUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!enforceUserManagementRules(req.user, target)) return res.status(403).json({ success: false, message: 'You are not allowed to unsuspend this user.' });
    target.status = 'active'; target.isActive = true; target.suspendedUntil = undefined; target.suspensionReason = undefined; target.suspendedBy = undefined;
    await target.save({ validateBeforeSave: false });
    res.json({ success: true, user: target.toJSON() });
  } catch (error) { next(error); }
};
