import React, { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';
import { REPORT_STATUSES, STATUS_CHART_COLORS } from '../../services/reportOptions';
import { SkeletonCard, SkeletonChart } from '../../components/common/Skeleton';

const priorities = [
  { name: 'Urgent', color: '#ef4444' },
  { name: 'High', color: '#f97316' },
  { name: 'Medium', color: '#f59e0b' },
  { name: 'Low', color: '#64748b' },
];

const toCounts = (items = []) => Object.fromEntries(items.map((item) => [item._id || item.name, item.count || item.value || 0]));

const BarangayDashboard = () => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const barangay = user?.barangay || '';
  const [dashboard, setDashboard] = useState({ total: 0, status: [], priority: [], reports: [], timeline: [] });
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !barangay) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    const encodedBarangay = encodeURIComponent(barangay);
    setLoading(true);
    setError('');
    Promise.all([
      api.get(`/statistics/barangay/${encodedBarangay}`, { headers: { Authorization: `Bearer ${token}` } }),
      api.get('/reports', { params: { barangay, page: 1, limit: 5 }, headers: { Authorization: `Bearer ${token}` } }),
      api.get(`/statistics/barangay/${encodedBarangay}/timeline`, { params: { month }, headers: { Authorization: `Bearer ${token}` } }),
    ]).then(([overview, reports, timeline]) => {
      if (cancelled) return;
      setDashboard({ total: overview.data?.total || 0, status: overview.data?.status || [], priority: overview.data?.priority || [], reports: reports.data?.reports || [], timeline: timeline.data?.data || [] });
    }).catch((requestError) => {
      if (!cancelled) setError(requestError.response?.data?.message || 'Unable to load barangay dashboard.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [barangay, month, token]);

  const statusCounts = toCounts(dashboard.status);
  const priorityCounts = toCounts(dashboard.priority);
  const statusData = REPORT_STATUSES.map((name) => ({ name, value: statusCounts[name] || 0 }));
  const priorityData = priorities.map((item) => ({ ...item, count: priorityCounts[item.name] || 0 }));
  const maxPriority = Math.max(...priorityData.map((item) => item.count), 1);
  const chartText = isDark ? '#d1d5db' : '#475569';
  const chartGrid = isDark ? '#2e303a' : '#e2e8f0';
  const tooltipStyle = { backgroundColor: isDark ? '#14151d' : '#fff', border: `1px solid ${chartGrid}`, color: isDark ? '#fff' : '#1e293b' };
  const daysInMonth = new Date(selectedYear, month + 1, 0).getDate();
  const timelineCounts = Object.fromEntries(dashboard.timeline.map((item) => [item._id, item.count || 0]));
  const timelineData = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dateKey = `${selectedYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      date: new Date(selectedYear, month, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      reports: timelineCounts[dateKey] || 0,
    };
  });
  const monthOptions = Array.from({ length: 12 }, (_, index) => ({
    month: index,
    label: new Date(selectedYear, index, 1).toLocaleDateString('en-US', { month: 'long' }),
  }));

  if (loading) return <div className="space-y-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} className="h-28 w-full" />)}</div><div className="grid gap-6 xl:grid-cols-2"><SkeletonChart className="h-[280px] w-full" /><SkeletonChart className="h-[280px] w-full" /><SkeletonChart className="h-[280px] w-full xl:col-span-2" /></div></div>;
  if (error) return <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">{error}</div>;

  return <div className="space-y-6">
    <header><p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>{barangay}</p><h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Barangay Operations Dashboard</h1></header>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[['Total reports', dashboard.total, 'border-blue-500'], ['Pending', statusCounts.Pending || 0, 'border-amber-500'], ['In progress', statusCounts['In Progress'] || 0, 'border-violet-500'], ['Resolved', statusCounts.Resolved || 0, 'border-emerald-500']].map(([label, value, tone]) => <div key={label} className={`rounded-2xl border-l-4 ${tone} border-y border-r p-4 shadow-xl ${isDark ? 'border-y-[#2e303a] border-r-[#2e303a] bg-[#14151d]' : 'border-y-slate-200 border-r-slate-200 bg-white'}`}><p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{label}</p><p className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p></div>)}</div>
    <div className="grid gap-6 xl:grid-cols-2">
      <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}><h2 className={`mb-4 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports by status</h2><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value">{statusData.map((entry) => <Cell key={entry.name} fill={STATUS_CHART_COLORS[entry.name]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend formatter={(value) => <span style={{ color: chartText }}>{value}</span>} /></PieChart></ResponsiveContainer></div>
      <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-start justify-between gap-3">
          <div><h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Priority queue</h2><p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Reports needing attention first</p></div>
          <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-500">{priorityData[0].count} urgent</span>
        </div>
        <div className="mt-5 space-y-4">{priorityData.map((item) => <div key={item.name}><div className={`mb-1.5 flex items-center justify-between text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><strong className={isDark ? 'text-white' : 'text-slate-900'}>{item.count}</strong></div><div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-[#0a0b0f]' : 'bg-slate-100'}`}><div className="h-full rounded-full transition-all" style={{ width: `${Math.max((item.count / maxPriority) * 100, item.count ? 8 : 0)}%`, backgroundColor: item.color }} /></div></div>)}</div>
      </div>
      <div className={`rounded-2xl border p-5 shadow-xl xl:col-span-2 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports over time</h2><p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Daily submissions for the selected month</p></div><div className="flex flex-wrap gap-1.5">{monthOptions.map((option) => <button type="button" key={option.month} onClick={() => setMonth(option.month)} className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${month === option.month ? 'bg-[#3b82f6] text-white' : isDark ? 'bg-[#0a0b0f] text-gray-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}>{option.label.slice(0, 3)}</button>)}</div></div>
        <ResponsiveContainer width="100%" height={280}><AreaChart data={timelineData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}><defs><linearGradient id="barangayReportsTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={chartGrid} /><XAxis dataKey="date" stroke={chartText} tick={{ fontSize: 11 }} interval={Math.max(1, Math.floor(daysInMonth / 7))} /><YAxis allowDecimals={false} stroke={chartText} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="reports" name="Reports" stroke="#3b82f6" fill="url(#barangayReportsTrend)" strokeWidth={2} /><Line type="monotone" dataKey="reports" stroke="#60a5fa" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer>
      </div>
    </div>
    <section className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}><h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent reports</h2><div className="mt-4 space-y-3">{dashboard.reports.map((report) => <div key={report._id} className={`flex items-center justify-between rounded-xl border p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}><div><p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title || `${report.category || 'Hazard'} report`}</p><p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{report._id}</p></div><div className="text-right"><p className="text-xs font-medium text-[#60a5fa]">{report.priority || 'Medium'}</p><p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{report.status || 'Pending'}</p></div></div>)}{!dashboard.reports.length && <p className={`py-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No reports found.</p>}</div></section>
  </div>;
};

export default BarangayDashboard;
