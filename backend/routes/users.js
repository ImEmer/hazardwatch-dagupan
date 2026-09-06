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
router.delete('/:id', validateId, deleteUser);
export default router;
