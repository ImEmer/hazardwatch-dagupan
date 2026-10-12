import ActivityLog from '../models/ActivityLog.js';

const normalizeDetails = (details) => {
  if (details === undefined || details === null || details === '') return '';
  if (typeof details === 'string') return details;
  if (typeof details === 'object') return JSON.stringify(details);
  return String(details);
};

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
  details: normalizeDetails(details) || message,
  entityType: entityType || 'system',
  entityId: entityId || null,
  targetType: entityType || 'system',
  targetId: entityId || null,
});
