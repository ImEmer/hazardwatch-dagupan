import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // Kept for existing Google users. Google Sign-In is deprecated.
  googleId: { type: String, unique: true, sparse: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  password: { type: String, required: function passwordRequired() { return this.authProvider !== 'google'; }, minlength: 8, select: false },
  role: { type: String, enum: ['superadmin', 'admin', 'staff', 'barangay', 'user'], default: 'user' },
  barangay: { type: String, trim: true, default: null },
  phone: { type: String, trim: true },
  status: { type: String, enum: ['active', 'suspended', 'banned', 'deleted', 'pending'], default: 'active' },
  isActive: { type: Boolean, default: true },
  suspendedUntil: { type: Date },
  suspensionReason: { type: String },
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date },
  lastLogin: Date,
  profileImage: String,
  emailVerified: { type: Boolean, default: false },
  verificationRequired: { type: Boolean, default: true },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
  passwordResetCode: { type: String, select: false },
  passwordResetCodeExpires: { type: Date, select: false },
  passwordResetCodeAttempts: { type: Number, default: 0, select: false },
  passwordResetCodeToken: { type: String, select: false },
  passwordResetCodeTokenExpires: { type: Date, select: false },
  passwordResetLastSentAt: { type: Date, select: false },
}, { timestamps: true });

userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ status: 1, role: 1 });
userSchema.index({ name: 'text', email: 'text' });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
