import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { showError, showSuccess } from '../../services/alerts';
import CodeInput from '../common/CodeInput';

const AccountChangeDialogs = ({
  mode = 'both',
  inputClass,
  primaryButtonClass = 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50',
  secondaryButtonClass = 'rounded-lg border border-current px-4 py-2 text-sm disabled:opacity-50',
  isDark = true,
}) => {
  const { user, changePassword, verifyPasswordChange, requestEmailChange, verifyEmailChange } = useAuth();
  const [dialog, setDialog] = useState(null);
  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordCode, setPasswordCode] = useState('');
  const [verificationCurrentPassword, setVerificationCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const privileged = ['superadmin', 'admin', 'barangay'].includes(user?.role);
  const mutedTextClass = isDark ? 'text-gray-400' : 'text-slate-500';

  const closeDialog = () => {
    setDialog(null);
    setEmail('');
    setEmailCode('');
    setPasswordCode('');
    setVerificationCurrentPassword('');
    setPasswords({ current: '', next: '', confirm: '' });
  };

  const requestEmailCode = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await requestEmailChange(email);
      setDialog('email-verify');
      setEmailCode('');
      await showSuccess('A verification code was sent to your new email address.');
    } catch (error) {
      await showError(error.message || 'Unable to request an email change.');
    } finally {
      setSaving(false);
    }
  };

  const verifyEmailCode = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await verifyEmailChange(emailCode);
      closeDialog();
      await showSuccess('Email changed successfully.');
    } catch (error) {
      await showError(error.message || 'Unable to verify the new email.');
    } finally {
      setSaving(false);
    }
  };

  const resendEmailCode = async () => {
    setSaving(true);
    try {
      await requestEmailChange(email);
      setEmailCode('');
      await showSuccess('A new verification code was sent.');
    } catch (error) {
      await showError(error.message || 'Unable to resend the verification code.');
    } finally {
      setSaving(false);
    }
  };

  const requestPasswordCode = async (event) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      await showError('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await changePassword(passwords.current, passwords.next);
      setDialog('password-verify');
      setPasswordCode('');
      setVerificationCurrentPassword('');
      await showSuccess('A verification code was sent to your account email.');
    } catch (error) {
      await showError(error.message || 'Unable to request a password change.');
    } finally {
      setSaving(false);
    }
  };

  const verifyPasswordCode = async (event) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      await showError('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const response = await verifyPasswordChange(passwordCode, privileged ? verificationCurrentPassword : undefined);
      await showSuccess(response.message || 'Password changed. Please log in again.');
      closeDialog();
      window.location.href = '/login';
    } catch (error) {
      await showError(error.message || 'Unable to verify the password change.');
    } finally {
      setSaving(false);
    }
  };

  const resendPasswordCode = async () => {
    setSaving(true);
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswordCode('');
      await showSuccess('A new verification code was sent.');
    } catch (error) {
      await showError(error.message || 'Unable to resend the verification code.');
    } finally {
      setSaving(false);
    }
  };

  const actionButtonClass = 'rounded-lg border border-[#3b82f6] px-4 py-2 text-sm font-semibold text-[#60a5fa] disabled:opacity-50';

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {(mode === 'both' || mode === 'email') && (
          <button type="button" onClick={() => setDialog('email-request')} className={actionButtonClass}>
            Change Email
          </button>
        )}
        {(mode === 'both' || mode === 'password') && (
          <button type="button" onClick={() => setDialog('password-request')} className={actionButtonClass}>
            Change Password
          </button>
        )}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-8" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-change-dialog-title"
            className={`max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-2xl ${isDark ? 'border-[#343640] bg-[#14151d] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
          >
            <h2 id="account-change-dialog-title" className="text-xl font-semibold">
              {dialog.startsWith('email') ? 'Change Email' : 'Change Password'}
            </h2>

            {dialog === 'email-request' && (
              <form onSubmit={requestEmailCode} className="mt-5 space-y-4">
                <label className="block text-sm">
                  New email
                  <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={`${inputClass} mt-2`} />
                </label>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeDialog} disabled={saving} className={secondaryButtonClass}>Cancel</button>
                  <button type="submit" disabled={saving} className={primaryButtonClass}>{saving ? 'Sending...' : 'Request Change'}</button>
                </div>
              </form>
            )}

            {dialog === 'email-verify' && (
              <form onSubmit={verifyEmailCode} className="mt-5 space-y-4">
                <p className={`text-sm ${mutedTextClass}`}>Enter the 6-digit code sent to {email}.</p>
                <CodeInput
                  value={emailCode}
                  onChange={setEmailCode}
                  disabled={saving}
                  className={`${inputClass} text-center font-mono tracking-[0.5em]`}
                  inputProps={{ required: true, 'aria-label': '6-digit email verification code' }}
                />
                <div className="flex flex-wrap justify-end gap-3">
                  <button type="button" onClick={closeDialog} disabled={saving} className={secondaryButtonClass}>Cancel</button>
                  <button type="button" onClick={resendEmailCode} disabled={saving} className={secondaryButtonClass}>Resend</button>
                  <button type="submit" disabled={saving || emailCode.length !== 6} className={primaryButtonClass}>{saving ? 'Verifying...' : 'Verify'}</button>
                </div>
              </form>
            )}

            {dialog === 'password-request' && (
              <form onSubmit={requestPasswordCode} className="mt-5 space-y-4">
                <label className="block text-sm">
                  Current password
                  <input required type="password" autoComplete="current-password" value={verificationCurrentPassword} onChange={(event) => setVerificationCurrentPassword(event.target.value)} className={`${inputClass} mt-2`} />
                </label>
                <label className="block text-sm">
                  New password
                  <input required type="password" autoComplete="new-password" value={passwords.next} onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))} className={`${inputClass} mt-2`} />
                </label>
                <label className="block text-sm">
                  Confirm new password
                  <input required type="password" autoComplete="new-password" value={passwords.confirm} onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))} className={`${inputClass} mt-2`} />
                </label>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeDialog} disabled={saving} className={secondaryButtonClass}>Cancel</button>
                  <button type="submit" disabled={saving} className={primaryButtonClass}>{saving ? 'Sending...' : 'Request Change'}</button>
                </div>
              </form>
            )}

            {dialog === 'password-verify' && (
              <form onSubmit={verifyPasswordCode} className="mt-5 space-y-4">
                <p className={`text-sm ${mutedTextClass}`}>
                  Enter the 6-digit code sent to your email.{privileged ? ' Re-enter your current password to verify this change.' : ''}
                </p>
                {privileged && (
                  <label className="block text-sm">
                    Current password
                    <input required type="password" autoComplete="current-password" value={passwords.current} onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))} className={`${inputClass} mt-2`} />
                  </label>
                )}
                <CodeInput
                  value={passwordCode}
                  onChange={setPasswordCode}
                  disabled={saving}
                  className={`${inputClass} text-center font-mono tracking-[0.5em]`}
                  inputProps={{ required: true, 'aria-label': '6-digit password verification code' }}
                />
                <div className="flex flex-wrap justify-end gap-3">
                  <button type="button" onClick={closeDialog} disabled={saving} className={secondaryButtonClass}>Cancel</button>
                  <button type="button" onClick={resendPasswordCode} disabled={saving} className={secondaryButtonClass}>Resend</button>
                  <button type="submit" disabled={saving || passwordCode.length !== 6} className={primaryButtonClass}>{saving ? 'Verifying...' : 'Verify'}</button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
};

export default AccountChangeDialogs;
