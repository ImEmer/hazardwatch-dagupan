import React from 'react';
import useTheme from '../../hooks/useTheme';
import SettingsSection from './SettingsSection';
import SettingsToggle from './SettingsToggle';

export const DEFAULT_MAP_PREFERENCES = {
  showResolved: false,
  defaultZoom: 13,
  mapStyle: 'streets',
  markerStyle: 'danger',
};

const MAP_PREFERENCE_KEYS = Object.keys(DEFAULT_MAP_PREFERENCES);

export const normalizeMapPreferences = (preferences = {}) => Object.fromEntries(
  MAP_PREFERENCE_KEYS.map((key) => [key, preferences[key] ?? DEFAULT_MAP_PREFERENCES[key]]),
);

const MapPreferencesSection = ({ value, onChange, onSave, onCancel, saving = false, loading = false, saveLabel = 'Save changes' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const preferences = normalizeMapPreferences(value);
  const inputClass = `w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${isDark ? 'border-[#343640] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`;
  const secondaryButton = `rounded-md border px-3 py-2 text-sm font-medium ${isDark ? 'border-[#343640] text-gray-300 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`;
  const saveButton = 'rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <SettingsSection
      title="Map Preferences"
      description="Choose how resolved reports and hazard markers appear on your map."
      actions={<><button type="button" onClick={onCancel} disabled={loading || saving} className={secondaryButton}>Cancel</button><button type="button" onClick={onSave} disabled={loading || saving} className={saveButton}>{saving ? 'Saving...' : saveLabel}</button></>}
    >
      {loading ? <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Loading preferences...</p> : <div className="space-y-4">
        <SettingsToggle label="Show resolved reports" checked={preferences.showResolved} onChange={(checked) => onChange('showResolved', checked)} />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Default zoom<input type="number" min="1" max="18" value={preferences.defaultZoom} onChange={(event) => onChange('defaultZoom', Number(event.target.value))} className={`${inputClass} mt-1.5`} /></label>
          <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Map style<select value={preferences.mapStyle} onChange={(event) => onChange('mapStyle', event.target.value)} className={`${inputClass} mt-1.5`}><option value="streets">Streets</option><option value="satellite">Satellite</option><option value="terrain">Terrain</option></select></label>
          <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Hazard marker style<select value={preferences.markerStyle} onChange={(event) => onChange('markerStyle', event.target.value)} className={`${inputClass} mt-1.5`}><option value="circle">Circle</option><option value="pin">Pin</option><option value="danger">Danger</option></select></label>
        </div>
      </div>}
    </SettingsSection>
  );
};

export default MapPreferencesSection;