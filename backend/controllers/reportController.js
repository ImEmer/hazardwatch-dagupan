import Report from '../models/Report.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../utils/logActivity.js';
import { createNotification } from '../utils/createNotification.js';
import { resolveBarangayFromCoords } from '../utils/dagupanBarangays.js';
import { calculatePriority } from '../utils/priorityCalculator.js';
import { cloudinary } from '../middleware/upload.js';

const barangayScope = (barangay) => ({ $or: [{ barangay }, { assignedBarangay: barangay }] });
const scoped = (user) => user.role === 'barangay' ? barangayScope(user.barangay || '__unassigned_barangay__') : {};

const reportAssetPublicId = (url) => {
  if (typeof url !== 'string') return null;
  const marker = '/image/upload/';
  const markerIndex = url.indexOf(marker);
  if (markerIndex < 0) return null;
  const uploadedPath = url.slice(markerIndex + marker.length);
  const versionedPath = uploadedPath.match(/(?:^|\/)v\d+\/(.+)$/);
  const publicPath = (versionedPath?.[1] || uploadedPath).replace(/\.[^/.]+$/, '');
  try { return decodeURIComponent(publicPath); } catch { return publicPath; }
};

const deleteReportAssets = async (reports) => {
  const publicIds = new Set(reports.flatMap((report) => [report.photo, ...(report.images || [])]).map(reportAssetPublicId).filter(Boolean));
  await Promise.all([...publicIds].map(async (publicId) => {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('[reports] Failed to delete report image:', error.message);
    }
  }));
};

const deleteReportNotifications = async (reports) => {
  const reportIds = reports.map((report) => report._id);
  if (reportIds.length) await Notification.deleteMany({ referenceModel: 'Report', reference: { $in: reportIds } });
};

const notifyReportStaff = async (report, type, title, message) => {
  try {
    const [admins, barangayUsers] = await Promise.all([
      User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id role'),
      User.find({ role: 'barangay', barangay: report.barangay }).select('_id role'),
    ]);
    await Promise.all([...admins, ...barangayUsers].map((recipient) => createNotification({
      recipientId: recipient._id,
      recipientRole: recipient.role,
      type,
      title: recipient.role === 'barangay' && type === 'report_submitted' ? 'New Report in Your Barangay' : title,
      message,
      reference: report._id,
      referenceModel: 'Report',
      priority: report.priority,
    })));
  } catch (error) {
    console.error('[notification] Failed to notify report recipients:', error.message);
  }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseBounds = (bounds) => {
  if (bounds === undefined) return undefined;
  const values = typeof bounds === 'string' ? bounds.split(',').map(Number) : [];
  if (
    values.length !== 4
    || !values.every(Number.isFinite)
    || values[0] < -90 || values[0] > 90
    || values[2] < -90 || values[2] > 90
    || values[1] < -180 || values[1] > 180
    || values[3] < -180 || values[3] > 180
    || values[0] >= values[2]
    || values[1] >= values[3]
  ) return null;

  const [swLat, swLng, neLat, neLng] = values;
  return {
    $geoWithin: {
      $geometry: {
        type: 'Polygon',
        coordinates: [[
          [swLng, swLat],
          [neLng, swLat],
          [neLng, neLat],
          [swLng, neLat],
          [swLng, swLat],
        ]],
      },
    },
  };
};

const reportFilter = (req) => {
  const { status, category, priority, barangay, startDate, endDate, includeResolved, bounds } = req.query;
  const filter = { deletedAt: null, isActive: true, archived: { $ne: true } };
  const normalizedStatus = ['Pending', 'In Progress', 'Resolved', 'Closed'].find((value) => value.toLowerCase() === String(status || '').toLowerCase());
  if (status) filter.status = normalizedStatus || status;
  else if (includeResolved !== 'true') filter.status = { $nin: ['Resolved', 'Closed'] };
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (req.user.role === 'barangay') filter.$and = [barangayScope(req.user.barangay || '__unassigned_barangay__')];
  else if (barangay) filter.$and = [barangayScope(barangay)];
  const locationFilter = parseBounds(bounds);
  if (locationFilter) filter.location = locationFilter;
  if (startDate || endDate) filter.createdAt = { ...(startDate ? { $gte: new Date(startDate) } : {}), ...(endDate ? { $lte: new Date(`${endDate}T23:59:59.999Z`) } : {}) };
  return filter;
};

const applyReportSearch = async (filter, value) => {
  const query = String(value || '').trim();
  if (!query) return filter;
  const pattern = new RegExp(escapeRegex(query), 'i');
  const regexFilter = { $or: [
    { title: pattern },
    { description: pattern },
    { category: pattern },
    { address: pattern },
    { barangay: pattern },
    { assignedBarangay: pattern },
  ] };
  const [textMatches, regexMatches] = await Promise.all([
    Report.find({ $and: [filter, { $text: { $search: query } }] }).select('_id').lean().catch(() => []),
    Report.find({ $and: [filter, regexFilter] }).select('_id').lean(),
  ]);
  const ids = [...new Set([...textMatches, ...regexMatches].map((report) => String(report._id)))];
  return { $and: [filter, { _id: { $in: ids } }] };
};

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const DUPLICATE_DISTANCE_METERS = 100;
const DUPLICATE_WINDOW_HOURS = 24;

const cleanupUploadedFiles = async (files = []) => {
  await Promise.all(files.map(async (file) => {
    const publicId = file.filename || file.public_id;
    if (!publicId) return;
    try { await cloudinary.uploader.destroy(publicId); } catch (error) {
      console.error('[reports] Failed to clean up rejected upload:', error.message);
    }
  }));
};

export const getPublicReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 500, status, category, priority, barangay, bounds, includeResolved } = req.query;
    const requestedPage = Number(page);
    const requestedLimit = Number(limit);
    const pageNumber = Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1);
    const pageSize = Math.min(500, Math.max(1, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 500));
    const filter = { deletedAt: null, archived: { $ne: true }, isActive: { $ne: false } };
    if (includeResolved !== 'true') filter.status = { $nin: ['Resolved', 'Closed'] };
    else filter.status = { $ne: 'Closed' };
    if (status && ['Pending', 'In Progress'].includes(status)) filter.status = status;
    else if (status === 'Resolved' && includeResolved === 'true') filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (barangay) filter.barangay = barangay;

    const locationFilter = parseBounds(bounds);
    if (bounds !== undefined && !locationFilter) return res.status(400).json({ success: false, message: 'Bounds must be valid swLat,swLng,neLat,neLng coordinates.' });
    if (locationFilter) filter.location = locationFilter;

    const skip = (pageNumber - 1) * pageSize;
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .select('_id title category description status priority location address barangay createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Report.countDocuments(filter),
    ]);
    console.log('[getPublicReports] Filter:', filter);
    console.log('[getPublicReports] Found:', reports.length);

    res.json({
      success: true,
      reports,
      pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
    });
  } catch (error) { next(error); }
};

export const getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, assignedTo, sortBy = 'createdAt', sortOrder = 'desc', bounds } = req.query;
    const locationFilter = parseBounds(bounds);
    if (bounds !== undefined && !locationFilter) return res.status(400).json({ success: false, message: 'Bounds must be valid swLat,swLng,neLat,neLng coordinates.' });
    const filter = await applyReportSearch(reportFilter(req), req.query.q ?? req.query.search);
    if (assignedTo) filter.assignedTo = assignedTo;
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(limit) || 10));
    const skip = (pageNumber - 1) * pageSize;
    const sort = sortBy === 'priority' ? { priority: sortOrder === 'asc' ? 1 : -1 } : sortBy === 'status' ? { status: sortOrder === 'asc' ? 1 : -1 } : { createdAt: sortOrder === 'asc' ? 1 : -1 };
    const [reports, total] = await Promise.all([Report.find(filter).populate('assignedTo', 'name email').sort(sort).skip(skip).limit(pageSize), Report.countDocuments(filter)]);
    res.json({ success: true, reports, pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) { next(error); }
};

export const getArchivedReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.min(100, Math.max(1, Number(limit)));
    let filter = { archived: true, deletedAt: null, isActive: true };
    if (req.user.role === 'barangay') Object.assign(filter, barangayScope(req.user.barangay || '__unassigned_barangay__'));
    filter = await applyReportSearch(filter, req.query.q ?? req.query.search);
    const [reports, total] = await Promise.all([
      Report.find(filter).populate('assignedTo', 'name email').sort({ archivedAt: -1, createdAt: -1 }).skip((pageNumber - 1) * limitNumber).limit(limitNumber),
      Report.countDocuments(filter),
    ]);
    res.json({ success: true, reports, pagination: { page: pageNumber, limit: limitNumber, total, pages: Math.ceil(total / limitNumber) } });
  } catch (error) { next(error); }
};

export const exportReportsCsv = async (req, res, next) => {
  try {
    const filter = await applyReportSearch(reportFilter(req), req.query.q ?? req.query.search);
    const reports = await Report.find(filter).sort({ createdAt: -1 }).lean();
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

export const resolveReportBarangay = (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const accuracyMeters = req.query.accuracyMeters === undefined ? null : Number(req.query.accuracyMeters);
  const resolution = resolveBarangayFromCoords(lat, lng, accuracyMeters);
  if (['invalid_coordinates', 'invalid_accuracy'].includes(resolution.status)) {
    return res.status(400).json({ success: false, message: 'Valid latitude and longitude are required.' });
  }
  if (resolution.status === 'ambiguous') console.warn('[BARANGAY RESOLUTION] WARNING: coordinate intersects multiple barangay polygons.', { lat, lng, matches: resolution.matches });
  else if (process.env.NODE_ENV !== 'production') console.info('[BARANGAY RESOLUTION]', { lat, lng, accuracyMeters, ...resolution });
  return res.json({
    success: resolution.status === 'resolved',
    status: resolution.status,
    barangay: resolution.barangay,
    accuracyMeters: resolution.accuracyMeters,
  });
};

export const createReport = async (req, res, next) => {
  try {
    const uploadedFiles = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
    const photoValue = uploadedFiles[0] ? (uploadedFiles[0].path || uploadedFiles[0].secure_url) : (typeof req.body.photo === 'string' ? req.body.photo : '');
    const imageUrls = uploadedFiles.map((file) => file.path || file.secure_url).filter(Boolean);
    const location = typeof req.body.location === 'string' ? JSON.parse(req.body.location) : req.body.location;
    const coordinates = location?.coordinates;
    const locationAccuracyMeters = req.body.locationAccuracyMeters === undefined ? null : Number(req.body.locationAccuracyMeters);
    const resolution = Array.isArray(coordinates) && coordinates.length === 2
      ? resolveBarangayFromCoords(Number(coordinates[1]), Number(coordinates[0]), locationAccuracyMeters)
      : { status: 'invalid_coordinates', barangay: null, matches: [] };
    if (process.env.NODE_ENV !== 'production') {
      console.info('[LOCATION]', { lat: coordinates?.[1], lng: coordinates?.[0], accuracyMeters: locationAccuracyMeters, capturedAt: req.body.locationCapturedAt || null });
      console.info('[BARANGAY RESOLUTION]', { coordinates, ...resolution });
    }
    if (resolution.status !== 'resolved') {
      await cleanupUploadedFiles(uploadedFiles);
      const message = resolution.status === 'low_accuracy'
        ? 'GPS accuracy is insufficient to uniquely determine the barangay.'
        : resolution.status === 'ambiguous'
          ? 'Location lies on a barangay boundary and cannot be uniquely resolved.'
          : 'Unable to determine a Dagupan barangay for this location.';
      return res.status(422).json({ success: false, code: resolution.status, message });
    }
    const allowDuplicate = req.body.allowDuplicate === true || req.body.allowDuplicate === 'true';
    const duplicateReport = Array.isArray(coordinates) && coordinates.length === 2
      ? await Report.findOne({
        category: req.body.category,
        'reportedBy.userId': req.user._id,
        createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000) },
        location: { $near: { $geometry: { type: 'Point', coordinates }, $maxDistance: DUPLICATE_DISTANCE_METERS } },
      }).select('_id category address barangay location createdAt status').lean()
      : null;
    if (duplicateReport && !allowDuplicate) {
      await cleanupUploadedFiles(uploadedFiles);
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_DETECTED',
        message: 'You already submitted a similar report within the last 24 hours.',
        duplicateId: duplicateReport._id,
        duplicate: duplicateReport,
      });
    }
    const report = await Report.create({
      ...req.body,
      title: `${req.body.category} report - ${new Date().toLocaleDateString('en-PH')}`,
      priority: calculatePriority(req.body.category, req.body.description),
      customCategory: req.body.category === 'Other' ? String(req.body.customCategory || '').trim() : '',
      location,
      barangay: resolution.barangay,
      locationAccuracyMeters,
      locationCapturedAt: req.body.locationCapturedAt || null,
      isDuplicate: Boolean(duplicateReport && allowDuplicate),
      duplicateOf: duplicateReport?._id || null,
      photo: photoValue,
      images: imageUrls.length ? imageUrls : (req.body.images ? (Array.isArray(req.body.images) ? req.body.images : [req.body.images]) : (photoValue ? [photoValue] : [])),
      reportedBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      },
    });
    const reportMessage = `A new ${report.category} report was submitted in ${report.barangay || 'your area'}.`;
    await notifyReportStaff(report, 'report_submitted', 'New Report Submitted', reportMessage);
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
    if (payload.location) {
      const coordinates = payload.location.coordinates;
      const resolution = Array.isArray(coordinates) && coordinates.length === 2
        ? resolveBarangayFromCoords(Number(coordinates[1]), Number(coordinates[0]), payload.locationAccuracyMeters)
        : { status: 'invalid_coordinates', barangay: null, matches: [] };
      if (resolution.status !== 'resolved') {
        const message = resolution.status === 'low_accuracy'
          ? 'GPS accuracy is insufficient to uniquely determine the barangay.'
          : 'Location must resolve to exactly one Dagupan barangay.';
        return res.status(422).json({ success: false, code: resolution.status, message });
      }
      payload.barangay = resolution.barangay;
      payload.address = `Barangay ${resolution.barangay}, Dagupan City, Pangasinan`;
      payload.locationAccuracyMeters = payload.locationAccuracyMeters ?? null;
      payload.locationCapturedAt = payload.locationCapturedAt ?? null;
    }
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
    const previousStatus = report.status;
    const nextStatus = req.body.status;
    const update = { status: nextStatus };
    if (nextStatus === 'Closed') {
      update.archived = true;
      update.archivedAt = new Date();
    } else {
      update.archived = false;
      update.archivedAt = null;
    }
    const updated = await Report.findOneAndUpdate({ _id: req.params.id, ...scoped(req.user) }, update, { new: true, runValidators: true });
    if (previousStatus !== nextStatus) {
      await notifyReportStaff(updated, 'status_changed', 'Report Status Updated', `Report "${updated.title}" is now ${nextStatus}.`);
    }
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
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    try {
      const assignee = req.body.assignedTo ? await User.findById(req.body.assignedTo).select('_id role') : null;
      if (assignee && ['superadmin', 'admin', 'barangay'].includes(assignee.role)) {
        await createNotification({
          recipientId: assignee._id,
          recipientRole: assignee.role,
          type: 'report_assigned',
          title: 'Report Assigned to You',
          message: `Report "${report.title}" was assigned to you.`,
          reference: report._id,
          referenceModel: 'Report',
        });
      }
    } catch (error) {
      console.error('[notification] Failed to notify report assignee:', error.message);
    }
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
    const report = await Report.findOne({ _id: req.params.id, ...scoped(req.user) });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    await report.deleteOne();
    await deleteReportNotifications([report]);
    await deleteReportAssets([report]);
    await logActivity({ actor: req.user, action: 'report_deleted', message: `${req.user.name} deleted report ${report._id}`, entityType: 'report', entityId: report._id }).catch(() => {});
    res.json({ success: true, deletedCount: 1 });
  } catch (error) { next(error); }
};

export const deleteReportsBulk = async (req, res, next) => {
  try {
    const reports = await Report.find({ _id: { $in: req.reportIds } });
    if (req.user.role === 'barangay') {
      const barangay = req.user.barangay || '__unassigned_barangay__';
      const outOfScope = reports.some((report) => report.barangay !== barangay && report.assignedBarangay !== barangay);
      if (outOfScope) return res.status(403).json({ success: false, message: 'You can only delete reports from your barangay.' });
    }
    if (!reports.length) return res.json({ success: true, deletedCount: 0 });

    const ids = reports.map((report) => report._id);
    const result = await Report.deleteMany({ _id: { $in: ids }, ...scoped(req.user) });
    const deletedReports = reports;
    await deleteReportNotifications(deletedReports);
    await deleteReportAssets(deletedReports);
    await Promise.all(deletedReports.map((report) => logActivity({
      actor: req.user,
      action: 'report_deleted',
      message: `${req.user.name} deleted report ${report._id}`,
      entityType: 'report',
      entityId: report._id,
    }).catch(() => {})));
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) { next(error); }
};
