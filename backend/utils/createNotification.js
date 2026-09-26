import Notification from '../models/Notification.js';

export const createNotification = async ({
  recipientId,
  recipientRole,
  type,
  title,
  message,
  reference,
  referenceModel,
}) => {
  try {
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