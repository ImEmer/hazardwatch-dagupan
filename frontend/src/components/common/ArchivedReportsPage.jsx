import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';
import { confirmAction, showError, showSuccess } from '../../services/alerts';
import Pagination from './Pagination';
import Skeleton from './Skeleton';

const PAGE_SIZE = 10;

const ArchivedReportsPage = ({ basePath = '/admin' }) => {
  const { token, user } = useAuth();
  const { theme } = useTheme();
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const isDark = theme === 'dark';
  const isBarangay = user?.role === 'barangay';
  const panel = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';
  const rowBorder = isDark ? 'border-[#2e303a]' : 'border-slate-200';
  const reportIds = reports.map((report) => String(report._id));
  const allSelected = reportIds.length > 0 && reportIds.every((id) => selectedIds.includes(id));
  const columnCount = isBarangay ? 4 : 5;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.get('/reports/archived', { params: { page, limit: PAGE_SIZE }, headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        if (cancelled) return;
        const nextPagination = response.data?.pagination || { page, limit: PAGE_SIZE, total: 0, pages: 1 };
        if (page > Math.max(1, nextPagination.pages || 1)) {
          setPage(Math.max(1, nextPagination.pages || 1));
          return;
        }
        setReports(response.data?.reports || []);
        setPagination(nextPagination);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setReports([]);
          setError(requestError.response?.data?.message || 'Unable to load archived reports.');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, reloadKey, token]);

  const togglePageSelection = (checked) => {
    setSelectedIds((current) => checked
      ? [...new Set([...current, ...reportIds])]
      : current.filter((id) => !reportIds.includes(id)));
  };

  const deleteSelected = async () => {
    if (!selectedIds.length || deleting) return;
    const selectedCount = selectedIds.length;
    const result = await confirmAction(
      `Delete ${selectedCount} report${selectedCount === 1 ? '' : 's'} permanently? This cannot be undone.`,
      'Delete permanently'
    );
    if (!result.isConfirmed) return;

    setDeleting(true);
    try {
      const response = await api.delete('/reports/bulk', {
        data: { reportIds: selectedIds },
        headers: { Authorization: `Bearer ${token}` },
      });
      const deletedCount = Number(response.data?.deletedCount ?? selectedCount);
      setSelectedIds([]);
      setReloadKey((current) => current + 1);
      window.dispatchEvent(new Event('hw:reports-updated'));
      await showSuccess('Reports deleted', `${deletedCount} report${deletedCount === 1 ? '' : 's'} deleted.`);
    } catch (requestError) {
      await showError('Delete failed', requestError.response?.data?.message || 'Unable to delete selected reports.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className={`rounded-2xl border p-5 shadow-xl ${panel}`}>
        <p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">{isBarangay ? `${user?.barangay || 'Barangay'} retention` : 'Retention'}</p>
        <h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Archived reports</h1>
        <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Closed reports remain here until permanently deleted.</p>
      </section>

      <section className={`overflow-hidden rounded-2xl border shadow-xl ${panel}`}>
        <div className={`flex items-center justify-between gap-3 border-b p-4 ${rowBorder}`}>
          <label className={`inline-flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
            <input type="checkbox" aria-label="Select all reports on this page" checked={allSelected} disabled={loading || !reports.length || deleting} onChange={(event) => togglePageSelection(event.target.checked)} />
            Select all on this page
          </label>
          <button type="button" onClick={deleteSelected} disabled={!selectedIds.length || deleting} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
            <Trash2 size={16} aria-hidden="true" /> {deleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className={`min-w-full text-left text-sm ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>
            <thead className={isDark ? 'bg-[#0a0b0f] text-gray-400' : 'bg-slate-100 text-slate-500'}>
              <tr><th className="w-10 px-4 py-3" aria-label="Select" /><th className="px-4 py-3">Report</th>{!isBarangay && <th className="px-4 py-3">Barangay</th>}<th className="px-4 py-3">Closed</th><th className="px-4 py-3">Action</th></tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, index) => <tr key={index} className={`border-t ${rowBorder}`}>{Array.from({ length: columnCount }).map((__, columnIndex) => <td key={columnIndex} className="px-4 py-4"><Skeleton className="h-5 w-3/4" /></td>)}</tr>)
                : error ? <tr><td colSpan={columnCount} className="p-10 text-center text-red-400">{error}</td></tr>
                  : !reports.length ? <tr><td colSpan={columnCount} className="p-10 text-center">No archived reports.</td></tr>
                    : reports.map((report) => {
                      const id = String(report._id);
                      return <tr key={id} className={`border-t ${rowBorder}`}>
                        <td className="px-4 py-4"><input type="checkbox" aria-label={`Select ${report.title || 'report'}`} checked={selectedIds.includes(id)} disabled={deleting} onChange={() => setSelectedIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id])} /></td>
                        <td className="px-4 py-4 font-medium">{report.title || `${report.category} report`}</td>
                        {!isBarangay && <td className="px-4 py-4">{report.assignedBarangay || report.barangay || '-'}</td>}
                        <td className="px-4 py-4">{report.archivedAt ? new Date(report.archivedAt).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-4"><Link to={`${basePath}/reports/${id}`} state={{ from: 'archived' }} className="text-[#3b82f6] hover:text-[#60a5fa]">View</Link></td>
                      </tr>;
                    })}
            </tbody>
          </table>
        </div>
      </section>
      <Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={(nextPage) => { setSelectedIds([]); setPage(nextPage); }} isDark={isDark} />
    </div>
  );
};

export default ArchivedReportsPage;