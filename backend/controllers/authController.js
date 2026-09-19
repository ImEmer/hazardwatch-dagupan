import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { clearFailedLogins, getLoginLockout, recordFailedLogin } from '../middleware/loginLockout.js';
import { logActivity } from '../utils/logActivity.js';
import { sendPasswordResetCode } from '../utils/sendEmail.js';

export const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, barangay: user.barangay, isActive: user.isActive });
const tokenExpiryFor = (role) => ['admin', 'superadmin', 'barangay'].includes(role) ? '1d' : '7d';
export const issueToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: tokenExpiryFor(user.role) });

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, barangay, phone } = req.body;
    if (typeof email === 'string' && /\s/.test(email)) return res.status(400).json({ success: false, message: 'Email and password cannot contain spaces.' });
    if (typeof password === 'string' && /\s/.test(password)) return res.status(400).json({ success: false, message: 'Email and password cannot contain spaces.' });

    const exists = await User.findOne({ email: String(email || '').trim().toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered. Please log in instead.' });

    const safeRole = ['superadmin', 'admin', 'staff', 'barangay', 'user'].includes(role) ? role : 'user';
    const user = await User.create({ name, email: String(email).trim().toLowerCase(), password, role: safeRole, barangay, phone, status: 'active', isActive: true });
    await logActivity({ actor: user, action: 'registered', message: `${user.name} registered a new account`, scope: user.role === 'barangay' ? 'barangay' : 'user', entityType: 'auth', entityId: user._id }).catch(() => {});
    res.status(201).json({ success: true, user: publicUser(user) });
  } catch (error) { next(error); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const lockout = getLoginLockout(req, normalizedEmail);
    if (lockout) {
      res.set('Retry-After', String(lockout.retryAfter));
      return res.status(429).json({ success: false, message: `Too many failed login attempts. Please try again in ${Math.ceil(lockout.retryAfter / 60)} minutes.` });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      const failedLogin = recordFailedLogin(req, normalizedEmail);
      if (failedLogin) {
        res.set('Retry-After', String(failedLogin.retryAfter));
        return res.status(429).json({ success: false, message: 'Too many failed login attempts. Please try again in 5 minutes.' });
      }

      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (user.status === 'suspended' && user.suspendedUntil && new Date(user.suspendedUntil) <= new Date()) {
      user.status = 'active';
      user.isActive = true;
      user.suspendedUntil = undefined;
      user.suspensionReason = undefined;
      user.suspendedBy = undefined;
      await user.save({ validateBeforeSave: false });
    }
    if (user.status === 'suspended') {
      const now = new Date();
      const suspendedUntil = user.suspendedUntil ? new Date(user.suspendedUntil) : null;
      const remainingMs = suspendedUntil ? Math.max(0, suspendedUntil.getTime() - now.getTime()) : 0;
      const dayMs = 24 * 60 * 60 * 1000;
      const daysRemaining = Math.ceil(remainingMs / dayMs);
      const durationMessage = remainingMs < dayMs
        ? 'less than a day'
        : `${daysRemaining} more day${daysRemaining === 1 ? '' : 's'}`;
      const reason = user.suspensionReason ? ` Reason: ${user.suspensionReason}` : '';
      return res.status(403).json({
        success: false,
        status: 'suspended',
        suspendedUntil: user.suspendedUntil || null,
        daysRemaining,
        reason: user.suspensionReason || '',
        message: `Your account is suspended for ${durationMessage}.${reason}`,
      });
    }
    if (user.status === 'banned') {
      const reason = user.suspensionReason ? ` Reason: ${user.suspensionReason}` : '';
      return res.status(403).json({ success: false, status: 'banned', suspendedUntil: null, daysRemaining: null, reason: user.suspensionReason || '', message: `Your account is permanently banned.${reason}` });
    }
    if (user.status === 'deleted' || !user.isActive) return res.status(403).json({ success: false, message: 'This account is inactive.' });
    clearFailedLogins(req, normalizedEmail);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    await logActivity({ actor: user, action: 'login', message: `${user.name} logged in`, scope: user.role === 'barangay' ? 'barangay' : user.role === 'user' ? 'user' : 'admin', entityType: 'auth', entityId: user._id }).catch(() => {});
    res.json({ success: true, token: issueToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
};

export const refresh = async (req, res) => {
  res.json({ success: true, token: issueToken(req.user), user: publicUser(req.user) });
};

export const logout = async (req, res) => {
  await logActivity({ actor: req.user, action: 'logout', message: `${req.user.name} logged out`, scope: req.user.role === 'barangay' ? 'barangay' : req.user.role === 'user' ? 'user' : 'admin', entityType: 'auth', entityId: req.user._id }).catch(() => {});
  res.json({ success: true, message: 'Logged out successfully.' });
};
export const getMe = (req, res) => res.json({ success: true, user: publicUser(req.user) });

export const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword))) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    user.password = req.body.newPassword;
    await user.save();
    await logActivity({ actor: req.user, action: 'password_changed', message: `${req.user.name} changed their password`, scope: req.user.role === 'barangay' ? 'barangay' : req.user.role === 'user' ? 'user' : 'admin', entityType: 'profile', entityId: req.user._id }).catch(() => {});
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) { next(error); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name?.trim() || !email?.trim()) return res.status(422).json({ success: false, message: 'Name and email are required.' });
    const normalizedEmail = email.trim().toLowerCase();
    const currentEmail = String(req.user.email || '').trim().toLowerCase();
    const emailChanged = currentEmail !== normalizedEmail;
    if (emailChanged) {
      const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } });
      if (duplicate) return res.status(409).json({ success: false, message: 'Email already registered.' });
    }
    const nameChanged = req.user.name !== name.trim();
    req.user.name = name.trim();
    req.user.email = normalizedEmail;
    await req.user.save({ validateBeforeSave: false });
    const action = nameChanged && emailChanged ? 'profile_updated' : nameChanged ? 'name_updated' : 'email_updated';
    const message = action === 'profile_updated' ? `${req.user.name} updated their profile` : `${req.user.name} updated their ${action === 'name_updated' ? 'name' : 'email'}`;
    await logActivity({ actor: req.user, action, message, scope: req.user.role === 'barangay' ? 'barangay' : req.user.role === 'user' ? 'user' : 'admin', entityType: 'profile', entityId: req.user._id }).catch(() => {});
    res.json({ success: true, user: publicUser(req.user) });
  } catch (error) { next(error); }
};

export const deleteAccount = async (req, res, next) => {
  try {
    req.user.isActive = false;
    req.user.status = 'deleted';
    req.user.deletedAt = new Date();
    await req.user.save({ validateBeforeSave: false });
    await logActivity({ actor: req.user, action: 'account_deleted', message: `${req.user.name} deleted their account`, scope: req.user.role === 'barangay' ? 'barangay' : req.user.role === 'user' ? 'user' : 'admin', entityType: 'profile', entityId: req.user._id }).catch(() => {});
    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) { next(error); }
};

export const checkEmail = async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  const exists = Boolean(email) && Boolean(await User.findOne({ email }));
  res.json({ success: true, exists });
};

export const forgotPassword = async (req, res) => {
  const response = { success: true, message: 'If an account exists for this email, a reset code has been sent.' };

  try {
    const user = await User.findOne({ email: String(req.body.email || '').trim().toLowerCase() });
    if (!user) return res.json(response);

    await logActivity({ actor: user, action: 'password_reset_requested', message: `${user.name} requested a password reset`, scope: user.role === 'barangay' ? 'barangay' : user.role === 'user' ? 'user' : 'admin', entityType: 'auth', entityId: user._id }).catch(() => {});
    const rawToken = crypto.randomBytes(32).toString('hex');
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    user.passwordResetCode = await bcrypt.hash(resetCode, 12);
    user.passwordResetCodeExpires = Date.now() + 15 * 60 * 1000;
    user.passwordResetCodeAttempts = 0;
    user.passwordResetCodeToken = undefined;
    user.passwordResetCodeTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Reset code for ${user.email}: ${resetCode}`);
    }

    try {
      await sendPasswordResetCode(user.email, resetCode, user.name, rawToken);
    } catch (error) {
      console.error('[forgot-password] Email delivery failed:', error.message);
    }
  } catch (error) {
    console.error('[forgot-password] Error:', error.message);
    console.error('[forgot-password] Stack:', error.stack);
  }

  return res.json(response);
};

export const verifyResetCode = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    const user = await User.findOne({ email }).select('+passwordResetCode +passwordResetCodeExpires +passwordResetCodeAttempts');
    if (!user || !user.passwordResetCode || !user.passwordResetCodeExpires || user.passwordResetCodeExpires <= new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }
    if ((user.passwordResetCodeAttempts || 0) >= 5) {
      user.passwordResetCode = undefined;
      user.passwordResetCodeExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(429).json({ success: false, message: 'Too many invalid code attempts. Please request a new code.' });
    }

    const isValid = await bcrypt.compare(code, user.passwordResetCode);
    if (!isValid) {
      user.passwordResetCodeAttempts = (user.passwordResetCodeAttempts || 0) + 1;
      if (user.passwordResetCodeAttempts >= 5) {
        user.passwordResetCode = undefined;
        user.passwordResetCodeExpires = undefined;
      }
      await user.save({ validateBeforeSave: false });
      return res.status(user.passwordResetCodeAttempts >= 5 ? 429 : 400).json({
        success: false,
        message: user.passwordResetCodeAttempts >= 5 ? 'Too many invalid code attempts. Please request a new code.' : 'Invalid reset code.',
      });
    }

    const rawCodeToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetCodeToken = crypto.createHash('sha256').update(rawCodeToken).digest('hex');
    user.passwordResetCodeTokenExpires = Date.now() + 10 * 60 * 1000;
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;
    user.passwordResetCodeAttempts = 0;
    await user.save({ validateBeforeSave: false });
    return res.json({ success: true, token: rawCodeToken });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.body.token || '').digest('hex');
    const user = await User.findOne({
      $or: [
        { resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: Date.now() } },
        { passwordResetCodeToken: tokenHash, passwordResetCodeTokenExpires: { $gt: Date.now() } },
      ],
    }).select('+resetPasswordToken +resetPasswordExpires +passwordResetCodeToken +passwordResetCodeTokenExpires');
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.passwordResetCodeToken = undefined;
    user.passwordResetCodeTokenExpires = undefined;
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;
    user.passwordResetCodeAttempts = 0;
    await user.save();
    await logActivity({ actor: user, action: 'password_reset', message: `${user.name} reset their password`, scope: user.role === 'barangay' ? 'barangay' : user.role === 'user' ? 'user' : 'admin', entityType: 'auth', entityId: user._id }).catch(() => {});
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) { next(error); }
};
