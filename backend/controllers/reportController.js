import Report from '../models/Report.js';
import { logActivity } from '../utils/logActivity.js';

const scoped = (user) => user.role === 'barangay' ? { assignedBarangay: user.barangay || '__unassigned_barangay__' } : {};

export const getPublicReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 100, status, category, priority, barangay } = req.query;
    const filter = { deletedAt: null };
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
    const { page = 1, limit = 10, search, status, category, priority, barangay, assignedTo, startDate, endDate } = req.query;
    const filter = { deletedAt: null, ...scoped(req.user) };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (barangay) filter.assignedBarangay = barangay;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.$text = { $search: search };
    if (startDate || endDate) filter.createdAt = { ...(startDate ? { $gte: new Date(startDate) } : {}), ...(endDate ? { $lte: new Date(`${endDate}T23:59:59.999Z`) } : {}) };
    const skip = (Number(page) - 1) * Number(limit);
    const [reports, total] = await Promise.all([Report.find(filter).populate('assignedTo', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)), Report.countDocuments(filter)]);
    res.json({ success: true, reports, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
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
    const report = await Report.findOne({ _id: req.params.id, deletedAt: null }).populate('assignedTo', 'name email');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    report.views += 1;
    await report.save({ validateBeforeSave: false });
    res.json({ success: true, report });
  } catch (error) { next(error); }
};

export const createReport = async (req, res, next) => {
  try {
    const photoValue = req.file
      ? `/uploads/${req.file.filename}`
      : (typeof req.body.photo === 'string' ? req.body.photo : '');

    const report = await Report.create({
      ...req.body,
      title: `${req.body.category} report - ${new Date().toLocaleDateString('en-PH')}`,
      location: typeof req.body.location === 'string' ? JSON.parse(req.body.location) : req.body.location,
      barangay: req.body.barangay || '',
      photo: photoValue,
      reportedBy: {
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
    const report = await Report.findOneAndUpdate({ _id: req.params.id, ...scoped(req.user) }, req.body, { new: true, runValidators: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    await logActivity({ actor: req.user, action: 'report_status_updated', message: `${req.user.name} updated report status to ${req.body.status}`, entityType: 'report', entityId: report._id }).catch(() => {});
    res.json({ success: true, report });
  } catch (error) { next(error); }
};

export const updateStatus = async (req, res, next) => {
  try {
    const report = await Report.findOneAndUpdate({ _id: req.params.id, ...scoped(req.user) }, { status: req.body.status }, { new: true, runValidators: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    await logActivity({ actor: req.user, action: 'report_priority_updated', message: `${req.user.name} updated report priority to ${req.body.priority}`, entityType: 'report', entityId: report._id }).catch(() => {});
    res.json({ success: true, report });
  } catch (error) { next(error); }
};
export const updatePriority = async (req, res, next) => {
  try {
    const report = await Report.findOneAndUpdate({ _id: req.params.id, ...scoped(req.user) }, { priority: req.body.priority }, { new: true, runValidators: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, report });
  } catch (error) { next(error); }
};
export const assignReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { assignedTo: req.body.assignedTo, assignedBarangay: req.body.assignedBarangay }, { new: true });
    await logActivity({ actor: req.user, action: 'report_assigned', message: `${req.user.name} assigned a report to ${req.body.assignedBarangay || 'a staff member'}`, entityType: 'report', entityId: report?._id }).catch(() => {});
    res.json({ success: true, report });
  } catch (error) { next(error); }
};
export const addComment = async (req, res, next) => {
  try {
    const report = await Report.findOneAndUpdate({ _id: req.params.id, ...scoped(req.user) }, { $push: { comments: { text: req.body.text, author: req.user._id, authorName: req.user.name } } }, { new: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    await logActivity({ actor: req.user, action: 'comment_added', message: `${req.user.name} added a comment`, entityType: 'report', entityId: report._id }).catch(() => {});
    res.json({ success: true, report });
  } catch (error) { next(error); }
};
export const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, message: 'Report deleted.', report });
  } catch (error) { next(error); }
};
