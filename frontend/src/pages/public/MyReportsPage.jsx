import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { showError } from '../../services/alerts';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { SkeletonReportCard } from '../../components/common/Skeleton';

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

const MyReportsPage = () => {
  const { token, user, isAuthenticated, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({ duration: 800, easing: 'ease-in-out', once: true });
    AOS.refresh();
  }, []);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let cancelled = false;

    const loadReports = async () => {
      try {
        let response;
        try {
          response = await api.get('/reports/mine', { headers: { Authorization: `Bearer ${token}` } });
        } catch (error) {
          if (error.response?.status !== 404) throw error;
          response = await api.get('/reports', {
            params: { email: user?.email || '' },
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        const body = response?.data || {};
        const reportList = Array.isArray(body.reports) ? body.reports : Array.isArray(body.data) ? body.data : [];
        const filteredReports = user?.email
          ? reportList.filter((report) => {
              const reporterEmail = report.reportedBy?.email || report.email || report.user?.email;
              return !reporterEmail || reporterEmail.toLowerCase() === user.email.toLowerCase();
            })
          : reportList;

        if (!cancelled) setReports(filteredReports);
      } catch (error) {
        if (!cancelled) showError(error.message);
      } finally {
        if (!cancelled) {
          setLoading(false);
          AOS.refresh();
        }
      }
    };

    loadReports();
    return () => { cancelled = true; };
  }, [token, user?.email]);

  const filteredReports = useMemo(() => reports.filter((report) => {
    const matchesStatus = status === 'all' || report.status === status;
    const matchesSearch = (report.title || '').toLowerCase().includes(search.toLowerCase())
      || (report.category || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  }), [reports, search, status]);

  if (authLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#0a0b0f] px-4 pb-16 pt-28 text-gray-400">Loading session...</main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0b0f] px-4 pb-16 pt-28 text-white">
        <div data-aos="fade-up" className="w-full max-w-md rounded-2xl border border-[#2e303a] bg-[#14151d] p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#3b82f6]/10 text-[#60a5fa]" aria-hidden="true">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10" width="14" height="10" rx="2" /><path strokeLinecap="round" d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          </div>
          <h1 className="text-2xl font-bold">You must log in first</h1>
          <p className="mt-2 text-gray-400">Please log in to view your submitted reports.</p>
          <Link to="/login" state={{ from: '/my-reports' }} className="mt-6 inline-flex rounded-lg bg-[#3b82f6] px-5 py-2.5 font-semibold text-white transition hover:bg-[#2563eb]">Go to Login</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0b0f] px-4 pb-16 pt-28 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <header data-aos="fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">Citizen portal</p>
          <h1 className="mt-2 text-3xl font-bold">My Reports</h1>
          <p className="mt-2 text-gray-400">Review the hazards you have submitted and follow their status.</p>
        </header>
        <div data-aos="fade-up" data-aos-delay="100" className="flex flex-col gap-3 rounded-2xl border border-[#2e303a] bg-[#14151d] p-4 md:flex-row">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports" className="auth-input flex-1" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="auth-input md:max-w-xs">
            <option value="all">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        {loading ? (
          <div data-aos="fade-up" className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonReportCard key={index} />
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div data-aos="fade-up" className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-10 text-center text-gray-400">No reports found.</div>
        ) : (
          <div data-aos="fade-up" data-aos-delay="150" className="space-y-3">
            {filteredReports.map((report) => {
              const reportId = report._id || report.id;
              const isSelected = selectedId === reportId;
              const photoUrl = normalizePhotoUrl(report.photo);
              const reportTitle = report.title || report.description || `${report.category || 'Hazard'} report`;
              const formattedDate = report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date';

              return (
                <article key={reportId} data-aos="fade-up" className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-white">{reportTitle}</h2>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${statusStyles[report.status] || statusStyles.Pending}`}>{report.status || 'Pending'}</span>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${priorityStyles[report.priority] || priorityStyles.Medium}`}>{report.priority || 'Medium'}</span>
                      </div>

                      <p className="mt-2 text-sm text-gray-400">{report.category || 'General hazard'} · {formattedDate}</p>
                      <p className="mt-3 text-sm leading-6 text-gray-200">{report.description || 'No description provided.'}</p>

                      {report.address && (
                        <p className="mt-3 text-sm text-gray-400">Location: {report.address}</p>
                      )}
                    </div>

                    <div className="w-full md:max-w-xs">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Report evidence"
                          className="max-h-48 w-full cursor-pointer rounded-lg border border-[#2e303a] object-contain hover:opacity-90 transition"
                          onClick={() => window.open(photoUrl, '_blank', 'noopener,noreferrer')}
                        />
                      ) : (
                        <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-[#2e303a] text-sm text-gray-500">
                          No photo uploaded
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#2e303a] pt-4">
                    <button type="button" onClick={() => setSelectedId(isSelected ? null : reportId)} className="text-sm font-medium text-[#60a5fa] hover:text-white">
                      {isSelected ? 'Hide details' : 'View details'}
                    </button>
                    <Link to={`/reports/${reportId}`} className="text-sm font-medium text-[#60a5fa] hover:text-white">
                      Open report
                    </Link>
                  </div>

                  {isSelected && (
                    <div className="mt-4 space-y-2 border-t border-[#2e303a] pt-4 text-sm text-gray-300">
                      <p><span className="font-medium text-white">Category:</span> {report.category || 'Unspecified'}</p>
                      <p><span className="font-medium text-white">Status:</span> {report.status || 'Pending'}</p>
                      <p><span className="font-medium text-white">Priority:</span> {report.priority || 'Medium'}</p>
                      <p><span className="font-medium text-white">Date:</span> {formattedDate}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyReportsPage;
