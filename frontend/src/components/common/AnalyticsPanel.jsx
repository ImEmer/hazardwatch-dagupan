import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useTheme from '../../hooks/useTheme';
import { analyticsApi } from '../../services/api';
import Skeleton, { SkeletonChart } from './Skeleton';

const COLORS = ['#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];
const emptyAnalytics = { barangay: [], category: [], priority: [], day: [], hourly: [], sliding: [], sessions: [] };

const rows = (response) => response?.data?.data || [];
const labelFor = (item, fallback = 'Unknown') => item?.name || item?._id || fallback;
const windowLabel = (item) => {
  const value = item?.window || item?._id;
  if (!value) return 'Unknown';
  const start = value.start || value.$date?.start;
  return start ? new Date(start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : String(value);
};

const AnalyticsPanel = ({ title = 'Spark analytics' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const chartText = isDark ? '#d1d5db' : '#475569';
  const chartGrid = isDark ? '#2e303a' : '#e2e8f0';
  const panelClass = `rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`;
  const tooltipStyle = { backgroundColor: isDark ? '#14151d' : '#ffffff', border: `1px solid ${chartGrid}`, color: isDark ? '#ffffff' : '#1e293b' };

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const [barangay, category, priority, day, hourly, sliding, sessions] = await Promise.all([
        analyticsApi.getReportsPerBarangay(),
        analyticsApi.getReportsPerCategory(),
        analyticsApi.getReportsPerPriority(),
        analyticsApi.getReportsPerDay(),
        analyticsApi.getTumblingHourly(),
        analyticsApi.getSliding(),
        analyticsApi.getSessions(),
      ]);
      setAnalytics({ barangay: rows(barangay), category: rows(category), priority: rows(priority), day: rows(day), hourly: rows(hourly), sliding: rows(sliding), sessions: rows(sessions) });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load Spark analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics().catch(() => {}); }, [fetchAnalytics]);

  const chartData = useMemo(() => ({
    barangay: analytics.barangay.map((item) => ({ name: labelFor(item), count: item.count || 0 })),
    category: analytics.category.map((item) => ({ name: labelFor(item), value: item.count || 0 })),
    priority: analytics.priority.map((item) => ({ name: labelFor(item), count: item.count || 0 })),
    day: analytics.day.map((item) => ({ date: item.date || item._id, count: item.count || 0 })),
    hourly: analytics.hourly.map((item) => ({ time: windowLabel(item), count: item.count || 0 })),
    sliding: analytics.sliding.map((item) => ({ time: windowLabel(item), count: item.count || 0 })),
  }), [analytics]);

  if (loading) return <section className={panelClass}><div className="flex items-center justify-between"><Skeleton className="h-6 w-40" /><Skeleton className="h-9 w-24" /></div><div className="mt-5 grid gap-6 xl:grid-cols-2"><SkeletonChart className="h-64" /><SkeletonChart className="h-64" /><SkeletonChart className="h-64" /><SkeletonChart className="h-64" /></div></section>;
  if (error) return <section className={`${panelClass} border-red-500/30`}><div className="flex items-center justify-between gap-3"><p className="text-red-400">{error}</p><button type="button" onClick={() => fetchAnalytics(true)} className="rounded-lg border border-red-400/50 px-3 py-2 text-sm text-red-300">Retry</button></div></section>;

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>Scalable analytics</p><h2 className={`mt-1 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2></div>
        <button type="button" onClick={() => fetchAnalytics(true)} disabled={refreshing} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50 ${isDark ? 'border-[#2e303a] text-gray-200' : 'border-slate-300 text-slate-700'}`} aria-label="Refresh analytics">{refreshing ? 'Refreshing...' : 'Refresh'}</button>
      </div>
      <div className="mt-5 grid gap-6 xl:grid-cols-2">
        <div><h3 className={`mb-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports per barangay</h3><ResponsiveContainer width="100%" height={260}><BarChart data={chartData.barangay} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={chartGrid} /><XAxis type="number" allowDecimals={false} stroke={chartText} /><YAxis dataKey="name" type="category" width={110} stroke={chartText} tick={{ fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
        <div><h3 className={`mb-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports per category</h3><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={chartData.category} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={92}>{chartData.category.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend formatter={(value) => <span style={{ color: chartText }}>{value}</span>} /></PieChart></ResponsiveContainer></div>
        <div><h3 className={`mb-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports per priority</h3><ResponsiveContainer width="100%" height={260}><BarChart data={chartData.priority}><CartesianGrid strokeDasharray="3 3" stroke={chartGrid} /><XAxis dataKey="name" stroke={chartText} /><YAxis allowDecimals={false} stroke={chartText} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div><h3 className={`mb-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports per day</h3><ResponsiveContainer width="100%" height={260}><LineChart data={chartData.day}><CartesianGrid strokeDasharray="3 3" stroke={chartGrid} /><XAxis dataKey="date" stroke={chartText} /><YAxis allowDecimals={false} stroke={chartText} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
        <div><h3 className={`mb-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Tumbling hourly windows</h3><ResponsiveContainer width="100%" height={260}><LineChart data={chartData.hourly}><CartesianGrid strokeDasharray="3 3" stroke={chartGrid} /><XAxis dataKey="time" stroke={chartText} tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} stroke={chartText} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
        <div><h3 className={`mb-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sliding windows</h3><ResponsiveContainer width="100%" height={260}><BarChart data={chartData.sliding}><CartesianGrid strokeDasharray="3 3" stroke={chartGrid} /><XAxis dataKey="time" stroke={chartText} tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} stroke={chartText} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </div>
      <div className="mt-6"><h3 className={`mb-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Session windows</h3><div className="overflow-x-auto"><table className={`min-w-full text-left text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}><thead><tr className={`border-b ${isDark ? 'border-[#2e303a] text-gray-400' : 'border-slate-200 text-slate-500'}`}><th className="px-3 py-2">Reporter</th><th className="px-3 py-2">Window</th><th className="px-3 py-2">Reports</th></tr></thead><tbody>{analytics.sessions.slice(0, 10).map((item, index) => <tr key={`${item.reporterId || 'unknown'}-${index}`} className={`border-b ${isDark ? 'border-[#2e303a]' : 'border-slate-100'}`}><td className="px-3 py-2">{item.reporterId || 'Anonymous'}</td><td className="px-3 py-2">{windowLabel(item)}</td><td className="px-3 py-2">{item.count || 0}</td></tr>)}</tbody></table>{!analytics.sessions.length && <p className={`py-5 text-center text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No session windows available.</p>}</div></div>
    </section>
  );
};

export default AnalyticsPanel;