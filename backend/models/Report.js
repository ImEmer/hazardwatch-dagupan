import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, enum: ['Pothole', 'Broken Streetlight', 'Clogged Drainage', 'Flooding', 'Waste Disposal', 'Damaged Public Facility', 'Fallen Electrical Wire', 'Damaged Road', 'Illegal Dumping', 'Air Pollution', 'Animal Related', 'Blocked Fire Exit', 'Broken Traffic Light', 'Broken Water Pipe', 'Clogged Canal (Waste)', 'Contaminated Water', 'Damaged Bridge', 'Damaged Sidewalk', 'Deforestation', 'Fallen Tree', 'Fire Hazard', 'Gas Leak', 'Missing Road Sign', 'Noise Pollution', 'Oil Spill', 'Other', 'Overflowing Trash Bin', 'Public Safety Hazard', 'Public Toilet Issue', 'Smoke Report', 'Traffic Obstruction', 'Vandalism', 'Water Leak', 'Waste / Sanitation', 'Electrical / Streetlight', 'Infrastructure', 'Traffic / Road', 'Environmental', 'Flood', 'Public Safety'], required: true },
  customCategory: { type: String, default: '', trim: true, maxlength: 60 },
  description: { type: String, default: '', minlength: 0, trim: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true, validate: (v) => v.length === 2 },
  },
  address: String,
  barangay: String,
  photo: String,
  images: [{ type: String }],
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved', 'Closed'], default: 'Pending' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Low' },
  reportedBy: { userId: mongoose.Schema.Types.ObjectId, name: String, email: String, phone: String, isAnonymous: { type: Boolean, default: false } },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedBarangay: String,
  resolution: { notes: String, resolvedAt: Date, resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
  comments: [{ text: { type: String, required: true }, author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, authorName: String, createdAt: { type: Date, default: Date.now } }],
  views: { type: Number, default: 0 },
  archived: { type: Boolean, default: false },
  archivedAt: { type: Date },
  isActive: { type: Boolean, default: true },
  seeded: { type: Boolean, default: false, index: true },
  deletedAt: Date,
}, { timestamps: true });

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ title: 'text', description: 'text', address: 'text' });
reportSchema.index({ status: 1, category: 1, priority: 1 });

export default mongoose.model('Report', reportSchema);
