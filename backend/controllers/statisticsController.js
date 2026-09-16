import Report from '../models/Report.js';

const scope = (user) => user.role === 'barangay' ? { $or: [{ barangay: user.barangay }, { assignedBarangay: user.barangay }], deletedAt: null } : { deletedAt: null };
const barangayScope = (req) => ({ $or: [{ barangay: req.params.barangay }, { assignedBarangay: req.params.barangay }], deletedAt: null });
const assertBarangayAccess = (req, res) => {
	if (req.user.role === 'barangay' && String(req.user.barangay || '').toLowerCase() !== String(req.params.barangay || '').toLowerCase()) {
		res.status(403).json({ success: false, message: 'You can only view your own barangay statistics.' });
		return false;
	}
	return true;
};
export const getOverview = async (req, res, next) => { try { const filter = scope(req.user); const [total, status, priority] = await Promise.all([Report.countDocuments(filter), Report.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]), Report.aggregate([{ $match: filter }, { $group: { _id: '$priority', count: { $sum: 1 } } }])]); res.json({ success: true, total, status, priority }); } catch (e) { next(e); } };
const grouped = (field) => async (req, res, next) => { try { const data = await Report.aggregate([{ $match: scope(req.user) }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }, { $sort: { count: -1 } }]); res.json({ success: true, data }); } catch (e) { next(e); } };
export const getCategories = grouped('category');
export const getStatuses = grouped('status');
export const getBarangays = grouped('assignedBarangay');
export const getTimeline = async (req, res, next) => { try { const data = await Report.aggregate([{ $match: scope(req.user) }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]); res.json({ success: true, data }); } catch (e) { next(e); } };
const getBarangayStats = (field) => async (req, res, next) => { try { if (!assertBarangayAccess(req, res)) return; const data = await Report.aggregate([{ $match: barangayScope(req) }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }, { $sort: { count: -1 } }]); res.json({ success: true, data }); } catch (e) { next(e); } };
export const getBarangayOverview = async (req, res, next) => { try { if (!assertBarangayAccess(req, res)) return; const filter = barangayScope(req); const [total, status, priority] = await Promise.all([Report.countDocuments(filter), Report.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]), Report.aggregate([{ $match: filter }, { $group: { _id: '$priority', count: { $sum: 1 } } }])]); res.json({ success: true, total, status, priority }); } catch (e) { next(e); } };
export const getBarangayStatuses = getBarangayStats('status');
export const getBarangayPriorities = getBarangayStats('priority');
export const getBarangayTimeline = async (req, res, next) => { try { if (!assertBarangayAccess(req, res)) return; const month = Number(req.query.month); const year = Number(req.query.year) || new Date().getFullYear(); const match = barangayScope(req); if (Number.isInteger(month) && month >= 0 && month <= 11) { match.createdAt = { $gte: new Date(year, month, 1), $lt: new Date(year, month + 1, 1) }; } const data = await Report.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]); res.json({ success: true, data }); } catch (e) { next(e); } };
export const getPublicStats = async (req, res, next) => {
	try {
		const filter = { deletedAt: null };
		const [totalReports, activeHazards, resolvedCases, areas, topCategories] = await Promise.all([
			Report.countDocuments(filter),
			Report.countDocuments({ ...filter, status: { $in: ['Pending', 'In Progress'] } }),
			Report.countDocuments({ ...filter, status: 'Resolved' }),
			Report.aggregate([
				{ $match: { ...filter, $or: [{ barangay: { $nin: ['', null] } }, { assignedBarangay: { $nin: ['', null] } }] } },
				{ $project: { area: { $cond: [{ $and: [{ $ne: ['$barangay', null] }, { $ne: ['$barangay', ''] }] }, '$barangay', '$assignedBarangay'] } } },
				{ $group: { _id: '$area' } },
				{ $count: 'count' },
			]),
			Report.aggregate([
				{ $match: filter },
				{ $group: { _id: '$category', count: { $sum: 1 } } },
				{ $sort: { count: -1, _id: 1 } },
				{ $limit: 5 },
				{ $project: { _id: 0, category: '$_id', count: 1 } },
			]),
		]);

		res.json({
			success: true,
			totalReports,
			activeHazards,
			resolvedCases,
			areasCovered: areas[0]?.count || 0,
			topCategories,
		});
	} catch (error) { next(error); }
};
