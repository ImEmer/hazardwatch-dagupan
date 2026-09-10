import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { showError } from '../../services/alerts';
import AOS from 'aos';
import 'aos/dist/aos.css';

const statusStyles = {
  Pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  'In Progress': 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  Resolved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Closed: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
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
          <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-10 text-center text-gray-400">Loading your reports...</div>
        ) : filteredReports.length === 0 ? (
          <div data-aos="fade-up" className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-10 text-center text-gray-400">No reports found.</div>
        ) : (
          <div data-aos="fade-up" data-aos-delay="150" className="space-y-3">
            {filteredReports.map((report) => {
              const reportId = report._id || report.id;
              const isSelected = selectedId === reportId;
              return (
                <article key={reportId} data-aos="fade-up" className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5">
                  <button type="button" onClick={() => setSelectedId(isSelected ? null : reportId)} className="w-full text-left">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="font-semibold text-white">{report.title || `${report.category} report`}</h2>
                        <p className="mt-1 text-sm text-gray-400">{report.category} · {new Date(report.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-1 text-xs ${statusStyles[report.status] || statusStyles.Pending}`}>{report.status}</span>
                        <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-xs text-orange-300">{report.priority || 'Medium'}</span>
                      </div>
                    </div>
                  </button>
                  {isSelected && <div className="mt-4 border-t border-[#2e303a] pt-4 text-sm text-gray-300"><p>{report.description}</p><p className="mt-2 text-gray-400">{report.address || 'Location recorded on the map.'}</p></div>}
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
