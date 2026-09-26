import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import PasswordToggle from '../PasswordToggle';
import SettingsSection from './SettingsSection';
import SettingsToggle from './SettingsToggle';
import MapPreferencesSection, { DEFAULT_MAP_PREFERENCES, normalizeMapPreferences } from './MapPreferencesSection';

const DEFAULT_PREFERENCES = {
  theme: 'dark',
  notifications: {
    newHazardReports: true,
    criticalReports: true,
    statusUpdates: true,
    systemNotifications: true,
    emailNotifications: false,
    inAppNotifications: true,
  },
  map: DEFAULT_MAP_PREFERENCES,
};

const inputBase = 'w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const saveButton = 'inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50';
const cancelButton = 'rounded-md border px-3 py-2 text-sm font-medium transition';

const SettingsDashboard = () => {
  const { user, updateProfile, changePassword, verifyEmail, updatePreferences } = useAuth();
  const { theme, themePreference, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordVisibility, setPasswordVisibility] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState('');
  const [notifications, setNotifications] = useState(DEFAULT_PREFERENCES.notifications);
  const [mapPreferences, setMapPreferences] = useState(DEFAULT_PREFERENCES.map);
  const [appearanceDraft, setAppearanceDraft] = useState(themePreference);
  const [savedAppearance, setSavedAppearance] = useState(user?.preferences?.theme || themePreference);
  const inputClass = `${inputBase} ${isDark ? 'border-[#343640] bg-[#0a0b0f] text-white placeholder:text-gray-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`;
  const secondaryButton = `${cancelButton} ${isDark ? 'border-[#343640] text-gray-300 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`;

  useEffect(() => {
    setProfile({ name: user?.name || '', email: user?.email || '' });
    setNotifications({ ...DEFAULT_PREFERENCES.notifications, ...user?.preferences?.notifications });
    setMapPreferences(normalizeMapPreferences(user?.preferences?.map));
    setAppearanceDraft(user?.preferences?.theme || themePreference);
    setSavedAppearance(user?.preferences?.theme || themePreference);
  }, [user?.email, user?.name, user?.preferences]);

  const runSave = async (key, task, successMessage) => {
    setSaving(key);
    try {
      await task();
      toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to save settings.');
      return false;
    } finally {
      setSaving('');
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const emailChanged = profile.email.trim().toLowerCase() !== String(user?.email || '').toLowerCase();
    const saved = await runSave('profile', () => updateProfile(profile.name, profile.email), 'Account details saved.');
    if (saved && emailChanged) setVerificationPending(true);
  };

  const submitVerification = async (event) => {
    event.preventDefault();
    await runSave('verify-email', async () => {
      await verifyEmail(profile.email, verificationCode);
      setVerificationPending(false);
      setVerificationCode('');
    }, 'Email verified.');
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) return toast.error('New passwords do not match.');
    await runSave('password', async () => {
      await changePassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
    }, 'Password changed successfully.');
  };

  const savePreferences = (key, values, successMessage) => runSave(key, () => updatePreferences(values), successMessage);
  const restoreNotifications = () => setNotifications({ ...DEFAULT_PREFERENCES.notifications, ...user?.preferences?.notifications });
  const restoreMapPreferences = () => setMapPreferences(normalizeMapPreferences(user?.preferences?.map));
  const changeAppearance = (value) => {
    setAppearanceDraft(value);
    setTheme(value);
  };

  const preferenceSaveActions = (key, onSave, onCancel) => <><button type="button" onClick={onCancel} className={secondaryButton}>Cancel</button><button type="button" onClick={onSave} disabled={saving === key} className={saveButton}>{saving === key ? 'Saving...' : 'Save changes'}</button></>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">Workspace</p>
        <h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Settings</h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Manage your account, preferences, and security.</p>
      </header>

      <SettingsSection title="Account" description="Update your account details and email verification status." actions={<><button type="button" onClick={() => { setProfile({ name: user?.name || '', email: user?.email || '' }); setVerificationPending(false); setVerificationCode(''); }} className={secondaryButton}>Cancel</button><button form="account-settings-form" type="submit" disabled={saving === 'profile'} className={saveButton}>{saving === 'profile' ? 'Saving...' : 'Save changes'}</button></>}>
        <form id="account-settings-form" onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
          <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Full name<input required minLength={2} maxLength={50} autoComplete="name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className={`${inputClass} mt-1.5`} /></label>
          <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Email address<input required type="email" autoComplete="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className={`${inputClass} mt-1.5`} /><span className={`mt-1.5 block text-xs ${user?.emailVerified ? 'text-emerald-500' : 'text-amber-500'}`}>{user?.emailVerified ? 'Verified' : verificationPending ? 'Verification required' : 'Not verified'}</span></label>
          <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Role<span className={`mt-1.5 block rounded-md border px-3 py-2 capitalize ${isDark ? 'border-[#343640] bg-[#0a0b0f] text-gray-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{user?.role || 'user'}</span></div>
          {user?.barangay && <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Barangay<span className={`mt-1.5 block rounded-md border px-3 py-2 ${isDark ? 'border-[#343640] bg-[#0a0b0f] text-gray-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{user.barangay}</span></div>}
        </form>
        {verificationPending && <form onSubmit={submitVerification} className={`mt-4 flex flex-wrap items-end gap-3 border-t pt-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}><label className={`min-w-[14rem] flex-1 text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Verification code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className={`${inputClass} mt-1.5`} /></label><button type="submit" disabled={saving === 'verify-email'} className={saveButton}>{saving === 'verify-email' ? 'Verifying...' : 'Verify email'}</button></form>}
      </SettingsSection>

      <SettingsSection title="Security" description="Change your password. Use at least 8 characters with uppercase, lowercase, a number, and a symbol." actions={<><button type="button" onClick={() => setPasswords({ current: '', next: '', confirm: '' })} className={secondaryButton}>Cancel</button><button form="password-settings-form" type="submit" disabled={saving === 'password'} className={saveButton}>{saving === 'password' ? 'Saving...' : 'Update password'}</button></>}>
        <form id="password-settings-form" onSubmit={savePassword} className="grid gap-4 sm:grid-cols-3">
          {[
            ['current', 'Current password', 'current-password'],
            ['next', 'New password', 'new-password'],
            ['confirm', 'Confirm new password', 'new-password'],
          ].map(([key, label, autocomplete]) => <label key={key} className={`block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{label}<span className="relative mt-1.5 block"><input required minLength={key === 'current' ? undefined : 8} type={passwordVisibility[key] ? 'text' : 'password'} autoComplete={autocomplete} value={passwords[key]} onChange={(event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))} className={`${inputClass} pr-11`} /><PasswordToggle visible={passwordVisibility[key]} onToggle={() => setPasswordVisibility((current) => ({ ...current, [key]: !current[key] }))} label={label.toLowerCase()} /></span></label>)}
        </form>
      </SettingsSection>

      <SettingsSection title="Appearance" description="Choose the theme for this account. System follows your device appearance." actions={preferenceSaveActions('appearance', () => savePreferences('appearance', { theme: appearanceDraft }, 'Appearance saved.'), () => changeAppearance(savedAppearance))}>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme preference">
          {['light', 'dark', 'system'].map((option) => <button key={option} type="button" role="radio" aria-checked={appearanceDraft === option} onClick={() => changeAppearance(option)} className={`flex items-center justify-between rounded-md border px-4 py-3 text-sm font-medium capitalize transition ${appearanceDraft === option ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300' : isDark ? 'border-[#343640] text-gray-300 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{option}{appearanceDraft === option && <Check size={16} />}</button>)}
        </div>
        <div className={`flex items-center gap-3 rounded-md border p-3 ${isDark ? 'border-[#343640] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}><div className={`h-10 w-14 rounded border ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}><div className="m-2 h-2 w-6 rounded bg-blue-500" /></div><div><p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-slate-800'}`}>Live preview</p><p className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Current appearance: {theme}</p></div></div>
      </SettingsSection>

      <SettingsSection title="Notification settings" description="Choose which in-app and email notification categories are enabled." actions={preferenceSaveActions('notifications', () => savePreferences('notifications', { notifications }, 'Notification preferences saved.'), restoreNotifications)}>
        <div className="divide-y divide-slate-200/70 dark:divide-[#2e303a]">
          {[
            ['newHazardReports', 'New hazard reports', 'Receive alerts when a new report is submitted.'],
            ['criticalReports', 'Critical/high-priority reports', 'Receive alerts for urgent and high-priority reports.'],
            ['statusUpdates', 'Report status updates', 'Receive updates when report status changes.'],
            ['systemNotifications', 'System notifications', 'Receive account and operational notices.'],
            ['emailNotifications', 'Email notifications', 'Save your email preference. Email delivery is not connected yet.'],
            ['inAppNotifications', 'In-app notifications', 'Show notifications in the sidebar and notification center.'],
          ].map(([key, label, description]) => <div key={key} className="py-3 first:pt-0 last:pb-0"><SettingsToggle label={label} description={description} checked={notifications[key]} onChange={(checked) => setNotifications((current) => ({ ...current, [key]: checked }))} /></div>)}
        </div>
      </SettingsSection>

      <MapPreferencesSection
        value={mapPreferences}
        onChange={(key, value) => setMapPreferences((current) => ({ ...current, [key]: value }))}
        onSave={() => savePreferences('map', { map: normalizeMapPreferences(mapPreferences) }, 'Map preferences saved.')}
        onCancel={restoreMapPreferences}
        saving={saving === 'map'}
      />

    </div>
  );
};

export default SettingsDashboard;