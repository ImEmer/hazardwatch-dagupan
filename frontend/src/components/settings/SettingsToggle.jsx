import React from 'react';
import useTheme from '../../hooks/useTheme';

const SettingsToggle = ({ label, description, checked, onChange, disabled = false }) => {
  const { theme } = useTheme();
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-1">
      <span className="min-w-0">
        <span className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>{label}</span>
        {description && <span className={`mt-1 block text-xs leading-5 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-blue-600' : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </label>
  );
};

export default SettingsToggle;