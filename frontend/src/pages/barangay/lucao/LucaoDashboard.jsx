import React from 'react';
import { Link } from 'react-router-dom';
import useTheme from '../../../hooks/useTheme';

const stats = [
  { label: 'Open incidents', value: '15', tone: 'text-amber-400' },
  { label: 'Resolved', value: '31', tone: 'text-emerald-400' },
  { label: 'Critical alerts', value: '2', tone: 'text-rose-400' },
  { label: 'This week', value: '9', tone: 'text-sky-400' },
];

const recentReports = [
  { id: 'HR-2134', title: 'Blocked drainage channel near Lucao Road', status: 'Monitoring', priority: 'High' },
  { id: 'HR-2140', title: 'Electrical hazard near residential lane', status: 'Assigned', priority: 'High' },
  { id: 'HR-2148', title: 'Debris in community access road', status: 'Queued', priority: 'Low' },
];

const alerts = [
  'Stormwater backflow reported near the market area.',
  'Community inspection team is assigned for drainage check.',
  'Street lamps flagged for battery backup check.',
];

const LucaoDashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const basePath = '/barangay/lucao';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={`text-xs uppercase tracking-[0.24em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>Lucao</p>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Barangay Operations Dashboard</h1>
        </div>
        <Link to={`${basePath}/reports`} className="inline-flex items-center rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#2563eb]">
          View reports
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className={`rounded-2xl border p-5 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
            <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{item.label}</p>
            <p className={`mt-3 text-3xl font-bold ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className={`rounded-2xl border p-5 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent incidents</h2>
            <span className={`text-xs ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>Updated 8 min ago</span>
          </div>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div key={report.id} className={`flex items-center justify-between rounded-xl border p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{report.id}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${report.priority === 'High' ? 'text-rose-400' : report.priority === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>{report.priority}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{report.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Priority snapshot</h2>
          <ul className="mt-4 space-y-3">
            {alerts.map((alert) => (
              <li key={alert} className={`rounded-xl border border-dashed p-3 text-sm ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-gray-300' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                {alert}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LucaoDashboard;
