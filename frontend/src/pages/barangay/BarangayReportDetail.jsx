import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';
import Skeleton from '../../components/common/Skeleton';
import { HAZARD_CATEGORY_COLORS, REPORT_STATUSES, STATUS_BADGES, STATUS_BADGES_LIGHT } from '../../services/reportOptions';
import { showError, showSuccess } from '../../services/alerts';

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

const BarangayReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const isDark = theme === 'dark';
  const panel = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const muted = isDark ? 'text-gray-400' : 'text-slate-500';
  const field = `mt-2 w-full rounded-xl border px-3 py-2.5 focus:border-[#3b82f6] focus:outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`;
  const readOnly = ['Resolved', 'Closed'].includes(report?.status);
  const reportSource = location.state?.from || (report?.archived ? 'archived' : report?.status === 'Resolved' ? 'resolved' : 'reports');
  const photoUrl = typeof report?.photo === 'string' && report.photo.trim() ? report.photo.trim() : null;

  useEffect(() => {
    if (!id || !token || !user?.barangay) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    api.get(`/reports/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        const next = response.data?.report;
        const assigned = next?.assignedBarangay || next?.barangay;
        if (!next || String(assigned || '').toLowerCase() !== String(user.barangay).toLowerCase()) throw new Error('Report not found.');
        if (!cancelled) setReport(next);
      })
      .catch((requestError) => { if (!cancelled) { setReport(null); setError(requestError.response?.data?.message || 'Report not found.'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, token, user?.barangay]);

  const updateReport = async (path, value, successMessage) => {
    if (readOnly) return;
    try {
      const response = await api.patch(`/reports/${id}/${path}`, { [path === 'status' ? 'status' : 'priority']: value }, { headers: { Authorization: `Bearer ${token}` } });
      setReport(response.data?.report || report);
      await showSuccess(successMessage);
    } catch (requestError) {
      await showError(requestError.response?.data?.message || requestError.message);
    }
  };

  const backPath = reportSource === 'archived' ? '/barangay/archived' : reportSource === 'resolved' ? '/barangay/reports/resolved' : '/barangay/reports';
  if (loading) return <div className="space-y-6"><div className={`rounded-2xl border p-5 shadow-xl ${panel}`}><Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-8 w-3/5" /></div><div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]"><div className={`rounded-2xl border p-5 shadow-xl ${panel}`}><Skeleton className="h-4 w-28" /><Skeleton className="mt-4 h-4 w-full" /><Skeleton className="mt-2 h-4 w-5/6" /><Skeleton className="mt-6 h-52 w-full rounded-xl" /><div className="mt-6 grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-xl" />)}</div></div><div className={`rounded-2xl border p-5 shadow-xl ${panel}`}><Skeleton className="h-4 w-20" /><Skeleton className="mt-4 h-12 w-full rounded-xl" /><Skeleton className="mt-3 h-12 w-full rounded-xl" /></div></div></div>;
  if (!report) return <div className={`rounded-2xl border p-8 text-center shadow-xl ${panel}`}><p className={`text-lg font-semibold ${heading}`}>Report not found</p><p className={`mt-2 text-sm ${muted}`}>{error || 'The requested barangay report could not be loaded.'}</p><Link to="/barangay/reports" className="mt-4 inline-block text-[#3b82f6] hover:text-[#60a5fa]">Back to reports</Link></div>;

  return <div className="space-y-6"><div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-xl ${panel}`}><div className="w-full"><p className={`text-xs uppercase tracking-[0.25em] ${muted}`}>Report detail</p><h2 className={`mt-2 text-2xl font-bold ${heading}`}>{report.title || `${report.category || 'Hazard'} report`}</h2></div><div className="flex items-center gap-3"><button type="button" onClick={() => navigate(backPath)} className="rounded-lg border border-blue-500 bg-transparent px-4 py-2 text-blue-500 transition-colors hover:bg-blue-500/10">{reportSource === 'archived' ? 'Back to Archived' : reportSource === 'resolved' ? 'Back to Resolved Cases' : 'Back to Reports'}</button><div className="flex gap-2"><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${(isDark ? STATUS_BADGES : STATUS_BADGES_LIGHT)[report.status] || (isDark ? STATUS_BADGES : STATUS_BADGES_LIGHT).Pending}`}>{report.status}</span><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${(isDark ? priorityColors : priorityColorsLight)[report.priority] || (isDark ? priorityColors : priorityColorsLight).Medium}`}>{report.priority || 'Medium'}</span></div></div></div><div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]"><div className={`rounded-2xl border p-5 shadow-xl ${panel}`}><p className={`text-xs uppercase tracking-[0.2em] ${muted}`}>Summary</p><p className={`mt-4 ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{report.description || 'No description provided.'}</p>{report.address && <p className={`mt-4 text-sm ${muted}`}>Location: {report.address}</p>}{photoUrl && !photoLoadError ? <div className="mt-4"><p className={`mb-2 text-xs uppercase tracking-[0.2em] ${muted}`}>Evidence</p><button type="button" onClick={() => window.open(photoUrl, '_blank', 'noopener,noreferrer')} className="inline-block overflow-hidden rounded-lg border border-[#2e303a] bg-[#0a0b0f] p-2 text-left" aria-label="Open report evidence in a new tab"><img src={photoUrl} alt="Submitted evidence" className="max-h-[180px] w-auto cursor-pointer rounded-md object-contain transition hover:opacity-90" onError={() => setPhotoLoadError(true)} /></button></div> : <p className={`mt-4 text-sm ${muted}`}>No photo uploaded</p>}<div className="mt-6 grid gap-4 md:grid-cols-2"><div className={`rounded-xl border p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}><p className={`text-xs uppercase tracking-[0.2em] ${muted}`}>Category</p><p className="mt-2 inline-flex rounded-full px-2 py-1 text-sm font-medium text-white" style={{ backgroundColor: HAZARD_CATEGORY_COLORS[report.category] || '#6b7280' }}>{report.category === 'Other' && report.customCategory ? `Other - ${report.customCategory}` : report.category}</p></div><div className={`rounded-xl border p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}><p className={`text-xs uppercase tracking-[0.2em] ${muted}`}>Location</p><p className={`mt-2 ${heading}`}>{report.address || 'Dagupan City'}</p></div><div className={`rounded-xl border p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-50 bg-slate-50'}`}><p className={`text-xs uppercase tracking-[0.2em] ${muted}`}>Reported by</p><p className={`mt-2 ${heading}`}>{report.reportedBy?.name || 'Citizen reporter'}</p></div><div className={`rounded-xl border p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}><p className={`text-xs uppercase tracking-[0.2em] ${muted}`}>Date</p><p className={`mt-2 ${heading}`}>{new Date(report.createdAt).toLocaleString()}</p></div></div></div><div className={`rounded-2xl border p-5 shadow-xl ${panel}`}><p className={`text-xs uppercase tracking-[0.2em] ${muted}`}>Actions</p><div className="mt-4 space-y-3">{readOnly && <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">This report is {report.status} and can no longer be edited.</div>}{!readOnly && <><label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Status<select value={report.status} onChange={(event) => updateReport('status', event.target.value, 'Report status updated.')} className={field}>{REPORT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label><label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Priority<select value={report.priority || 'Medium'} onChange={(event) => updateReport('priority', event.target.value, 'Report priority updated.')} className={field}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label></>}</div></div></div></div>;
};

export default BarangayReportDetail;
