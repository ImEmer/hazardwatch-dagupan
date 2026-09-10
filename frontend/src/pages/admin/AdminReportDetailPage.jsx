import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useReports } from '../../context/ReportContext';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';
import { REPORT_STATUSES, STATUS_BADGES, STATUS_BADGES_LIGHT } from '../../services/reportOptions';
import { showError } from '../../services/alerts';

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

const AdminReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reports, updateReportStatus, updateReportPriority } = useReports();
  const { token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [fetchedReport, setFetchedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const report = reports.find((item) => String(item._id || item.id) === id) || fetchedReport;
  const photoUrl = report?.photo ? (
    report.photo.startsWith('http://') || report.photo.startsWith('https://')
      ? report.photo
      : report.photo.startsWith('/')
        ? `https://hazardwatch-dagupan.onrender.com${report.photo}`
        : `https://hazardwatch-dagupan.onrender.com/uploads/${report.photo}`
  ) : null;

  useEffect(() => {
    setPhotoLoadError(false);
  }, [id, report?._id, report?.photo]);

  useEffect(() => {
    let cancelled = false;
    const contextReport = reports.find((item) => String(item._id || item.id) === id);
    if (contextReport) {
      setFetchedReport(null);
      setLoading(false);
      return undefined;
    }

    if (!token || !/^[a-f\d]{24}$/i.test(id)) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    api.get(`/reports/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        const body = response.data || {};
        if (!cancelled) setFetchedReport(body.report);
      })
      .catch(() => {
        if (!cancelled) setFetchedReport(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, reports, token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="w-full space-y-3">
              <div className="h-4 w-24 animate-pulse rounded-md bg-[#1a1a1f]" />
              <div className="h-8 w-3/5 animate-pulse rounded-md bg-[#1a1a1f]" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-20 animate-pulse rounded-full bg-[#1a1a1f]" />
              <div className="h-8 w-20 animate-pulse rounded-full bg-[#1a1a1f]" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
            <div className="space-y-4">
              <div className="h-4 w-28 animate-pulse rounded-md bg-[#1a1a1f]" />
              <div className="h-4 w-full animate-pulse rounded-md bg-[#1a1a1f]" />
              <div className="h-4 w-5/6 animate-pulse rounded-md bg-[#1a1a1f]" />
              <div className="h-4 w-2/3 animate-pulse rounded-md bg-[#1a1a1f]" />
              <div className="mt-6 h-52 w-full animate-pulse rounded-xl bg-[#1a1a1f]" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-20 animate-pulse rounded-xl bg-[#1a1a1f]" />
                <div className="h-20 animate-pulse rounded-xl bg-[#1a1a1f]" />
                <div className="h-20 animate-pulse rounded-xl bg-[#1a1a1f]" />
                <div className="h-20 animate-pulse rounded-xl bg-[#1a1a1f]" />
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
            <div className="space-y-4">
              <div className="h-4 w-20 animate-pulse rounded-md bg-[#1a1a1f]" />
              <div className="h-12 w-full animate-pulse rounded-xl bg-[#1a1a1f]" />
              <div className="h-12 w-full animate-pulse rounded-xl bg-[#1a1a1f]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className={`rounded-2xl border p-8 text-center shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Report not found</p>
        <Link to="/admin/reports" className="mt-4 inline-block text-[#3b82f6] hover:text-[#60a5fa]">
          Back to reports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className="w-full">
          <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Report detail</p>
          <h2 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/admin/reports')} className={`text-sm transition ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>Back to Reports</button>
          <div className="flex gap-2">
          <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${(isDark ? STATUS_BADGES : STATUS_BADGES_LIGHT)[report.status] || (isDark ? STATUS_BADGES : STATUS_BADGES_LIGHT).Pending}`}>
            {report.status}
          </span>
          <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${(isDark ? priorityColors : priorityColorsLight)[report.priority] || (isDark ? priorityColors : priorityColorsLight).Medium}`}>
            {report.priority || 'Medium'}
          </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Summary</p>
          <p className={`mt-4 ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{report.description}</p>

          {report.address && (
            <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Location: {report.address}
            </p>
          )}

          {photoUrl && !photoLoadError ? (
            <div className="mt-4">
              <p className={`mb-2 text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Evidence</p>
              <button
                type="button"
                onClick={() => window.open(photoUrl, '_blank', 'noopener,noreferrer')}
                className="inline-block overflow-hidden rounded-lg border border-[#2e303a] bg-[#0a0b0f] p-2 text-left"
                aria-label="Open report evidence in a new tab"
              >
                <img
                  src={photoUrl}
                  alt="Submitted evidence"
                  className="max-h-[200px] w-auto cursor-pointer rounded-md object-contain transition hover:opacity-90"
                  onError={() => setPhotoLoadError(true)}
                />
              </button>
            </div>
          ) : (
            !photoUrl && <p className={`mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>No photo uploaded</p>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className={`rounded-xl border p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Category</p>
              <p className={`mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.category}</p>
            </div>
            <div className={`rounded-xl border p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Location</p>
              <p className={`mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.address || 'Dagupan City'}</p>
            </div>
            <div className={`rounded-xl border p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Reported by</p>
              <p className={`mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.reportedBy?.name || 'Citizen reporter'}</p>
            </div>
            <div className={`rounded-xl border p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Date</p>
              <p className={`mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{new Date(report.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Actions</p>
          <div className="mt-4 space-y-3">
            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
              Status
              <select
                id="status"
                name="status"
                value={report.status}
                onChange={(event) => updateReportStatus(report._id || report.id, event.target.value).catch((error) => showError(error.message || 'Unable to update report status.'))}
                className={`mt-2 w-full rounded-xl border px-3 py-2.5 focus:border-[#3b82f6] focus:outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}
              >
                {REPORT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>

            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
              Priority
              <select
                id="priority"
                name="priority"
                value={report.priority || 'Medium'}
                onChange={(event) => updateReportPriority(report._id || report.id, event.target.value).catch((error) => showError(error.message || 'Unable to update report priority.'))}
                className={`mt-2 w-full rounded-xl border px-3 py-2.5 focus:border-[#3b82f6] focus:outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}
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
