import { body, param, query, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });
  next();
};

export const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
  body('email').custom((value) => {
    if (typeof value !== 'string' || /\s/.test(value)) throw new Error('Email and password cannot contain spaces.');
    return true;
  }).isEmail().normalizeEmail().withMessage('A valid email is required.'),
  body('password').custom((value) => {
    if (typeof value !== 'string' || /\s/.test(value)) throw new Error('Email and password cannot contain spaces.');
    return true;
  }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/).withMessage('Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'),
  validate,
];
export const validateLogin = [body('email').isEmail().normalizeEmail(), body('password').notEmpty(), validate];
export const validateReport = [
  body('category').isIn(['Pothole', 'Broken Streetlight', 'Clogged Drainage', 'Flooding', 'Waste Disposal', 'Damaged Public Facility', 'Fallen Electrical Wire', 'Damaged Road', 'Illegal Dumping', 'Air Pollution', 'Animal Related', 'Blocked Fire Exit', 'Broken Traffic Light', 'Broken Water Pipe', 'Clogged Canal (Waste)', 'Contaminated Water', 'Damaged Bridge', 'Damaged Sidewalk', 'Deforestation', 'Fallen Tree', 'Fire Hazard', 'Gas Leak', 'Missing Road Sign', 'Noise Pollution', 'Oil Spill', 'Other', 'Overflowing Trash Bin', 'Public Safety Hazard', 'Public Toilet Issue', 'Smoke Report', 'Traffic Obstruction', 'Vandalism', 'Water Leak']),
  body('customCategory').custom((value, { req }) => {
    const customCategory = typeof value === 'string' ? value.trim() : '';
    if (req.body.category === 'Other' && customCategory.length < 3) throw new Error('Please specify the hazard type using at least 3 characters.');
    if (req.body.category !== 'Other' && customCategory) throw new Error('Custom hazard type is only allowed when category is Other.');
    if (customCategory.length > 60 || !/^[A-Za-z0-9 ]*$/.test(customCategory)) throw new Error('Custom hazard type must contain only letters, numbers, and spaces, up to 60 characters.');
    req.body.customCategory = customCategory;
    return true;
  }),
  body('description').trim().isLength({ min: 10 }),
  body('location').custom((value, { req }) => {
    const location = typeof value === 'string' ? JSON.parse(value) : value;
    if (!location?.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      throw new Error('A valid map location is required.');
    }
    req.body.location = location;
    return true;
  }),
  body('photo').custom((value, { req }) => {
    if (!req.files?.length && !req.file && !value) throw new Error('Photo evidence is required.');
    return true;
  }),
  validate,
];
export const validateId = [param('id').isMongoId().withMessage('Invalid id.'), validate];
export const validatePagination = [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 }), validate];
