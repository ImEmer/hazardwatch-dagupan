import ActivityLog from '../models/ActivityLog.js';

export const logActivity = ({ actor, action, message, details = '', scope, entityType, entityId }) => ActivityLog.create({
  user: actor?._id || null,
  actorId: actor?._id || null,
  actorName: actor?.name || 'System',
  role: actor?.role || 'user',
  actorRole: actor?.role || 'user',
  actorBarangay: actor?.barangay || '',
  scope: scope || (actor?.role === 'barangay' ? 'barangay' : actor?.role === 'user' ? 'user' : 'admin'),
  action,
  message,
  details: details || message,
  entityType: entityType || 'system',
  entityId: entityId || null,
  targetType: entityType || 'system',
  targetId: entityId || null,
});
