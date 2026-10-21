import SecurityLog from '../models/SecurityLog.js';

export const getSecurityStatus = async (req, res, next) => {
  try {
    const logs = await SecurityLog.find().sort({ timestamp: -1 }).limit(50).lean();
    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};
