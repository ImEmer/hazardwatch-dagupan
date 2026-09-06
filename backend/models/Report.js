import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, enum: ['Pothole', 'Streetlight', 'Drainage', 'Flooding', 'Waste Disposal', 'Public Facility', 'Other'], required: true },
  description: { type: String, required: true, minlength: 10, trim: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true, validate: (v) => v.length === 2 },
  },
  address: String,
  photo: String,
  status: { type: String, enum: ['Pending', 'Under Review', 'Verified', 'In Progress', 'Resolved', 'Closed'], default: 'Pending' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  reportedBy: { name: String, email: String, phone: String, isAnonymous: { type: Boolean, default: false } },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedBarangay: String,
  resolution: { notes: String, resolvedAt: Date, resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
  comments: [{ text: { type: String, required: true }, author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, authorName: String, createdAt: { type: Date, default: Date.now } }],
  views: { type: Number, default: 0 },
  deletedAt: Date,
}, { timestamps: true });

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ title: 'text', description: 'text', address: 'text' });
reportSchema.index({ status: 1, category: 1, priority: 1 });

export default mongoose.model('Report', reportSchema);
