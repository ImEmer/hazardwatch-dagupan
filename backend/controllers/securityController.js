import { clearLoginLockoutById, getActiveLoginLockouts } from '../middleware/loginLockout.js';
import { clearRateLimitById, getRateLimitStatus } from '../middleware/rateLimit.js';

export const getSecurityStatus = (req, res) => {
  const rateLimitStatus = getRateLimitStatus();
  const lockouts = getActiveLoginLockouts();
  res.json({
    success: true,
    entries: [...lockouts, ...rateLimitStatus.entries],
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
