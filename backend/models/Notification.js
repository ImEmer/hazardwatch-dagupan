import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientRole: { type: String, enum: ['superadmin', 'admin', 'barangay'], required: true },
  type: {
    type: String,
    enum: ['report_submitted', 'status_changed', 'report_assigned', 'account_suspended', 'account_banned', 'contact_received'],
    required: true,
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  reference: { type: mongoose.Schema.Types.ObjectId },
  referenceModel: { type: String, enum: ['Report', 'User', 'ContactMessage'] },
  read: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);