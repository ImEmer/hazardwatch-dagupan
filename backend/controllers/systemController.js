import SystemSettings from '../models/SystemSettings.js';

const defaultSettings = {
  key: 'global',
  systemName: 'HazardWatch Dagupan',
  systemLogo: '',
  hazardCategories: ['Pothole', 'Broken Streetlight', 'Clogged Drainage', 'Flooding', 'Waste Disposal', 'Damaged Public Facility', 'Fallen Electrical Wire', 'Damaged Road', 'Illegal Dumping', 'Air Pollution', 'Animal Related', 'Blocked Fire Exit', 'Broken Traffic Light', 'Broken Water Pipe', 'Clogged Canal (Waste)', 'Contaminated Water', 'Damaged Bridge', 'Damaged Sidewalk', 'Deforestation', 'Fallen Tree', 'Fire Hazard', 'Gas Leak', 'Missing Road Sign', 'Noise Pollution', 'Oil Spill', 'Other', 'Overflowing Trash Bin', 'Public Safety Hazard', 'Public Toilet Issue', 'Smoke Report', 'Traffic Obstruction', 'Vandalism', 'Water Leak'],
  reportStatuses: ['Pending', 'In Progress', 'Resolved', 'Closed'],
  priorityLevels: ['Low', 'Medium', 'High', 'Urgent'],
  userRoles: ['user', 'barangay', 'staff', 'admin', 'superadmin'],
  maintenanceMode: false,
  notificationsEnabled: true,
  defaultUserRole: 'user',
  roleHierarchy: { user: 1, barangay: 2, staff: 2, admin: 3, superadmin: 4 },
  permissionMatrix: {},
};

const allowedFields = Object.keys(defaultSettings).filter((field) => field !== 'key');
const arrayFields = ['hazardCategories', 'reportStatuses', 'priorityLevels', 'userRoles'];

const loadSettings = () => SystemSettings.findOneAndUpdate(
  { key: 'global' },
  { $setOnInsert: defaultSettings },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
);

export const getSystemSettings = async (req, res, next) => {
  try {
    const settings = await loadSettings();
    res.json({ success: true, settings });
  } catch (error) { next(error); }
};

export const updateSystemSettings = async (req, res, next) => {
  try {
    const body = req.body || {};
    const unknownField = Object.keys(body).find((field) => !allowedFields.includes(field));
    if (unknownField) return res.status(400).json({ success: false, message: `Unknown setting: ${unknownField}.` });
    for (const field of arrayFields) {
      if (Object.hasOwn(body, field) && (!Array.isArray(body[field]) || body[field].some((item) => typeof item !== 'string' || !item.trim()))) {
        return res.status(400).json({ success: false, message: `${field} must be an array of non-empty strings.` });
      }
    }
    if (Object.hasOwn(body, 'systemName') && (typeof body.systemName !== 'string' || !body.systemName.trim() || body.systemName.trim().length > 100)) {
      return res.status(400).json({ success: false, message: 'System name must be between 1 and 100 characters.' });
    }
    if (Object.hasOwn(body, 'systemLogo') && typeof body.systemLogo !== 'string') return res.status(400).json({ success: false, message: 'System logo must be a URL string.' });
    for (const field of ['maintenanceMode', 'notificationsEnabled']) {
      if (Object.hasOwn(body, field) && typeof body[field] !== 'boolean') return res.status(400).json({ success: false, message: `${field} must be a boolean.` });
    }
    if (Object.hasOwn(body, 'defaultUserRole') && !['user', 'barangay', 'staff', 'admin'].includes(body.defaultUserRole)) {
      return res.status(400).json({ success: false, message: 'Default user role is invalid.' });
    }
    if (Object.hasOwn(body, 'roleHierarchy') && (!body.roleHierarchy || typeof body.roleHierarchy !== 'object' || Array.isArray(body.roleHierarchy))) {
      return res.status(400).json({ success: false, message: 'Role hierarchy must be an object.' });
    }
    if (Object.hasOwn(body, 'permissionMatrix') && (!body.permissionMatrix || typeof body.permissionMatrix !== 'object' || Array.isArray(body.permissionMatrix))) {
      return res.status(400).json({ success: false, message: 'Permission matrix must be an object.' });
    }

    await loadSettings();
    const updates = Object.fromEntries(Object.entries(body).map(([field, value]) => [field, typeof value === 'string' ? value.trim() : value]));
    const settings = await SystemSettings.findOneAndUpdate({ key: 'global' }, { $set: updates }, { new: true, runValidators: true });
    res.json({ success: true, settings });
  } catch (error) { next(error); }
};

export const uploadSystemLogo = async (req, res, next) => {
  try {
    if (!req.file?.path) return res.status(400).json({ success: false, message: 'Choose a supported image file.' });
    const settings = await loadSettings();
    settings.systemLogo = req.file.path;
    await settings.save();
    res.json({ success: true, settings });
  } catch (error) { next(error); }
};