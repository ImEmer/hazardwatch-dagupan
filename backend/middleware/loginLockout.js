const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_MS = 5 * 60 * 1000;
const attempts = new Map();

const getKey = (req, email) => `${req.ip}:${String(email || '').trim().toLowerCase()}`;

const getRemainingSeconds = (lockedUntil) => Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000));

export const getLoginLockout = (req, email) => {
  const key = getKey(req, email);
  const record = attempts.get(key);

  if (!record) return null;

  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    return { retryAfter: getRemainingSeconds(record.lockedUntil) };
  }

  if (record.lockedUntil || Date.now() - record.lastAttemptAt > LOCKOUT_MS) {
    attempts.delete(key);
    return null;
  }

  return null;
};

export const recordFailedLogin = (req, email) => {
  const key = getKey(req, email);
  const current = attempts.get(key) || { failedAttempts: 0 };
  const failedAttempts = current.failedAttempts + 1;
  const lockedUntil = failedAttempts >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_MS : null;

  attempts.set(key, {
    failedAttempts,
    lastAttemptAt: Date.now(),
    lockedUntil,
  });

  return lockedUntil ? { retryAfter: getRemainingSeconds(lockedUntil) } : null;
};

export const clearFailedLogins = (req, email) => {
  attempts.delete(getKey(req, email));
};
