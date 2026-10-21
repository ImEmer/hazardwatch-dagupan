import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema({
  identifier: { type: String, required: true, trim: true, maxlength: 320 },
  reason: { type: String, required: true, trim: true, maxlength: 100 },
  details: { type: String, trim: true, default: '', maxlength: 1000 },
  timestamp: { type: Date, default: Date.now, required: true },
  status: { type: String, required: true, trim: true, default: 'Blocked', maxlength: 50 },
});

securityLogSchema.index({ timestamp: -1 });

export default mongoose.model('SecurityLog', securityLogSchema);
