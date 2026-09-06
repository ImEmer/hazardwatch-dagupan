import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['superadmin', 'admin', 'staff', 'barangay'], default: 'staff' },
  barangay: { type: String, trim: true, default: null },
  phone: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  profileImage: String,
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
