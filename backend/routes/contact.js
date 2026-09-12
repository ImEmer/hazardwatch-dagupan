import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getMessages, submitMessage, updateMessageStatus } from '../controllers/contactController.js';
import { allowRoles, protect } from '../middleware/auth.js';
import { validateId } from '../middleware/validate.js';

const validateContact = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
  body('subject').trim().isLength({ min: 3 }).withMessage('Subject must be at least 3 characters.'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    next();
  },
];

const router = Router();
router.post('/', validateContact, submitMessage);
router.get('/', protect, allowRoles('admin', 'superadmin'), getMessages);
router.patch('/:id/status', protect, allowRoles('admin', 'superadmin'), validateId, body('status').isIn(['new', 'read', 'resolved']), updateMessageStatus);
export default router;
