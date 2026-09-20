import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { showError, showSuccess } from '../../services/alerts';
import PasswordToggle from '../../components/PasswordToggle';
import useTheme from '../../hooks/useTheme';

const SuperAdminSettings = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  const panel = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';

  return (
    <main className={`min-h-screen px-4 pb-10 ${isDark ? 'bg-[#0a0b0f] text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className={`rounded-2xl border p-8 shadow-xl ${panel}`}>
          <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Super Admin</p>
          <h1 className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Account settings</h1>
        </div>
        <div className={`rounded-2xl border p-6 shadow-xl ${panel}`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Profile</h2>
          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Full name<input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className={`${inputClass} mt-2`} /></label>
            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Email<input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className={`${inputClass} mt-2`} /></label>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save profile</button>
          </form>
          <form onSubmit={savePassword} className={`mt-8 space-y-4 border-t pt-6 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Change password</h2>
            {[
              ['current', 'Current password'],
              ['next', 'New password'],
              ['confirm', 'Confirm new password'],
            ].map(([key, label]) => <div key={key} className="relative"><input type={key === 'current' ? (showCurrentPassword ? 'text' : 'password') : key === 'next' ? (showNewPassword ? 'text' : 'password') : (showConfirmPassword ? 'text' : 'password')} placeholder={label} value={passwords[key]} onChange={(event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))} className={`${inputClass} pr-10`} /><PasswordToggle visible={key === 'current' ? showCurrentPassword : key === 'next' ? showNewPassword : showConfirmPassword} onToggle={() => (key === 'current' ? setShowCurrentPassword : key === 'next' ? setShowNewPassword : setShowConfirmPassword)((value) => !value)} label={label.toLowerCase()} /></div>)}
            <button type="submit" disabled={saving} className="rounded-lg border border-[#3b82f6] px-4 py-2 text-sm font-semibold text-[#60a5fa] disabled:opacity-50">Change password</button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default SuperAdminSettings;
