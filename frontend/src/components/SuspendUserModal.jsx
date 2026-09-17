import React, { useEffect, useState } from 'react';

const initialForm = { duration: '7', customDate: '', reason: '' };

const SuspendUserModal = ({ isOpen, isDark, targetUser, currentUser, userName, onClose, onConfirm, saving = false }) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !targetUser || String(targetUser.id || targetUser._id) === String(currentUser?._id || currentUser?.id) || targetUser.role === 'superadmin') return null;
  const inputClass = `mt-1 w-full rounded-lg border px-3 py-2 outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`;
  const submit = async (event) => {
    event.preventDefault();
    if (form.reason.trim().length < 10) {
      setError('Reason must be at least 10 characters.');
      return;
    }
    if (form.duration === 'custom' && !form.customDate) {
      setError('Choose a suspension end date.');
      return;
    }
    setError('');
    await onConfirm({ durationInDays: form.duration === 'custom' ? 'custom' : Number(form.duration), suspendedUntil: form.customDate, reason: form.reason.trim() });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={submit} className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${isDark ? 'border-[#2e303a] bg-[#14151d] text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-500/15 p-2 text-amber-400" aria-hidden="true"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.8L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.8a2 2 0 00-3.4 0z" /></svg></div>
          <div><h2 className="text-xl font-bold">Suspend User</h2><p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Suspend {userName}'s account</p></div>
        </div>
        <label className="mt-5 block text-sm">Duration<select value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))} className={inputClass}><option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="30">30 days</option><option value="custom">Custom</option></select></label>
        {form.duration === 'custom' && <label className="mt-4 block text-sm">Suspension end date<input type="date" min={new Date().toISOString().slice(0, 10)} value={form.customDate} onChange={(event) => setForm((current) => ({ ...current, customDate: event.target.value }))} className={inputClass} /></label>}
        <label className="mt-4 block text-sm">Reason<textarea required minLength={10} maxLength={500} rows="4" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} className={inputClass} placeholder="Explain why this account is being suspended." /><span className={`mt-1 block text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{form.reason.length}/500</span></label>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <p className={`mt-4 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>This user will not be able to log in until the suspension expires.</p>
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className={`rounded-lg border px-4 py-2 text-sm ${isDark ? 'border-[#2e303a] text-gray-300' : 'border-slate-300 text-slate-600'}`}>Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60">{saving ? 'Suspending...' : 'Suspend User'}</button></div>
      </form>
    </div>
  );
};

export default SuspendUserModal;
