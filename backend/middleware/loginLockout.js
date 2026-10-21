const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_MS = 5 * 60 * 1000;
export const loginLockout = new Map();

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

export const recordFailedLogin = (req, email) => {
  const key = getKey(req, email);
  const current = loginLockout.get(key) || { failedAttempts: 0 };
  const failedAttempts = current.failedAttempts + 1;
  const lockedUntil = failedAttempts >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_MS : null;

  loginLockout.set(key, {
    failedAttempts,
    lastAttemptAt: Date.now(),
    lockedUntil,
  });

  return lockedUntil ? { retryAfter: getRemainingSeconds(lockedUntil) } : null;
};

export const clearFailedLogins = (req, email) => {
  loginLockout.delete(getKey(req, email));
};

export const getActiveLoginLockouts = () => {
  const now = Date.now();
  const entries = [];

  for (const [key, record] of loginLockout) {
    const unlockAt = record.lockedUntil || record.lastAttemptAt + LOCKOUT_MS;
    if (unlockAt <= now) {
      loginLockout.delete(key);
      continue;
    }

    const separator = key.lastIndexOf(':');
    const ip = key.slice(0, separator);
    const email = key.slice(separator + 1);
    entries.push({
      type: 'login-lockout',
      id: Buffer.from(key).toString('base64url'),
      identifier: `${email} / ${ip}`,
      reason: 'Failed Logins',
      unlockAt: new Date(unlockAt).toISOString(),
      remainingMinutes: Math.ceil((unlockAt - now) / 60000),
      failedAttempts: record.failedAttempts,
      locked: Boolean(record.lockedUntil),
    });
  }

  return entries;
};

export const clearLoginLockoutById = (id) => {
  let key;
  try {
    key = Buffer.from(id, 'base64url').toString();
  } catch {
    return false;
  }
  if (!key || Buffer.from(key).toString('base64url') !== id) return false;
  return loginLockout.delete(key);
};
