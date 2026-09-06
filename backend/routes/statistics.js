import { Router } from 'express';
import { getBarangays, getCategories, getOverview, getStatuses, getTimeline } from '../controllers/statisticsController.js';
import { isStaff, protect } from '../middleware/auth.js';

const router = Router();
router.use(protect, isStaff);
router.get('/overview', getOverview);
router.get('/categories', getCategories);
router.get('/status', getStatuses);
router.get('/timeline', getTimeline);
router.get('/barangay', getBarangays);
export default router;
