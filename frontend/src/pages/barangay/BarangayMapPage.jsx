import React, { useEffect, useMemo, useState } from 'react';
import InteractiveMap from '../../components/InteractiveMap';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';

const statuses = ['all', 'Pending', 'In Progress', 'Resolved', 'Closed'];
const BarangayMapPage = () => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('all');
  const [heatmap, setHeatmap] = useState(() => localStorage.getItem('hazardwatch_heatmap') === 'true');
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!token || !user?.barangay) return undefined; let cancelled = false; api.get('/reports', { params: { barangay: user.barangay, page: 1, limit: 100 }, headers: { Authorization: `Bearer ${token}` } }).then((response) => { if (!cancelled) setReports(response.data?.reports || []); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, [token, user?.barangay]);
  const filtered = useMemo(() => status === 'all' ? reports : reports.filter((report) => report.status === status), [reports, status]);
  const toggleHeatmap = () => setHeatmap((value) => { localStorage.setItem('hazardwatch_heatmap', String(!value)); return !value; });
  const panel = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';
  return <div className="flex h-[calc(100vh-64px)] min-h-0 flex-col gap-6"><section className={`rounded-2xl border p-4 shadow-xl ${panel}`}><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.25em] text-[#3b82f6]">{user?.barangay} response map</p><h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Map View</h1></div><div className="flex flex-wrap gap-2">{statuses.map((item) => <button type="button" key={item} onClick={() => setStatus(item)} className={`rounded-lg px-3 py-1.5 text-sm ${status === item ? 'bg-[#3b82f6] text-white' : isDark ? 'bg-[#0a0b0f] text-gray-300' : 'bg-slate-100 text-slate-700'}`}>{item === 'all' ? 'All' : item}</button>)}</div></div></section><div className="grid min-h-0 flex-1 gap-6 overflow-hidden xl:grid-cols-[2fr_1fr]"><div className={`relative min-h-0 overflow-hidden rounded-2xl border p-2 shadow-xl ${panel}`}><button type="button" onClick={toggleHeatmap} className="absolute left-5 top-5 z-10 rounded-lg bg-[#14151d]/95 px-3 py-2 text-sm text-white">{heatmap ? 'Show Markers' : 'Show Heatmap'}</button><InteractiveMap reports={filtered} height="100%" showHeatmap={heatmap} /></div><div className="min-h-0 space-y-4 overflow-y-auto pr-1">{loading ? <p className="text-gray-400">Loading reports...</p> : filtered.map((report) => <div key={report._id} className={`rounded-2xl border p-4 shadow-xl ${panel}`}><p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title || `${report.category} report`}</p><p className="mt-1 text-xs text-[#60a5fa]">{report.status}</p><p className={`mt-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{report.address || 'Dagupan City area'}</p></div>)}</div></div></div>;
};

export default BarangayMapPage;
