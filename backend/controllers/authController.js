import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, barangay: user.barangay, isActive: user.isActive });

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, barangay, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered.' });
    const user = await User.create({ name, email, password, role: role && ['staff', 'barangay'].includes(role) ? role : 'staff', barangay, phone });
    res.status(201).json({ success: true, user: publicUser(user) });
  } catch (error) { next(error); }
};

export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'This account is inactive.' });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, token: generateToken(user._id), user: publicUser(user) });
  } catch (error) { next(error); }
};

export const logout = (req, res) => res.json({ success: true, message: 'Logged out successfully.' });
export const getMe = (req, res) => res.json({ success: true, user: publicUser(req.user) });

export const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword))) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) { next(error); }
};

export const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const response = { success: true, message: 'If an account exists, a reset link has been sent.' };
  if (!user) return res.json(response);
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
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) { next(error); }
};
