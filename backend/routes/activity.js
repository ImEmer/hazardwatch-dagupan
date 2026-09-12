import { Router } from 'express';
import { getActivityLogs, getAllActivity, getPublicActivity } from '../controllers/activityController.js';
import { allowRoles, protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.get('/all', allowRoles('superadmin'), getAllActivity);
router.get('/public', allowRoles('admin', 'superadmin'), getPublicActivity);
router.get('/', getActivityLogs);

export default router;
