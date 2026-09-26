import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import useTheme from '../../hooks/useTheme';
import api, { preferencesApi } from '../../services/api';
import PasswordToggle from '../PasswordToggle';
import SettingsSection from './SettingsSection';
import SettingsToggle from './SettingsToggle';

const DEFAULT_MAP_PREFERENCES = {
  showResolved: false,
  defaultZoom: 13,
  mapStyle: 'streets',
  markerStyle: 'circle',
};

const UserSettingsModal = ({ user, onClose, onSaved }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = user?._id || user?.id;
  const [account, setAccount] = useState({ name: user?.name || '', email: user?.email || '' });
  const [mapPreferences, setMapPreferences] = useState(DEFAULT_MAP_PREFERENCES);
  const [savedMapPreferences, setSavedMapPreferences] = useState(DEFAULT_MAP_PREFERENCES);
  const [password, setPassword] = useState({ next: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({ next: false, confirm: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const inputClass = `w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${isDark ? 'border-[#343640] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`;
  const actionButton = 'rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50';
  const cancelButton = `rounded-md border px-3 py-2 text-sm font-medium ${isDark ? 'border-[#343640] text-gray-300 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`;

  useEffect(() => {
    let active = true;
    setAccount({ name: user?.name || '', email: user?.email || '' });
    setLoading(true);
    preferencesApi.getForUser(userId).then(({ data }) => {
      if (active) {
        const saved = { ...DEFAULT_MAP_PREFERENCES, ...data.preferences?.map };
        setMapPreferences(saved);
        setSavedMapPreferences(saved);
      }
    }).catch((error) => {
      if (active) toast.error(error.response?.data?.message || 'Unable to load user settings.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [userId]);

  const saveAccount = async (event) => {
    event.preventDefault();
    setSaving('account');
    try {
      await api.put(`/users/${userId}`, { name: account.name, email: account.email, role: user.role, barangay: user.barangay || '' });
      toast.success('Account details saved.');
      onSaved?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update account details.');
    } finally { setSaving(''); }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (password.next !== password.confirm) return toast.error('New passwords do not match.');
    setSaving('password');
    try {
      await preferencesApi.updatePassword(userId, password.next);
      setPassword({ next: '', confirm: '' });
      toast.success('Password updated.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update password.');
    } finally { setSaving(''); }
  };

  const saveMapPreferences = async () => {
    setSaving('map');
    try {
      await preferencesApi.updateForUser(userId, { map: mapPreferences });
      setSavedMapPreferences(mapPreferences);
      toast.success('Map preferences saved.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save map preferences.');
    } finally { setSaving(''); }
  };

  const resetMapPreferences = () => setMapPreferences(savedMapPreferences);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="user-settings-title" className={`max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border p-4 shadow-2xl sm:p-6 ${isDark ? 'border-[#2e303a] bg-[#0f1016] text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}>
        <header className="mb-5 flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">User management</p><h2 id="user-settings-title" className="mt-1 text-xl font-bold">Settings for {user.name}</h2></div>
          <button type="button" onClick={onClose} className={cancelButton}>Close</button>
        </header>

        <div className="space-y-4">
          <SettingsSection title="Account" description="Update this user’s contact details. Role and barangay are read-only here." actions={<><button type="button" onClick={() => setAccount({ name: user.name || '', email: user.email || '' })} className={cancelButton}>Cancel</button><button form="managed-account-form" type="submit" disabled={saving === 'account'} className={actionButton}>{saving === 'account' ? 'Saving...' : 'Save account'}</button></>}>
            <form id="managed-account-form" onSubmit={saveAccount} className="grid gap-3 sm:grid-cols-2">
              <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Full name<input required minLength={2} maxLength={50} value={account.name} onChange={(event) => setAccount((current) => ({ ...current, name: event.target.value }))} className={`${inputClass} mt-1.5`} /></label>
              <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Email<input required type="email" value={account.email} onChange={(event) => setAccount((current) => ({ ...current, email: event.target.value }))} className={`${inputClass} mt-1.5`} /></label>
              <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Role<span className={`mt-1.5 block rounded-md border px-3 py-2 capitalize ${isDark ? 'border-[#343640] bg-[#0a0b0f] text-gray-400' : 'border-slate-200 bg-white text-slate-500'}`}>{user.role}</span></div>
              {user.barangay && <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Barangay<span className={`mt-1.5 block rounded-md border px-3 py-2 ${isDark ? 'border-[#343640] bg-[#0a0b0f] text-gray-400' : 'border-slate-200 bg-white text-slate-500'}`}>{user.barangay}</span></div>}
            </form>
          </SettingsSection>

          <SettingsSection title="Security" description="Set a new password for this account. It must contain at least 8 characters, uppercase and lowercase letters, and a number." actions={<><button type="button" onClick={() => setPassword({ next: '', confirm: '' })} className={cancelButton}>Cancel</button><button form="managed-password-form" type="submit" disabled={saving === 'password'} className={actionButton}>{saving === 'password' ? 'Saving...' : 'Update password'}</button></>}>
            <form id="managed-password-form" onSubmit={savePassword} className="grid gap-3 sm:grid-cols-2">
              {[
                ['next', 'New password'],
                ['confirm', 'Confirm new password'],
              ].map(([key, label]) => <label key={key} className={`block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{label}<span className="relative mt-1.5 block"><input required minLength={8} type={showPassword[key] ? 'text' : 'password'} autoComplete="new-password" value={password[key]} onChange={(event) => setPassword((current) => ({ ...current, [key]: event.target.value }))} className={`${inputClass} pr-11`} /><PasswordToggle visible={showPassword[key]} onToggle={() => setShowPassword((current) => ({ ...current, [key]: !current[key] }))} label={label.toLowerCase()} /></span></label>)}
            </form>
          </SettingsSection>

          <SettingsSection title="Map Preferences" description="Configure how this user’s map displays reports." actions={<><button type="button" onClick={resetMapPreferences} className={cancelButton}>Cancel</button><button type="button" onClick={saveMapPreferences} disabled={loading || saving === 'map'} className={actionButton}>{saving === 'map' ? 'Saving...' : 'Save map preferences'}</button></>}>
            {loading ? <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Loading preferences...</p> : <div className="space-y-4">
              <SettingsToggle label="Show resolved reports" checked={mapPreferences.showResolved} onChange={(showResolved) => setMapPreferences((current) => ({ ...current, showResolved }))} />
              <div className="grid gap-3 sm:grid-cols-3">
                <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Default zoom<input type="number" min="1" max="18" value={mapPreferences.defaultZoom} onChange={(event) => setMapPreferences((current) => ({ ...current, defaultZoom: Number(event.target.value) }))} className={`${inputClass} mt-1.5`} /></label>
                <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Map style<select value={mapPreferences.mapStyle} onChange={(event) => setMapPreferences((current) => ({ ...current, mapStyle: event.target.value }))} className={`${inputClass} mt-1.5`}><option value="streets">Streets</option><option value="satellite">Satellite</option><option value="terrain">Terrain</option></select></label>
                <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Hazard marker style<select value={mapPreferences.markerStyle} onChange={(event) => setMapPreferences((current) => ({ ...current, markerStyle: event.target.value }))} className={`${inputClass} mt-1.5`}><option value="circle">Circle</option><option value="pin">Pin</option><option value="danger">Danger</option></select></label>
              </div>
            </div>}
          </SettingsSection>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsModal;