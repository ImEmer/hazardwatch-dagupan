import Notification from '../models/Notification.js';

const getRoleNotifications = (role) => {
  switch (role) {
    case 'superadmin':
      return { $or: [{ role: 'superadmin' }, { scope: 'system' }, { role: 'admin' }, { role: 'barangay' }] };
    case 'admin':
      return { $or: [{ role: 'admin' }, { scope: 'admin' }, { role: 'user' }] };
    case 'barangay':
      return { $or: [{ role: 'barangay' }, { scope: 'barangay' }, { role: 'user' }] };
    default:
      return { role: role || 'user' };
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const roleFilter = getRoleNotifications(req.user.role);
    const notifications = await Notification.find(roleFilter).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (notification.userId && notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have access to this notification.' });
    }

    notification.isRead = true;
    await notification.save();
    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};
