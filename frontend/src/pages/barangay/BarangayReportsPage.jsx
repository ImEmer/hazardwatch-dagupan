import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';

const statusStyles = { Pending: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300', 'In Progress': 'border-violet-500/30 bg-violet-500/10 text-violet-300', Resolved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', Closed: 'border-slate-500/30 bg-slate-500/10 text-slate-300' };
const priorityStyles = { Urgent: 'border-red-500/30 bg-red-500/10 text-red-300', High: 'border-orange-500/30 bg-orange-500/10 text-orange-300', Medium: 'border-blue-500/30 bg-blue-500/10 text-blue-300', Low: 'border-slate-500/30 bg-slate-500/10 text-slate-300' };

const BarangayReportsPage = ({ resolvedOnly = false }) => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: 'all', priority: 'all' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !user?.barangay) return undefined;
    let cancelled = false;
    setLoading(true);
    const params = { barangay: user.barangay, page, limit: 10, includeResolved: resolvedOnly, search: filters.search || undefined, status: resolvedOnly ? 'Resolved' : filters.status === 'all' ? undefined : filters.status, priority: filters.priority === 'all' ? undefined : filters.priority };
    api.get('/reports', { params, headers: { Authorization: `Bearer ${token}` } }).then((response) => {
      if (!cancelled) { setReports(response.data?.reports || []); setPagination(response.data?.pagination || { page, limit: 10, total: 0, pages: 1 }); }
    }).catch((requestError) => { if (!cancelled) setError(requestError.response?.data?.message || 'Unable to load reports.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters, page, resolvedOnly, token, user?.barangay]);

  const updateFilter = (key, value) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })); };
  const panel = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';
  const muted = isDark ? 'text-gray-400' : 'text-slate-500';
  const input = `rounded-xl border px-3 py-2.5 text-sm focus:border-[#3b82f6] focus:outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`;

  return <div className="space-y-6">{!resolvedOnly && <button type="button" onClick={() => navigate('/barangay/reports/resolved')} className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/50 px-3 py-2 text-sm text-emerald-400"><span aria-hidden="true">✓</span>View Resolved Cases</button>}<section className={`rounded-2xl border p-5 shadow-xl ${panel}`}><p className="text-xs uppercase tracking-[0.25em] text-[#3b82f6]">{user?.barangay || 'Barangay'} queue</p><h1 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports</h1><div className="mt-5 grid gap-3 md:grid-cols-3"><input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search title, category, or location" className={input} /><select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className={input}><option value="all">All statuses</option><option>Pending</option><option>In Progress</option><option>Resolved</option><option>Closed</option></select><select value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value)} className={input}><option value="all">All priorities</option><option>Urgent</option><option>High</option><option>Medium</option><option>Low</option></select></div></section><section className={`overflow-x-auto rounded-2xl border shadow-xl ${panel}`}><table className="min-w-full text-left text-sm"><thead className={isDark ? 'bg-[#0a0b0f] text-gray-400' : 'bg-slate-50 text-slate-500'}><tr><th className="px-5 py-3">Title</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Priority</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className={`px-5 py-10 text-center ${muted}`}>Loading reports...</td></tr> : error ? <tr><td colSpan="6" className="px-5 py-10 text-center text-red-400">{error}</td></tr> : !reports.length ? <tr><td colSpan="6" className={`px-5 py-10 text-center ${muted}`}>No reports found.</td></tr> : reports.map((report) => <tr key={report._id} className={`border-t ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}><td className={`px-5 py-4 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title || `${report.category || 'Hazard'} report`}</td><td className={`px-5 py-4 ${muted}`}>{report.category || 'General'}</td><td className="px-5 py-4"><span className={`rounded-full border px-2 py-1 text-xs ${statusStyles[report.status] || statusStyles.Pending}`}>{report.status || 'Pending'}</span></td><td className="px-5 py-4"><span className={`rounded-full border px-2 py-1 text-xs ${priorityStyles[report.priority] || priorityStyles.Medium}`}>{report.priority || 'Medium'}</span></td><td className={`max-w-xs truncate px-5 py-4 ${muted}`} title={report.address || ''}>{report.address || 'Dagupan City'}</td><td className="px-5 py-4"><Link to={`/barangay/reports/${report._id}`} className="text-[#3b82f6] hover:text-[#60a5fa]">View</Link></td></tr>)}</tbody></table></section><div className="flex items-center justify-between"><p className={`text-sm ${muted}`}>Showing {pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries</p><div className="flex gap-3 text-sm"><button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="text-gray-400 disabled:opacity-40">Previous</button><span className={muted}>Page {page} of {Math.max(1, pagination.pages)}</span><button type="button" disabled={page >= pagination.pages} onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))} className="text-gray-400 disabled:opacity-40">Next</button></div></div></div>;
};

export default BarangayReportsPage;
