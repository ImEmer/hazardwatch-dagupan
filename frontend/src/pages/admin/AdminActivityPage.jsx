import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';
import { showError } from '../../services/alerts';

const tabs = [
  { key: 'user', label: 'User Activity', roles: ['user'] },
  { key: 'barangay', label: 'Barangay Activity', roles: ['barangay'] },
  { key: 'admin', label: 'Admin Activity', roles: ['admin', 'superadmin'] },
];

const AdminActivityPage = () => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/activity', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        if (!cancelled) setActivities(response.data?.activities || []);
      })
      .catch((error) => {
        if (!cancelled) showError(error.response?.data?.message || 'Unable to load activity.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  const visibleActivities = activities.filter((activity) => tabs.find((tab) => tab.key === activeTab).roles.includes(activity.role));

  return (
    <div className="space-y-6">
      <div>
        <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Audit trail</p>
        <h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Activity</h1>
      </div>

      <div className={`flex flex-wrap gap-2 border-b ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
        {tabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`border-b-2 px-3 py-3 text-sm font-medium ${activeTab === tab.key ? 'border-[#3b82f6] text-[#3b82f6]' : `border-transparent ${isDark ? 'text-gray-400' : 'text-slate-500'}`}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`rounded-2xl border shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        {loading ? (
          <p className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Loading activity...</p>
        ) : visibleActivities.length === 0 ? (
          <p className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No activity recorded yet.</p>
        ) : (
          <div className="divide-y divide-[#2e303a]">
            {visibleActivities.map((activity) => (
              <div key={activity._id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={isDark ? 'text-white' : 'text-slate-900'}>{activity.message}</p>
                  <p className={`mt-1 text-xs capitalize ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{activity.actorName || 'Unknown actor'} · {activity.role}</p>
                </div>
                <time dateTime={activity.createdAt} className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{new Date(activity.createdAt).toLocaleString()}</time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivityPage;
