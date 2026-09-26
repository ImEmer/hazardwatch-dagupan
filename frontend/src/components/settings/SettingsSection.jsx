import React from 'react';
import SettingsCard from './SettingsCard';
import useTheme from '../../hooks/useTheme';

const SettingsSection = ({ title, description, children, actions }) => {
  const { theme } = useTheme();
  return (
    <SettingsCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
          {description && <p className={`mt-1 max-w-2xl text-sm leading-5 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </SettingsCard>
  );
};

export default SettingsSection;