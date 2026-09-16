import { Router } from 'express';
import { createUser, deleteUser, getUser, getUsers, toggleUserStatus, updateUser } from '../controllers/userController.js';
import { isAdmin, protect } from '../middleware/auth.js';
import { validateId, validateRegister } from '../middleware/validate.js';

const router = Router();
router.use(protect, isAdmin);
router.get('/', getUsers);
router.get('/:id', validateId, getUser);
router.post('/', validateRegister, createUser);
router.put('/:id', validateId, updateUser);
router.patch('/:id/status', validateId, toggleUserStatus);
router.delete('/bulk', async (req, res) => {
  const { ids = [] } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'Please select at least one user.' });
  const users = await (await import('../models/User.js')).default.find({ _id: { $in: ids } });
  await Promise.all(users.map(async (user) => {
    if (user._id.toString() === req.user._id.toString()) return null;
    user.isActive = false; user.status = 'deleted'; user.deletedAt = new Date();
    return user.save({ validateBeforeSave: false });
  }));
  res.json({ success: true, message: `${users.length} users deleted.` });
});
router.delete('/:id', validateId, deleteUser);
export default router;
