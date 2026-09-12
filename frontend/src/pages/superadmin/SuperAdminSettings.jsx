import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { showError, showSuccess } from '../../services/alerts';

const SuperAdminSettings = () => {
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

  const inputClass = 'w-full rounded-xl border border-[#2e303a] bg-[#0a0b0f] px-3 py-2.5 text-white placeholder:text-gray-500';

  return (
    <main className="min-h-screen bg-[#0a0b0f] px-4 pb-10 pt-24 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-8 shadow-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">Super Admin</p>
          <h1 className="mt-3 text-3xl font-bold">Account settings</h1>
        </div>
        <form onSubmit={saveProfile} className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 shadow-xl">
          <h2 className="text-xl font-semibold">Profile</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm text-gray-300">Full name<input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className={`${inputClass} mt-2`} /></label>
            <label className="block text-sm text-gray-300">Email<input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className={`${inputClass} mt-2`} /></label>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold disabled:opacity-50">Save profile</button>
          </div>
        </form>
        <form onSubmit={savePassword} className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 shadow-xl">
          <h2 className="text-xl font-semibold">Change password</h2>
          <div className="mt-5 space-y-4">
            {[
              ['current', 'Current password'],
              ['next', 'New password'],
              ['confirm', 'Confirm new password'],
            ].map(([key, label]) => <input key={key} type="password" placeholder={label} value={passwords[key]} onChange={(event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))} className={inputClass} />)}
            <button type="submit" disabled={saving} className="rounded-lg border border-[#3b82f6] px-4 py-2 text-sm font-semibold text-[#60a5fa] disabled:opacity-50">Change password</button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default SuperAdminSettings;
