import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actorName: { type: String, trim: true, default: '' },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'staff', 'barangay', 'user'],
    default: 'user',
  },
  scope: { type: String, enum: ['system', 'admin', 'barangay', 'user'], default: 'system' },
  action: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  entityType: { type: String, default: 'report' },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

export default mongoose.model('ActivityLog', activityLogSchema);
