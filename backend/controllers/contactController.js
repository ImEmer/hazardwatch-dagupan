import ContactMessage from '../models/ContactMessage.js';
import User from '../models/User.js';
import { createNotification } from '../utils/createNotification.js';

export const submitMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.create(req.body);
    try {
      const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id role');
      await Promise.all(admins.map((admin) => createNotification({
        recipientId: admin._id,
        recipientRole: admin.role,
        type: 'contact_received',
        title: 'New Contact Message',
        message: `A new message was received: ${message.subject}`,
        reference: message._id,
        referenceModel: 'ContactMessage',
      })));
    } catch (notificationError) {
      console.error('[notification] Failed to notify contact recipients:', notificationError.message);
    }
    res.status(201).json({ success: true, message });
  } catch (error) { next(error); }
};

export const getMessages = async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (error) { next(error); }
};

export const updateMessageStatus = async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!message) return res.status(404).json({ success: false, message: 'Contact message not found.' });
    res.json({ success: true, message });
  } catch (error) { next(error); }
};
