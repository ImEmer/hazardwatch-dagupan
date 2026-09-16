import { Router } from 'express';
import { banUser, createUser, deleteUser, getUser, getUsers, suspendUser, toggleUserStatus, unsuspendUser, updateUser } from '../controllers/userController.js';
import { isAdmin, protect } from '../middleware/auth.js';
import { validateId, validateRegister } from '../middleware/validate.js';

const router = Router();
router.use(protect, isAdmin);
router.get('/', getUsers);
router.get('/:id', validateId, getUser);
router.post('/', validateRegister, createUser);
router.put('/:id', validateId, updateUser);
router.patch('/:id/status', validateId, toggleUserStatus);
router.post('/:id/suspend', validateId, suspendUser);
router.post('/:id/ban', validateId, banUser);
router.post('/:id/unsuspend', validateId, unsuspendUser);
router.delete('/bulk', async (req, res) => {
  const { ids = [] } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'Please select at least one user.' });
  const User = (await import('../models/User.js')).default;
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
