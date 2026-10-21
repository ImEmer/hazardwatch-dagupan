import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import useTheme from '../../hooks/useTheme';
import { systemSettingsApi } from '../../services/api';

const SuperAdminSystemGovernance = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [globalAnnouncement, setGlobalAnnouncement] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [securityEntries, setSecurityEntries] = useState([]);
  const [rateLimitStats, setRateLimitStats] = useState([]);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [securityError, setSecurityError] = useState('');
  const [unlockingId, setUnlockingId] = useState('');
  const cardClass = `rounded-2xl border p-6 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`;
  const secondaryTextClass = isDark ? 'text-gray-400' : 'text-slate-500';

  const fetchSecurityStatus = useCallback(async () => {
    try {
      const { data } = await systemSettingsApi.getSecurityStatus();
      const lockouts = Array.isArray(data?.lockouts) ? data.lockouts : [];
      const rateLimitEntries = Array.isArray(data?.rateLimitEntries) ? data.rateLimitEntries : [];
      const entries = Array.isArray(data?.entries) ? data.entries : [...lockouts, ...rateLimitEntries];
      if (import.meta.env.DEV) {
        console.debug('[security-status] Loaded entry counts', {
          lockouts: lockouts.length,
          rateLimitEntries: rateLimitEntries.length,
        });
      }
      setSecurityEntries(entries);
      setRateLimitStats(data?.rateLimitStats || []);
      setSecurityError('');
    } catch (requestError) {
      setSecurityError(requestError.response?.data?.message || 'Unable to load security status.');
    } finally {
      setSecurityLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    systemSettingsApi.get()
      .then(({ data }) => {
        if (!active) return;
        setMaintenanceMode(Boolean(data?.settings?.maintenanceMode));
        setGlobalAnnouncement(data?.settings?.globalAnnouncement || '');
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load system governance settings.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    fetchSecurityStatus();
    const intervalId = window.setInterval(fetchSecurityStatus, 30_000);
    return () => window.clearInterval(intervalId);
  }, [fetchSecurityStatus]);

  const saveSettings = async (settings, successMessage) => {
    setSaving(true);
    setError('');
    try {
      const { data } = await systemSettingsApi.update(settings);
      setMaintenanceMode(Boolean(data?.settings?.maintenanceMode));
      setGlobalAnnouncement(data?.settings?.globalAnnouncement || '');
      toast.success(successMessage);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to save system governance settings.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const saveMaintenanceMode = (event) => {
    event.preventDefault();
    saveSettings({ maintenanceMode }, 'Maintenance mode saved.');
  };

  const saveAnnouncement = (event) => {
    event.preventDefault();
    saveSettings({ globalAnnouncement }, 'Global announcement saved.');
  };

  const clearAnnouncement = () => {
    setGlobalAnnouncement('');
    saveSettings({ globalAnnouncement: '' }, 'Global announcement cleared.');
  };

  const unlockEntry = async (entry) => {
    setUnlockingId(entry.id);
    try {
      await systemSettingsApi.unlockSecurityEntry(entry.type, entry.id);
      toast.success('Security entry unlocked.');
      await fetchSecurityStatus();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to unlock this entry.');
    } finally {
      setUnlockingId('');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">Superadmin</p>
        <h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>System Governance</h1>
        <p className={`mt-1 text-sm ${secondaryTextClass}`}>Control system availability and publish announcements to all users.</p>
      </header>

      <form onSubmit={saveMaintenanceMode}>
        <section className={cardClass}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Maintenance Mode</h2>
          <p className={`mt-1 text-sm ${secondaryTextClass}`}>Temporarily make the system unavailable to non-superadmins.</p>
          <label className="mt-5 flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className={`block text-sm font-medium ${isDark ? 'text-gray-100' : 'text-slate-800'}`}>Enable Maintenance Mode</span>
              <span className="mt-1 block text-sm font-medium text-amber-500">Enabling this will block all users except Superadmins.</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={maintenanceMode}
              aria-label="Maintenance Mode"
              disabled={loading || saving}
              onClick={() => setMaintenanceMode((enabled) => !enabled)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${maintenanceMode ? 'bg-blue-600' : isDark ? 'bg-slate-700' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
          <button type="submit" disabled={loading || saving} className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? 'Loading...' : saving ? 'Saving...' : 'Save Maintenance Settings'}
          </button>
        </section>
        {error && <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>}
      </form>

      <form onSubmit={saveAnnouncement}>
        <section className={cardClass}>
          <label htmlFor="global-announcement" className={`block text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Global Announcement</label>
          <p className={`mt-1 text-sm ${secondaryTextClass}`}>This message appears in a yellow banner across public and privileged pages.</p>
          <textarea
            id="global-announcement"
            rows={5}
            value={globalAnnouncement}
            disabled={loading || saving}
            onChange={(event) => setGlobalAnnouncement(event.target.value)}
            className={`mt-4 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 ${isDark ? 'border-[#343640] bg-[#0a0b0f] text-white placeholder:text-gray-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`}
            placeholder="Write an announcement for all users..."
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" disabled={loading || saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Loading...' : saving ? 'Saving...' : 'Update Announcement'}
            </button>
            <button type="button" onClick={clearAnnouncement} disabled={loading || saving || !globalAnnouncement} className="rounded-lg border border-red-500 px-5 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50">
              Clear Announcement
            </button>
          </div>
        </section>
        {error && <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>}
      </form>

      <section className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Security Overview</h2>
            <p className={`mt-1 text-sm ${secondaryTextClass}`}>Active login lockouts and rate-limit blocks. Refreshes every 30 seconds.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {rateLimitStats.map(({ limiter, blockedClients }) => (
              <span key={limiter} className={`rounded-full px-3 py-1 text-xs ${isDark ? 'bg-[#0a0b0f] text-gray-300' : 'bg-slate-100 text-slate-600'}`}>
                {limiter}: {blockedClients} blocked
              </span>
            ))}
          </div>
        </div>
        {securityError && <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{securityError}</p>}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className={isDark ? 'text-gray-400' : 'text-slate-500'}>
              <tr>
                <th className="px-3 py-3 font-medium">Identifier (Email/IP)</th>
                <th className="px-3 py-3 font-medium">Reason (Failed Logins/Rate Limit)</th>
                <th className="px-3 py-3 font-medium">Unlock Time (Remaining minutes)</th>
                <th className="px-3 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-[#2e303a]' : 'divide-y divide-slate-200'}>
              {securityLoading && securityEntries.length === 0 && <tr><td colSpan="4" className={`px-3 py-6 text-center ${secondaryTextClass}`}>Loading security status...</td></tr>}
              {!securityLoading && securityEntries.length === 0 && <tr><td colSpan="4" className={`px-3 py-6 text-center ${secondaryTextClass}`}>No active lockouts or rate limits.</td></tr>}
              {securityEntries.map((entry) => (
                <tr key={`${entry.type}:${entry.id}`}>
                  <td className={`px-3 py-3 ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{entry.identifier}</td>
                  <td className={`px-3 py-3 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{entry.reason}</td>
                  <td className={`px-3 py-3 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{entry.remainingMinutes} min</td>
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => unlockEntry(entry)} disabled={unlockingId === entry.id} className="rounded-md border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-500 transition hover:bg-amber-500/10 disabled:opacity-50">
                      {unlockingId === entry.id ? 'Unlocking...' : 'Unlock'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default SuperAdminSystemGovernance;
