import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { showError, showSuccess } from '../../services/alerts';
import PasswordToggle from '../../components/PasswordToggle';
import useTheme from '../../hooks/useTheme';

const SuperAdminSettings = () => {
  const { user, updateProfile, changePassword, verifyPasswordChange, requestEmailChange, verifyEmailChange } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [emailChangePending, setEmailChangePending] = useState(false);
  const [emailChangeTarget, setEmailChangeTarget] = useState('');
  const [emailChangeCode, setEmailChangeCode] = useState('');
  const [passwordChangePending, setPasswordChangePending] = useState(false);
  const [passwordChangeCode, setPasswordChangeCode] = useState('');
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
      const emailChanged = profile.email.trim().toLowerCase() !== String(user?.email || '').toLowerCase();
      await updateProfile(profile.name, user.email);
      if (emailChanged) {
        await requestEmailChange(profile.email);
        setProfile((current) => ({ ...current, email: profile.email }));
        setEmailChangePending(true);
        setEmailChangeTarget(profile.email);
        setEmailChangeCode('');
        await showSuccess('Name saved. A verification code was sent to your new email address.');
      } else {
        await showSuccess('Profile updated successfully.');
      }
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
      setPasswordChangePending(true);
      setPasswordChangeCode('');
      await showSuccess('A verification code was sent to your account email.');
    } catch (error) {
      await showError(error.message || 'Unable to change password.');
    } finally {
      setSaving(false);
    }
  };

  const verifyEmailChangeCode = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await verifyEmailChange(emailChangeCode);
      setProfile((current) => ({ ...current, email: response.user?.email || emailChangeTarget }));
      setEmailChangePending(false);
      setEmailChangeTarget('');
      setEmailChangeCode('');
      await showSuccess('Email address changed successfully.');
    } catch (error) {
      await showError(error.message || 'Unable to verify the new email.');
    } finally {
      setSaving(false);
    }
  };

  const resendEmailChangeCode = async () => {
    setSaving(true);
    try {
      await requestEmailChange(emailChangeTarget);
      setEmailChangeCode('');
      await showSuccess('A new verification code was sent.');
    } catch (error) {
      await showError(error.message || 'Unable to resend the verification code.');
    } finally {
      setSaving(false);
    }
  };

  const verifyPasswordChangeCode = async (event) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      await showError('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const response = await verifyPasswordChange(passwordChangeCode, passwords.current);
      setPasswords({ current: '', next: '', confirm: '' });
      await showSuccess(response.message || 'Password changed. Please log in again.');
      window.location.href = '/login';
    } catch (error) {
      await showError(error.message || 'Unable to verify the password change.');
    } finally {
      setSaving(false);
    }
  };

  const resendPasswordChangeCode = async () => {
    setSaving(true);
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswordChangeCode('');
      await showSuccess('A new verification code was sent.');
    } catch (error) {
      await showError(error.message || 'Unable to resend the verification code.');
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
            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Email<input type="email" disabled={emailChangePending} value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className={`${inputClass} mt-2`} /></label>
            {!emailChangePending && <button type="submit" disabled={saving} className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save profile</button>}
          </form>
          {emailChangePending && <form onSubmit={verifyEmailChangeCode} className="mt-4 space-y-3"><p className="text-sm text-gray-400">Enter the code sent to {emailChangeTarget}.</p><input aria-label="Email verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={emailChangeCode} onChange={(event) => setEmailChangeCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className={inputClass} placeholder="Verification code" /><div className="flex gap-3"><button disabled={saving || emailChangeCode.length !== 6} className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Verify email</button><button type="button" disabled={saving} onClick={resendEmailChangeCode} className="rounded-lg border border-current px-4 py-2 text-sm">Resend code</button></div></form>}
          <form onSubmit={passwordChangePending ? verifyPasswordChangeCode : savePassword} className={`mt-8 space-y-4 border-t pt-6 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Change password</h2>
            {[
              ['current', 'Current password'],
              ['next', 'New password'],
              ['confirm', 'Confirm new password'],
            ].map(([key, label]) => <div key={key} className="relative"><input type={key === 'current' ? (showCurrentPassword ? 'text' : 'password') : key === 'next' ? (showNewPassword ? 'text' : 'password') : (showConfirmPassword ? 'text' : 'password')} placeholder={label} value={passwords[key]} onChange={(event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))} className={`${inputClass} pr-10`} /><PasswordToggle visible={key === 'current' ? showCurrentPassword : key === 'next' ? showNewPassword : showConfirmPassword} onToggle={() => (key === 'current' ? setShowCurrentPassword : key === 'next' ? setShowNewPassword : setShowConfirmPassword)((value) => !value)} label={label.toLowerCase()} /></div>)}
            {passwordChangePending && <><p className="text-sm text-gray-400">Enter the code sent to your account email. Re-enter your current password above to verify.</p><input aria-label="Password change verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={passwordChangeCode} onChange={(event) => setPasswordChangeCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className={inputClass} placeholder="Verification code" /></>}
            <div className="flex gap-3"><button type="submit" disabled={saving || (passwordChangePending && passwordChangeCode.length !== 6)} className="rounded-lg border border-[#3b82f6] px-4 py-2 text-sm font-semibold text-[#60a5fa] disabled:opacity-50">{passwordChangePending ? 'Verify and change password' : 'Change password'}</button>{passwordChangePending && <button type="button" disabled={saving} onClick={resendPasswordChangeCode} className="rounded-lg border border-current px-4 py-2 text-sm">Resend code</button>}</div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default SuperAdminSettings;
