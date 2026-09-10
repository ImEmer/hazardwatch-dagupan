import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
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

const MyReportsPage = () => {
  const { token, user, isAuthenticated, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
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
    return <main className={`flex min-h-screen items-center justify-center px-4 pb-16 pt-28 ${isDark ? 'bg-[#0a0b0f] text-gray-400' : 'bg-slate-100 text-slate-500'}`}>Loading session...</main>;
  }

  if (!isAuthenticated) {
    return (
      <main className={`flex min-h-screen items-center justify-center px-4 pb-16 pt-28 ${isDark ? 'bg-[#0a0b0f] text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div data-aos="fade-up" className={`w-full max-w-md rounded-2xl border p-8 text-center shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
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
    <main className={`min-h-screen px-4 pb-16 pt-28 ${isDark ? 'bg-[#0a0b0f] text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className="mx-auto max-w-6xl space-y-6">
        <header data-aos="fade-up">
          <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-[#60a5fa]' : 'text-blue-700'}`}>Citizen portal</p>
          <h1 className="mt-2 text-3xl font-bold">My Reports</h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Review the hazards you have submitted and follow their status.</p>
        </header>
        <div data-aos="fade-up" data-aos-delay="100" className={`flex flex-col gap-3 rounded-2xl border p-4 md:flex-row ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports" className={`auth-input flex-1 ${isDark ? '' : 'border-slate-200 bg-slate-50 text-slate-900'}`} />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={`auth-input md:max-w-xs ${isDark ? '' : 'border-slate-200 bg-slate-50 text-slate-900'}`}>
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
          <div data-aos="fade-up" className={`rounded-2xl border p-10 text-center ${isDark ? 'border-[#2e303a] bg-[#14151d] text-gray-400' : 'border-slate-200 bg-white text-slate-500'}`}>No reports found.</div>
        ) : (
          <div data-aos="fade-up" data-aos-delay="150" className="space-y-3">
            {filteredReports.map((report) => {
              const reportId = report._id || report.id;
              const reportTitle = report.title || report.description || `${report.category || 'Hazard'} report`;
              const formattedDate = report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date';

              return (
                <Link key={reportId} to={`/reports/${reportId}`} className={`block rounded-2xl border transition ${isDark ? 'border-[#2e303a] bg-[#14151d] hover:border-[#3b82f6]/40 hover:bg-[#171a22]' : 'border-slate-200 bg-white hover:border-[#3b82f6]/40 hover:bg-slate-50'}`}>
                  <article data-aos="fade-up" className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{reportTitle}</h2>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${statusStyles[report.status] || statusStyles.Pending}`}>{report.status || 'Pending'}</span>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${priorityStyles[report.priority] || priorityStyles.Medium}`}>{report.priority || 'Medium'}</span>
                    </div>

                    <div className={`mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.15em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      <span>{report.category || 'General hazard'}</span>
                      <span>•</span>
                      <span>{formattedDate}</span>
                    </div>

                    <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{report.description || 'No description provided.'}</p>

                    {report.address && (
                      <p className={`mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Location: {report.address}</p>
                    )}
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyReportsPage;
