import { Router } from 'express';
import { getPublicSystemSettings, getSystemSettings, updateSystemSettings, uploadSystemLogo } from '../controllers/systemController.js';
import { allowRoles, protect } from '../middleware/auth.js';
import { uploadPhoto } from '../middleware/upload.js';
import { getSecurityStatus } from '../controllers/securityController.js';

const router = Router();
router.get('/settings/public', getPublicSystemSettings);
router.use(protect, allowRoles('superadmin'));
router.get('/security-status', getSecurityStatus);
router.get('/settings', getSystemSettings);
router.patch('/settings', updateSystemSettings);
router.patch('/settings/logo', uploadPhoto.single('logo'), uploadSystemLogo);

export default router;