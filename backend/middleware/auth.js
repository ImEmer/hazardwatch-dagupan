import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import TokenBlacklist from '../models/TokenBlacklist.js';

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Authentication required.' });
    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (await TokenBlacklist.exists({ token: tokenHash })) return res.status(401).json({ success: false, message: 'Token has been revoked.' });
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'User is inactive or no longer exists.' });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'You do not have permission for this action.' });
  next();
};

export const isAdmin = allowRoles('superadmin', 'admin');
export const isStaff = allowRoles('superadmin', 'admin', 'staff', 'barangay');
