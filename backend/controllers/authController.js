import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import { clearFailedLogins, getLoginLockout, recordFailedLogin } from '../middleware/loginLockout.js';
import { logActivity } from '../utils/logActivity.js';
import { sendAccountVerifiedEmail, sendNewDeviceAlertEmail, sendPasswordResetCode, sendTwoFactorCode, sendVerificationEmail } from '../utils/sendEmail.js';

const VERIFICATION_CUTOFF = new Date('2026-09-25T00:00:00.000Z');

export const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, barangay: user.barangay, isActive: user.isActive, emailVerified: user.emailVerified, twoFactorEnabled: user.twoFactorEnabled, preferences: user.preferences });
const tokenExpiryFor = (role) => ['admin', 'superadmin', 'barangay'].includes(role) ? '1d' : '7d';
export const issueToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: tokenExpiryFor(user.role) });
const privilegedRoles = ['superadmin', 'admin', 'barangay'];
const PRIVILEGED_NOTIFICATION_EMAIL = 'emersonisla06@gmail.com';
const createOtp = () => crypto.randomInt(100000, 1000000).toString();
const createLoginChallenge = (user) => jwt.sign({ id: user._id, purpose: 'login-2fa' }, process.env.JWT_SECRET, { expiresIn: '10m' });
export const createDeviceFingerprint = ({ userAgent = '', acceptLanguage = '', deviceId = '' }) => {
  const fingerprintSource = deviceId || `${userAgent || 'unknown'}|${acceptLanguage || 'unknown'}`;
  return crypto.createHash('sha256').update(fingerprintSource).digest('hex');
};

export const syncKnownDevice = (knownDevices = [], { deviceId, userAgent = '', ip = '', now = new Date() } = {}) => {
  const trimmed = Array.isArray(knownDevices) ? knownDevices : [];
  const index = trimmed.findIndex((entry) => entry?.deviceId === deviceId);
  const baseEntry = {
    deviceId,
    firstSeenAt: now,
    lastSeenAt: now,
    userAgent: userAgent || '',
    ip: ip || '',
  };

  if (index === -1) {
    const next = [...trimmed, baseEntry];
    if (next.length > 20) next.shift();
    return next;
  }

  const updated = [...trimmed];
  updated[index] = {
    ...updated[index],
    lastSeenAt: now,
    userAgent: userAgent || updated[index].userAgent || '',
    ip: ip || updated[index].ip || '',
  };
  return updated;
};

const deliverTwoFactorCode = async (user, code) => {
  const target = user.notificationEmail || user.email;
  if (process.env.NODE_ENV === 'production') {
    await sendTwoFactorCode({ email: target, name: user.name, code });
    return;
  }
  console.log(`[auth] 2FA OTP for ${user.email} sent to ${target}: ${code}`);
  await sendTwoFactorCode({ email: target, name: user.name, code }).catch((error) => {
    console.error('[auth] Two-factor email delivery failed in development:', error.message);
  });
};
const revokeToken = async (req, decodedToken = jwt.decode(req.headers.authorization.slice(7))) => {
  const token = req.headers.authorization.slice(7);
  if (!decodedToken?.exp) return;
  await TokenBlacklist.updateOne(
    { token: crypto.createHash('sha256').update(token).digest('hex') },
    { $setOnInsert: { token: crypto.createHash('sha256').update(token).digest('hex'), userId: req.user._id, expiresAt: new Date(decodedToken.exp * 1000) } },
    { upsert: true },
  );
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, barangay, phone, agreedToTerms } = req.body;
    if (agreedToTerms !== true) return res.status(400).json({ success: false, message: 'You must agree to the Terms of Service.' });
    if (typeof email === 'string' && /\s/.test(email)) return res.status(400).json({ success: false, message: 'Email and password cannot contain spaces.' });
    if (typeof password === 'string' && /\s/.test(password)) return res.status(400).json({ success: false, message: 'Email and password cannot contain spaces.' });

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const safeRole = ['superadmin', 'admin', 'staff', 'barangay', 'user'].includes(role) ? role : 'user';
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.status !== 'deleted') {
      return res.status(400).json({ success: false, message: 'Email already registered. Please log in instead.' });
    }

    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const hashedVerificationCode = await bcrypt.hash(verificationCode, 12);
    const verificationExpires = Date.now() + 15 * 60 * 1000;
    if (existingUser) {
      existingUser.name = name;
      existingUser.email = normalizedEmail;
      existingUser.password = password;
      existingUser.role = safeRole;
      existingUser.twoFactorEnabled = privilegedRoles.includes(safeRole);
      existingUser.notificationEmail = privilegedRoles.includes(safeRole) ? PRIVILEGED_NOTIFICATION_EMAIL : null;
      existingUser.barangay = barangay;
      existingUser.phone = phone;
      existingUser.status = 'pending';
      existingUser.isActive = false;
      existingUser.deletedAt = undefined;
      existingUser.emailVerified = false;
      existingUser.verificationRequired = true;
      existingUser.emailVerificationCode = hashedVerificationCode;
      existingUser.emailVerificationToken = undefined;
      existingUser.emailVerificationExpires = verificationExpires;
      await existingUser.save();
      if (process.env.NODE_ENV === 'development') console.log(`🔐 Verification code for ${normalizedEmail}: ${verificationCode}`);
      try {
        await sendVerificationEmail({ email: existingUser.email, name: existingUser.name, code: verificationCode });
      } catch (emailError) {
        console.error('[register] Verification email failed:', emailError.message);
      }
      return res.status(201).json({ success: true, message: 'Account created. Check your email for the 6-digit code.', user: publicUser(existingUser) });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: safeRole,
      twoFactorEnabled: privilegedRoles.includes(safeRole),
      notificationEmail: privilegedRoles.includes(safeRole) ? PRIVILEGED_NOTIFICATION_EMAIL : null,
      barangay,
      phone,
      status: 'pending',
      isActive: false,
      emailVerified: false,
      verificationRequired: true,
      emailVerificationCode: hashedVerificationCode,
      emailVerificationExpires: verificationExpires,
    });

    if (process.env.NODE_ENV === 'development') console.log(`🔐 Verification code for ${normalizedEmail}: ${verificationCode}`);
    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        code: verificationCode,
      });
    } catch (emailError) {
      console.error('[register] Verification email failed:', emailError.message);
    }

    await logActivity({ actor: user, action: 'registered', message: `${user.name} registered a new account`, scope: user.role === 'barangay' ? 'barangay' : 'user', entityType: 'auth', entityId: user._id }).catch(() => {});
    res.status(201).json({ success: true, message: 'Check your email to verify your account.', user: publicUser(user) });
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

    const user = await User.findOne({ email: normalizedEmail }).select('+password +notificationEmail +otpCode +otpExpires +otpAttempts +otpBlockedUntil');
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
    const requiresVerification = user.status === 'pending'
      || (user.verificationRequired !== false && (!user.createdAt || new Date(user.createdAt) > VERIFICATION_CUTOFF));
    if (!user.emailVerified && requiresVerification) return res.status(403).json({ success: false, message: 'Please verify your email first. Check your inbox for the 6-digit code.', needsVerification: true, email: user.email });
    if (user.status === 'deleted' || !user.isActive) return res.status(403).json({ success: false, message: 'This account is inactive.' });
    if (privilegedRoles.includes(user.role) && user.twoFactorEnabled) {
      const now = new Date();
      if (user.otpBlockedUntil && user.otpBlockedUntil > now) {
        const retryAfter = Math.ceil((user.otpBlockedUntil.getTime() - now.getTime()) / 1000);
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({ success: false, message: 'Two-factor verification is temporarily locked. Try again in 15 minutes.' });
      }
      if (user.otpBlockedUntil && user.otpBlockedUntil <= now) {
        user.otpBlockedUntil = undefined;
        user.otpAttempts = 0;
      }
      const code = createOtp();
      await deliverTwoFactorCode(user, code);
      user.otpCode = await bcrypt.hash(code, 12);
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save({ validateBeforeSave: false });
      clearFailedLogins(req, normalizedEmail);
      return res.json({ success: true, requiresOTP: true, tempToken: createLoginChallenge(user), message: 'A security code was sent to your email.' });
    }
    clearFailedLogins(req, normalizedEmail);
    const userAgent = String(req.headers['user-agent'] || '');
    const acceptLanguage = String(req.headers['accept-language'] || '');
    const deviceIdHeader = String(req.headers['x-device-id'] || '');
    const deviceId = createDeviceFingerprint({ userAgent, acceptLanguage, deviceId: deviceIdHeader });
    const existingDevice = user.knownDevices?.find((entry) => entry?.deviceId === deviceId);
    const deviceName = (() => {
      const match = /([A-Za-z0-9._-]+)\s*\(([^)]+)\)/.exec(userAgent) || /([A-Za-z0-9._-]+)\//.exec(userAgent);
      if (!userAgent) return 'New device';
      if (match) return `${match[1] || 'Browser'} on ${match[2] || 'device'}`;
      return userAgent.split(' ').slice(0, 5).join(' ') || 'New device';
    })();
    const loginTimestamp = new Date();
    const nextKnownDevices = syncKnownDevice(user.knownDevices, { deviceId, userAgent, ip: req.ip || req.socket?.remoteAddress || 'unknown-ip', now: loginTimestamp });
    user.knownDevices = nextKnownDevices;
    user.lastLogin = loginTimestamp;
    await user.save({ validateBeforeSave: false });

    if (!existingDevice) {
      try {
        await sendNewDeviceAlertEmail({
          email: user.notificationEmail || user.email,
          name: user.name,
          deviceName,
          ipAddress: req.ip || req.socket?.remoteAddress || 'unknown IP',
          sentAt: loginTimestamp,
        });
      } catch (error) {
        console.error('[auth] New device alert email failed:', error.message);
      }
    }

    await logActivity({ actor: user, action: 'login', message: `${user.name} logged in`, scope: user.role === 'barangay' ? 'barangay' : user.role === 'user' ? 'user' : 'admin', entityType: 'auth', entityId: user._id }).catch(() => {});
    res.json({ success: true, token: issueToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
};

export const verifyTwoFactorLogin = async (req, res, next) => {
  try {
    const decoded = jwt.verify(String(req.body.tempToken || ''), process.env.JWT_SECRET);
    if (decoded.purpose !== 'login-2fa') return res.status(401).json({ success: false, message: 'Invalid verification session.' });
    const user = await User.findById(decoded.id).select('+otpCode +otpExpires +otpAttempts +otpBlockedUntil');
    if (!user || !user.isActive || !privilegedRoles.includes(user.role) || !user.twoFactorEnabled) return res.status(403).json({ success: false, message: 'This verification session is no longer valid.' });
    const now = new Date();
    if (user.otpBlockedUntil && user.otpBlockedUntil > now) {
      res.set('Retry-After', String(Math.ceil((user.otpBlockedUntil.getTime() - now.getTime()) / 1000)));
      return res.status(429).json({ success: false, message: 'Too many incorrect security codes. Try again in 15 minutes.' });
    }
    if (user.status === 'suspended' && user.suspendedUntil && user.suspendedUntil <= now) {
      user.status = 'active';
      user.isActive = true;
      user.suspendedUntil = undefined;
      user.suspensionReason = undefined;
      user.suspendedBy = undefined;
    }
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'This account is not active.' });

    const code = String(req.body.code || '').trim();
    const valid = Boolean(code && user.otpCode && user.otpExpires && user.otpExpires > now && await bcrypt.compare(code, user.otpCode));
    if (!valid) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.otpBlockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.otpCode = undefined;
        user.otpExpires = undefined;
      }
      await user.save({ validateBeforeSave: false });
      const locked = user.otpAttempts >= 5;
      if (locked) res.set('Retry-After', '900');
      return res.status(locked ? 429 : 401).json({ success: false, message: locked ? 'Too many incorrect security codes. Try again in 15 minutes.' : 'Invalid or expired security code.' });
    }

    const loginTime = new Date();
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.otpBlockedUntil = undefined;
    const userAgent = String(req.headers['user-agent'] || '');
    const acceptLanguage = String(req.headers['accept-language'] || '');
    const deviceIdHeader = String(req.headers['x-device-id'] || '');
    const deviceId = createDeviceFingerprint({ userAgent, acceptLanguage, deviceId: deviceIdHeader });
    const existingDevice = user.knownDevices?.find((entry) => entry?.deviceId === deviceId);
    const deviceName = (() => {
      const match = /([A-Za-z0-9._-]+)\s*\(([^)]+)\)/.exec(userAgent) || /([A-Za-z0-9._-]+)\//.exec(userAgent);
      if (!userAgent) return 'New device';
      if (match) return `${match[1] || 'Browser'} on ${match[2] || 'device'}`;
      return userAgent.split(' ').slice(0, 5).join(' ') || 'New device';
    })();
    const nextKnownDevices = syncKnownDevice(user.knownDevices, { deviceId, userAgent, ip: req.ip || req.socket?.remoteAddress || 'unknown-ip', now: loginTime });
    user.knownDevices = nextKnownDevices;
    user.lastLogin = loginTime;
    await user.save({ validateBeforeSave: false });

    if (!existingDevice) {
      try {
        await sendNewDeviceAlertEmail({
          email: user.notificationEmail || user.email,
          name: user.name,
          deviceName,
          ipAddress: req.ip || req.socket?.remoteAddress || 'unknown IP',
          sentAt: loginTime,
        });
      } catch (error) {
        console.error('[auth] New device alert email failed:', error.message);
      }
    }

    await logActivity({ actor: user, action: 'login', message: `${user.name} logged in`, scope: user.role === 'barangay' ? 'barangay' : 'admin', entityType: 'auth', entityId: user._id }).catch(() => {});
    return res.json({ success: true, token: issueToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Verification session expired. Log in again.' });
    next(error);
  }
};

export const resendTwoFactorLoginCode = async (req, res, next) => {
  try {
    const decoded = jwt.verify(String(req.body.tempToken || ''), process.env.JWT_SECRET);
    if (decoded.purpose !== 'login-2fa') return res.status(401).json({ success: false, message: 'Invalid verification session.' });
    const user = await User.findById(decoded.id).select('+notificationEmail +otpAttempts +otpBlockedUntil');
    if (!user || !user.isActive || !user.twoFactorEnabled || !privilegedRoles.includes(user.role)) return res.status(403).json({ success: false, message: 'This verification session is no longer valid.' });
    if (user.otpBlockedUntil && user.otpBlockedUntil > new Date()) return res.status(429).json({ success: false, message: 'Two-factor verification is temporarily locked.' });
    const code = createOtp();
    await deliverTwoFactorCode(user, code);
    user.otpCode = await bcrypt.hash(code, 12);
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'A new security code was sent to your email.' });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Verification session expired. Log in again.' });
    next(error);
  }
};

export const enableTwoFactor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+notificationEmail');
    if (!user || !privilegedRoles.includes(user.role)) return res.status(403).json({ success: false, message: 'Two-factor authentication is only available to privileged accounts.' });
    if (user.twoFactorEnabled) return res.status(409).json({ success: false, message: 'Two-factor authentication is already enabled.' });
    const code = createOtp();
    const setupHash = await bcrypt.hash(code, 12);
    await deliverTwoFactorCode(user, code);
    user.twoFactorSetupCode = setupHash;
    user.twoFactorSetupExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.twoFactorSetupAttempts = 0;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, requiresOTP: true, message: 'Enter the emailed code to finish enabling 2FA.' });
  } catch (error) { next(error); }
};

export const verifyTwoFactorSetup = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSetupCode +twoFactorSetupExpires +twoFactorSetupAttempts');
    if (!user || !privilegedRoles.includes(user.role)) return res.status(403).json({ success: false, message: 'Two-factor authentication is only available to privileged accounts.' });
    if (!user.twoFactorSetupCode || !user.twoFactorSetupExpires || user.twoFactorSetupExpires <= new Date()) return res.status(400).json({ success: false, message: 'The setup code expired. Start 2FA setup again.' });
    const valid = await bcrypt.compare(String(req.body.code || ''), user.twoFactorSetupCode);
    if (!valid) {
      user.twoFactorSetupAttempts = (user.twoFactorSetupAttempts || 0) + 1;
      if (user.twoFactorSetupAttempts >= 5) {
        user.twoFactorSetupCode = undefined;
        user.twoFactorSetupExpires = undefined;
      }
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, message: user.twoFactorSetupAttempts >= 5 ? 'Setup locked. Start 2FA setup again.' : 'Invalid setup code.' });
    }
    user.twoFactorEnabled = true;
    user.twoFactorSetupCode = undefined;
    user.twoFactorSetupExpires = undefined;
    user.twoFactorSetupAttempts = 0;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, user: publicUser(user) });
  } catch (error) { next(error); }
};

export const disableTwoFactor = async (req, res, next) => {
  try {
    if (!privilegedRoles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Two-factor authentication is only available to privileged accounts.' });
    const user = await User.findById(req.user._id).select('+password +otpCode +otpExpires');
    if (!user || !(await user.comparePassword(String(req.body.currentPassword || '')))) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    user.twoFactorEnabled = false;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.otpBlockedUntil = undefined;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, user: publicUser(user) });
  } catch (error) { next(error); }
};

export const refresh = async (req, res, next) => {
  try {
    await revokeToken(req);
  } catch (error) {
    return next(error);
  }
  res.json({ success: true, token: issueToken(req.user), user: publicUser(req.user) });
};

export const logout = async (req, res, next) => {
  try {
    await revokeToken(req);
  } catch (error) {
    return next(error);
  }
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
    let verificationCode;
    if (emailChanged) {
      verificationCode = crypto.randomInt(100000, 1000000).toString();
      req.user.emailVerified = false;
      req.user.verificationRequired = true;
      req.user.emailVerificationCode = await bcrypt.hash(verificationCode, 12);
      req.user.emailVerificationExpires = Date.now() + 15 * 60 * 1000;
    }
    await req.user.save({ validateBeforeSave: false });
    if (verificationCode) {
      try {
        await sendVerificationEmail({ email: req.user.email, name: req.user.name, code: verificationCode });
      } catch (emailError) {
        console.error('[profile] Verification email failed:', emailError.message);
      }
    }
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
  const exists = Boolean(email) && Boolean(await User.exists({ email, status: { $ne: 'deleted' } }));
  res.json({ success: true, exists });
};

export const verifyEmail = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    const user = await User.findOne({ email }).select('+emailVerificationCode +emailVerificationExpires');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.emailVerified) return res.status(400).json({ success: false, message: 'Email already verified.' });
    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      return res.status(400).json({ success: false, message: 'No verification code found. Please register again.' });
    }
    if (user.emailVerificationExpires <= new Date()) return res.status(400).json({ success: false, message: 'Code expired. Please register again.' });
    if (!await bcrypt.compare(code, user.emailVerificationCode)) return res.status(400).json({ success: false, message: 'Invalid code.' });

    user.emailVerified = true;
    user.isActive = true;
    user.status = 'active';
    user.emailVerificationCode = undefined;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    try {
      await sendAccountVerifiedEmail({ email: user.email, name: user.name });
    } catch (error) {
      console.error('[auth] Account verified email failed:', error.message);
    }

    return res.json({ success: true, message: 'Email verified. You can now log in.' });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res) => {
  const response = { success: true, message: 'If an account exists for this email, a reset code has been sent.' };

  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email }).select('+passwordResetLastSentAt');
    if (!user) return res.json(response);

    if (user.passwordResetLastSentAt && Date.now() - user.passwordResetLastSentAt.getTime() < 60 * 1000) {
      return res.status(429).json({ success: false, message: 'Please wait 60 seconds before requesting another code.' });
    }

    await logActivity({ actor: user, action: 'password_reset_requested', message: `${user.name} requested a password reset`, scope: user.role === 'barangay' ? 'barangay' : user.role === 'user' ? 'user' : 'admin', entityType: 'auth', entityId: user._id }).catch(() => {});
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetCode = await bcrypt.hash(resetCode, 12);
    user.passwordResetCodeExpires = Date.now() + 15 * 60 * 1000;
    user.passwordResetCodeAttempts = 0;
    user.passwordResetCodeToken = undefined;
    user.passwordResetCodeTokenExpires = undefined;
    user.passwordResetLastSentAt = new Date();
    await user.save({ validateBeforeSave: false });

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Reset code (6-digit): ${resetCode}`);
    }

    try {
      console.log('[forgot-password] Sending email to:', email);
      const info = await sendPasswordResetCode(user.email, resetCode, user.name);
      console.log('[forgot-password] Email sent:', { to: email, messageId: info.messageId });
    } catch (error) {
      console.error('[forgot-password] Email failed:', { message: error.message, code: error.code, command: error.command, response: error.response, stack: error.stack });
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
      passwordResetCodeToken: tokenHash,
      passwordResetCodeTokenExpires: { $gt: Date.now() },
    }).select('+passwordResetCodeToken +passwordResetCodeTokenExpires');
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    user.password = req.body.password;
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
