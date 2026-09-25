import { body, param, query, validationResult } from 'express-validator';
import { isDagupanBarangay, isDagupanLocation } from '../utils/dagupanBarangays.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, message: errors.array()[0]?.msg || 'Validation failed', errors: errors.array() });
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
  body().custom((value) => {
    const allowed = ['name', 'email', 'password', 'role', 'barangay', 'phone', 'agreedToTerms'];
    const unknown = Object.keys(value || {}).find((key) => !allowed.includes(key));
    if (unknown) throw new Error(`Field ${unknown} is not allowed.`);
    return true;
  }),
  body('name').trim().escape().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
  body('email').custom((value) => {
    if (typeof value !== 'string' || /\s/.test(value)) throw new Error('Email and password cannot contain spaces.');
    return true;
  }).isEmail().normalizeEmail().withMessage('A valid email is required.'),
  passwordPolicy(),
  body('role').optional().isIn(['superadmin', 'admin', 'staff', 'barangay', 'user']),
  body('barangay').optional().trim().escape().isLength({ max: 100 }),
  body('phone').optional().trim().escape().isLength({ max: 30 }),
  body('agreedToTerms').custom((value) => {
    if (value !== true) throw new Error('You must agree to the Terms of Service.');
    return true;
  }),
  validateBadRequest,
];
export const validateLogin = [body('email').trim().isEmail().normalizeEmail(), body('password').notEmpty(), validate];
export const validateReport = [
  body('category').isIn(['Pothole', 'Broken Streetlight', 'Clogged Drainage', 'Flooding', 'Waste Disposal', 'Damaged Public Facility', 'Fallen Electrical Wire', 'Damaged Road', 'Illegal Dumping', 'Air Pollution', 'Animal Related', 'Blocked Fire Exit', 'Broken Traffic Light', 'Broken Water Pipe', 'Clogged Canal (Waste)', 'Contaminated Water', 'Damaged Bridge', 'Damaged Sidewalk', 'Deforestation', 'Fallen Tree', 'Fire Hazard', 'Gas Leak', 'Missing Road Sign', 'Noise Pollution', 'Oil Spill', 'Other', 'Overflowing Trash Bin', 'Public Safety Hazard', 'Public Toilet Issue', 'Smoke Report', 'Traffic Obstruction', 'Vandalism', 'Water Leak']),
  body('customCategory').custom((value, { req }) => {
    const customCategory = typeof value === 'string' ? value.trim() : '';
    if (req.body.category === 'Other' && customCategory.length < 3) throw new Error('Please specify the hazard type using at least 3 characters.');
    if (req.body.category !== 'Other' && customCategory) throw new Error('Custom hazard type is only allowed when category is Other.');
    if (customCategory.length > 60 || !/^[A-Za-z0-9 ]*$/.test(customCategory)) throw new Error('Custom hazard type must contain only letters, numbers, and spaces, up to 60 characters.');
    req.body.customCategory = customCategory.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[character]);
    return true;
  }),
  body('description').trim().escape().isLength({ min: 10, max: 5000 }),
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
  body('barangay').trim().custom((value) => {
    if (value && !isDagupanBarangay(value)) throw new Error('Invalid barangay.');
    return true;
  }),
  body('photo').custom((value, { req }) => {
    if (!req.files?.length && !req.file && !value) throw new Error('Photo evidence is required.');
    return true;
  }),
  validateBadRequest,
];
const validateReportLocation = body('location').optional().custom((value, { req }) => {
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
});

export const validateReportUpdate = [
  body().custom((value) => {
    const allowed = ['title', 'description', 'category', 'priority', 'location'];
    const unknown = Object.keys(value || {}).find((key) => !allowed.includes(key));
    if (unknown) throw new Error(`Field ${unknown} is not allowed.`);
    return true;
  }),
  body('title').optional().trim().isLength({ min: 3, max: 120 }).escape(),
  body('description').optional().trim().isLength({ min: 10, max: 5000 }).escape(),
  body('category').optional().isIn(['Pothole', 'Broken Streetlight', 'Clogged Drainage', 'Flooding', 'Waste Disposal', 'Damaged Public Facility', 'Fallen Electrical Wire', 'Damaged Road', 'Illegal Dumping', 'Air Pollution', 'Animal Related', 'Blocked Fire Exit', 'Broken Traffic Light', 'Broken Water Pipe', 'Clogged Canal (Waste)', 'Contaminated Water', 'Damaged Bridge', 'Damaged Sidewalk', 'Deforestation', 'Fallen Tree', 'Fire Hazard', 'Gas Leak', 'Missing Road Sign', 'Noise Pollution', 'Oil Spill', 'Other', 'Overflowing Trash Bin', 'Public Safety Hazard', 'Public Toilet Issue', 'Smoke Report', 'Traffic Obstruction', 'Vandalism', 'Water Leak']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
  validateReportLocation,
  validateBadRequest,
];
export const validateId = [param('id').isMongoId().withMessage('Invalid id.'), validate];
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100.'),
  validateBadRequest,
];

const reportCategories = ['Pothole', 'Broken Streetlight', 'Clogged Drainage', 'Flooding', 'Waste Disposal', 'Damaged Public Facility', 'Fallen Electrical Wire', 'Damaged Road', 'Illegal Dumping', 'Air Pollution', 'Animal Related', 'Blocked Fire Exit', 'Broken Traffic Light', 'Broken Water Pipe', 'Clogged Canal (Waste)', 'Contaminated Water', 'Damaged Bridge', 'Damaged Sidewalk', 'Deforestation', 'Fallen Tree', 'Fire Hazard', 'Gas Leak', 'Missing Road Sign', 'Noise Pollution', 'Oil Spill', 'Other', 'Overflowing Trash Bin', 'Public Safety Hazard', 'Public Toilet Issue', 'Smoke Report', 'Traffic Obstruction', 'Vandalism', 'Water Leak'];
const mutationFieldAllowlist = (allowed) => body().custom((value) => {
  const unknown = Object.keys(value || {}).find((key) => !allowed.includes(key));
  if (unknown) throw new Error(`Field ${unknown} is not allowed.`);
  return true;
});

export const validateReportComment = [
  mutationFieldAllowlist(['text']),
  body('text').trim().escape().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters.'),
  validateBadRequest,
];
export const validateReportStatus = [body('status').trim().isIn(['Pending', 'In Progress', 'Resolved', 'Closed']).withMessage('Invalid report status.'), validateBadRequest];
export const validateReportPriority = [body('priority').trim().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid report priority.'), validateBadRequest];
export const validateReportAssignment = [
  body('assignedTo').optional({ nullable: true }).isMongoId().withMessage('Invalid assignee id.'),
  body('assignedBarangay').optional().trim().isLength({ max: 100 }).escape(),
  validateBadRequest,
];
export const validateBulkIds = [
  body('ids').isArray({ min: 1, max: 50 }).withMessage('Ids must contain between 1 and 50 items.'),
  body('ids.*').isMongoId().withMessage('Invalid id.'),
  validateBadRequest,
];
export const validateUserUpdate = [
  mutationFieldAllowlist(['name', 'email', 'role', 'barangay', 'phone']),
  body('name').optional().trim().isLength({ min: 2, max: 50 }).escape(),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('role').optional().isIn(['superadmin', 'admin', 'staff', 'barangay', 'user']),
  body('barangay').optional().trim().isLength({ max: 100 }).escape(),
  body('phone').optional().trim().isLength({ max: 30 }).escape(),
  validateBadRequest,
];
export const validateEmail = [body('email').trim().isEmail().normalizeEmail().withMessage('A valid email is required.'), validateBadRequest];
export const validateResetCode = [
  body('email').trim().isEmail().normalizeEmail(),
  body('code').trim().isLength({ min: 6, max: 6 }).isNumeric(),
  validateBadRequest,
];
export const validateResetPassword = [
  body('token').trim().isLength({ min: 20, max: 200 }),
  passwordPolicy(),
  validateBadRequest,
];
export const validateProfile = [
  mutationFieldAllowlist(['name', 'email']),
  body('name').trim().escape().isLength({ min: 2, max: 50 }),
  body('email').trim().isEmail().normalizeEmail(),
  validateBadRequest,
];
export const validateStatusAction = [body('status').optional().isIn(['active', 'suspended', 'banned', 'deleted', 'pending']), validateBadRequest];
