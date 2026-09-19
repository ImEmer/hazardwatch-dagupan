import { Router } from 'express';
import passport from '../config/passport.js';
import { changePassword, checkEmail, deleteAccount, forgotPassword, getMe, issueToken, login, logout, refresh, register, resetPassword, updateProfile, verifyResetCode } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { passwordPolicy, validateBadRequest, validateLogin, validateRegister } from '../middleware/validate.js';
import { logActivity } from '../utils/logActivity.js';

const router = Router();
const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const googleFailureRedirect = `${frontendUrl}/login?error=google_failed`;

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: googleFailureRedirect }), async (req, res, next) => {
	try {
		if (!req.user?.isActive || ['suspended', 'banned', 'deleted'].includes(req.user.status)) return res.redirect(googleFailureRedirect);
		await logActivity({
			actor: req.user,
			action: 'login',
			message: `${req.user.name} logged in with Google`,
			scope: req.user.role === 'barangay' ? 'barangay' : req.user.role === 'user' ? 'user' : 'admin',
			entityType: 'auth',
			entityId: req.user._id,
		}).catch(() => {});
		req.user.lastLogin = new Date();
		await req.user.save({ validateBeforeSave: false });
		const token = issueToken(req.user);
		return res.redirect(`${frontendUrl}/auth/google/success?token=${encodeURIComponent(token)}`);
	} catch (error) {
		return next(error);
	}
});
router.get('/check-email', checkEmail);
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', protect, refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/change-password', protect, passwordPolicy('newPassword'), validateBadRequest, changePassword);
router.put('/profile', protect, updateProfile);
router.delete('/account', protect, deleteAccount);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', passwordPolicy(), validateBadRequest, resetPassword);
export default router;
