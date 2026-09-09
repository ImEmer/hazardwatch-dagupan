import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { confirmAction, showError, showSuccess } from '../../services/alerts';

const ProfilePage = () => {
  const { user, updateProfile, changePassword, deleteAccount, logout } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profile.name, profile.email);
      await showSuccess('Profile updated successfully.');
    } catch (error) {
      await showError(error.message);
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
      await showError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeAccount = async () => {
    const result = await confirmAction('This permanently deletes your account and cannot be undone.', 'Delete account');
    if (!result.isConfirmed) return;
    try {
      await deleteAccount();
      await showSuccess('Your account has been deleted.');
      await logout();
    } catch (error) {
      await showError(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0b0f] px-4 pb-16 pt-28 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <header><p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">Account</p><h1 className="mt-2 text-3xl font-bold">Profile & Settings</h1></header>
        <section className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6">
          <p className="text-sm text-gray-400">Role</p><p className="mt-1 font-semibold capitalize">{user?.role}</p>
          <form onSubmit={saveProfile} className="mt-6 space-y-4">
            <label className="block text-sm text-gray-300">Name<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="auth-input mt-2" /></label>
            <label className="block text-sm text-gray-300">Email<input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} className="auth-input mt-2" /></label>
            <button disabled={saving} className="auth-button md:w-auto md:px-6">Save profile</button>
          </form>
        </section>
        <section className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6">
          <h2 className="text-xl font-semibold">Change password</h2>
          <form onSubmit={savePassword} className="mt-5 space-y-4">
            <input type="password" placeholder="Current password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} className="auth-input" />
            <input type="password" placeholder="New password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} className="auth-input" />
            <input type="password" placeholder="Confirm new password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} className="auth-input" />
            <button disabled={saving} className="auth-button md:w-auto md:px-6">Change password</button>
          </form>
        </section>
        <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="text-xl font-semibold text-red-300">Delete account</h2><p className="mt-2 text-sm text-gray-400">This removes your account permanently.</p>
          <button type="button" onClick={removeAccount} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">Delete account</button>
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;
