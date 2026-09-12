import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { clearFailedLogins, getLoginLockout, recordFailedLogin } from '../middleware/loginLockout.js';
import { logActivity } from '../utils/logActivity.js';

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, barangay: user.barangay, isActive: user.isActive });

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, barangay, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const isPrivilegedRole = req.user && ['superadmin', 'admin'].includes(req.user.role);
    const safeRole = isPrivilegedRole && ['superadmin', 'admin', 'staff', 'barangay', 'user'].includes(role) ? role : 'user';

    const user = await User.create({ name, email, password, role: safeRole, barangay, phone });
    await logActivity({ actor: user, action: 'registered', message: `${user.name} registered a new account`, scope: user.role === 'barangay' ? 'barangay' : 'user', entityType: 'auth', entityId: user._id }).catch(() => {});
    res.status(201).json({ success: true, user: publicUser(user) });
  } catch (error) { next(error); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const lockout = getLoginLockout(req, email);
    if (lockout) {
      res.set('Retry-After', String(lockout.retryAfter));
      return res.status(429).json({ success: false, message: `Too many failed login attempts. Please try again in ${Math.ceil(lockout.retryAfter / 60)} minutes.` });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      const failedLogin = recordFailedLogin(req, email);
      if (failedLogin) {
        res.set('Retry-After', String(failedLogin.retryAfter));
        return res.status(429).json({ success: false, message: 'Too many failed login attempts. Please try again in 5 minutes.' });
      }

      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'This account is inactive.' });
    clearFailedLogins(req, email);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    await logActivity({ actor: user, action: 'login', message: `${user.name} logged in`, scope: user.role === 'barangay' ? 'barangay' : user.role === 'user' ? 'user' : 'admin', entityType: 'auth', entityId: user._id }).catch(() => {});
    res.json({ success: true, token: generateToken(user._id), user: publicUser(user) });
  } catch (error) { next(error); }
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
    const duplicate = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: req.user._id } });
    if (duplicate) return res.status(409).json({ success: false, message: 'Email already registered.' });
    const nameChanged = req.user.name !== name.trim();
    const emailChanged = req.user.email !== email.trim().toLowerCase();
    req.user.name = name.trim();
    req.user.email = email.trim().toLowerCase();
    await req.user.save({ validateBeforeSave: false });
    const action = nameChanged && emailChanged ? 'profile_updated' : nameChanged ? 'name_updated' : 'email_updated';
    const message = action === 'profile_updated' ? `${req.user.name} updated their profile` : `${req.user.name} updated their ${action === 'name_updated' ? 'name' : 'email'}`;
    await logActivity({ actor: req.user, action, message, scope: req.user.role === 'barangay' ? 'barangay' : req.user.role === 'user' ? 'user' : 'admin', entityType: 'profile', entityId: req.user._id }).catch(() => {});
    res.json({ success: true, user: publicUser(req.user) });
  } catch (error) { next(error); }
};

export const deleteAccount = async (req, res, next) => {
  try {
    await logActivity({ actor: req.user, action: 'account_deleted', message: `${req.user.name} deleted their account`, scope: req.user.role === 'barangay' ? 'barangay' : req.user.role === 'user' ? 'user' : 'admin', entityType: 'profile', entityId: req.user._id }).catch(() => {});
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) { next(error); }
};

export const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const response = { success: true, message: 'If an account exists, a reset link has been sent.' };
  if (!user) return res.json(response);
  await logActivity({ actor: user, action: 'password_reset_requested', message: `${user.name} requested a password reset`, scope: user.role === 'barangay' ? 'barangay' : user.role === 'user' ? 'user' : 'admin', entityType: 'auth', entityId: user._id }).catch(() => {});
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  if (process.env.NODE_ENV !== 'production') response.resetToken = rawToken;
  return res.json(response);
};

export const resetPassword = async (req, res, next) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.body.token || '').digest('hex');
    const user = await User.findOne({ resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: Date.now() } }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    await logActivity({ actor: user, action: 'password_reset', message: `${user.name} reset their password`, scope: user.role === 'barangay' ? 'barangay' : user.role === 'user' ? 'user' : 'admin', entityType: 'auth', entityId: user._id }).catch(() => {});
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) { next(error); }
};
