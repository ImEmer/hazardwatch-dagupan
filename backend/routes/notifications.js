import { Router } from 'express';
import { getNotifications, markAllAsRead, markAsRead, markAsUnread } from '../controllers/notificationController.js';
import { allowRoles, protect } from '../middleware/auth.js';
import { validateId } from '../middleware/validate.js';

const router = Router();
router.use(protect, allowRoles('superadmin', 'admin', 'barangay'));
router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', validateId, markAsRead);
router.patch('/:id/unread', validateId, markAsUnread);

export default router;