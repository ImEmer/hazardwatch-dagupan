import { Router } from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';
import { validateId } from '../middleware/validate.js';

const router = Router();
router.use(protect);
router.get('/', getNotifications);
router.patch('/:id/read', validateId, markNotificationRead);

export default router;
