import { Router } from 'express';
import { changePassword, checkEmail, deleteAccount, forgotPassword, getMe, login, logout, refresh, register, resetPassword, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateLogin, validateRegister } from '../middleware/validate.js';

const router = Router();
router.get('/check-email', checkEmail);
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', protect, refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);
router.delete('/account', protect, deleteAccount);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
export default router;
