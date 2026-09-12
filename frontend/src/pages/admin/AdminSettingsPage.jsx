import React, { useEffect, useState } from 'react';
import useTheme from '../../hooks/useTheme';
import useAuth from '../../hooks/useAuth';
import { showError, showSuccess } from '../../services/alerts';

const AdminSettingsPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    weeklySummary: true,
  });
  const { user, updateProfile, changePassword } = useAuth();
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setProfile({ name: user?.name || '', email: user?.email || '' });
  }, [user?.name, user?.email]);
  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profile.name, profile.email);
      await showSuccess('Profile updated successfully.');
    } catch (error) {
      await showError(error.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };
  const savePassword = async (event) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      await showError('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      await showSuccess('Password changed successfully.');
    } catch (error) {
      await showError(error.message || 'Unable to change password.');
    } finally {
      setSaving(false);
    }
  };
  const inputClass = `w-full rounded-xl border px-3 py-2.5 focus:border-[#3b82f6] focus:outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white placeholder:text-gray-500' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'}`;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Profile</p>
        <h2 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Account settings</h2>
        <form onSubmit={saveProfile} className="mt-5 space-y-4">
          <label className="block">
            <span className={`mb-2 block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Full name</span>
            <input id="profileName" name="profileName" autoComplete="name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className={inputClass} />
          </label>
          <label className="block">
            <span className={`mb-2 block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Email</span>
            <input id="profileEmail" name="profileEmail" autoComplete="email" type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className={inputClass} />
          </label>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save profile</button>
        </form>
        <form onSubmit={savePassword} className={`mt-8 space-y-4 border-t pt-6 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Change password</h3>
          {[
            ['current', 'Current password'],
            ['next', 'New password'],
            ['confirm', 'Confirm new password'],
          ].map(([key, label]) => <input key={key} type="password" placeholder={label} autoComplete={key === 'current' ? 'current-password' : 'new-password'} value={passwords[key]} onChange={(event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))} className={inputClass} />)}
          <button type="submit" disabled={saving} className="rounded-lg border border-[#3b82f6] px-4 py-2 text-sm font-semibold text-[#60a5fa] disabled:opacity-50">Change password</button>
        </form>
      </div>
      <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Preferences</p>
        <h2 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h2>
        <div className="mt-5 space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className={`flex items-center justify-between rounded-xl border px-3 py-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}>
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Receive platform updates and alerts</p>
              </div>
              <button type="button" onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))} className={`relative h-6 w-11 rounded-full transition ${value ? 'bg-[#3b82f6]' : isDark ? 'bg-[#2e303a]' : 'bg-slate-300'}`} aria-label={key}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${value ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
