import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';
import { showError } from '../../services/alerts';

const tabs = [
  { key: 'all', label: 'All', roles: ['barangay', 'user'] },
  { key: 'barangay', label: 'Barangay', roles: ['barangay'] },
  { key: 'user', label: 'User', roles: ['user'] },
];

const ActivityFeed = ({ activities, activeTab, search, dateFilter, isDark }) => {
  const cutoff = dateFilter === 'all' ? 0 : Date.now() - Number(dateFilter) * 24 * 60 * 60 * 1000;
  const filtered = activities.filter((activity) => {
    const role = activity.actorRole || activity.role;
    const text = `${activity.actorName || ''} ${activity.message || ''} ${activity.action || ''}`.toLowerCase();
    return tabs.find((tab) => tab.key === activeTab).roles.includes(role)
      && text.includes(search.toLowerCase())
      && new Date(activity.createdAt).getTime() >= cutoff;
  });

  if (!filtered.length) return <p className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No activity recorded yet.</p>;
  return <div className={`divide-y ${isDark ? 'divide-[#2e303a]' : 'divide-slate-200'}`}>
    {filtered.map((activity) => (
      <div key={activity._id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className={isDark ? 'text-white' : 'text-slate-900'}>{activity.message || activity.action}</p><span className="mt-1 inline-flex rounded-full bg-blue-500/10 px-2 py-1 text-xs capitalize text-blue-400">{activity.actorRole || activity.role}</span></div>
        <time dateTime={activity.createdAt} className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{new Date(activity.createdAt).toLocaleString()}</time>
      </div>
    ))}
  </div>;
};

const AdminActivityPage = () => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/activity/public', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => { if (!cancelled) setActivities(response.data?.activities || []); })
      .catch((error) => { if (!cancelled) showError(error.response?.data?.message || 'Unable to load activity.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  return <div className="space-y-6">
    <div><p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Audit trail</p><h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Activity</h1></div>
    <div className="flex flex-col gap-3 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search actor or action" className={`flex-1 rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-[#2e303a] bg-[#14151d] text-white' : 'border-slate-200 bg-white text-slate-900'}`} /><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className={`rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-[#2e303a] bg-[#14151d] text-white' : 'border-slate-200 bg-white text-slate-900'}`}><option value="all">All time</option><option value="1">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></div>
    <div className={`flex flex-wrap gap-2 border-b ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>{tabs.map((tab) => <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`border-b-2 px-3 py-3 text-sm font-medium ${activeTab === tab.key ? 'border-[#3b82f6] text-[#3b82f6]' : `border-transparent ${isDark ? 'text-gray-400' : 'text-slate-500'}`}`}>{tab.label}</button>)}</div>
    <div className={`rounded-2xl border shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>{loading ? <p className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Loading activity...</p> : <ActivityFeed activities={activities} activeTab={activeTab} search={search} dateFilter={dateFilter} isDark={isDark} />}</div>
  </div>;
};

export default AdminActivityPage;
