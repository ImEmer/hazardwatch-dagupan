import Notification from '../models/Notification.js';
import User from '../models/User.js';
import SystemSettings from '../models/SystemSettings.js';
import { sendEmail } from './sendEmail.js';

const privilegedRoles = ['superadmin', 'admin', 'barangay'];
const escapeHtml = (value) => String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

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
      User.findById(recipientId).select('email notificationEmail role preferences.notifications'),
      SystemSettings.findOne({ key: 'global' }).select('notificationsEnabled'),
    ]);
    const preferences = recipient?.preferences?.notifications;
    if (!recipient || systemSettings?.notificationsEnabled === false) return null;
    if (type === 'report_submitted') {
      const isCritical = ['High', 'Urgent'].includes(priority);
      if (isCritical ? preferences?.newHazardReports === false && preferences?.criticalReports === false : preferences?.newHazardReports === false) return null;
    } else if (type === 'status_changed' && preferences?.statusUpdates === false) {
      return null;
    } else if (preferences?.systemNotifications === false) {
      return null;
    }
    const notification = preferences?.inAppNotifications === false ? null : await Notification.create({
      recipientId, recipientRole, type, title, message, reference, referenceModel, read: false,
    });
    if (privilegedRoles.includes(recipient.role) && preferences?.emailNotifications === true) {
      const target = recipient.notificationEmail || recipient.email;
      await sendEmail({
        to: target,
        subject: `HazardWatch: ${title}`,
        text: message,
        html: `<p>${escapeHtml(message)}</p>`,
      }).catch((error) => console.error('[notification] Email delivery failed:', error.message));
    }
    if (notification) console.log('[notification] Created:', notification._id, 'for', recipientRole || recipientId);
    return notification;
  } catch (error) {
    console.error('[notification] Failed:', error.message);
    return null;
  }
};