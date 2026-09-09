import React, { useMemo, useState } from 'react';
import InteractiveMap from '../../components/InteractiveMap';
import { useReports } from '../../context/ReportContext';
import useTheme from '../../hooks/useTheme';

const statusColors = {
  Pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  'In Progress': 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  Resolved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Closed: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

const statusColorsLight = {
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'In Progress': 'bg-violet-50 text-violet-700 border-violet-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Closed: 'bg-slate-100 text-slate-700 border-slate-200',
};

const AdminMapPage = () => {
  const { reports } = useReports();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredReports = useMemo(() => {
    if (statusFilter === 'all') return reports;
    return reports.filter((report) => report.status === statusFilter);
  }, [reports, statusFilter]);

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-4 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Response map</p>
            <h2 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Geo dashboard</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'Pending', 'In Progress', 'Resolved', 'Closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  statusFilter === status
                    ? 'bg-[#3b82f6] text-white'
                    : isDark ? 'bg-[#0a0b0f] text-gray-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className={`overflow-hidden rounded-2xl border p-2 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <div className="h-[620px] overflow-hidden rounded-xl">
            <InteractiveMap reports={filteredReports} height="100%" />
          </div>
        </div>

        <div className="space-y-4">
          {filteredReports.slice(0, 6).map((report) => (
            <div key={report._id || report.id} className={`rounded-2xl border p-4 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title}</p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{report.category}</p>
                </div>
                <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${(isDark ? statusColors : statusColorsLight)[report.status] || (isDark ? statusColors : statusColorsLight).Pending}`}>
                  {report.status}
                </span>
              </div>
              <p className={`mt-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{report.address || 'Dagupan City area'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMapPage;
