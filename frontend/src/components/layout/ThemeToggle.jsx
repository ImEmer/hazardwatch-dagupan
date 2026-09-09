import React from 'react';
import useTheme from '../../hooks/useTheme';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        isDark ? 'border-[#2e303a] bg-[#14151d] text-white' : 'border-slate-200 bg-white text-slate-700'
      }`}
      aria-label="Toggle theme"
    >
      <span>{isDark ? '☀️' : '🌙'}</span>
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
};

export default ThemeToggle;
