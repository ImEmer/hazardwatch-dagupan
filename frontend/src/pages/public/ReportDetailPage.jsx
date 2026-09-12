import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { showError } from '../../services/alerts';

const statusStyles = {
  Pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  'In Progress': 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  Resolved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Closed: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

const priorityStyles = {
  Low: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
  Medium: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  High: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  Urgent: 'bg-red-500/10 text-red-300 border-red-500/30',
};

const ReportDetailPage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoLoadError, setPhotoLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchReport = async () => {
      if (!token) {
        setReport(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/reports/mine', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = Array.isArray(response?.data?.reports) ? response.data.reports : [];
        const found = list.find((item) => String(item._id || item.id) === String(id));
        if (!cancelled) setReport(found || null);
      } catch (error) {
        if (!cancelled) {
          setReport(null);
          showError(error.message || 'Unable to load this report.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReport();
    return () => { cancelled = true; };
  }, [id, token]);

  useEffect(() => {
    setPhotoLoadError(false);
  }, [id, report?.photo]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0b0f] px-4 pb-16 pt-28 text-white">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-4 w-24 animate-pulse rounded-md bg-[#1a1a1f]" />
          <div className="h-8 w-64 animate-pulse rounded-md bg-[#1a1a1f]" />
          <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6">
            <div className="h-4 w-full animate-pulse rounded-md bg-[#1a1a1f]" />
            <div className="mt-4 h-4 w-5/6 animate-pulse rounded-md bg-[#1a1a1f]" />
            <div className="mt-6 h-48 w-full animate-pulse rounded-xl bg-[#1a1a1f]" />
          </div>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen bg-[#0a0b0f] px-4 pb-16 pt-28 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#2e303a] bg-[#14151d] p-8 text-center">
          <h1 className="text-2xl font-bold">Report not found</h1>
          <p className="mt-2 text-gray-400">This report could not be found in your account.</p>
          <Link to="/my-reports" className="mt-6 inline-flex rounded-lg bg-[#3b82f6] px-4 py-2 font-semibold text-white hover:bg-[#2563eb]">
            Back to My Reports
          </Link>
        </div>
      </main>
    );
  }

  const photoUrl = typeof report.photo === 'string' && report.photo.trim() ? report.photo.trim() : null;
  const formattedDate = report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date';

  return (
    <main className="min-h-screen bg-[#0a0b0f] px-4 pb-16 pt-28 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2e303a] bg-[#14151d] p-5">
          <div className="w-full">
            <button
              type="button"
              onClick={() => navigate('/my-reports')}
              className="mb-3 inline-flex items-center text-sm font-medium text-[#3b82f6] hover:text-[#60a5fa]"
            >
              ← Back to My Reports
            </button>
            <p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">Report detail</p>
            <h1 className="mt-2 text-3xl font-bold text-white">{report.title || 'Hazard report'}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${statusStyles[report.status] || statusStyles.Pending}`}>{report.status || 'Pending'}</span>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${priorityStyles[report.priority] || priorityStyles.Medium}`}>{report.priority || 'Medium'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm text-gray-400">{report.category || 'General hazard'} · {formattedDate}</p>
              <p className="mt-4 text-base leading-7 text-gray-200">{report.description || 'No description provided.'}</p>

              {report.address && (
                <p className="mt-4 text-sm text-gray-400">Location: {report.address}</p>
              )}

              {photoUrl && !photoLoadError ? (
                <div className="mt-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-400">Evidence</p>
                  <button
                    type="button"
                    onClick={() => window.open(photoUrl, '_blank', 'noopener,noreferrer')}
                    className="inline-block overflow-hidden rounded-lg border border-[#2e303a] bg-[#0a0b0f] p-2 text-left"
                    aria-label="Open report evidence in a new tab"
                  >
                    <img
                      src={photoUrl}
                      alt="Report evidence"
                      className="max-h-[180px] w-auto cursor-pointer rounded-md object-contain transition hover:opacity-90"
                      onError={() => setPhotoLoadError(true)}
                    />
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">No photo uploaded</p>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-[#2e303a] bg-[#0a0b0f] p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Category</p>
                <p className="mt-2 font-medium text-white">{report.category || 'General hazard'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Status</p>
                <p className="mt-2 font-medium text-white">{report.status || 'Pending'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Priority</p>
                <p className="mt-2 font-medium text-white">{report.priority || 'Medium'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Date</p>
                <p className="mt-2 font-medium text-white">{formattedDate}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default ReportDetailPage;
