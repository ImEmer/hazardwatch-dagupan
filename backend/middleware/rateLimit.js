import rateLimit from 'express-rate-limit';

const retryAfterSeconds = (req) => {
  const resetTime = req.rateLimit?.resetTime;
  if (!resetTime) return 60;
  return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
};

const createLimiter = ({ windowMs, limit, keyGenerator }) => rateLimit({
  windowMs,
  limit,
  keyGenerator,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = retryAfterSeconds(req);
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({ success: false, message: 'Too many requests. Please try again later.', retryAfter });
  },
});

export const authLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 100 });
export const contactLimiter = createLimiter({ windowMs: 60 * 60 * 1000, limit: 5 });
export const forgotPasswordLimiter = createLimiter({ windowMs: 60 * 60 * 1000, limit: 3 });
export const resetPasswordLimiter = createLimiter({ windowMs: 60 * 60 * 1000, limit: 5 });
export const reportSubmitLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => `user:${req.user?._id || req.ip}`,
});
export const globalLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 200 });
