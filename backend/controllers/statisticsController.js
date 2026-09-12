import Report from '../models/Report.js';

const scope = (user) => user.role === 'barangay' ? { assignedBarangay: user.barangay, deletedAt: null } : { deletedAt: null };
export const getOverview = async (req, res, next) => { try { const filter = scope(req.user); const [total, status, priority] = await Promise.all([Report.countDocuments(filter), Report.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]), Report.aggregate([{ $match: filter }, { $group: { _id: '$priority', count: { $sum: 1 } } }])]); res.json({ success: true, total, status, priority }); } catch (e) { next(e); } };
const grouped = (field) => async (req, res, next) => { try { const data = await Report.aggregate([{ $match: scope(req.user) }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }, { $sort: { count: -1 } }]); res.json({ success: true, data }); } catch (e) { next(e); } };
export const getCategories = grouped('category');
export const getStatuses = grouped('status');
export const getBarangays = grouped('assignedBarangay');
export const getTimeline = async (req, res, next) => { try { const data = await Report.aggregate([{ $match: scope(req.user) }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]); res.json({ success: true, data }); } catch (e) { next(e); } };
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
