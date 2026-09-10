import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { useReports } from '../../context/ReportContext';
import api from '../../services/api';
import { showError, showSuccess } from '../../services/alerts';

const statusOptions = ['Pending', 'In Progress', 'Resolved', 'Closed'];

const BarangayReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { theme } = useTheme();
  const { reports, fetchReports, updateReportStatus } = useReports();
  const [comment, setComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchedReport, setFetchedReport] = useState(null);

  const report = useMemo(
    () => reports.find((item) => String(item._id || item.id) === id) || fetchedReport,
    [fetchedReport, id, reports]
  );

  const isDark = theme === 'dark';
  const panelClass = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';
  const headingClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';
  const fieldClass = isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white placeholder:text-gray-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400';

  useEffect(() => {
    if (!id || (reports.length && reports.some((item) => String(item._id || item.id) === id))) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadReport = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/reports/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const body = response.data || {};
        if (isMounted) setFetchedReport(body.report || null);
      } catch (error) {
        if (isMounted) setFetchedReport(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadReport();
    return () => {
      isMounted = false;
    };
  }, [id, reports, token]);

  const handleStatusChange = async (event) => {
    try {
      await updateReportStatus(id, event.target.value);
      await showSuccess('Report status updated.');
    } catch (error) {
      await showError(error.message || 'Unable to update report status.');
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;

    setSavingComment(true);
    try {
      const response = await api.post(`/reports/${id}/comments`, { text: comment.trim() }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = response.data || {};
      if (!body) throw new Error(body.message || 'Unable to add comment.');

      setComment('');
      await fetchReports();
      await showSuccess('Comment added.');
    } catch (error) {
      await showError(error.message || 'Unable to add comment.');
    } finally {
      setSavingComment(false);
    }
  };

  if (loading) {
    return <div className={`min-h-screen px-4 py-8 text-center ${isDark ? 'bg-[#0a0b0f] text-gray-400' : 'bg-slate-100 text-slate-500'}`}>Loading report...</div>;
  }

  if (!report) {
    return (
      <div className={`min-h-screen px-4 py-8 ${isDark ? 'bg-[#0a0b0f] text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/40 bg-red-500/5 p-6 shadow-xl">
          <h1 className="text-2xl font-bold">Report not found</h1>
          <p className="mt-3 text-sm text-red-400">The requested barangay report could not be loaded.</p>
          <Link to="/barangay/dashboard" className="mt-4 inline-block rounded-lg bg-[#3b82f6] px-4 py-2 text-white hover:bg-[#2563eb]">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0b0f] text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 lg:px-6">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigate('/barangay/dashboard')} className={`text-sm font-medium ${mutedClass} hover:text-[#3b82f6]`}>
            ← Back to dashboard
          </button>
          <span className="text-sm text-[#3b82f6]">Barangay report detail</span>
        </div>

        <section className={`rounded-2xl border p-6 shadow-xl ${panelClass}`}>
          <p className="text-xs uppercase tracking-[0.25em] text-[#3b82f6]">{report.category || 'General'}</p>
          <h1 className={`mt-3 text-3xl font-bold ${headingClass}`}>{report.title || 'Untitled report'}</h1>
          <p className={`mt-4 leading-7 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{report.description || 'No description provided.'}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <p className={`text-xs uppercase tracking-[0.2em] ${mutedClass}`}>Location</p>
              <p className={`mt-2 ${headingClass}`}>{report.address || 'Dagupan City'}</p>
            </div>
            <div>
              <p className={`text-xs uppercase tracking-[0.2em] ${mutedClass}`}>Submitted</p>
              <p className={`mt-2 ${headingClass}`}>
                {new Date(report.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {report.photo && (
            <div className="mt-6">
              <img src={report.photo} alt="Evidence" className="max-h-96 w-full rounded-xl border border-slate-200 object-cover" />
            </div>
          )}
        </section>

        <section className={`rounded-2xl border p-6 shadow-xl ${panelClass}`}>
          <h2 className={`text-xl font-semibold ${headingClass}`}>Update report</h2>

          <div className="mt-4">
            <label className={`block text-sm ${mutedClass}`}>
              Status
              <select value={report.status || 'Pending'} onChange={handleStatusChange} className={`mt-2 block w-full rounded-lg border px-3 py-2 ${fieldClass}`}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5">
            <label className={`block text-sm ${mutedClass}`}>
              Add comment
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows="4"
                placeholder="Write an update for this report"
                className={`mt-2 block w-full rounded-lg border px-3 py-2 ${fieldClass}`}
              />
            </label>
            <button
              type="button"
              onClick={handleCommentSubmit}
              disabled={savingComment || !comment.trim()}
              className="mt-3 rounded-lg bg-[#3b82f6] px-4 py-2 font-semibold text-white hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingComment ? 'Adding...' : 'Add comment'}
            </button>
          </div>
        </section>

        <section className={`rounded-2xl border p-6 shadow-xl ${panelClass}`}>
          <h2 className={`text-xl font-semibold ${headingClass}`}>Comments</h2>
          {report.comments?.length ? (
            <div className="mt-4 space-y-3">
              {report.comments.map((item, index) => (
                <div key={item._id || `${item.authorName || 'staff'}-${index}`} className="rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/5 p-4">
                  <p className={isDark ? 'text-gray-200' : 'text-slate-700'}>{item.text}</p>
                  <p className={`mt-2 text-xs ${mutedClass}`}>
                    {item.authorName || 'Barangay staff'} · {new Date(item.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className={`mt-4 text-sm ${mutedClass}`}>No comments yet.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default BarangayReportDetail;
