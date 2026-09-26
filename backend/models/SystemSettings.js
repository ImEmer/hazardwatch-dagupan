import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'global' },
  systemName: { type: String, trim: true, default: 'HazardWatch Dagupan', maxlength: 100 },
  systemLogo: { type: String, trim: true, default: '' },
  hazardCategories: { type: [String], default: [] },
  reportStatuses: { type: [String], default: ['Pending', 'In Progress', 'Resolved', 'Closed'] },
  priorityLevels: { type: [String], default: ['Low', 'Medium', 'High', 'Urgent'] },
  userRoles: { type: [String], default: ['user', 'barangay', 'staff', 'admin', 'superadmin'] },
  maintenanceMode: { type: Boolean, default: false },
  notificationsEnabled: { type: Boolean, default: true },
  defaultUserRole: { type: String, default: 'user' },
  roleHierarchy: { type: mongoose.Schema.Types.Mixed, default: { user: 1, barangay: 2, staff: 2, admin: 3, superadmin: 4 } },
  permissionMatrix: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model('SystemSettings', systemSettingsSchema);