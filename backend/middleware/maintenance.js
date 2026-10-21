import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import SystemSettings from '../models/SystemSettings.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import User from '../models/User.js';

const allowedDuringMaintenance = (req) => (
  (req.method === 'GET' && req.path === '/system/settings/public')
  || (req.method === 'POST' && [
    '/auth/login',
    '/auth/2fa/verify',
    '/auth/biometric/login-challenge',
    '/auth/biometric/login-verify',
  ].includes(req.path))
);

export const enforceMaintenanceMode = async (req, res, next) => {
  try {
    const settings = await SystemSettings.findOne({ key: 'global' }).select('maintenanceMode');
    if (!settings?.maintenanceMode || allowedDuringMaintenance(req)) return next();

    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      let decoded;
      try {
        decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      } catch {
        decoded = null;
      }

      if (decoded?.id && !decoded.purpose) {
        const tokenHash = crypto.createHash('sha256').update(header.slice(7)).digest('hex');
        const [isRevoked, user] = await Promise.all([
          TokenBlacklist.exists({ token: tokenHash }),
          User.findById(decoded.id).select('_id role isActive authVersion'),
        ]);
        if (!isRevoked && user?.isActive && user.role === 'superadmin'
          && (decoded.authVersion || 0) === (user.authVersion || 0)) {
          req.user = user;
          return next();
        }
      }
    }

    return res.status(503).json({ success: false, message: 'System is currently under maintenance.' });
  } catch (error) {
    return next(error);
  }
};
