import { body, param, query, validationResult } from 'express-validator';
import { isDagupanBarangay, isDagupanLocation } from '../utils/dagupanBarangays.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });
  next();
};

export const validateBadRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  next();
};

export const passwordPolicy = (field = 'password') => body(field)
  .custom((value) => {
    if (typeof value !== 'string' || /\s/.test(value)) throw new Error('Password cannot contain spaces.');
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value)) {
      throw new Error('Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.');
    }
    return true;
  });

export const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
  body('email').custom((value) => {
    if (typeof value !== 'string' || /\s/.test(value)) throw new Error('Email and password cannot contain spaces.');
    return true;
  }).isEmail().normalizeEmail().withMessage('A valid email is required.'),
  passwordPolicy(),
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
    let location;
    try {
      location = typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      throw new Error('A valid map location is required.');
    }
    if (!location?.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      throw new Error('A valid map location is required.');
    }
    const [longitude, latitude] = location.coordinates.map(Number);
    if (!isDagupanLocation({ lat: latitude, lng: longitude })) throw new Error('Location must be within Dagupan City.');
    req.body.location = location;
    return true;
  }),
  body('barangay').custom((value) => {
    if (value && !isDagupanBarangay(value)) throw new Error('Invalid barangay.');
    return true;
  }),
  body('photo').custom((value, { req }) => {
    if (!req.files?.length && !req.file && !value) throw new Error('Photo evidence is required.');
    return true;
  }),
  validateBadRequest,
];
export const validateId = [param('id').isMongoId().withMessage('Invalid id.'), validate];
export const validatePagination = [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 }), validate];
