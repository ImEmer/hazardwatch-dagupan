import ActivityLog from '../models/ActivityLog.js';

export const logActivity = ({ actor, action, message, scope, entityType, entityId }) => ActivityLog.create({
  user: actor?._id || null,
  actorId: actor?._id || null,
  actorName: actor?.name || 'System',
  role: actor?.role || 'user',
  scope: scope || (actor?.role === 'barangay' ? 'barangay' : actor?.role === 'user' ? 'user' : 'admin'),
  action,
  message,
  entityType: entityType || 'system',
  entityId: entityId || null,
  targetType: entityType || 'system',
  targetId: entityId || null,
});
