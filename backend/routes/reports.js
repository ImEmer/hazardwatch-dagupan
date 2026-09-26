import { Router } from 'express';
import { addComment, assignReport, createReport, deleteReport, exportReportsCsv, getArchivedReports, getMyReports, getPublicReports, getReport, getReports, updatePriority, updateReport, updateStatus } from '../controllers/reportController.js';
import { allowRoles, isStaff, protect } from '../middleware/auth.js';
import { uploadPhoto } from '../middleware/upload.js';
import { validateBulkIds, validateId, validatePagination, validateReport, validateReportAssignment, validateReportComment, validateReportPriority, validateReportStatus, validateReportUpdate } from '../middleware/validate.js';
import { reportSubmitLimiter } from '../middleware/rateLimit.js';

const router = Router();
router.get('/public', getPublicReports);
router.get('/export', protect, allowRoles('admin', 'superadmin'), exportReportsCsv);
router.get('/', protect, isStaff, validatePagination, getReports);
router.get('/mine', protect, getMyReports);
router.get('/archived', protect, isStaff, validatePagination, getArchivedReports);
router.get('/:id', protect, isStaff, validateId, getReport);
router.post('/', protect, reportSubmitLimiter, uploadPhoto.array('images', 3), validateReport, createReport);
router.put('/:id', protect, isStaff, validateId, validateReportUpdate, updateReport);
router.patch('/:id/status', protect, isStaff, validateId, validateReportStatus, updateStatus);
router.patch('/:id/priority', protect, isStaff, validateId, validateReportPriority, updatePriority);
router.patch('/:id/assign', protect, allowRoles('superadmin', 'admin'), validateId, validateReportAssignment, assignReport);
router.post('/:id/comments', protect, isStaff, validateId, validateReportComment, addComment);
router.delete('/bulk', protect, allowRoles('superadmin', 'admin'), validateBulkIds, async (req, res) => {
  const { ids = [] } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'Please select at least one report.' });
  const Report = (await import('../models/Report.js')).default;
  await Report.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: new Date(), isActive: false } });
  res.json({ success: true, message: `${ids.length} reports deleted.` });
});
router.delete('/:id', protect, allowRoles('superadmin', 'admin'), validateId, deleteReport);
export default router;
