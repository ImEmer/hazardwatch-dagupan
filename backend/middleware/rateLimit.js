import rateLimit from 'express-rate-limit';
import SecurityLog from '../models/SecurityLog.js';

const retryAfterSeconds = (req) => {
  const resetTime = req.rateLimit?.resetTime;
  if (!resetTime) return 60;
  return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
};

const createLimiter = ({ windowMs, limit, keyGenerator, skipSuccessfulRequests = false }) => rateLimit({
  windowMs,
  limit,
  keyGenerator,
  skipSuccessfulRequests,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: async (req, res) => {
    const retryAfter = retryAfterSeconds(req);
    if (req.rateLimit?.used === limit + 1) {
      const route = req.originalUrl || req.path;
      try {
        await SecurityLog.create({
          identifier: req.ip,
          reason: 'API Rate Limit',
          details: `${req.rateLimit.used} requests exceeded the limit of ${limit} within ${windowMs}ms on ${route}.`,
          status: 'Blocked',
        });
      } catch (error) {
        console.error('[security-audit] Unable to record rate-limit event:', error);
      }
    }
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({ success: false, message: 'Too many requests. Please try again later.', retryAfter });
  },
});

export const authLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 100 });
export const loginLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 5, skipSuccessfulRequests: true });
export const biometricLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 20 });
export const contactLimiter = createLimiter({ windowMs: 60 * 60 * 1000, limit: 5 });
export const forgotPasswordLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 3 });
export const resetPasswordLimiter = createLimiter({ windowMs: 60 * 60 * 1000, limit: 5 });
export const reactivationRequestLimiter = createLimiter({ windowMs: 60 * 60 * 1000, limit: 3 });
export const reactivationVerifyLimiter = createLimiter({ windowMs: 60 * 60 * 1000, limit: 5 });
export const emailChangeRequestLimiter = createLimiter({ windowMs: 60 * 60 * 1000, limit: 3, keyGenerator: (req) => `user:${req.user?._id || req.ip}` });
export const emailChangeVerifyLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 10, keyGenerator: (req) => `user:${req.user?._id || req.ip}` });
export const passwordChangeRequestLimiter = createLimiter({ windowMs: 60 * 60 * 1000, limit: 3, keyGenerator: (req) => `user:${req.user?._id || req.ip}` });
export const passwordChangeVerifyLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 10, keyGenerator: (req) => `user:${req.user?._id || req.ip}` });
export const reportSubmitLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => `user:${req.user?._id || req.ip}`,
});
export const globalLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 200 });
