import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import api from '../services/api';
import { showError } from '../services/alerts';

const relativeTime = (date) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

const pageNumbers = (pages, page) => pages <= 7
  ? Array.from({ length: pages }, (_, index) => index + 1)
  : [1, ...(page > 3 ? ['...'] : []), ...Array.from({ length: Math.min(pages - 1, page + 1) - Math.max(2, page - 1) + 1 }, (_, index) => Math.max(2, page - 1) + index), ...(page < pages - 2 ? ['...'] : []), pages];

const ActivityPage = ({ endpoint, tabs, title, roleParam = true }) => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { setPage(1); }, [activeTab, search, dateFilter]);
  useEffect(() => {
    AOS.init({ duration: 500, once: true });
    let cancelled = false;
    const params = { page, limit: 5, role: roleParam && activeTab !== 'all' ? activeTab : undefined, search: search || undefined };
    if (dateFilter !== 'all') params.startDate = new Date(Date.now() - Number(dateFilter) * 86400000).toISOString().slice(0, 10);
    setLoading(true);
    api.get(endpoint, { params, headers: { Authorization: `Bearer ${token}` } }).then((response) => {
      if (cancelled) return;
      setActivities(response.data?.entries || response.data?.activities || []);
      setPagination(response.data?.pagination || { page, limit: 5, total: 0, pages: 1 });
    }).catch((error) => { if (!cancelled) showError(error.response?.data?.message || 'Unable to load activity.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, dateFilter, endpoint, page, roleParam, search, token]);

  const totalPages = Math.max(1, pagination.pages || 1);
  const first = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const last = Math.min(pagination.page * pagination.limit, pagination.total);
  const panel = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';
  const muted = isDark ? 'text-gray-400' : 'text-slate-500';

  return <div className="space-y-6"><header><p className={`text-xs uppercase tracking-[0.25em] ${muted}`}>Audit trail</p><h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h1></header><div className="flex flex-col gap-3 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search actor or action" className={`flex-1 rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-[#2e303a] bg-[#14151d] text-white' : 'border-slate-200 bg-white text-slate-900'}`} /><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className={`rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-[#2e303a] bg-[#14151d] text-white' : 'border-slate-200 bg-white text-slate-900'}`}><option value="all">All time</option><option value="1">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></div><nav className={`flex flex-wrap gap-2 border-b ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>{tabs.map((tab) => <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`border-b-2 px-3 py-3 text-sm font-medium ${activeTab === tab.key ? 'border-[#3b82f6] text-[#3b82f6]' : `border-transparent ${muted}`}`}>{tab.label}</button>)}</nav><section className={`rounded-2xl border shadow-xl ${panel}`}>{loading ? <p className={`p-8 text-center ${muted}`}>Loading activity...</p> : !activities.length ? <p className={`p-8 text-center ${muted}`}>No activity yet.</p> : <div className={`divide-y ${isDark ? 'divide-[#2e303a]' : 'divide-slate-200'}`}>{activities.map((activity) => <div key={activity._id} data-aos="fade-up" className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className={isDark ? 'text-white' : 'text-slate-900'}>{activity.message || activity.action}</p><span className="mt-1 inline-flex rounded-full bg-blue-500/10 px-2 py-1 text-xs capitalize text-blue-400">{activity.actorRole || activity.role}</span></div><time title={new Date(activity.createdAt).toLocaleString()} className={`text-xs ${muted}`}>{relativeTime(activity.createdAt)}</time></div>)}</div>}</section><footer className="mt-4 flex flex-col items-center gap-3 px-1 py-3 sm:flex-row sm:justify-between"><p className={`text-sm ${muted}`}>Showing {first}–{last} of {pagination.total} entries</p><div className="flex items-center gap-3 text-sm"><button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="text-gray-400 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>{pageNumbers(totalPages, page).map((value, index) => value === '...' ? <span key={`ellipsis-${index}`} className="text-gray-500">...</span> : <button type="button" key={value} onClick={() => setPage(Math.min(totalPages, Math.max(1, value)))} className={page === value ? 'font-bold text-[#3b82f6]' : 'text-gray-400 hover:text-white'}>{value}</button>)}<button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="text-gray-400 disabled:cursor-not-allowed disabled:opacity-40">Next</button></div><p className={`text-xs ${muted}`}>{pagination.total} total entries</p></footer></div>;
};

export default ActivityPage;
