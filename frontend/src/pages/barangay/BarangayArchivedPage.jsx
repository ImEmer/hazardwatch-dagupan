import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';
import Skeleton from '../../components/common/Skeleton';

const BarangayArchivedPage = () => {
  const { token, user } = useAuth();
  const { theme } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isDark = theme === 'dark';
  const panel = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.get('/reports/archived', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => { if (!cancelled) setReports(response.data?.reports || []); })
      .catch((requestError) => { if (!cancelled) { setReports([]); setError(requestError.response?.data?.message || 'Unable to load archived reports.'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  return <div className="space-y-6"><section className={`rounded-2xl border p-5 shadow-xl ${panel}`}><p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">{user?.barangay || 'Barangay'} retention</p><h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Archived reports</h1><p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Closed reports are read-only.</p></section><section className={`overflow-hidden rounded-2xl border shadow-xl ${panel}`}><div className="overflow-x-auto"><table className={`min-w-full text-left text-sm ${isDark ? 'text-gray-200' : 'text-slate-700'}`}><thead className={isDark ? 'bg-[#0a0b0f] text-gray-400' : 'bg-slate-100 text-slate-500'}><tr><th className="px-4 py-3">Report</th><th className="px-4 py-3">Closed</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{loading ? Array.from({ length: 6 }).map((_, index) => <tr key={index} className={`border-t ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>{Array.from({ length: 3 }).map((__, columnIndex) => <td key={columnIndex} className="px-4 py-4"><Skeleton className="h-5 w-3/4" /></td>)}</tr>) : error ? <tr><td colSpan="3" className="p-10 text-center text-red-400">{error}</td></tr> : !reports.length ? <tr><td colSpan="3" className="p-10 text-center">No archived reports.</td></tr> : reports.map((report) => <tr key={report._id} className={`border-t ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}><td className="px-4 py-4 font-medium">{report.title || `${report.category} report`}</td><td className="px-4 py-4">{report.archivedAt ? new Date(report.archivedAt).toLocaleDateString() : '-'}</td><td className="px-4 py-4"><Link to={`/barangay/reports/${report._id}`} state={{ from: 'archived' }} className="text-[#3b82f6] hover:text-[#60a5fa]">View</Link></td></tr>)}</tbody></table></div></section></div>;
};

export default BarangayArchivedPage;
