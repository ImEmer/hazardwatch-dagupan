import React, { useEffect, useState } from 'react';
import { ShieldOff } from 'lucide-react';

const BanUserModal = ({ isOpen, isDark, targetUser, saving = false, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen, targetUser]);

  if (!isOpen || !targetUser) return null;
  const inputClass = `mt-1 w-full rounded-lg border px-3 py-2 outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={(event) => { event.preventDefault(); onConfirm(reason.trim()); }} className={`w-full max-w-lg rounded-xl border p-6 shadow-2xl ${isDark ? 'border-[#2e303a] bg-[#14151d] text-white' : 'border-slate-200 bg-white text-slate-900'}`} role="dialog" aria-modal="true" aria-labelledby="ban-user-title">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-500/15 p-2 text-red-400" aria-hidden="true"><ShieldOff size={20} /></div>
          <div><h2 id="ban-user-title" className="text-xl font-bold">Ban permanently</h2><p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Ban {targetUser.email} permanently? They will not be able to log in.</p></div>
        </div>
        <label className={`mt-5 block text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Reason (optional)<textarea maxLength={500} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className={inputClass} /></label>
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} disabled={saving} className={`rounded-lg border px-4 py-2 text-sm disabled:opacity-50 ${isDark ? 'border-[#2e303a] text-gray-300' : 'border-slate-300 text-slate-600'}`}>Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60">{saving ? 'Banning...' : 'Ban Permanently'}</button></div>
      </form>
    </div>
  );
};

export default BanUserModal;