import Report from '../models/Report.js';

const scope = (user) => user.role === 'barangay' ? { assignedBarangay: user.barangay, deletedAt: null } : { deletedAt: null };
export const getOverview = async (req, res, next) => { try { const filter = scope(req.user); const [total, status, priority] = await Promise.all([Report.countDocuments(filter), Report.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]), Report.aggregate([{ $match: filter }, { $group: { _id: '$priority', count: { $sum: 1 } } }])]); res.json({ success: true, total, status, priority }); } catch (e) { next(e); } };
const grouped = (field) => async (req, res, next) => { try { const data = await Report.aggregate([{ $match: scope(req.user) }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }, { $sort: { count: -1 } }]); res.json({ success: true, data }); } catch (e) { next(e); } };
export const getCategories = grouped('category');
export const getStatuses = grouped('status');
export const getBarangays = grouped('assignedBarangay');
export const getTimeline = async (req, res, next) => { try { const data = await Report.aggregate([{ $match: scope(req.user) }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]); res.json({ success: true, data }); } catch (e) { next(e); } };
