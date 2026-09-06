import { body, param, query, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });
  next();
};

export const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  validate,
];
export const validateLogin = [body('email').isEmail().normalizeEmail(), body('password').notEmpty(), validate];
export const validateReport = [
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('category').isIn(['Pothole', 'Streetlight', 'Drainage', 'Flooding', 'Waste Disposal', 'Public Facility', 'Other']),
  body('description').trim().isLength({ min: 10 }),
  body('location.coordinates').isArray({ min: 2, max: 2 }),
  validate,
];
export const validateId = [param('id').isMongoId().withMessage('Invalid id.'), validate];
export const validatePagination = [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 }), validate];
