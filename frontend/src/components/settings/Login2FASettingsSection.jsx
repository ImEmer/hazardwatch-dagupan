import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import SettingsSection from './SettingsSection';
import SettingsToggle from './SettingsToggle';

const Login2FASettingsSection = ({ user, updatePreferences }) => {
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [email2FAEnabled, setEmail2FAEnabled] = useState(Boolean(user?.login2FAEnabled));
  const passwordInputRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    setEmail2FAEnabled(Boolean(user?.login2FAEnabled));
  }, [user?.login2FAEnabled]);

  useEffect(() => {
    if (!showDisableDialog) return undefined;
    passwordInputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') cancelDisable();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll('input:not([disabled]), button:not([disabled])');
      if (focusable.length < 2) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDisableDialog]);

  const enableLogin2FA = async () => {
    const previousValue = email2FAEnabled;
    setEmail2FAEnabled(true);
    setSaving(true);
    try {
      await updatePreferences({ login2FAEnabled: true });
      toast.success('Email 2FA enabled.');
    } catch (error) {
      setEmail2FAEnabled(previousValue);
      toast.error(error.response?.data?.message || error.message || 'Unable to update login 2FA.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (nextEnabled) => {
    if (saving) return;
    if (nextEnabled) {
      enableLogin2FA();
      return;
    }
    setCurrentPassword('');
    setShowDisableDialog(true);
  };

  const disableLogin2FA = async (event) => {
    event.preventDefault();
    if (!currentPassword || saving) return;
    const previousValue = email2FAEnabled;
    setEmail2FAEnabled(false);
    setSaving(true);
    try {
      await updatePreferences({ login2FAEnabled: false, currentPassword });
      setShowDisableDialog(false);
      setCurrentPassword('');
      toast.success('Email 2FA disabled.');
    } catch (error) {
      setEmail2FAEnabled(previousValue);
      toast.error(error.response?.data?.message || error.message || 'Unable to update login 2FA.');
    } finally {
      setSaving(false);
    }
  };

  const cancelDisable = () => {
    if (saving) return;
    setShowDisableDialog(false);
    setCurrentPassword('');
  };

  return (
    <>
      <SettingsSection
        title="Email 2FA on Login"
        description="Require a 6-digit email code when logging in. Disable only for testing."
      >
        <SettingsToggle
          label="Enable email 2FA on login"
          checked={email2FAEnabled}
          disabled={saving}
          onChange={handleToggle}
        />
        <p
          role="status"
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            email2FAEnabled
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
          }`}
        >
          {email2FAEnabled ? '✅ 2FA is active' : 'Testing mode: 2FA is disabled'}
        </p>
      </SettingsSection>

      {showDisableDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelDisable();
          }}
        >
          <form
            ref={dialogRef}
            onSubmit={disableLogin2FA}
            className="w-full max-w-md rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 text-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="disable-login-2fa-title"
            aria-describedby="disable-login-2fa-description"
          >
            <h2 id="disable-login-2fa-title" className="text-xl font-semibold">Disable email 2FA?</h2>
            <p id="disable-login-2fa-description" className="mt-2 text-sm leading-6 text-gray-300">
              Disabling 2FA makes your account less secure. Only do this for testing. Continue?
            </p>
            <label className="mt-4 block text-sm text-gray-300">
              Current password
              <input
                ref={passwordInputRef}
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="mt-1.5 w-full rounded-md border border-[#343640] bg-[#0a0b0f] px-3 py-2 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={cancelDisable}
                disabled={saving}
                className="rounded-lg border border-[#3a3d49] px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-[#20222d] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !currentPassword}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Disabling...' : 'Disable'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Login2FASettingsSection;
