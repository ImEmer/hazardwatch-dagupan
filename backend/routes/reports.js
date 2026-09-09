import { Router } from 'express';
import { addComment, assignReport, createReport, deleteReport, getMyReports, getReport, getReports, updatePriority, updateReport, updateStatus } from '../controllers/reportController.js';
import { allowRoles, isStaff, protect } from '../middleware/auth.js';
import { uploadPhoto } from '../middleware/upload.js';
import { validateId, validatePagination, validateReport } from '../middleware/validate.js';

const router = Router();
router.get('/', protect, isStaff, validatePagination, getReports);
router.get('/mine', protect, getMyReports);
router.get('/:id', protect, isStaff, validateId, getReport);
router.post('/', protect, uploadPhoto.single('photo'), validateReport, createReport);
router.put('/:id', protect, isStaff, validateId, updateReport);
router.patch('/:id/status', protect, isStaff, validateId, updateStatus);
router.patch('/:id/priority', protect, isStaff, validateId, updatePriority);
router.patch('/:id/assign', protect, allowRoles('superadmin', 'admin'), validateId, assignReport);
router.post('/:id/comments', protect, isStaff, validateId, addComment);
router.delete('/:id', protect, allowRoles('superadmin', 'admin'), validateId, deleteReport);
export default router;
