import React, { useEffect, useState } from 'react';
import useTheme from '../../hooks/useTheme';
import useAuth from '../../hooks/useAuth';
import { showError, showSuccess } from '../../services/alerts';
import AccountChangeDialogs from '../../components/settings/AccountChangeDialogs';

const AdminSettingsPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({ name: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfile({ name: user?.name || '' });
  }, [user?.name]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profile.name, user.email);
      await showSuccess('Profile updated successfully.');
    } catch (error) {
      await showError(error.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full rounded-xl border px-3 py-2.5 focus:border-[#3b82f6] focus:outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white placeholder:text-gray-500' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'}`;
  return (
    <div className="mx-auto max-w-3xl">
      <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Profile</p>
        <h2 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Account settings</h2>
        <form onSubmit={saveProfile} className="mt-5 space-y-4">
          <label className="block">
            <span className={`mb-2 block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Full name</span>
            <input id="profileName" name="profileName" autoComplete="name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className={inputClass} />
          </label>
          <div className="block">
            <span className={`mb-2 block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Email</span>
            <p className={inputClass}>{user?.email}</p>
          </div>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save profile</button>
        </form>
        <div className="mt-4"><AccountChangeDialogs mode="email" inputClass={inputClass} isDark={isDark} /></div>
        <div className={`mt-8 border-t pt-6 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Security</h3>
          <div className="mt-4"><AccountChangeDialogs mode="password" inputClass={inputClass} isDark={isDark} /></div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
