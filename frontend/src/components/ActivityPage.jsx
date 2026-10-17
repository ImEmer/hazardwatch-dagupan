import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import api from '../services/api';
import { showError } from '../services/alerts';
import { formatDateTime } from '../utils/formatDate';
import Skeleton from './common/Skeleton';
import Pagination from './common/Pagination';

const getActivityDetails = (details) => {
  if (details && typeof details === 'object') return details;
  if (typeof details !== 'string' || !details) return {};
  try {
    const parsedDetails = JSON.parse(details);
    return parsedDetails && typeof parsedDetails === 'object' ? parsedDetails : {};
  } catch {
    return {};
  }
};

const formatActivityMessage = (message) => String(message || '').replace(
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/g,
  (timestamp) => formatDateTime(timestamp),
);

const ActivityPage = ({ endpoint, tabs, title, roleParam = true, categoryParam = false }) => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState(tabs[0]?.key || 'all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { setPage(1); }, [activeTab, search, dateFilter]);
  useEffect(() => {
    let cancelled = false;
    const params = {
      page,
      limit: 5,
      role: roleParam && activeTab !== 'all' ? activeTab : undefined,
      category: categoryParam && activeTab !== 'all' ? activeTab : undefined,
      search: search || undefined,
    };
    if (dateFilter !== 'all') params.startDate = new Date(Date.now() - Number(dateFilter) * 86400000).toISOString().slice(0, 10);
    setLoading(true);
    setError('');
    api.get(endpoint, { params, headers: { Authorization: `Bearer ${token}` } }).then((response) => {
      if (cancelled) return;
      setActivities(response.data?.entries || response.data?.activities || []);
      setPagination(response.data?.pagination || { page, limit: 5, total: 0, pages: 1 });
    }).catch((requestError) => {
      if (!cancelled) {
        setActivities([]);
        setError(requestError.response?.data?.message || 'Unable to load activity.');
        showError(requestError.response?.data?.message || 'Unable to load activity.');
      }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, categoryParam, dateFilter, endpoint, page, roleParam, search, token]);

  const totalPages = Math.max(1, pagination.pages || 1);
  const panel = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';
  const muted = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      <header><p className={`text-xs uppercase tracking-[0.25em] ${muted}`}>Audit trail</p><h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h1></header>
      <div className="flex flex-col gap-3 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search actor or action" className={`flex-1 rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-[#2e303a] bg-[#14151d] text-white' : 'border-slate-200 bg-white text-slate-900'}`} /><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className={`rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-[#2e303a] bg-[#14151d] text-white' : 'border-slate-200 bg-white text-slate-900'}`}><option value="all">All time</option><option value="1">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></div>
      <nav className={`flex flex-wrap gap-2 border-b ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>{tabs.map((tab) => <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`border-b-2 px-3 py-3 text-sm font-medium ${activeTab === tab.key ? 'border-[#3b82f6] text-[#3b82f6]' : `border-transparent ${muted}`}`}>{tab.label}</button>)}</nav>
      <section className={`rounded-2xl border shadow-xl ${panel}`}>
        {loading ? <div className="space-y-4 p-4">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div></div>)}</div> : error ? <p className="p-8 text-center text-red-400">{error}</p> : !activities.length ? <p className={`p-8 text-center ${muted}`}>No activity yet.</p> : <div className={`divide-y ${isDark ? 'divide-[#2e303a]' : 'divide-slate-200'}`}>{activities.map((activity) => {
          const details = getActivityDetails(activity.details);
          const reason = details.reason || details.suspensionReason || details.banReason;
          return (
            <div key={activity._id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className={`${isDark ? 'text-white' : 'text-slate-900'} break-words`}>{formatActivityMessage(activity.message || activity.action)}</p>
                {reason && <p className={`mt-1 break-words whitespace-pre-wrap text-sm ${muted}`}>Reason: {reason}</p>}
                <span className="mt-1 inline-flex rounded-full bg-blue-500/10 px-2 py-1 text-xs capitalize text-blue-400">{activity.actorRole || activity.role}</span>
              </div>
              <time dateTime={activity.createdAt} title={formatDateTime(activity.createdAt)} className={`shrink-0 text-xs ${muted}`}>{formatDateTime(activity.createdAt)}</time>
            </div>
          );
        })}</div>}
      </section>
      <Pagination currentPage={page} totalPages={totalPages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={setPage} isDark={isDark} />
    </div>
  );
};

export default ActivityPage;
