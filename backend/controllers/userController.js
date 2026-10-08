import User from '../models/User.js';
import { logActivity } from '../utils/logActivity.js';
import { createNotification } from '../utils/createNotification.js';
import { sendAccountSuspendedEmail, sendAdminAutoBanNotificationEmail, sendAutoBanEmail } from '../utils/sendEmail.js';

const fields = 'name email role barangay phone status isActive suspendedUntil suspensionReason suspendedBy lastLogin profileImage createdAt';
const listFields = 'name email role barangay status isActive suspendedUntil suspensionReason lastLogin createdAt';
const ROLE_LEVELS = { user: 1, barangay: 2, staff: 2, admin: 3, superadmin: 4 };
const manageableRoles = ['admin', 'barangay', 'user'];
const PRIVILEGED_NOTIFICATION_EMAIL = 'emersonisla06@gmail.com';
const privilegedRoles = ['superadmin', 'admin', 'barangay'];
const preferenceKeys = {
  notifications: ['newHazardReports', 'criticalReports', 'statusUpdates', 'systemNotifications', 'emailNotifications', 'inAppNotifications'],
  map: ['showResolved', 'defaultZoom', 'mapStyle', 'markerStyle'],
};

const mergePreferences = (current, updates) => {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) return { error: 'Preferences must be an object.' };
  const next = current?.toObject ? current.toObject() : { ...(current || {}) };

  if (Object.hasOwn(updates, 'theme')) {
    if (!['light', 'dark', 'system'].includes(updates.theme)) return { error: 'Theme must be light, dark, or system.' };
    next.theme = updates.theme;
  }

  for (const section of ['notifications', 'map']) {
    if (!Object.hasOwn(updates, section)) continue;
    const values = updates[section];
    if (!values || typeof values !== 'object' || Array.isArray(values)) return { error: `${section} preferences must be an object.` };
    next[section] = { ...(next[section]?.toObject?.() || next[section] || {}) };
    for (const [key, value] of Object.entries(values)) {
      if (!preferenceKeys[section].includes(key)) continue;
      if (['showResolved', 'newHazardReports', 'criticalReports', 'statusUpdates', 'systemNotifications', 'emailNotifications', 'inAppNotifications'].includes(key) && typeof value !== 'boolean') {
        return { error: `${key} must be a boolean.` };
      }
      if (key === 'mapStyle' && !['streets', 'satellite', 'terrain'].includes(value)) return { error: 'Map style is invalid.' };
      if (key === 'markerStyle' && !['pin', 'circle', 'danger'].includes(value)) return { error: 'Marker style is invalid.' };
      if (key === 'defaultZoom' && (!Number.isInteger(value) || value < 1 || value > 18)) return { error: 'Default zoom must be an integer from 1 to 18.' };
      next[section][key] = value;
    }
  }
  return { preferences: next };
};

export const getMyPreferences = (req, res) => res.json({ success: true, preferences: req.user.preferences });

const canManageUserSettings = (actor, target) => actor.role === 'superadmin'
  || (actor.role === 'admin' && ['user', 'barangay'].includes(target.role));

export const updateMyPreferences = async (req, res, next) => {
  try {
    const result = mergePreferences(req.user.preferences, req.body);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    req.user.preferences = result.preferences;
    await req.user.save({ validateBeforeSave: false });
    res.json({ success: true, preferences: req.user.preferences });
  } catch (error) { next(error); }
};

export const updateUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!canManageUserSettings(req.user, user)) return res.status(403).json({ success: false, message: 'You are not allowed to update this user’s password.' });
    user.password = req.body.newPassword;
    await user.save();
    await logActivity({ actor: req.user, action: 'user_password_reset', message: `${req.user.name} updated the password for ${user.name}`, scope: 'admin', entityType: 'user', entityId: user._id }).catch(() => {});
    res.json({ success: true, message: 'User password updated.' });
  } catch (error) { next(error); }
};

const managedTargetError = (actor, targetUser, action) => {
  if (String(actor._id) === String(targetUser?._id)) return `You cannot ${action} your own account.`;
  const allowedTargets = actor.role === 'superadmin' ? manageableRoles : actor.role === 'admin' ? ['barangay', 'user'] : [];
  if (!allowedTargets.includes(targetUser?.role)) {
    return `You do not have permission to ${action} a user with role ${targetUser?.role}.`;
  }
  return null;
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
    const search = String(req.query.q ?? req.query.search ?? '').trim();
    const filter = { status: { $ne: 'deleted' } };
    const requestedRole = String(req.query.role || '').trim();
    if (['superadmin', 'admin', 'staff', 'barangay', 'user'].includes(requestedRole)) filter.role = requestedRole;
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const [textMatches, regexMatches] = await Promise.all([
        User.find({ $and: [filter, { $text: { $search: search } }] }).select('_id').lean().catch(() => []),
        User.find({ $and: [filter, { $or: [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { email: { $regex: escapedSearch, $options: 'i' } },
          { role: { $regex: escapedSearch, $options: 'i' } },
          { barangay: { $regex: escapedSearch, $options: 'i' } },
        ] }] }).select('_id').lean(),
      ]);
      const ids = [...new Set([...textMatches, ...regexMatches].map((user) => String(user._id)))];
      filter._id = { $in: ids };
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
    const user = await User.create({
      ...req.body,
      email: String(req.body.email || '').trim().toLowerCase(),
      role,
      twoFactorEnabled: privilegedRoles.includes(role),
      notificationEmail: privilegedRoles.includes(role) ? PRIVILEGED_NOTIFICATION_EMAIL : null,
      status: 'active',
      isActive: true,
      deletedAt: undefined,
    });
    await logActivity({ actor: req.user, action: 'user_created', message: `${req.user.name} created user ${user.name}`, scope: 'admin', entityType: 'user', entityId: user._id }).catch(() => {});
    const safeUser = user.toJSON();
    delete safeUser.notificationEmail;
    res.status(201).json({ success: true, user: safeUser });
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
    const permissionError = managedTargetError(req.user, targetUser, 'edit');
    if (permissionError) return res.status(403).json({ success: false, message: permissionError });

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
    const permissionError = managedTargetError(req.user, target, 'suspend');
    if (permissionError) return res.status(403).json({ success: false, message: permissionError });
    if (target.status === 'banned') return res.status(409).json({ success: false, message: 'This user is already permanently banned.' });

    const requestedDuration = req.body.durationInDays ?? req.body.duration;
    const durationMs = getDurationMs(requestedDuration);
    const until = requestedDuration === 'custom' ? new Date(req.body.suspendedUntil) : new Date(Date.now() + durationMs);
    if (!Number.isFinite(until.getTime()) || until <= new Date()) return res.status(400).json({ success: false, message: 'A valid suspension duration is required.' });

    const reason = String(req.body.reason || 'Temporarily suspended by administrator').trim();
    const suspensionCount = Number(target.suspensionCount || 0) + 1;
    const suspensionDates = [...(Array.isArray(target.suspensionHistory) ? target.suspensionHistory : []), new Date()];

    target.status = 'suspended';
    target.isActive = false;
    target.suspendedUntil = until;
    target.suspensionReason = reason;
    target.suspendedBy = req.user._id;
    target.suspensionCount = suspensionCount;
    target.suspensionHistory = suspensionDates;

    await target.save({ validateBeforeSave: false });

    try {
      await sendAccountSuspendedEmail({
        email: target.email,
        name: target.name,
        reason,
        suspendedUntil: until,
      });
    } catch (emailError) {
      console.error('[users] Suspension email failed:', emailError.message);
    }

    if (suspensionCount >= 3) {
      target.status = 'banned';
      target.isActive = false;
      target.bannedAt = new Date();
      target.bannedBy = req.user._id;
      target.banReason = 'Auto-banned after 3 suspensions';
      target.suspendedUntil = undefined;
      target.suspensionReason = undefined;
      target.suspendedBy = undefined;
      await target.save({ validateBeforeSave: false });

      try {
        await sendAutoBanEmail({
          email: target.email,
          name: target.name,
          suspensionDates: suspensionDates.slice(-3),
        });
      } catch (emailError) {
        console.error('[users] Auto-ban email failed:', emailError.message);
      }

      const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_FROM || 'emersonisla06@gmail.com';
      try {
        await sendAdminAutoBanNotificationEmail({
          email: adminNotificationEmail,
          userName: target.name,
          userEmail: target.email,
          suspensionCount,
          suspensionDates: suspensionDates.slice(-3),
        });
      } catch (emailError) {
        console.error('[users] Admin auto-ban notification email failed:', emailError.message);
      }

      try {
        await logActivity({
          actor: req.user,
          action: 'user_auto_banned',
          message: `${req.user.name} auto-banned ${target.name} after ${suspensionCount} suspensions`,
          scope: 'admin',
          entityType: 'user',
          entityId: target._id,
        });
      } catch (logError) {
        console.error('[users] Auto-ban activity log failed:', logError.message);
      }

      if (['superadmin', 'admin', 'barangay'].includes(target.role)) {
        await createNotification({
          recipientId: target._id,
          recipientRole: target.role,
          type: 'account_banned',
          title: 'Account Banned',
          message: 'Your account has been permanently banned after three suspensions.',
          reference: target._id,
          referenceModel: 'User',
        }).catch(() => {});
      }

      return res.json({ success: true, message: 'User auto-banned after 3 suspensions', user: target.toJSON() });
    }

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
    await logActivity({
      actor: req.user,
      action: 'user_suspended',
      message: `${req.user.name} suspended ${target.name} until ${until.toISOString()}`,
      scope: 'admin',
      entityType: 'user',
      entityId: target._id,
    }).catch(() => {});
    return res.json({ success: true, user: target.toJSON() });
  } catch (error) { next(error); }
};

export const banUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });
    const permissionError = managedTargetError(req.user, target, 'ban');
    if (permissionError) return res.status(403).json({ success: false, message: permissionError });
    if (target.status === 'banned') return res.status(409).json({ success: false, message: 'This user is already permanently banned.' });
    target.status = 'banned';
    target.isActive = false;
    target.bannedAt = new Date();
    target.bannedBy = req.user._id;
    target.banReason = String(req.body.reason || '').trim() || undefined;
    target.suspendedUntil = undefined;
    target.suspensionReason = undefined;
    target.suspendedBy = undefined;
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
    res.json({ success: true, message: 'User banned permanently', user: target.toJSON() });
  } catch (error) { next(error); }
};

export const unsuspendUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });
    if (target.status === 'banned') return res.status(403).json({ success: false, message: 'Permanently banned users cannot be unsuspended.' });
    const permissionError = managedTargetError(req.user, target, 'modify');
    if (permissionError) return res.status(403).json({ success: false, message: permissionError });
    target.status = 'active'; target.isActive = true; target.suspendedUntil = undefined; target.suspensionReason = undefined; target.suspendedBy = undefined;
    await target.save({ validateBeforeSave: false });
    res.json({ success: true, user: target.toJSON() });
  } catch (error) { next(error); }
};
