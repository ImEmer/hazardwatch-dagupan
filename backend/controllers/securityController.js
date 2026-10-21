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

export const sendGlobalBroadcast = (req, res) => {
  const { message, type } = req.body || {};
  if (typeof message !== 'string' || !message.trim() || message.trim().length > 1000) {
    return res.status(400).json({ success: false, message: 'Broadcast message must be between 1 and 1000 characters.' });
  }
  if (!['info', 'warning', 'emergency'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Broadcast type must be info, warning, or emergency.' });
  }

  const payload = { message: message.trim(), type };
  const io = req.app.get('io');
  io.emit('global-broadcast', payload);
  if (type === 'emergency') io.emit('emergency-alert', payload.message);
  res.json({ success: true, broadcast: payload });
};
