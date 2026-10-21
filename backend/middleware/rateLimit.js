import rateLimit, { MemoryStore } from 'express-rate-limit';

const retryAfterSeconds = (req) => {
  const resetTime = req.rateLimit?.resetTime;
  if (!resetTime) return 60;
  return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
};

const limiterRegistry = new Map();

const createLimiter = ({ name, windowMs, limit, keyGenerator, skipSuccessfulRequests = false }) => {
  const store = new MemoryStore();
  const limiter = rateLimit({
    windowMs,
    limit,
    store,
    keyGenerator,
    skipSuccessfulRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      const retryAfter = retryAfterSeconds(req);
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({ success: false, message: 'Too many requests. Please try again later.', retryAfter });
    },
  });
  limiterRegistry.set(name, { limiter, store, limit });
  return limiter;
};

export const authLimiter = createLimiter({ name: 'auth', windowMs: 15 * 60 * 1000, limit: 100 });
export const loginLimiter = createLimiter({ name: 'login', windowMs: 15 * 60 * 1000, limit: 5, skipSuccessfulRequests: true });
export const biometricLimiter = createLimiter({ name: 'biometric', windowMs: 15 * 60 * 1000, limit: 20 });
export const contactLimiter = createLimiter({ name: 'contact', windowMs: 60 * 60 * 1000, limit: 5 });
export const forgotPasswordLimiter = createLimiter({ name: 'forgotPassword', windowMs: 15 * 60 * 1000, limit: 3 });
export const resetPasswordLimiter = createLimiter({ name: 'resetPassword', windowMs: 60 * 60 * 1000, limit: 5 });
export const reactivationRequestLimiter = createLimiter({ name: 'reactivationRequest', windowMs: 60 * 60 * 1000, limit: 3 });
export const reactivationVerifyLimiter = createLimiter({ name: 'reactivationVerify', windowMs: 60 * 60 * 1000, limit: 5 });
export const emailChangeRequestLimiter = createLimiter({ name: 'emailChangeRequest', windowMs: 60 * 60 * 1000, limit: 3, keyGenerator: (req) => `user:${req.user?._id || req.ip}` });
export const emailChangeVerifyLimiter = createLimiter({ name: 'emailChangeVerify', windowMs: 15 * 60 * 1000, limit: 10, keyGenerator: (req) => `user:${req.user?._id || req.ip}` });
export const passwordChangeRequestLimiter = createLimiter({ name: 'passwordChangeRequest', windowMs: 60 * 60 * 1000, limit: 3, keyGenerator: (req) => `user:${req.user?._id || req.ip}` });
export const passwordChangeVerifyLimiter = createLimiter({ name: 'passwordChangeVerify', windowMs: 15 * 60 * 1000, limit: 10, keyGenerator: (req) => `user:${req.user?._id || req.ip}` });
export const reportSubmitLimiter = createLimiter({
  name: 'reportSubmit',
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => `user:${req.user?._id || req.ip}`,
});
export const globalLimiter = createLimiter({ name: 'global', windowMs: 15 * 60 * 1000, limit: 200 });

export const getRateLimitStatus = () => {
  const now = Date.now();
  const entries = [];
  const stats = [];

  for (const [name, { store, limit }] of limiterRegistry) {
    const clients = new Map([...store.previous, ...store.current]);
    let blockedClients = 0;
    let activeClients = 0;
    let totalRequests = 0;
    for (const [key, client] of clients) {
      if (client.resetTime.getTime() <= now) continue;
      activeClients += 1;
      totalRequests += client.totalHits;
      if (client.totalHits < limit) continue;
      blockedClients += 1;
      entries.push({
        type: 'rate-limit',
        id: Buffer.from(`${name}\n${key}`).toString('base64url'),
        identifier: key,
        reason: 'Rate Limit',
        unlockAt: client.resetTime.toISOString(),
        remainingMinutes: Math.ceil((client.resetTime.getTime() - now) / 60000),
        limiter: name,
        requests: client.totalHits,
        limit,
      });
    }
    stats.push({ limiter: name, activeClients, blockedClients, totalRequests });
  }

  return { entries, stats };
};

export const clearRateLimitById = async (id) => {
  let decoded;
  try {
    decoded = Buffer.from(id, 'base64url').toString();
  } catch {
    return false;
  }
  if (!decoded || Buffer.from(decoded).toString('base64url') !== id) return false;
  const separator = decoded.indexOf('\n');
  if (separator < 1) return false;
  const name = decoded.slice(0, separator);
  const key = decoded.slice(separator + 1);
  const entry = limiterRegistry.get(name);
  if (!entry || !key) return false;
  const client = await entry.limiter.getKey(key);
  if (!client) return false;
  await entry.limiter.resetKey(key);
  return true;
};
