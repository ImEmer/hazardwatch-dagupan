import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getMessages, submitMessage, updateMessageStatus } from '../controllers/contactController.js';
import { allowRoles, protect } from '../middleware/auth.js';
import { validateBadRequest, validateId } from '../middleware/validate.js';
import { contactLimiter } from '../middleware/rateLimit.js';

const validateContact = [
  body('name').trim().escape().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
  body('email').trim().isEmail().normalizeEmail().withMessage('A valid email is required.'),
  body('subject').trim().escape().isLength({ min: 3, max: 150 }).withMessage('Subject must be between 3 and 150 characters.'),
  body('message').trim().escape().isLength({ min: 10, max: 5000 }).withMessage('Message must be between 10 and 5000 characters.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    next();
  },
];

const router = Router();
router.post('/', contactLimiter, validateContact, submitMessage);
router.get('/', protect, allowRoles('admin', 'superadmin'), getMessages);
router.patch('/:id/status', protect, allowRoles('admin', 'superadmin'), validateId, body('status').isIn(['new', 'read', 'resolved']), validateBadRequest, updateMessageStatus);
export default router;
