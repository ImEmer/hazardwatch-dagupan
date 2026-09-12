import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useReports } from '../../context/ReportContext';
import useTheme from '../../hooks/useTheme';
import { HAZARD_CATEGORIES, HAZARD_CATEGORY_COLORS, REPORT_STATUSES, STATUS_BADGES, STATUS_BADGES_LIGHT } from '../../services/reportOptions';
import { confirmAction, showError, showSuccess } from '../../services/alerts';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

const PAGE_SIZE = 10;

const priorityColors = {
  Low: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  Medium: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  High: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  Urgent: 'bg-red-500/10 text-red-300 border-red-500/30',
};

const priorityColorsLight = {
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Urgent: 'bg-red-50 text-red-700 border-red-200',
};

const AdminReportsPage = () => {
  const { reports, updateReportStatus, deleteReport } = useReports();
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const isLoading = reports.length === 0;
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [barangayFilter, setBarangayFilter] = useState(searchParams.get('barangay') || 'all');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [page, setPage] = useState(1);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch = [report.title, report.category, report.address || '', report.description]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;
      const matchesBarangay = barangayFilter === 'all' || (report.assignedBarangay || report.barangay) === barangayFilter;
      const createdAt = new Date(report.createdAt).getTime();
      const matchesStart = !startDate || createdAt >= new Date(startDate).getTime();
      const matchesEnd = !endDate || createdAt <= new Date(`${endDate}T23:59:59`).getTime();

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesBarangay && matchesStart && matchesEnd;
    });
  }, [reports, search, statusFilter, priorityFilter, categoryFilter, barangayFilter, startDate, endDate]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, categoryFilter, barangayFilter, startDate, endDate, sortBy]);

  useEffect(() => {
    const next = {};
    [['search', search], ['status', statusFilter], ['priority', priorityFilter], ['category', categoryFilter], ['barangay', barangayFilter], ['startDate', startDate], ['endDate', endDate], ['sortBy', sortBy]].forEach(([key, value]) => { if (value && value !== 'all' && value !== 'newest') next[key] = value; });
    setSearchParams(next, { replace: true });
  }, [search, statusFilter, priorityFilter, categoryFilter, barangayFilter, startDate, endDate, sortBy, setSearchParams]);

  const pageCount = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const sortedReports = [...filteredReports].sort((a, b) => sortBy === 'oldest' ? new Date(a.createdAt) - new Date(b.createdAt) : sortBy === 'priority' ? String(b.priority).localeCompare(String(a.priority)) : sortBy === 'status' ? String(a.status).localeCompare(String(b.status)) : new Date(b.createdAt) - new Date(a.createdAt));
  const visibleReports = sortedReports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const barangays = [...new Set(reports.map((report) => report.assignedBarangay || report.barangay).filter(Boolean))].sort();

  const resetFilters = () => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setCategoryFilter('all'); setBarangayFilter('all'); setStartDate(''); setEndDate(''); setSortBy('newest'); };
  const exportCsv = async () => {
    try {
      const params = { search, status: statusFilter === 'all' ? undefined : statusFilter, category: categoryFilter === 'all' ? undefined : categoryFilter, priority: priorityFilter === 'all' ? undefined : priorityFilter, barangay: barangayFilter === 'all' ? undefined : barangayFilter, startDate: startDate || undefined, endDate: endDate || undefined };
      const response = await api.get('/reports/export', { params, responseType: 'blob', headers: { Authorization: `Bearer ${token}` } });
      const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = `hazardwatch-reports-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url); await showSuccess('Reports exported successfully.');
    } catch (error) { await showError(error.response?.data?.message || 'Unable to export reports.'); }
  };

  const handleDelete = async (report) => {
    const result = await confirmAction(`Delete "${report.title}"? This action cannot be undone.`, 'Delete');
    if (!result.isConfirmed) return;
    try {
      await deleteReport(report.id || report._id, token);
    } catch (error) {
      await showError(error.message || 'Unable to delete the report.');
    }
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-4 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Operational queue</p>
            <h2 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports management</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-[#3b82f6] px-3 py-2 text-sm font-medium text-[#60a5fa] hover:bg-[#3b82f6]/10"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>Export CSV</button>
            {['all', ...REPORT_STATUSES].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  statusFilter === status
                    ? 'bg-[#3b82f6] text-white'
                    : isDark
                      ? 'bg-[#0a0b0f] text-gray-300 hover:text-white'
                      : 'bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                {status === 'all' ? 'All statuses' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            id="reportSearch"
            name="reportSearch"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search report title, address, category..."
            className={`rounded-xl border px-3 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#3b82f6] focus:outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}
          />

          <select
            id="priorityFilter"
            name="priorityFilter"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className={`rounded-xl border px-3 py-2.5 text-sm focus:border-[#3b82f6] focus:outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}
          >
            <option value="all">All priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          <select
            id="categoryFilter"
            name="categoryFilter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className={`rounded-xl border px-3 py-2.5 text-sm focus:border-[#3b82f6] focus:outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}
          >
            <option value="all">All categories</option>
            {HAZARD_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>

          <div className={`rounded-xl border px-3 py-2.5 text-sm ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-gray-300' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
            {filteredReports.length} results
          </div>
          <select value={barangayFilter} onChange={(event) => setBarangayFilter(event.target.value)} className={`rounded-xl border px-3 py-2.5 text-sm ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}><option value="all">All barangays</option>{barangays.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}</select>
          <label className="text-xs text-gray-400">From<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`} /></label>
          <label className="text-xs text-gray-400">To<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`} /></label>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className={`rounded-xl border px-3 py-2.5 text-sm ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="priority">Priority</option><option value="status">Status</option></select>
          <button type="button" onClick={resetFilters} className="rounded-xl border border-[#2e303a] px-3 py-2.5 text-sm text-gray-400 hover:text-white">Reset Filters</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{[[search, `Search: ${search}`, () => setSearch('')], [statusFilter !== 'all' && statusFilter, statusFilter, () => setStatusFilter('all')], [categoryFilter !== 'all' && categoryFilter, categoryFilter, () => setCategoryFilter('all')], [priorityFilter !== 'all' && priorityFilter, priorityFilter, () => setPriorityFilter('all')], [barangayFilter !== 'all' && barangayFilter, barangayFilter, () => setBarangayFilter('all')], [startDate, `From: ${startDate}`, () => setStartDate('')], [endDate, `To: ${endDate}`, () => setEndDate('')]].filter(([value]) => value).map(([value, label, remove]) => <button type="button" key={label} onClick={remove} className="rounded-full bg-[#3b82f6]/10 px-2.5 py-1 text-xs text-[#60a5fa]">{label} ×</button>)}</div>
      </div>

      <div className={`overflow-hidden rounded-2xl border shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className={`min-w-full table-fixed text-left text-sm ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[11%]" />
            </colgroup>
            <thead className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'bg-[#0a0b0f] text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
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
              {isLoading ? (
                Array.from({ length: 6 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className={`border-t align-middle ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
                    {Array.from({ length: 7 }).map((__, colIndex) => (
                      <td key={`${rowIndex}-${colIndex}`} className="px-4 py-3">
                        <div className="h-5 animate-pulse rounded-md bg-[#1a1a1f]" style={{ width: colIndex === 0 ? '80%' : colIndex === 1 ? '60%' : colIndex === 2 ? '90%' : colIndex === 3 ? '70%' : colIndex === 4 ? '70%' : colIndex === 5 ? '60%' : '50%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-gray-400">
                    No matching reports found.
                  </td>
                </tr>
              ) : (
                visibleReports.map((report) => (
                  <tr key={report._id || report.id} className={`border-t align-top ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
                    <td className="px-4 py-4">
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title}</p>
                        <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{report.reportedBy?.name || 'Citizen report'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4"><span className="inline-flex rounded-full px-2 py-1 text-xs font-medium text-white" style={{ backgroundColor: HAZARD_CATEGORY_COLORS[report.category] || '#6b7280' }}>{report.category}</span></td>
                    <td className={`max-w-0 truncate px-4 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`} title={report.address || 'Dagupan City'}>{report.address || 'Dagupan City'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-xs font-medium ${(isDark ? STATUS_BADGES : STATUS_BADGES_LIGHT)[report.status] || (isDark ? STATUS_BADGES : STATUS_BADGES_LIGHT).Pending}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-xs font-medium ${(isDark ? priorityColors : priorityColorsLight)[report.priority] || (isDark ? priorityColors : priorityColorsLight).Medium}`}>
                        {report.priority || 'Medium'}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDelete(report)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                            aria-label={`Delete ${report.title}`}
                            title="Delete report"
                          >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16m-10 4v6m4-6v6M9 7V4h6v3m-9 0l1 13h10l1-13" />
                            </svg>
                          </button>
                          <Link to={`/admin/reports/${report._id || report.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#3b82f6] transition hover:bg-[#3b82f6]/10 hover:text-[#60a5fa]" aria-label={`Open details for ${report.title}`} title="Open details">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" />
                            </svg>
                          </Link>
                        </div>
                        <select
                          id={`status-${report._id || report.id}`}
                          name={`status-${report._id || report.id}`}
                          value={report.status}
                          onChange={(event) => updateReportStatus(report.id || report._id, event.target.value).catch((error) => showError(error.message || 'Unable to update report status.'))}
                          className={`rounded-lg border px-2 py-1.5 text-xs focus:border-[#3b82f6] focus:outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between px-1 py-3">
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Page {page} of {pageCount}</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className={`px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`} aria-label="Previous page">&lt;</button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button type="button" key={pageNumber} onClick={() => setPage(pageNumber)} className={`px-2 py-1.5 text-sm ${page === pageNumber ? 'font-bold text-[#3b82f6]' : isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}>{pageNumber}</button>
          ))}
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className={`px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`} aria-label="Next page">&gt;</button>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
