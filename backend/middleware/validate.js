import { body, param, query, validationResult } from 'express-validator';
import { resolveBarangayFromCoords } from '../utils/dagupanBarangays.js';

const firstValidationError = (errors) => {
  const first = errors.array()[0];
  return first?.msg || 'Validation failed';
};

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const serialized = errors.array();
    return res.status(422).json({ success: false, message: firstValidationError(errors), errors: serialized });
  }
  next();
};

export const validateBadRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const serialized = errors.array();
    return res.status(400).json({ success: false, message: firstValidationError(errors), errors: serialized });
  }
  next();
};

export const passwordPolicy = (field = 'password') => body(field)
  .custom((value, { req }) => {
    if (typeof value !== 'string' || /\s/.test(value)) throw new Error('Password cannot contain spaces.');
    if (req.user?.role === 'superadmin' && req.body?.role === 'admin' && /^admin\d+@06$/.test(value)) return true;
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value)) {
      throw new Error('Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.');
    }
    return true;
  })
  .isLength({ max: 72 }).withMessage('Password cannot exceed 72 characters.');

const emailPattern = /^[^\s@]+@[A-Za-z](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
const emailValidator = (field = 'email') => body(field)
  .trim()
  .isEmail().withMessage('Enter a valid email address.')
  .matches(emailPattern).withMessage('Enter a valid email address.')
  .normalizeEmail();

const registerValidators = (nameValidator) => [
  body().custom((value) => {
    const allowed = ['name', 'email', 'password', 'role', 'barangay', 'phone', 'agreedToTerms'];
    const unknown = Object.keys(value || {}).find((key) => !allowed.includes(key));
    if (unknown) throw new Error(`Field ${unknown} is not allowed.`);
    return true;
  }),
  nameValidator,
  emailValidator(),
  passwordPolicy(),
  body('role').optional().isIn(['superadmin', 'admin', 'barangay', 'user']),
  body('barangay').optional().trim().escape().isLength({ max: 100 }),
  body('phone').optional().trim().escape().isLength({ max: 30 }),
  body('agreedToTerms').custom((value) => {
    if (value !== true) throw new Error('You must agree to the Terms of Service.');
    return true;
  }),
  validateBadRequest,
];
export const validateRegister = registerValidators(
  body('name').trim().escape().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
);
export const validatePublicRegister = registerValidators(
  body('name').trim().matches(/^[\p{L} '-]+$/u).withMessage('Full name must contain letters only.').escape().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
);
export const validateLogin = [
  emailValidator(),
  body('password').notEmpty().withMessage('Password is required.').isLength({ max: 72 }).withMessage('Password cannot exceed 72 characters.'),
  validateBadRequest,
];
export const validateEmailVerification = [
  emailValidator(),
  body('code').isString().matches(/^\d{6}$/).withMessage('Enter the 6-digit verification code.'),
  validateBadRequest,
];
export const validateReport = [
  body('category').isIn(['Pothole', 'Broken Streetlight', 'Clogged Drainage', 'Flooding', 'Waste Disposal', 'Damaged Public Facility', 'Fallen Electrical Wire', 'Damaged Road', 'Illegal Dumping', 'Air Pollution', 'Animal Related', 'Blocked Fire Exit', 'Broken Traffic Light', 'Broken Water Pipe', 'Clogged Canal (Waste)', 'Contaminated Water', 'Damaged Bridge', 'Damaged Sidewalk', 'Deforestation', 'Fallen Tree', 'Fire Hazard', 'Gas Leak', 'Missing Road Sign', 'Noise Pollution', 'Oil Spill', 'Other', 'Overflowing Trash Bin', 'Public Safety Hazard', 'Public Toilet Issue', 'Smoke Report', 'Traffic Obstruction', 'Vandalism', 'Water Leak']),
  body('customCategory').custom((value, { req }) => {
    const customCategory = typeof value === 'string' ? value.trim() : '';
    if (req.body.category === 'Other' && customCategory.length < 3) throw new Error('Please specify the hazard type using at least 3 characters.');
    if (req.body.category !== 'Other' && customCategory) throw new Error('Custom hazard type is only allowed when category is Other.');
    if (customCategory.length > 100 || !/^[A-Za-z0-9 ]*$/.test(customCategory)) throw new Error('Custom hazard type must contain only letters, numbers, and spaces, up to 100 characters.');
    req.body.customCategory = customCategory.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[character]);
    return true;
  }),
  body('description').trim().escape().isLength({ min: 10, max: 500 }),
  body('locationAccuracyMeters').optional().isFloat({ min: 0 }).toFloat().withMessage('GPS accuracy must be a non-negative number.'),
  body('locationCapturedAt').optional().isISO8601().toDate().withMessage('GPS timestamp must be a valid date.'),
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
    const resolution = resolveBarangayFromCoords(latitude, longitude, req.body.locationAccuracyMeters);
    if (resolution.status === 'low_accuracy') throw new Error('GPS accuracy is insufficient to uniquely determine the barangay. Please wait for a more accurate location or select a map point.');
    if (resolution.status === 'ambiguous') throw new Error('Location lies on a barangay boundary and cannot be uniquely resolved. Please select a nearby point.');
    if (resolution.status !== 'resolved') throw new Error('Unable to determine a Dagupan barangay for this location.');
    req.body.location = location;
    req.barangayResolution = resolution;
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
  const resolution = resolveBarangayFromCoords(latitude, longitude, req.body.locationAccuracyMeters);
  if (resolution.status === 'low_accuracy') throw new Error('GPS accuracy is insufficient to uniquely determine the barangay.');
  if (resolution.status !== 'resolved') throw new Error('Location must resolve to exactly one Dagupan barangay.');
  req.body.location = location;
  return true;
});

export const validateReportUpdate = [
  body().custom((value) => {
    const allowed = ['title', 'description', 'category', 'priority', 'location', 'locationAccuracyMeters', 'locationCapturedAt'];
    const unknown = Object.keys(value || {}).find((key) => !allowed.includes(key));
    if (unknown) throw new Error(`Field ${unknown} is not allowed.`);
    if ((value?.locationAccuracyMeters !== undefined || value?.locationCapturedAt !== undefined) && value?.location === undefined) {
      throw new Error('Location accuracy and timestamp must be updated with a location.');
    }
    return true;
  }),
  body('title').optional().trim().escape().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().escape().isLength({ min: 10, max: 500 }),
  body('category').optional().isIn(['Pothole', 'Broken Streetlight', 'Clogged Drainage', 'Flooding', 'Waste Disposal', 'Damaged Public Facility', 'Fallen Electrical Wire', 'Damaged Road', 'Illegal Dumping', 'Air Pollution', 'Animal Related', 'Blocked Fire Exit', 'Broken Traffic Light', 'Broken Water Pipe', 'Clogged Canal (Waste)', 'Contaminated Water', 'Damaged Bridge', 'Damaged Sidewalk', 'Deforestation', 'Fallen Tree', 'Fire Hazard', 'Gas Leak', 'Missing Road Sign', 'Noise Pollution', 'Oil Spill', 'Other', 'Overflowing Trash Bin', 'Public Safety Hazard', 'Public Toilet Issue', 'Smoke Report', 'Traffic Obstruction', 'Vandalism', 'Water Leak']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
  body('locationAccuracyMeters').optional().isFloat({ min: 0 }).toFloat().withMessage('GPS accuracy must be a non-negative number.'),
  body('locationCapturedAt').optional().isISO8601().toDate().withMessage('GPS timestamp must be a valid date.'),
  validateReportLocation,
  validateBadRequest,
];
export const validateId = [param('id').isMongoId().withMessage('Invalid id.'), validate];
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be an integer between 1 and 500.'),
  validateBadRequest,
];

const reportCategories = ['Pothole', 'Broken Streetlight', 'Clogged Drainage', 'Flooding', 'Waste Disposal', 'Damaged Public Facility', 'Fallen Electrical Wire', 'Damaged Road', 'Illegal Dumping', 'Air Pollution', 'Animal Related', 'Blocked Fire Exit', 'Broken Traffic Light', 'Broken Water Pipe', 'Clogged Canal (Waste)', 'Contaminated Water', 'Damaged Bridge', 'Damaged Sidewalk', 'Deforestation', 'Fallen Tree', 'Fire Hazard', 'Gas Leak', 'Missing Road Sign', 'Noise Pollution', 'Oil Spill', 'Other', 'Overflowing Trash Bin', 'Public Safety Hazard', 'Public Toilet Issue', 'Smoke Report', 'Traffic Obstruction', 'Vandalism', 'Water Leak'];
const mutationFieldAllowlist = (allowed) => body().custom((value) => {
  const unknown = Object.keys(value || {}).find((key) => !allowed.includes(key));
  if (unknown) throw new Error(`Field ${unknown} is not allowed.`);
  return true;
});

export const validateReportStatus = [
  body('status').trim().isIn(['Pending', 'In Progress', 'Resolved', 'Closed']).withMessage('Invalid report status.'),
  validateBadRequest,
];
export const validateReportPriority = [
  body('priority').trim().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid report priority.'),
  validateBadRequest,
];
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
export const validateBulkReportIds = (req, res, next) => {
  const reportIds = req.body?.reportIds ?? req.body?.ids;
  if (!Array.isArray(reportIds) || reportIds.length === 0 || reportIds.length > 50) {
    return res.status(400).json({ success: false, message: 'Report IDs must contain between 1 and 50 items.' });
  }
  if (reportIds.some((id) => typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id))) {
    return res.status(400).json({ success: false, message: 'Every report ID must be a valid MongoDB ID.' });
  }
  req.reportIds = [...new Set(reportIds)];
  next();
};
export const validateBanReason = [
  body('reason').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Ban reason cannot exceed 500 characters.'),
  validateBadRequest,
];
export const validateUserUpdate = [
  mutationFieldAllowlist(['name', 'email', 'role', 'barangay', 'phone']),
  body('name').optional().trim().isLength({ min: 2, max: 50 }).escape(),
  emailValidator().optional(),
  body('role').optional().isIn(['superadmin', 'admin', 'barangay', 'user']),
  body('barangay').optional().trim().isLength({ max: 100 }).escape(),
  body('phone').optional().trim().isLength({ max: 30 }).escape(),
  validateBadRequest,
];
export const validateEmail = [emailValidator(), validateBadRequest];
export const validateResetCode = [
  emailValidator(),
  body('code').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Reset code must be a 6-digit number.'),
  validateBadRequest,
];
export const validateResetPassword = [
  body('token').trim().isLength({ min: 20, max: 200 }).withMessage('Reset token is invalid.'),
  passwordPolicy(),
  validateBadRequest,
];
export const validateProfile = [
  mutationFieldAllowlist(['name', 'email']),
  body('name').trim().escape().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
  emailValidator(),
  validateBadRequest,
];
export const validateEmailChangeRequest = [
  mutationFieldAllowlist(['newEmail']),
  emailValidator('newEmail'),
  validateBadRequest,
];
export const validateChangeCode = [
  mutationFieldAllowlist(['code', 'currentPassword']),
  body('code').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Verification code must be 6 digits.'),
  body('currentPassword').optional().isString().isLength({ min: 1, max: 72 }).withMessage('Current password must be between 1 and 72 characters.'),
  validateBadRequest,
];
export const validatePasswordChangeRequest = [
  mutationFieldAllowlist(['currentPassword', 'newPassword']),
  body('currentPassword').isString().isLength({ min: 1, max: 72 }).withMessage('Current password must be between 1 and 72 characters.'),
  passwordPolicy('newPassword'),
  validateBadRequest,
];
export const validateStatusAction = [
  body('status').optional().isIn(['active', 'suspended', 'banned', 'deleted', 'pending']).withMessage('Invalid user status.'),
  validateBadRequest,
];
