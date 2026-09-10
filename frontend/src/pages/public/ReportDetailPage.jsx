import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import useTheme from '../../hooks/useTheme';
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

const normalizePhotoUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  if (photo.startsWith('/')) return `https://hazardwatch-dagupan.onrender.com${photo}`;
  return `https://hazardwatch-dagupan.onrender.com/uploads/${photo}`;
};

const ReportDetailPage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <main className={`min-h-screen px-4 pb-16 pt-28 ${isDark ? 'bg-[#0a0b0f] text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className={`h-4 w-24 animate-pulse rounded-md ${isDark ? 'bg-[#1a1a1f]' : 'bg-slate-200'}`} />
          <div className={`h-8 w-64 animate-pulse rounded-md ${isDark ? 'bg-[#1a1a1f]' : 'bg-slate-200'}`} />
          <div className={`rounded-2xl border p-6 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
            <div className={`h-4 w-full animate-pulse rounded-md ${isDark ? 'bg-[#1a1a1f]' : 'bg-slate-200'}`} />
            <div className={`mt-4 h-4 w-5/6 animate-pulse rounded-md ${isDark ? 'bg-[#1a1a1f]' : 'bg-slate-200'}`} />
            <div className={`mt-6 h-48 w-full animate-pulse rounded-xl ${isDark ? 'bg-[#1a1a1f]' : 'bg-slate-200'}`} />
          </div>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className={`min-h-screen px-4 pb-16 pt-28 ${isDark ? 'bg-[#0a0b0f] text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className={`mx-auto max-w-xl rounded-2xl border p-8 text-center ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <h1 className="text-2xl font-bold">Report not found</h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>This report could not be found in your account.</p>
          <Link to="/my-reports" className="mt-6 inline-flex rounded-lg bg-[#3b82f6] px-4 py-2 font-semibold text-white hover:bg-[#2563eb]">
            Back to My Reports
          </Link>
        </div>
      </main>
    );
  }

  const photoUrl = normalizePhotoUrl(report.photo);
  const formattedDate = report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date';

  return (
    <main className="min-h-screen bg-[#0a0b0f] px-4 pb-16 pt-28 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <div className="w-full">
            <button
              type="button"
              onClick={() => navigate('/my-reports')}
              className="mb-3 inline-flex items-center text-sm font-medium text-[#3b82f6] hover:text-[#60a5fa]"
            >
              ← Back to My Reports
            </button>
            <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-[#60a5fa]' : 'text-blue-700'}`}>Report detail</p>
            <h1 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title || 'Hazard report'}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${statusStyles[report.status] || statusStyles.Pending}`}>{report.status || 'Pending'}</span>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${priorityStyles[report.priority] || priorityStyles.Medium}`}>{report.priority || 'Medium'}</span>
          </div>
        </div>

        <div className={`rounded-2xl border p-6 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{report.category || 'General hazard'} · {formattedDate}</p>
              <p className={`mt-4 text-base leading-7 ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{report.description || 'No description provided.'}</p>

              {report.address && (
                <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Location: {report.address}</p>
              )}
            </div>

            <div className={`space-y-3 rounded-2xl border p-4 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}>
              <div>
                <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Category</p>
                <p className={`mt-2 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.category || 'General hazard'}</p>
              </div>
              <div>
                <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Status</p>
                <p className={`mt-2 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.status || 'Pending'}</p>
              </div>
              <div>
                <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Priority</p>
                <p className={`mt-2 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.priority || 'Medium'}</p>
              </div>
              <div>
                <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Date</p>
                <p className={`mt-2 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{formattedDate}</p>
              </div>
            </div>
          </div>

          {photoUrl && (
            <div className="mt-6">
              <p className={`mb-3 text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Evidence</p>
              <a href={photoUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-300 bg-slate-100 p-2">
                <img
                  src={photoUrl}
                  alt="Report evidence"
                  className="max-h-80 w-full rounded-lg object-contain"
                  onError={(event) => {
                    event.target.style.display = 'none';
                  }}
                />
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ReportDetailPage;
