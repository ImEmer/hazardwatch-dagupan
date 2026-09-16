import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';
import { showError, showSuccess } from '../../services/alerts';

const statuses = ['Pending', 'In Progress', 'Resolved', 'Closed'];

const BarangayReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [report, setReport] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isDark = theme === 'dark';
  const panel = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const muted = isDark ? 'text-gray-400' : 'text-slate-500';
  const field = `mt-2 block w-full rounded-lg border px-3 py-2 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`;
  const readOnly = ['Resolved', 'Closed'].includes(report?.status);

  useEffect(() => {
    if (!id || !token || !user?.barangay) return undefined;
    let cancelled = false;
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

  const updateStatus = async (event) => {
    if (readOnly) return;
    try {
      const response = await api.patch(`/reports/${id}/status`, { status: event.target.value }, { headers: { Authorization: `Bearer ${token}` } });
      setReport(response.data?.report || report);
      await showSuccess('Report status updated.');
    } catch (requestError) { await showError(requestError.response?.data?.message || requestError.message); }
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    try {
      const response = await api.post(`/reports/${id}/comments`, { text: comment.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setReport(response.data?.report || report);
      setComment('');
      await showSuccess('Comment added.');
    } catch (requestError) { await showError(requestError.response?.data?.message || requestError.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className={`p-8 text-center ${muted}`}>Loading report...</div>;
  if (!report) return <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300"><h1 className="text-2xl font-bold">Report not found</h1><p className="mt-2 text-sm">{error || 'The requested barangay report could not be loaded.'}</p></div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[0.25em] text-[#3b82f6]">{user.barangay} / Report</p><h1 className={`mt-2 text-3xl font-bold ${heading}`}>{report.title || `${report.category || 'Hazard'} report`}</h1></div>
        <button type="button" onClick={() => navigate(report.archived ? '/barangay/archived' : '/barangay/reports')} className="border border-blue-500 bg-transparent px-4 py-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">{report.archived ? 'Back to Archived' : 'Back to Reports'}</button>
      </header>
      <section className={`rounded-2xl border p-6 shadow-xl ${panel}`}>
        <div className="flex flex-wrap gap-2"><span className="rounded-full bg-sky-500/20 px-2.5 py-1 text-xs text-sky-300">{report._id}</span><span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs text-amber-300">{report.status || 'Pending'}</span><span className="rounded-full bg-rose-500/20 px-2.5 py-1 text-xs text-rose-300">{report.priority || 'Medium'} priority</span></div>
        <p className={`mt-5 leading-7 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{report.description || 'No description provided.'}</p>
        <dl className="mt-6 grid gap-4 md:grid-cols-2"><div><dt className={`text-xs uppercase tracking-[0.2em] ${muted}`}>Location</dt><dd className={`mt-2 ${heading}`}>{report.address || 'Dagupan City'}</dd></div><div><dt className={`text-xs uppercase tracking-[0.2em] ${muted}`}>Submitted</dt><dd className={`mt-2 ${heading}`}>{new Date(report.createdAt).toLocaleDateString()}</dd></div></dl>
        {report.photo && <img src={report.photo} alt="Evidence" className="mt-6 max-h-96 w-full rounded-xl object-cover" />}
      </section>
      <section className={`rounded-2xl border p-6 shadow-xl ${panel}`}>
        <h2 className={`text-xl font-semibold ${heading}`}>Report actions</h2>
        {readOnly ? <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">This report is {report.status} and can no longer be edited.</div> : <label className={`mt-4 block text-sm ${muted}`}>Status<select value={report.status || 'Pending'} onChange={updateStatus} className={field}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>}
        <form onSubmit={addComment} className="mt-5"><label className={`block text-sm ${muted}`}>Add comment<textarea value={comment} onChange={(event) => setComment(event.target.value)} rows="4" className={field} /></label><button type="submit" disabled={saving || !comment.trim()} className="mt-3 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Adding...' : 'Add comment'}</button></form>
      </section>
    </div>
  );
};

export default BarangayReportDetail;
