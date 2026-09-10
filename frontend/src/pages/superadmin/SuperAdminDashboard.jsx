import React, { useEffect, useState } from 'react';
import useTheme from '../../hooks/useTheme';
import useAuth from '../../hooks/useAuth';

const SuperAdminDashboard = () => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [activities, setActivities] = useState([]);
  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchActivities = async () => {
      if (!token) return;
      try {
        const response = await fetch('/activity', { headers: { Authorization: `Bearer ${token}` } });
        const body = await response.json().catch(() => ({ activities: [] }));
        if (response.ok) setActivities(body.activities || []);
      } catch (error) {
        setActivities([]);
      }
    };

    fetchActivities();
  }, [token]);

  return (
    <main className="min-h-screen px-4 pb-10 pt-24 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className={`rounded-2xl border p-8 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">Super Admin</p>
          <h1 className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>System overview</h1>
          <p className={`mt-3 max-w-2xl ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Monitoring all admin activity, barangay updates, and platform-wide report changes.
          </p>
        </div>

        <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <h2 className={`mb-4 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>System-wide recent activity</h2>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>No system activity yet.</p>
            ) : (
              activities.map((activity) => (
                <div key={activity._id || activity.id} className={`rounded-xl border p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{activity.message}</p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {activity.role} • {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default SuperAdminDashboard;
