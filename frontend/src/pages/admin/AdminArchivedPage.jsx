import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';

const AdminArchivedPage = ({ basePath = '/admin' }) => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';
  useEffect(() => {
    let cancelled = false;
    api.get('/reports/archived', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => { if (!cancelled) setReports(response.data?.reports || []); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);
  const panel = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';
  return <div className="space-y-6"><section className={`rounded-2xl border p-5 shadow-xl ${panel}`}><p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">Retention</p><h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Archived reports</h1><p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Closed reports are preserved here as read-only records.</p></section><section className={`overflow-hidden rounded-2xl border shadow-xl ${panel}`}><div className="overflow-x-auto"><table className={`min-w-full text-left text-sm ${isDark ? 'text-gray-200' : 'text-slate-700'}`}><thead className={isDark ? 'bg-[#0a0b0f] text-gray-400' : 'bg-slate-100 text-slate-500'}><tr><th className="px-4 py-3">Report</th><th className="px-4 py-3">Barangay</th><th className="px-4 py-3">Closed</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan="4" className="p-10 text-center">Loading archived reports...</td></tr> : !reports.length ? <tr><td colSpan="4" className="p-10 text-center">No archived reports.</td></tr> : reports.map((report) => <tr key={report._id} className={`border-t ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}><td className="px-4 py-4 font-medium">{report.title || `${report.category} report`}</td><td className="px-4 py-4">{report.assignedBarangay || report.barangay || '—'}</td><td className="px-4 py-4">{report.archivedAt ? new Date(report.archivedAt).toLocaleDateString() : '—'}</td><td className="px-4 py-4"><Link to={`${basePath}/reports/${report._id}`} className="text-[#3b82f6] hover:text-[#60a5fa]">View</Link></td></tr>)}</tbody></table></div></section></div>;
};

export default AdminArchivedPage;
