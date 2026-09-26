import React from 'react';
import useTheme from '../../hooks/useTheme';

const SettingsCard = ({ children, className = '' }) => {
  const { theme } = useTheme();
  return <section className={`rounded-lg border p-5 sm:p-6 ${theme === 'dark' ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'} ${className}`}>{children}</section>;
};

export default SettingsCard;