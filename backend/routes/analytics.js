import { Router } from 'express';
import { getReportsPerBarangay, getReportsPerCategory, getReportsPerDay, getReportsPerPriority, getSessionWindows, getSlidingWindows, getTumblingHourly } from '../controllers/analyticsController.js';
import { isStaff, protect } from '../middleware/auth.js';

const router = Router();
router.use(protect, isStaff);
router.get('/reports-per-barangay', getReportsPerBarangay);
router.get('/reports-per-category', getReportsPerCategory);
router.get('/reports-per-priority', getReportsPerPriority);
router.get('/reports-per-day', getReportsPerDay);
router.get('/tumbling-hourly', getTumblingHourly);
router.get('/sliding', getSlidingWindows);
router.get('/sessions', getSessionWindows);

export default router;
