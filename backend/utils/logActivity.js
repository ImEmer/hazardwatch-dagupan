import ActivityLog from '../models/ActivityLog.js';

let activitySocketServer;

export const setActivitySocketServer = (io) => {
  activitySocketServer = io;
};

const normalizeDetails = (details) => {
  if (details === undefined || details === null || details === '') return '';
  if (typeof details === 'string') return details;
  if (typeof details === 'object') return JSON.stringify(details);
  return String(details);
};

export const logActivity = async ({ actor, action, message, details = '', scope, entityType, entityId }) => {
  const activity = await ActivityLog.create({
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
  activitySocketServer?.to('room:admin').to('room:superadmin').emit('new-activity', activity.toObject());
  return activity;
};
