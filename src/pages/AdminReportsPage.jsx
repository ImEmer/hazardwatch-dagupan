import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

const AdminReportsPage = () => {
  const { reports, updateReportStatus, deleteReport } = useReports();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch = [report.title, report.category, report.address || '', report.description]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [reports, search, statusFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-4 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Operational queue</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Reports management</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'Pending', 'Under Review', 'In Progress', 'Resolved', 'Closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  statusFilter === status
                    ? 'bg-[#3b82f6] text-white'
                    : 'bg-[#0a0b0f] text-gray-300 hover:text-white'
                }`}
              >
                {status === 'all' ? 'All statuses' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1.7fr_1fr_1fr]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search report title, address, category..."
            className="rounded-xl border border-[#2e303a] bg-[#0a0b0f] px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-[#3b82f6] focus:outline-none"
          />

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="rounded-xl border border-[#2e303a] bg-[#0a0b0f] px-3 py-2.5 text-sm text-white focus:border-[#3b82f6] focus:outline-none"
          >
            <option value="all">All priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          <div className="rounded-xl border border-[#2e303a] bg-[#0a0b0f] px-3 py-2.5 text-sm text-gray-300">
            {filteredReports.length} results
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#2e303a] bg-[#14151d] shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-200">
            <thead className="bg-[#0a0b0f] text-xs uppercase tracking-[0.2em] text-gray-400">
              <tr>
                <th className="px-4 py-3">Report</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-gray-400">
                    No matching reports found.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="border-t border-[#2e303a] align-top">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-white">{report.title}</p>
                        <p className="mt-1 text-xs text-gray-400">{report.reportedBy?.name || 'Citizen report'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-300">{report.category}</td>
                    <td className="px-4 py-4 text-gray-300">{report.address || 'Dagupan City'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusColors[report.status] || statusColors.Pending}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${priorityColors[report.priority] || priorityColors.Medium}`}>
                        {report.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-300">
                      {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Link to={`/admin/reports/${report.id}`} className="text-left text-xs text-[#3b82f6] hover:text-[#60a5fa]">
                          Open detail
                        </Link>
                        <select
                          value={report.status}
                          onChange={(event) => updateReportStatus(report.id, event.target.value)}
                          className="rounded-lg border border-[#2e303a] bg-[#0a0b0f] px-2 py-1.5 text-xs text-white focus:border-[#3b82f6] focus:outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Verified">Verified</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this report?')) {
                              deleteReport(report.id);
                            }
                          }}
                          className="text-left text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
