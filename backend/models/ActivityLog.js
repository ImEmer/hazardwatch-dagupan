import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actorName: { type: String, trim: true, default: '' },
  actorBarangay: { type: String, trim: true, default: '' },
  actorRole: {
    type: String,
    enum: ['superadmin', 'admin', 'staff', 'barangay', 'user'],
    default: 'user',
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'staff', 'barangay', 'user'],
    default: 'user',
  },
  scope: { type: String, enum: ['system', 'admin', 'barangay', 'user'], default: 'system' },
  action: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  details: { type: String, trim: true, default: '' },
  entityType: { type: String, enum: ['report', 'user', 'auth', 'profile', 'setting', 'system'], default: 'system' },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  targetType: { type: String, enum: ['report', 'user', 'auth', 'profile', 'setting', 'system'], default: 'system' },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ actorRole: 1 });

export default mongoose.model('ActivityLog', activityLogSchema);
