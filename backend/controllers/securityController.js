import { clearLoginLockoutById, loginLockout } from '../middleware/loginLockout.js';
import { clearRateLimitById, getRateLimitStatus } from '../middleware/rateLimit.js';

export const getSecurityStatus = (req, res) => {
  const now = Date.now();
  const lockouts = [];
  for (const [key, record] of loginLockout) {
    if (!record.lockedUntil) continue;
    if (record.lockedUntil <= now) {
      loginLockout.delete(key);
      continue;
    }

    const separator = key.lastIndexOf(':');
    const ip = key.slice(0, separator);
    const email = key.slice(separator + 1);
    lockouts.push({
      type: 'login-lockout',
      id: Buffer.from(key).toString('base64url'),
      identifier: `${email} / ${ip}`,
      reason: 'Failed Logins',
      unlockAt: new Date(record.lockedUntil).toISOString(),
      remainingMinutes: Math.ceil((record.lockedUntil - now) / 60000),
      failedAttempts: record.failedAttempts,
    });
  }

  const rateLimitStatus = getRateLimitStatus();
  const entries = [...lockouts, ...rateLimitStatus.entries];
  res.json({
    success: true,
    lockouts,
    rateLimitEntries: rateLimitStatus.entries,
    entries,
    rateLimitStats: rateLimitStatus.stats,
  });
};

export const unlockSecurityEntry = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    let unlocked = false;
    if (type === 'login-lockout') unlocked = clearLoginLockoutById(id);
    if (type === 'rate-limit') unlocked = await clearRateLimitById(id);
    if (!unlocked) return res.status(404).json({ success: false, message: 'Security entry not found or already expired.' });
    res.json({ success: true, message: 'Security entry unlocked.' });
  } catch (error) {
    next(error);
  }
};
