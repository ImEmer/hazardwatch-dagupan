import React, { useEffect, useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { toast } from 'sonner';
import { confirmAction } from '../../services/alerts';
import { authApi } from '../../services/api';
import { isPlatformAuthenticatorAvailable } from '../../services/biometric';
import SettingsSection from './SettingsSection';
import SettingsToggle from './SettingsToggle';

const BiometricSettingsSection = () => {
  const [available, setAvailable] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [credentials, setCredentials] = useState([]);
  const [busy, setBusy] = useState('');

  const refreshDevices = async () => {
    const { data } = await authApi.getBiometricDevices();
    setEnabled(Boolean(data.biometricEnabled));
    setCredentials(data.credentials || []);
  };

  useEffect(() => {
    let active = true;
    isPlatformAuthenticatorAvailable().then((supported) => {
      if (active) setAvailable(supported);
    }).finally(() => {
      if (active) setAvailabilityChecked(true);
    });
    authApi.getBiometricDevices().then(({ data }) => {
      if (active) {
        setEnabled(Boolean(data.biometricEnabled));
        setCredentials(data.credentials || []);
      }
    }).catch((error) => {
      if (active) toast.error(error.response?.data?.message || error.message || 'Unable to load biometric devices.');
    });
    return () => { active = false; };
  }, []);

  const enableBiometric = async () => {
    setBusy('register');
    try {
      const { data: challenge } = await authApi.registerBiometricChallenge();
      const credential = await startRegistration({ optionsJSON: challenge.options });
      const platform = `${navigator.userAgent || ''} ${navigator.userAgentData?.platform || navigator.platform || ''}`;
      const deviceLabel = /windows/i.test(platform)
        ? 'Windows Hello'
        : /iphone/i.test(platform)
          ? 'iPhone'
          : /ipad/i.test(platform)
            ? 'iPad'
            : /macintosh|mac os/i.test(platform)
              ? 'Mac'
              : /android/i.test(platform)
                ? 'Android device'
                : 'This device';
      await authApi.verifyBiometricRegistration(credential, deviceLabel);
      await refreshDevices();
      toast.success('Biometric login registered for this device.');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to register this biometric device.');
    } finally {
      setBusy('');
    }
  };

  const toggleBiometric = async (nextEnabled) => {
    if (nextEnabled && !credentials.length) {
      await enableBiometric();
      return;
    }
    setBusy('toggle');
    try {
      await authApi.toggleBiometric(nextEnabled);
      await refreshDevices();
      toast.success(nextEnabled ? 'Biometric login enabled.' : 'Biometric login paused.');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to update biometric settings.');
    } finally {
      setBusy('');
    }
  };

  const removeDevice = async (credential) => {
    const { isConfirmed } = await confirmAction(`Remove ${credential.deviceLabel || 'this device'} from biometric login?`, 'Remove device');
    if (!isConfirmed) return;
    setBusy(credential.credentialId);
    try {
      await authApi.removeBiometricCredential(credential.credentialId);
      await refreshDevices();
      toast.success('Biometric device removed.');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to remove biometric device.');
    } finally {
      setBusy('');
    }
  };

  return (
    <SettingsSection
      title="Biometric login"
      description="Use your device's fingerprint, Face ID, or Windows Hello to sign in faster. If unavailable, the 6-digit email code remains available."
    >
      <SettingsToggle
        label="Enable Biometric Login (Passkeys)"
        description={!available && availabilityChecked
          ? 'Not available on this device.'
          : 'Turning off biometric login pauses it on this account. Your registered devices will remain and can be used again when you re-enable biometric login.'}
        checked={enabled}
        disabled={!availabilityChecked || Boolean(busy) || (!available && !enabled)}
        onChange={toggleBiometric}
      />
      {!enabled && credentials.length > 0 && (
        <p role="status" className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Biometric login is off. {credentials.length} {credentials.length === 1 ? 'device is' : 'devices are'} registered. Turn it on to use {credentials.length === 1 ? 'it' : 'them'} again.
        </p>
      )}
      {enabled && credentials.length > 0 && (
        <div className="border-t border-slate-200 pt-4 dark:border-[#2e303a]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Registered devices</h3>
            <button
              type="button"
              onClick={enableBiometric}
              disabled={!availabilityChecked || !available || Boolean(busy)}
              className="rounded-md border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:text-blue-300"
            >
              {busy === 'register' ? 'Registering...' : 'Add this device'}
            </button>
          </div>
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-[#2e303a]">
            {credentials.map((credential) => (
              <li key={credential.credentialId} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                <div>
                  <p className="text-sm font-medium">{credential.deviceLabel || 'This device'}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Last used: {credential.lastUsedAt ? new Date(credential.lastUsedAt).toLocaleString() : 'Never'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeDevice(credential)}
                  disabled={Boolean(busy)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50 dark:border-[#343640] dark:text-gray-300"
                >
                  {busy === credential.credentialId ? 'Removing...' : 'Remove'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SettingsSection>
  );
};

export default BiometricSettingsSection;
