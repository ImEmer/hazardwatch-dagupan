import React, { useMemo, useState } from 'react';
import InteractiveMap from '../components/InteractiveMap';
import { useReports } from '../context/ReportContext';

const statusColors = {
  Pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  'Under Review': 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  Verified: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  'In Progress': 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  Resolved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Closed: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

const AdminMapPage = () => {
  const { reports } = useReports();
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredReports = useMemo(() => {
    if (statusFilter === 'all') return reports;
    return reports.filter((report) => report.status === statusFilter);
  }, [reports, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-4 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Response map</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Geo dashboard</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'Pending', 'In Progress', 'Resolved', 'Closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  statusFilter === status
                    ? 'bg-[#3b82f6] text-white'
                    : 'bg-[#0a0b0f] text-gray-300 hover:text-white'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-[#2e303a] bg-[#14151d] p-2 shadow-xl">
          <div className="h-[620px] overflow-hidden rounded-xl">
            <InteractiveMap reports={filteredReports} height="100%" />
          </div>
        </div>

        <div className="space-y-4">
          {filteredReports.slice(0, 6).map((report) => (
            <div key={report.id} className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-4 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{report.title}</p>
                  <p className="mt-1 text-xs text-gray-400">{report.category}</p>
                </div>
                <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${statusColors[report.status] || statusColors.Pending}`}>
                  {report.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-300">{report.address || 'Dagupan City area'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMapPage;
