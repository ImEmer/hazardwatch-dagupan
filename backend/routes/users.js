import { Router } from 'express';
import { banUser, createUser, deleteUser, getMyPreferences, getUser, getUserPreferences, getUsers, getUserStats, suspendUser, toggleUserStatus, unsuspendUser, updateMyPreferences, updateUser, updateUserPassword, updateUserPreferences } from '../controllers/userController.js';
import { allowRoles, isAdmin, protect } from '../middleware/auth.js';
import { passwordPolicy, validateBadRequest, validateBulkIds, validateId, validateRegister, validateStatusAction, validateUserUpdate } from '../middleware/validate.js';

const router = Router();
router.get('/me/preferences', protect, getMyPreferences);
router.patch('/me/preferences', protect, updateMyPreferences);
router.use(protect, isAdmin);
router.get('/stats', getUserStats);
router.get('/', getUsers);
router.get('/:id', validateId, getUser);
router.post('/', validateRegister, createUser);
router.put('/:id', validateId, validateUserUpdate, updateUser);
router.patch('/:id/status', validateId, validateStatusAction, toggleUserStatus);
router.get('/:id/preferences', allowRoles('superadmin', 'admin'), validateId, getUserPreferences);
router.patch('/:id/preferences', allowRoles('superadmin', 'admin'), validateId, updateUserPreferences);
router.patch('/:id/password', validateId, passwordPolicy('newPassword'), validateBadRequest, updateUserPassword);
router.post('/:id/suspend', validateId, suspendUser);
router.post('/:id/ban', validateId, banUser);
router.post('/:id/unsuspend', validateId, unsuspendUser);
router.delete('/bulk', validateBulkIds, async (req, res) => {
  const { ids = [] } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'Please select at least one user.' });
  const User = (await import('../models/User.js')).default;
  const roleLevels = { user: 1, barangay: 2, staff: 2, admin: 3, superadmin: 4 };
  const targets = await User.find({ _id: { $in: ids } }).select('_id role');
  for (const target of targets) {
    if (String(target._id) === String(req.user._id)) return res.status(403).json({ success: false, message: 'You cannot delete your own account.' });
    if (!['admin', 'superadmin'].includes(req.user.role) || !['user', 'barangay'].includes(target.role) || (roleLevels[req.user.role] || 0) <= (roleLevels[target.role] || 0)) return res.status(403).json({ success: false, message: `You do not have permission to delete a user with role ${target.role}.` });
  }
  const roleFilter = req.user.role === 'admin' ? { role: { $in: ['user', 'barangay'] } } : { role: { $nin: ['superadmin', 'staff'] } };
  const users = await User.find({ _id: { $in: ids }, ...roleFilter });
  await Promise.all(users.map(async (user) => {
    if (user._id.toString() === req.user._id.toString()) return null;
    user.isActive = false; user.status = 'deleted'; user.deletedAt = new Date();
    return user.save({ validateBeforeSave: false });
  }));
  res.json({ success: true, message: `${users.length} users deleted.` });
});
router.delete('/:id', validateId, deleteUser);
export default router;
