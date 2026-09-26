import { Router } from 'express';
import { getSystemSettings, updateSystemSettings, uploadSystemLogo } from '../controllers/systemController.js';
import { allowRoles, protect } from '../middleware/auth.js';
import { uploadPhoto } from '../middleware/upload.js';

const router = Router();
router.use(protect, allowRoles('superadmin'));
router.get('/settings', getSystemSettings);
router.patch('/settings', updateSystemSettings);
router.patch('/settings/logo', uploadPhoto.single('logo'), uploadSystemLogo);

export default router;