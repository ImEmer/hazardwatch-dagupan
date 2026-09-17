import Report from '../models/Report.js';
import { logActivity } from '../utils/logActivity.js';
import { isDagupanBarangay } from '../utils/dagupanBarangays.js';

const barangayScope = (barangay) => ({ $or: [{ barangay }, { assignedBarangay: barangay }] });
const scoped = (user) => user.role === 'barangay' ? barangayScope(user.barangay || '__unassigned_barangay__') : {};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const reportFilter = (req) => {
  const { search, status, category, priority, barangay, startDate, endDate, includeResolved } = req.query;
  const filter = { deletedAt: null, archived: { $ne: true } };
  if (status) filter.status = status;
  else if (includeResolved !== 'true') filter.status = { $nin: ['Resolved', 'Closed'] };
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (req.user.role === 'barangay') filter.$and = [barangayScope(req.user.barangay || '__unassigned_barangay__')];
  else if (barangay) filter.$and = [barangayScope(barangay)];
  if (search) { const pattern = new RegExp(escapeRegex(search), 'i'); filter.$and = [...(filter.$and || []), { $or: [{ title: pattern }, { description: pattern }, { address: pattern }] }]; }
  if (startDate || endDate) filter.createdAt = { ...(startDate ? { $gte: new Date(startDate) } : {}), ...(endDate ? { $lte: new Date(`${endDate}T23:59:59.999Z`) } : {}) };
  return filter;
};

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const getPublicReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 100, status, category, priority, barangay } = req.query;
    const filter = { deletedAt: null, archived: { $ne: true }, isActive: { $ne: false } };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (barangay) filter.barangay = barangay;

    const skip = (Number(page) - 1) * Number(limit);
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .select('_id category description status priority location address barangay createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Report.countDocuments(filter),
    ]);

    res.json({
      success: true,
      reports,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) { next(error); }
};

export const getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, assignedTo, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filter = reportFilter(req);
    if (assignedTo) filter.assignedTo = assignedTo;
    const skip = (Number(page) - 1) * Number(limit);
    const sort = sortBy === 'priority' ? { priority: sortOrder === 'asc' ? 1 : -1 } : sortBy === 'status' ? { status: sortOrder === 'asc' ? 1 : -1 } : { createdAt: sortOrder === 'asc' ? 1 : -1 };
    const [reports, total] = await Promise.all([Report.find(filter).populate('assignedTo', 'name email').sort(sort).skip(skip).limit(Number(limit)), Report.countDocuments(filter)]);
    res.json({ success: true, reports, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getArchivedReports = async (req, res, next) => {
  try {
    const filter = { archived: true, deletedAt: null };
    if (req.user.role === 'barangay') Object.assign(filter, barangayScope(req.user.barangay || '__unassigned_barangay__'));
    const reports = await Report.find(filter).populate('assignedTo', 'name email').sort({ archivedAt: -1, createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) { next(error); }
};

export const exportReportsCsv = async (req, res, next) => {
  try {
    const reports = await Report.find(reportFilter(req)).sort({ createdAt: -1 }).lean();
    const rows = [
      ['ID', 'Title', 'Category', 'Status', 'Priority', 'Barangay', 'Address', 'Latitude', 'Longitude', 'Reported By', 'Date Submitted'],
      ...reports.map((report) => [report._id, report.title, report.category, report.status, report.priority, report.assignedBarangay || report.barangay, report.address, report.location?.coordinates?.[1], report.location?.coordinates?.[0], report.reportedBy?.name, report.createdAt?.toISOString()]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const date = new Date().toISOString().slice(0, 10);
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="hazardwatch-reports-${date}.csv"` });
    res.send(csv);
  } catch (error) { next(error); }
};

export const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ 'reportedBy.email': req.user.email, deletedAt: null })
      .sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) { next(error); }
};

export const getReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, deletedAt: null, isActive: { $ne: false } }).populate('assignedTo', 'name email');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    report.views += 1;
    await report.save({ validateBeforeSave: false });
    res.json({ success: true, report });
  } catch (error) { next(error); }
};

export const createReport = async (req, res, next) => {
  try {
    if (req.body.barangay && !isDagupanBarangay(req.body.barangay)) return res.status(400).json({ success: false, message: 'Invalid barangay.' });
    const uploadedFiles = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
    const photoValue = uploadedFiles[0] ? (uploadedFiles[0].path || uploadedFiles[0].secure_url) : (typeof req.body.photo === 'string' ? req.body.photo : '');
    const imageUrls = uploadedFiles.map((file) => file.path || file.secure_url).filter(Boolean);
    const location = typeof req.body.location === 'string' ? JSON.parse(req.body.location) : req.body.location;
    const report = await Report.create({
      ...req.body,
      title: `${req.body.category} report - ${new Date().toLocaleDateString('en-PH')}`,
      priority: 'Low',
      customCategory: req.body.category === 'Other' ? String(req.body.customCategory || '').trim() : '',
      location,
      barangay: req.body.barangay || '',
      photo: photoValue,
      images: imageUrls.length ? imageUrls : (req.body.images ? (Array.isArray(req.body.images) ? req.body.images : [req.body.images]) : (photoValue ? [photoValue] : [])),
      reportedBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      },
    });
    await logActivity({ actor: req.user, action: 'report_submitted', message: `${req.user.name} submitted a report`, scope: 'user', entityType: 'report', entityId: report._id }).catch(() => {});
    res.status(201).json({ success: true, report });
  } catch (error) { next(error); }
};

export const updateReport = async (req, res, next) => {
  try {
    const existing = await Report.findOne({ _id: req.params.id, ...scoped(req.user) });
    if (!existing) return res.status(404).json({ success: false, message: 'Report not found.' });
    if (['Resolved', 'Closed'].includes(existing.status) && req.user.role !== 'superadmin') {
      return res.status(400).json({ success: false, message: `This report is ${existing.status} and can no longer be edited.` });
    }
    const payload = { ...req.body };
    const report = await Report.findOneAndUpdate({ _id: req.params.id, ...scoped(req.user) }, payload, { new: true, runValidators: true });
    await logActivity({ actor: req.user, action: 'report_updated', message: `${req.user.name} edited report ${report._id}`, entityType: 'report', entityId: report._id }).catch(() => {});
    res.json({ success: true, report });
  } catch (error) { next(error); }
};

export const updateStatus = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, ...scoped(req.user) });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    if (['Resolved', 'Closed'].includes(report.status) && req.user.role !== 'superadmin') {
      return res.status(400).json({ success: false, message: `This report is ${report.status} and can no longer be edited.` });
    }
    const nextStatus = req.body.status;
    const update = { status: nextStatus };
    if (nextStatus === 'Closed') {
      update.archived = true;
      update.archivedAt = new Date();
    }
    const updated = await Report.findOneAndUpdate({ _id: req.params.id, ...scoped(req.user) }, update, { new: true, runValidators: true });
    await logActivity({ actor: req.user, action: 'report_status_updated', message: `${req.user.name} updated status of report ${updated._id} to ${req.body.status}`, entityType: 'report', entityId: updated._id }).catch(() => {});
    res.json({ success: true, report: updated });
  } catch (error) { next(error); }
};
export const updatePriority = async (req, res, next) => {
  try {
    const report = await Report.findOneAndUpdate({ _id: req.params.id, ...scoped(req.user) }, { priority: req.body.priority }, { new: true, runValidators: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    await logActivity({ actor: req.user, action: 'report_priority_updated', message: `${req.user.name} updated priority of report ${report._id} to ${req.body.priority}`, entityType: 'report', entityId: report._id }).catch(() => {});
    res.json({ success: true, report });
  } catch (error) { next(error); }
};
export const assignReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { assignedTo: req.body.assignedTo, assignedBarangay: req.body.assignedBarangay }, { new: true });
    await logActivity({ actor: req.user, action: 'report_assigned', message: `${req.user.name} assigned report ${report?._id} to ${req.body.assignedBarangay || 'a staff member'}`, entityType: 'report', entityId: report?._id }).catch(() => {});
    res.json({ success: true, report });
  } catch (error) { next(error); }
};
export const addComment = async (req, res, next) => {
  try {
    const report = await Report.findOneAndUpdate({ _id: req.params.id, ...scoped(req.user) }, { $push: { comments: { text: req.body.text, author: req.user._id, authorName: req.user.name } } }, { new: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    await logActivity({ actor: req.user, action: 'comment_added', message: `${req.user.name} commented on report ${report._id}`, entityType: 'report', entityId: report._id }).catch(() => {});
    res.json({ success: true, report });
  } catch (error) { next(error); }
};
export const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { isActive: false, deletedAt: new Date() }, { new: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    await logActivity({ actor: req.user, action: 'report_deleted', message: `${req.user.name} deleted report ${report._id}`, entityType: 'report', entityId: report._id }).catch(() => {});
    res.json({ success: true, message: 'Report deleted.', report });
  } catch (error) { next(error); }
};
