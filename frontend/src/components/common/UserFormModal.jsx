import React from 'react';

const UserFormModal = ({ isOpen, isDark, form, roleOptions, barangayOptions = [], isCreating = true, roleNote, onChange, onClose, onSubmit, saving = false }) => {
  if (!isOpen) return null;
  const inputClass = `mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`;
  const barangayCreation = isCreating && form.role === 'barangay';
  const adminCreation = isCreating && form.role === 'admin';
  const roleLocked = roleOptions.length === 1;
  const barangayField = form.role === 'barangay' && (
    <label className="block text-sm">
      <span>Barangay</span>
      <select required value={form.barangay} onChange={(event) => onChange('barangay', event.target.value)} className={inputClass}>
        <option value="">Select barangay</option>
        {barangayOptions.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}
      </select>
    </label>
  );
  const showRoleFields = roleLocked || Boolean(form.role);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <form onSubmit={onSubmit} className={`my-auto w-full max-w-lg rounded-2xl border p-6 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{isCreating ? 'Add user' : 'Edit user'}</h3>
          <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-white">Close</button>
        </div>
        <div className="space-y-4">
          {!roleLocked && (
            <label className="block text-sm">
              <span>Role</span>
              <select required value={form.role} onChange={(event) => onChange('role', event.target.value)} className={inputClass}>
                <option value="" disabled className="text-gray-400">Select role...</option>
                {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          )}
          {showRoleFields && roleNote && <p className="text-sm text-amber-500">{roleNote}</p>}
          {showRoleFields && barangayCreation && barangayField}
          {showRoleFields && (
          <>
          <label className="block text-sm">
            <span>Full name</span>
            <input required value={form.name} onChange={(event) => onChange('name', event.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span>Email</span>
            <input required type="email" value={form.email} onChange={(event) => onChange('email', event.target.value)} className={inputClass} />
          </label>
          {isCreating && !barangayCreation && !adminCreation && (
            <label className="block text-sm">
              <span>Password</span>
              <input required type="password" minLength="8" maxLength={72} value={form.password} onChange={(event) => onChange('password', event.target.value)} className={inputClass} />
            </label>
          )}
          {adminCreation && (
            <div className="space-y-1 text-sm">
              <p>Default password: <span className="font-semibold" aria-readonly="true">{form.password}</span></p>
              <p className="text-amber-500">User must change password on first login.</p>
            </div>
          )}
          {barangayCreation && (
            <div className="space-y-1 text-sm">
              <p>Default password: <span className="font-semibold">Barangay@123</span></p>
              <p className="text-amber-500">User must change password on first login.</p>
            </div>
          )}
          {roleLocked && <label className="block text-sm"><span>Role</span><input value={roleOptions[0].label} readOnly className={inputClass} /></label>}
          {!barangayCreation && barangayField}
          </>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#2e303a] px-4 py-2 text-sm text-gray-300">Cancel</button>
          <button type="submit" disabled={saving || !showRoleFields} className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isCreating ? 'Create user' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  );
};

export default UserFormModal;
