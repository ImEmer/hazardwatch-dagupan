import { Router } from 'express';
import { getBarangayOverview, getBarangayPriorities, getBarangayStatuses, getBarangayTimeline, getBarangays, getCategories, getOverview, getPublicStats, getStatuses, getTimeline } from '../controllers/statisticsController.js';
import { isOperationsManager, protect } from '../middleware/auth.js';

const router = Router();
router.get('/public', getPublicStats);
router.use(protect, isOperationsManager);
router.get('/overview', getOverview);
router.get('/categories', getCategories);
router.get('/status', getStatuses);
router.get('/timeline', getTimeline);
router.get('/barangay', getBarangays);
router.get('/barangay/:barangay', getBarangayOverview);
router.get('/barangay/:barangay/status', getBarangayStatuses);
router.get('/barangay/:barangay/priority', getBarangayPriorities);
router.get('/barangay/:barangay/timeline', getBarangayTimeline);
export default router;
