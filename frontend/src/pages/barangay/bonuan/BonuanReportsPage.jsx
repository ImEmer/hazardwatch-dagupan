import React from 'react';
import { Link } from 'react-router-dom';
import useTheme from '../../../hooks/useTheme';

const reports = [
  { id: 'HR-2041', title: 'Flooded road near Bonuan market', status: 'Monitoring', priority: 'High', date: '2026-09-04' },
  { id: 'HR-2046', title: 'Fallen tree along Rizal Street', status: 'Assigned', priority: 'Medium', date: '2026-09-05' },
  { id: 'HR-2052', title: 'Waste blockage near public market', status: 'Queued', priority: 'Low', date: '2026-09-06' },
];

const BonuanReportsPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const basePath = '/barangay/bonuan';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs uppercase tracking-[0.22em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>Bonuan</p>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports</h1>
        </div>
      </div>

      <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className={isDark ? 'bg-[#0a0b0f] text-gray-300' : 'bg-slate-50 text-slate-600'}>
              <tr>
                <th className="px-4 py-3 text-sm font-semibold">Report</th>
                <th className="px-4 py-3 text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-sm font-semibold">Priority</th>
                <th className="px-4 py-3 text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className={`border-t ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
                  <td className="px-4 py-3">
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{report.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${report.status === 'Monitoring' ? 'bg-amber-500/20 text-amber-300' : report.status === 'Assigned' ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-500/20 text-slate-300'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${report.priority === 'High' ? 'text-rose-400' : report.priority === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {report.priority}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{report.date}</td>
                  <td className="px-4 py-3">
                    <Link to={`${basePath}/reports/${report.id}`} className="text-sm font-medium text-[#3b82f6] hover:text-[#60a5fa]">
                      View detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BonuanReportsPage;
