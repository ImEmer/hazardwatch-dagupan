import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { useReports } from '../../context/ReportContext';

const PRIORITY_STYLES = {
  Urgent: 'border-red-500/30 bg-red-500/10 text-red-300',
  High: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  Medium: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  Low: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
};

const STATUS_STYLES = {
  Pending: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  'In Progress': 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  Resolved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  Closed: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
};

const BarangayReportsPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { reports } = useReports();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const barangayReports = useMemo(() => {
    const assignedBarangay = user?.barangay;
    if (!assignedBarangay) return [];

    return reports.filter((report) => {
      const sameBarangay = report.assignedBarangay === assignedBarangay || report.barangay === assignedBarangay;
      return sameBarangay;
    });
  }, [reports, user?.barangay]);

  const filteredReports = useMemo(() => {
    const query = search.toLowerCase();

    return barangayReports.filter((report) => {
      const matchesSearch = [report.title, report.category, report.address || '', report.description || '']
        .join(' ')
        .toLowerCase()
        .includes(query);

      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || (report.priority || 'Medium') === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [barangayReports, priorityFilter, search, statusFilter]);

  const isDark = theme === 'dark';
  const fieldClass = isDark
    ? 'border-[#2e303a] bg-[#0a0b0f] text-white placeholder:text-gray-500'
    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400';
  const panelClass = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';
  const headingClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      <section className={`rounded-2xl border p-5 shadow-xl ${panelClass}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#3b82f6]">Barangay queue</p>
            <h1 className={`mt-2 text-3xl font-bold ${headingClass}`}>Reports for {user?.barangay || 'Barangay'}</h1>
          </div>
          <div className="text-sm text-[#3b82f6]">{filteredReports.length} matching reports</div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, category, or location"
            className={`rounded-xl border px-3 py-2.5 text-sm focus:border-[#3b82f6] focus:outline-none ${fieldClass}`}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`rounded-xl border px-3 py-2.5 text-sm focus:border-[#3b82f6] focus:outline-none ${fieldClass}`}
          >
            <option value="all">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className={`rounded-xl border px-3 py-2.5 text-sm focus:border-[#3b82f6] focus:outline-none ${fieldClass}`}
          >
            <option value="all">All priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </section>

      <section className={`rounded-2xl border shadow-xl ${panelClass}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className={isDark ? 'bg-[#0a0b0f] text-gray-400' : 'bg-slate-50 text-slate-500'}>
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="6" className={`px-5 py-10 text-center ${mutedClass}`}>
                    No reports match your filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const reportId = report._id || report.id;
                  const statusClass = STATUS_STYLES[report.status] || STATUS_STYLES.Pending;
                  const priority = report.priority || 'Medium';
                  const priorityClass = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium;

                  return (
                    <tr key={reportId} className={`border-t ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
                      <td className={`px-5 py-4 font-medium ${headingClass}`}>{report.title || 'Untitled report'}</td>
                      <td className={`px-5 py-4 ${mutedClass}`}>{report.category || 'General'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClass}`}>
                          {report.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${priorityClass}`}>
                          {priority}
                        </span>
                      </td>
                      <td className={`max-w-xs truncate px-5 py-4 ${mutedClass}`} title={report.address || 'Dagupan City'}>
                        {report.address || 'Dagupan City'}
                      </td>
                      <td className="px-5 py-4">
                        <Link to={`/barangay/reports/${reportId}`} className="text-sm font-medium text-[#3b82f6] hover:text-[#60a5fa]">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default BarangayReportsPage;
