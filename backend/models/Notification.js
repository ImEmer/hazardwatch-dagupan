import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'staff', 'barangay', 'user'],
    default: 'user',
  },
  message: { type: String, required: true, trim: true },
  type: { type: String, default: 'info' },
  scope: { type: String, enum: ['system', 'admin', 'barangay', 'user'], default: 'system' },
  isRead: { type: Boolean, default: false },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
