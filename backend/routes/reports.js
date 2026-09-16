import { Router } from 'express';
import { addComment, assignReport, createReport, deleteReport, exportReportsCsv, getMyReports, getPublicReports, getReport, getReports, updatePriority, updateReport, updateStatus } from '../controllers/reportController.js';
import { allowRoles, isStaff, protect } from '../middleware/auth.js';
import { uploadPhoto } from '../middleware/upload.js';
import { validateId, validatePagination, validateReport } from '../middleware/validate.js';

const router = Router();
router.get('/public', validatePagination, getPublicReports);
router.get('/export', protect, allowRoles('admin', 'superadmin'), exportReportsCsv);
router.get('/', protect, isStaff, validatePagination, getReports);
router.get('/mine', protect, getMyReports);
router.get('/archived', protect, isStaff, async (req, res) => {
  const Report = (await import('../models/Report.js')).default;
  const filter = { archived: true, deletedAt: null };
  if (req.user.role === 'barangay') filter.barangay = req.user.barangay;
  const reports = await Report.find(filter).sort({ archivedAt: -1 });
  res.json({ success: true, reports });
});
router.get('/:id', protect, isStaff, validateId, getReport);
router.post('/', protect, uploadPhoto.array('images', 5), validateReport, createReport);
router.put('/:id', protect, isStaff, validateId, updateReport);
router.patch('/:id/status', protect, isStaff, validateId, updateStatus);
router.patch('/:id/priority', protect, isStaff, validateId, updatePriority);
router.patch('/:id/assign', protect, allowRoles('superadmin', 'admin'), validateId, assignReport);
router.post('/:id/comments', protect, isStaff, validateId, addComment);
router.delete('/bulk', protect, allowRoles('superadmin', 'admin'), async (req, res) => {
  const { ids = [] } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'Please select at least one report.' });
  const Report = (await import('../models/Report.js')).default;
  await Report.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: new Date(), isActive: false } });
  res.json({ success: true, message: `${ids.length} reports deleted.` });
});
router.delete('/:id', protect, allowRoles('superadmin', 'admin'), validateId, deleteReport);
export default router;
