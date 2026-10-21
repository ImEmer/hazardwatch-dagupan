import SecurityLog from '../models/SecurityLog.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const loginLockout = new Map();

const getKey = (req, email) => `${req.ip}:${String(email || '').trim().toLowerCase()}`;

const getRemainingSeconds = (lockedUntil) => Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000));

export const getLoginLockout = (req, email) => {
  const key = getKey(req, email);
  const record = loginLockout.get(key);

  if (!record) return null;

  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    return { retryAfter: getRemainingSeconds(record.lockedUntil) };
  }

  if (record.lockedUntil || Date.now() - record.lastAttemptAt > LOCKOUT_MS) {
    loginLockout.delete(key);
    return null;
  }

  return null;
};

export const recordFailedLogin = async (req, email) => {
  const key = getKey(req, email);
  const current = loginLockout.get(key) || { failedAttempts: 0 };
  const failedAttempts = current.failedAttempts + 1;
  const lockedUntil = failedAttempts >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_MS : null;

  loginLockout.set(key, {
    failedAttempts,
    lastAttemptAt: Date.now(),
    lockedUntil,
  });

  if (lockedUntil) {
    await SecurityLog.create({
      identifier: `${String(email || '').trim().toLowerCase()} / ${req.ip}`,
      reason: 'Failed Login',
      details: `${failedAttempts} failed attempts on /login.`,
      status: 'Blocked',
    });
  }

  return lockedUntil ? { retryAfter: getRemainingSeconds(lockedUntil) } : null;
};

export const clearFailedLogins = (req, email) => {
  loginLockout.delete(getKey(req, email));
};
