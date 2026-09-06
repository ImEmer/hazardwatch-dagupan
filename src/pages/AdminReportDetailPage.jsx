import React from 'react';
import { Link, useParams } from 'react-router-dom';
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

const AdminReportDetailPage = () => {
  const { id } = useParams();
  const { reports, updateReportStatus } = useReports();
  const report = reports.find((item) => item.id === id);

  if (!report) {
    return (
      <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-8 text-center shadow-xl">
        <p className="text-lg font-semibold text-white">Report not found</p>
        <Link to="/admin/reports" className="mt-4 inline-block text-[#3b82f6] hover:text-[#60a5fa]">
          Back to reports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2e303a] bg-[#14151d] p-4 shadow-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Report detail</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{report.title}</h2>
        </div>
        <div className="flex gap-2">
          <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusColors[report.status] || statusColors.Pending}`}>
            {report.status}
          </span>
          <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${priorityColors[report.priority] || priorityColors.Medium}`}>
            {report.priority || 'Medium'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5 shadow-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Summary</p>
          <p className="mt-4 text-gray-200">{report.description}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[#2e303a] bg-[#0a0b0f] p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Category</p>
              <p className="mt-2 text-white">{report.category}</p>
            </div>
            <div className="rounded-xl border border-[#2e303a] bg-[#0a0b0f] p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Location</p>
              <p className="mt-2 text-white">{report.address || 'Dagupan City'}</p>
            </div>
            <div className="rounded-xl border border-[#2e303a] bg-[#0a0b0f] p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Reported by</p>
              <p className="mt-2 text-white">{report.reportedBy?.name || 'Citizen reporter'}</p>
            </div>
            <div className="rounded-xl border border-[#2e303a] bg-[#0a0b0f] p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Date</p>
              <p className="mt-2 text-white">{new Date(report.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5 shadow-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Actions</p>
          <div className="mt-4 space-y-3">
            <label className="block text-sm text-gray-300">
              Status
              <select
                id="status"
                name="status"
                value={report.status}
                onChange={(event) => updateReportStatus(report.id, event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#2e303a] bg-[#0a0b0f] px-3 py-2.5 text-white focus:border-[#3b82f6] focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Verified">Verified</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </label>

            <label className="block text-sm text-gray-300">
              Priority
              <select
                id="priority"
                name="priority"
                value={report.priority || 'Medium'}
                className="mt-2 w-full rounded-xl border border-[#2e303a] bg-[#0a0b0f] px-3 py-2.5 text-white focus:border-[#3b82f6] focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportDetailPage;
