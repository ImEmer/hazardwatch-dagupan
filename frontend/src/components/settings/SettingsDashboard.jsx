import React, { useEffect, useState } from 'react';
import { Check, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import PasswordToggle from '../PasswordToggle';
import { systemSettingsApi } from '../../services/api';
import SettingsSection from './SettingsSection';
import SettingsToggle from './SettingsToggle';

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
  map: {
    showResolved: false,
    showClusters: true,
    defaultView: 'city',
    defaultZoom: 13,
    mapStyle: 'streets',
    markerStyle: 'circle',
  },
};

const DEFAULT_SYSTEM = {
  systemName: 'HazardWatch Dagupan',
  systemLogo: '',
  hazardCategories: [],
  reportStatuses: ['Pending', 'In Progress', 'Resolved', 'Closed'],
  priorityLevels: ['Low', 'Medium', 'High', 'Urgent'],
  userRoles: ['user', 'barangay', 'staff', 'admin', 'superadmin'],
  maintenanceMode: false,
  notificationsEnabled: true,
  defaultUserRole: 'user',
  roleHierarchy: { user: 1, barangay: 2, staff: 2, admin: 3, superadmin: 4 },
  permissionMatrix: {},
};

const inputBase = 'w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const saveButton = 'inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50';
const cancelButton = 'rounded-md border px-3 py-2 text-sm font-medium transition';

const ManagedList = ({ label, values, onChange, isDark }) => {
  const [draft, setDraft] = useState('');
  const inputClass = `${inputBase} ${isDark ? 'border-[#343640] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`;
  return (
    <fieldset>
      <legend className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{label}</legend>
      <div className="space-y-2">
        {values.map((value, index) => <div key={`${label}-${index}`} className="flex items-center gap-2">
          <input aria-label={`${label} ${index + 1}`} value={value} onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className={inputClass} />
          <button type="button" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} className={`rounded-md p-2 text-red-500 hover:bg-red-500/10 ${values.length <= 1 ? 'invisible' : ''}`} aria-label={`Delete ${value}`} title="Delete"><Trash2 size={16} /></button>
        </div>)}
      </div>
      <div className="mt-2 flex gap-2">
        <input aria-label={`New ${label.toLowerCase()}`} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); const value = draft.trim(); if (value && !values.includes(value)) onChange([...values, value]); setDraft(''); } }} className={inputClass} placeholder={`Add ${label.toLowerCase()}`} />
        <button type="button" onClick={() => { const value = draft.trim(); if (value && !values.includes(value)) onChange([...values, value]); setDraft(''); }} className={`rounded-md border px-3 ${isDark ? 'border-[#343640] text-gray-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`} aria-label={`Add ${label}`}><Plus size={16} /></button>
      </div>
    </fieldset>
  );
};

const SettingsDashboard = ({ superAdminOnly = false }) => {
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
  const [systemSettings, setSystemSettings] = useState(DEFAULT_SYSTEM);
  const [savedSystemSettings, setSavedSystemSettings] = useState(DEFAULT_SYSTEM);
  const [systemLoaded, setSystemLoaded] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const inputClass = `${inputBase} ${isDark ? 'border-[#343640] bg-[#0a0b0f] text-white placeholder:text-gray-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`;
  const secondaryButton = `${cancelButton} ${isDark ? 'border-[#343640] text-gray-300 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`;

  useEffect(() => {
    setProfile({ name: user?.name || '', email: user?.email || '' });
    setNotifications({ ...DEFAULT_PREFERENCES.notifications, ...user?.preferences?.notifications });
    setMapPreferences({ ...DEFAULT_PREFERENCES.map, ...user?.preferences?.map });
    setAppearanceDraft(user?.preferences?.theme || themePreference);
    setSavedAppearance(user?.preferences?.theme || themePreference);
  }, [user?.email, user?.name, user?.preferences]);

  useEffect(() => {
    if (!superAdminOnly) return;
    let active = true;
    systemSettingsApi.get().then(({ data }) => {
      if (active) {
        const loadedSettings = { ...DEFAULT_SYSTEM, ...data.settings };
        setSystemSettings(loadedSettings);
        setSavedSystemSettings(loadedSettings);
        setSystemLoaded(true);
      }
    }).catch((error) => toast.error(error.response?.data?.message || 'Unable to load system settings.'));
    return () => { active = false; };
  }, [superAdminOnly]);

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
  const restoreMapPreferences = () => setMapPreferences({ ...DEFAULT_PREFERENCES.map, ...user?.preferences?.map });
  const changeAppearance = (value) => {
    setAppearanceDraft(value);
    setTheme(value);
  };

  const saveSystemSettings = async () => {
    const payload = Object.fromEntries(Object.entries(systemSettings).filter(([key]) => !['_id', 'key', 'createdAt', 'updatedAt', '__v'].includes(key)));
    await runSave('system', async () => {
      const { data } = await systemSettingsApi.update(payload);
      const saved = { ...DEFAULT_SYSTEM, ...data.settings };
      setSystemSettings(saved);
      setSavedSystemSettings(saved);
    }, 'System settings saved.');
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { data } = await systemSettingsApi.uploadLogo(file);
      const saved = { ...systemSettings, systemLogo: data.settings.systemLogo };
      setSystemSettings(saved);
      setSavedSystemSettings(saved);
      toast.success('System logo uploaded.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to upload system logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const updateSystemList = (key, values) => setSystemSettings((current) => ({ ...current, [key]: values }));
  const roleNames = systemSettings.userRoles?.length ? systemSettings.userRoles : DEFAULT_SYSTEM.userRoles;
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
          ].map(([key, label, autocomplete]) => <label key={key} className={`relative block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{label}<input required minLength={key === 'current' ? undefined : 8} type={passwordVisibility[key] ? 'text' : 'password'} autoComplete={autocomplete} value={passwords[key]} onChange={(event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))} className={`${inputClass} mt-1.5 pr-11`} /><PasswordToggle visible={passwordVisibility[key]} onToggle={() => setPasswordVisibility((current) => ({ ...current, [key]: !current[key] }))} label={label.toLowerCase()} /></label>)}
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

      <SettingsSection title="Map preferences" description="Set the initial map view and how hazard reports are displayed." actions={preferenceSaveActions('map', () => savePreferences('map', { map: mapPreferences }, 'Map preferences saved.'), restoreMapPreferences)}>
        <div className="divide-y divide-slate-200/70 dark:divide-[#2e303a]">
          <div className="grid gap-4 py-3 sm:grid-cols-2">
            <SettingsToggle label="Show resolved reports" checked={mapPreferences.showResolved} onChange={(showResolved) => setMapPreferences((current) => ({ ...current, showResolved }))} />
            <SettingsToggle label="Group nearby reports" description="Cluster markers when there are many reports." checked={mapPreferences.showClusters} onChange={(showClusters) => setMapPreferences((current) => ({ ...current, showClusters }))} />
          </div>
          <div className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Default map view<select value={mapPreferences.defaultView} onChange={(event) => setMapPreferences((current) => ({ ...current, defaultView: event.target.value }))} className={`${inputClass} mt-1.5`}><option value="city">City</option><option value="barangay">My barangay</option><option value="my-location">My location</option></select></label>
            <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Default zoom<input type="number" min="1" max="18" value={mapPreferences.defaultZoom} onChange={(event) => setMapPreferences((current) => ({ ...current, defaultZoom: Number(event.target.value) }))} className={`${inputClass} mt-1.5`} /><span className={`mt-1 block text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Zoom {mapPreferences.defaultZoom} of 18</span></label>
            <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Map style<select value={mapPreferences.mapStyle} onChange={(event) => setMapPreferences((current) => ({ ...current, mapStyle: event.target.value }))} className={`${inputClass} mt-1.5`}><option value="streets">Streets</option><option value="satellite">Satellite</option><option value="terrain">Terrain</option></select></label>
            <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Hazard marker style<select value={mapPreferences.markerStyle} onChange={(event) => setMapPreferences((current) => ({ ...current, markerStyle: event.target.value }))} className={`${inputClass} mt-1.5`}><option value="circle">Circle</option><option value="pin">Pin</option></select></label>
          </div>
        </div>
      </SettingsSection>

      {superAdminOnly && <>
        <SettingsSection title="System settings" description="Manage platform identity and operational reference lists." actions={<><button type="button" onClick={() => setSystemSettings(savedSystemSettings)} disabled={!systemLoaded || saving === 'system'} className={secondaryButton}>Cancel</button><button type="button" onClick={saveSystemSettings} disabled={!systemLoaded || saving === 'system'} className={saveButton}>{saving === 'system' ? 'Saving...' : 'Save system settings'}</button></>}>
          <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>System name<input maxLength={100} value={systemSettings.systemName} onChange={(event) => setSystemSettings((current) => ({ ...current, systemName: event.target.value }))} className={`${inputClass} mt-1.5`} /></label>
          <div className="grid gap-5 md:grid-cols-2">
            <ManagedList label="Hazard categories" values={systemSettings.hazardCategories} onChange={(values) => updateSystemList('hazardCategories', values)} isDark={isDark} />
            <ManagedList label="Report statuses" values={systemSettings.reportStatuses} onChange={(values) => updateSystemList('reportStatuses', values)} isDark={isDark} />
            <ManagedList label="Priority levels" values={systemSettings.priorityLevels} onChange={(values) => updateSystemList('priorityLevels', values)} isDark={isDark} />
            <ManagedList label="User roles" values={systemSettings.userRoles} onChange={(values) => updateSystemList('userRoles', values)} isDark={isDark} />
          </div>
          <div className={`border-t pt-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
            <SettingsToggle label="System notifications enabled" description="Allow the application to create in-app notifications globally." checked={systemSettings.notificationsEnabled} onChange={(notificationsEnabled) => setSystemSettings((current) => ({ ...current, notificationsEnabled }))} />
            <SettingsToggle label="Maintenance mode" description="Flag the system as under maintenance. This does not block requests until maintenance enforcement is added." checked={systemSettings.maintenanceMode} onChange={(maintenanceMode) => setSystemSettings((current) => ({ ...current, maintenanceMode }))} />
          </div>
          <div className={`border-t pt-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
            <label className={`flex flex-wrap items-center gap-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}><span className="font-medium">System logo</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadLogo(event.target.files?.[0])} disabled={uploadingLogo} className="max-w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:font-semibold file:text-white" /><span className="inline-flex items-center gap-1 text-xs">{uploadingLogo ? 'Uploading...' : <><Upload size={14} /> JPEG, PNG, or WebP, max 5 MB</>}</span></label>
            {systemSettings.systemLogo && <img src={systemSettings.systemLogo} alt="Current system logo" className="mt-3 h-14 max-w-48 rounded border border-slate-300 bg-white object-contain p-1" />}
          </div>
        </SettingsSection>

        <SettingsSection title="User and role management" description="Configure the default registration role, role hierarchy, and capability matrix." actions={<><button type="button" onClick={() => setSystemSettings(savedSystemSettings)} disabled={!systemLoaded || saving === 'system'} className={secondaryButton}>Cancel</button><button type="button" onClick={saveSystemSettings} disabled={!systemLoaded || saving === 'system'} className={saveButton}>{saving === 'system' ? 'Saving...' : 'Save role settings'}</button></>}>
          <label className={`block max-w-sm text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Default role for new users<select value={systemSettings.defaultUserRole} onChange={(event) => setSystemSettings((current) => ({ ...current, defaultUserRole: event.target.value }))} className={`${inputClass} mt-1.5`}>{roleNames.filter((role) => ['user', 'barangay', 'staff', 'admin'].includes(role)).map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
          <div>
            <h3 className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>Role hierarchy</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{roleNames.map((role) => <label key={role} className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{role}<input type="number" min="1" max="10" value={systemSettings.roleHierarchy?.[role] ?? 1} onChange={(event) => setSystemSettings((current) => ({ ...current, roleHierarchy: { ...current.roleHierarchy, [role]: Number(event.target.value) } }))} className={`${inputClass} mt-1.5`} /></label>)}</div>
          </div>
          <div className="overflow-x-auto">
            <h3 className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>Permission matrix</h3>
            <table className="w-full min-w-[34rem] text-left text-sm"><thead><tr className={isDark ? 'text-gray-400' : 'text-slate-500'}><th className="py-2 pr-3 font-medium">Capability</th>{roleNames.map((role) => <th key={role} className="px-2 py-2 text-center font-medium capitalize">{role}</th>)}</tr></thead><tbody>{['viewReports', 'manageReports', 'manageUsers', 'manageSystemSettings'].map((permission) => <tr key={permission} className={`border-t ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}><th className={`py-2 pr-3 font-medium ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{permission.replace(/([A-Z])/g, ' $1')}</th>{roleNames.map((role) => <td key={role} className="px-2 py-2 text-center"><input type="checkbox" aria-label={`${role} ${permission}`} checked={Boolean(systemSettings.permissionMatrix?.[role]?.[permission])} onChange={(event) => setSystemSettings((current) => ({ ...current, permissionMatrix: { ...current.permissionMatrix, [role]: { ...current.permissionMatrix?.[role], [permission]: event.target.checked } } }))} className="h-4 w-4 accent-blue-600" /></td>)}</tr>)}</tbody></table>
          </div>
        </SettingsSection>
      </>}
    </div>
  );
};

export default SettingsDashboard;