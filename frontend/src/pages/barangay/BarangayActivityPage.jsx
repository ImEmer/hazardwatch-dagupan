import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';
import { showError } from '../../services/alerts';

const relativeTime = (date) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

const BarangayActivityPage = () => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({ duration: 500, once: true });
    let cancelled = false;
    api.get(`/activity/barangay/${encodeURIComponent(user?.barangay || '')}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => { if (!cancelled) setActivities(response.data?.activities || []); })
      .catch((error) => { if (!cancelled) showError(error.response?.data?.message || 'Unable to load barangay activity.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, user?.barangay]);

  const visible = activities.filter((activity) => `${activity.actorName || ''} ${activity.message || ''} ${activity.action || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6"><div><p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{user?.barangay || 'Barangay'} audit trail</p><h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Activity</h1></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search actor or action" className={`w-full rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-[#2e303a] bg-[#14151d] text-white' : 'border-slate-200 bg-white text-slate-900'}`} /><div className={`rounded-2xl border shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>{loading ? <p className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Loading activity...</p> : !visible.length ? <p className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No activity recorded yet.</p> : <div className={`divide-y ${isDark ? 'divide-[#2e303a]' : 'divide-slate-200'}`}>{visible.map((activity) => <div key={activity._id} data-aos="fade-up" className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className={isDark ? 'text-white' : 'text-slate-900'}>{activity.message || activity.action}</p><span className="mt-1 inline-flex rounded-full bg-blue-500/10 px-2 py-1 text-xs capitalize text-blue-400">{activity.actorRole || activity.role}</span></div><time dateTime={activity.createdAt} title={new Date(activity.createdAt).toLocaleString()} className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{relativeTime(activity.createdAt)}</time></div>)}</div>}</div></div>;
};

export default BarangayActivityPage;
