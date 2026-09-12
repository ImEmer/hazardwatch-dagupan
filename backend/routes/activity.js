import { Router } from 'express';
import { getActivityLogs, getAllActivity, getBarangayActivity, getMyActivity, getPublicActivity } from '../controllers/activityController.js';
import { allowRoles, protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.get('/all', allowRoles('superadmin'), getAllActivity);
router.get('/public', allowRoles('admin', 'superadmin'), getPublicActivity);
router.get('/barangay/:barangay', allowRoles('barangay', 'admin', 'superadmin'), getBarangayActivity);
router.get('/me', getMyActivity);
router.get('/', getActivityLogs);

export default router;
