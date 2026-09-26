import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import useTheme from '../../hooks/useTheme';

const PAGE_SIZE = 20;
const reportId = (report) => String(report?._id || report?.id || '');

const MapReportList = ({ endpoint, token, includeResolved = false, status, selectedReport, onSelectReport }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const selectedId = reportId(selectedReport);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get(endpoint, {
      params: {
        page,
        limit: PAGE_SIZE,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeResolved: includeResolved ? 'true' : 'false',
        ...(status && status !== 'all' ? { status } : {}),
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
    }).then(({ data }) => {
      const newestFirst = [...(data.reports || [])].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
      setReports(newestFirst);
      setPagination(data.pagination || { pages: 1, total: newestFirst.length });
    }).catch((requestError) => {
      if (requestError.code !== 'ERR_CANCELED') setError(requestError.response?.data?.message || 'Unable to load reports.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [endpoint, includeResolved, page, status, token]);

  useEffect(() => {
    if (selectedId) listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedId]);

  const visibleReports = useMemo(() => {
    if (!selectedId) return reports;
    const selected = reports.find((report) => reportId(report) === selectedId) || selectedReport;
    return [selected, ...reports.filter((report) => reportId(report) !== selectedId)];
  }, [reports, selectedId, selectedReport]);

  return (
    <section className={`flex min-h-0 flex-col overflow-hidden rounded-lg border ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`} aria-label="Reports">
      <header className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
        <div><h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports</h2><p className={`mt-0.5 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{pagination.total || 0} reports · newest first</p></div>
        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{page} / {Math.max(1, pagination.pages || 1)}</span>
      </header>
      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
        {loading && <p className={`py-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Loading reports...</p>}
        {!loading && error && <p role="alert" className="py-6 text-center text-sm text-red-500">{error}</p>}
        {!loading && !error && visibleReports.length === 0 && <p className={`py-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No reports found.</p>}
        {!loading && !error && visibleReports.map((report) => {
          const id = reportId(report);
          const selected = id === selectedId;
          return <button key={id} type="button" onClick={() => onSelectReport?.(report)} className={`w-full rounded-md border p-3 text-left transition ${selected ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30' : isDark ? 'border-[#2e303a] bg-[#0e0f14] hover:border-slate-500' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
            <span className="flex items-start justify-between gap-2"><span className={`line-clamp-2 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title || `${report.category || 'Hazard'} report`}</span><span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${report.status === 'Resolved' ? 'bg-emerald-500/15 text-emerald-500' : report.status === 'In Progress' ? 'bg-blue-500/15 text-blue-500' : 'bg-amber-500/15 text-amber-500'}`}>{report.status || 'Pending'}</span></span>
            <span className={`mt-1 block text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{report.category || 'Uncategorized'} · {report.address || report.barangay || 'Dagupan City'}</span>
            <time className={`mt-1 block text-[11px] ${isDark ? 'text-gray-500' : 'text-slate-400'}`} dateTime={report.createdAt}>{report.createdAt ? new Date(report.createdAt).toLocaleString() : ''}</time>
          </button>;
        })}
      </div>
      <footer className={`flex items-center justify-between border-t px-3 py-2 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
        <button type="button" aria-label="Previous reports page" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className={`rounded p-1.5 disabled:opacity-40 ${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}><ChevronLeft size={16} /></button>
        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Page {page}</span>
        <button type="button" aria-label="Next reports page" disabled={page >= (pagination.pages || 1) || loading} onClick={() => setPage((current) => current + 1)} className={`rounded p-1.5 disabled:opacity-40 ${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}><ChevronRight size={16} /></button>
      </footer>
    </section>
  );
};

export default MapReportList;