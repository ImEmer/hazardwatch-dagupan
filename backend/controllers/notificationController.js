import Notification from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const requestedPage = Number.parseInt(req.query.page, 10) || 1;
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
    const page = Math.max(1, requestedPage);
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const filter = req.query.filter || 'all';
    if (!['all', 'unread', 'read'].includes(filter)) {
      return res.status(400).json({ success: false, message: 'Filter must be all, unread, or read.' });
    }

    const query = { recipientId: req.user._id };
    if (filter !== 'all') query.read = filter === 'read';
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipientId: req.user._id, read: false }),
    ]);

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { read: true, readAt: new Date() },
      { new: true },
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.json({ success: true, notification });
  } catch (error) { next(error); }
};

export const markAsUnread = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { read: false, readAt: null },
      { new: true },
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.json({ success: true, notification });
  } catch (error) { next(error); }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user._id, read: false },
      { read: true, readAt: new Date() },
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) { next(error); }
};