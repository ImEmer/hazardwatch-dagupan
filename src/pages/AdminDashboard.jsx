    import React from 'react';
    import { useReports } from '../context/ReportContext';

    const statusColors = {
      Pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
      'Under Review': 'bg-sky-500/10 text-sky-300 border-sky-500/30',
      Verified: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
      'In Progress': 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      Resolved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      Closed: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    };

    const priorityColors = {
      Low: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
      Medium: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      High: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
      Urgent: 'bg-red-500/10 text-red-300 border-red-500/30',
    };

    const AdminDashboard = () => {
      const { reports } = useReports();

      const totalReports = reports.length;
      const pending = reports.filter((report) => report.status === 'Pending').length;
      const inProgress = reports.filter((report) => report.status === 'In Progress').length;
      const resolved = reports.filter((report) => report.status === 'Resolved').length;
      const recentReports = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

      const statusSummary = [
        { label: 'Pending', value: pending, color: 'bg-yellow-500' },
        { label: 'In Progress', value: inProgress, color: 'bg-blue-500' },
        { label: 'Resolved', value: resolved, color: 'bg-emerald-500' },
        { label: 'Closed', value: reports.filter((report) => report.status === 'Closed').length, color: 'bg-slate-500' },
      ];

      return (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-4 shadow-xl">
              <p className="text-sm text-gray-400">Total reports</p>
              <p className="mt-3 text-3xl font-bold text-white">{totalReports}</p>
            </div>
            <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-4 shadow-xl">
              <p className="text-sm text-gray-400">Pending</p>
              <p className="mt-3 text-3xl font-bold text-white">{pending}</p>
            </div>
            <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-4 shadow-xl">
              <p className="text-sm text-gray-400">In progress</p>
              <p className="mt-3 text-3xl font-bold text-white">{inProgress}</p>
            </div>
            <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-4 shadow-xl">
              <p className="text-sm text-gray-400">Resolved</p>
              <p className="mt-3 text-3xl font-bold text-white">{resolved}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Reports by status</h3>
                <span className="text-sm text-gray-400">Last 30 days</span>
              </div>

              <div className="space-y-4">
                {statusSummary.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-sm text-gray-300">
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#0a0b0f]">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${Math.max((item.value / Math.max(totalReports, 1)) * 100, 8)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5 shadow-xl">
              <h3 className="text-xl font-semibold text-white">Response metrics</h3>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[#2e303a] bg-[#0a0b0f] p-3">
                  <p className="text-sm text-gray-400">Average response time</p>
                  <p className="mt-2 text-2xl font-bold text-white">6.2 hours</p>
                </div>
                <div className="rounded-xl border border-[#2e303a] bg-[#0a0b0f] p-3">
                  <p className="text-sm text-gray-400">Active incidents</p>
                  <p className="mt-2 text-2xl font-bold text-white">{pending + inProgress}</p>
                </div>
                <div className="rounded-xl border border-[#2e303a] bg-[#0a0b0f] p-3">
                  <p className="text-sm text-gray-400">Critical issues</p>
                  <p className="mt-2 text-2xl font-bold text-white">{reports.filter((report) => report.priority === 'Urgent').length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Recent reports</h3>
                <span className="text-sm text-gray-400">Latest activity</span>
              </div>

              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#2e303a] bg-[#0a0b0f] p-3">
                    <div>
                      <p className="font-medium text-white">{report.title}</p>
                      <p className="text-xs text-gray-400">{report.category} • {new Date(report.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${priorityColors[report.priority] || priorityColors.Medium}`}>
                        {report.priority || 'Medium'}
                      </span>
                      <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${statusColors[report.status] || statusColors.Pending}`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5 shadow-xl">
              <h3 className="text-xl font-semibold text-white">Priority queue</h3>
              <div className="mt-5 space-y-3">
                {['Urgent', 'High', 'Medium', 'Low'].map((level) => (
                  <div key={level} className="flex items-center justify-between rounded-xl border border-[#2e303a] bg-[#0a0b0f] p-3">
                    <span className="text-gray-300">{level}</span>
                    <span className="text-white">{reports.filter((report) => (report.priority || 'Medium') === level).length}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    };

    export default AdminDashboard;