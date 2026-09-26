import Notification from '../models/Notification.js';
import User from '../models/User.js';
import SystemSettings from '../models/SystemSettings.js';

export const createNotification = async ({
  recipientId,
  recipientRole,
  type,
  title,
  message,
  reference,
  referenceModel,
  priority,
}) => {
  try {
    const [recipient, systemSettings] = await Promise.all([
      User.findById(recipientId).select('preferences.notifications'),
      SystemSettings.findOne({ key: 'global' }).select('notificationsEnabled'),
    ]);
    const preferences = recipient?.preferences?.notifications;
    if (!recipient || systemSettings?.notificationsEnabled === false || preferences?.inAppNotifications === false) return null;
    if (type === 'report_submitted') {
      const isCritical = ['High', 'Urgent'].includes(priority);
      if (isCritical ? preferences?.newHazardReports === false && preferences?.criticalReports === false : preferences?.newHazardReports === false) return null;
    } else if (type === 'status_changed' && preferences?.statusUpdates === false) {
      return null;
    } else if (preferences?.systemNotifications === false) {
      return null;
    }
    const notification = await Notification.create({
      recipientId,
      recipientRole,
      type,
      title,
      message,
      reference,
      referenceModel,
      read: false,
    });
    console.log('[notification] Created:', notification._id, 'for', recipientRole || recipientId);
    return notification;
  } catch (error) {
    console.error('[notification] Failed:', error.message);
    return null;
  }
};