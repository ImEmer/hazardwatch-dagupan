import React, { createContext, useCallback, useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const userKey = user?._id || user?.id || 'guest';
  const storageKey = `hazardwatch-theme-${userKey}`;
  const [theme, setTheme] = useState('dark');
  const [themePreference, setThemePreference] = useState('dark');

  useEffect(() => {
    const saved = user?.preferences?.theme || localStorage.getItem(storageKey) || 'dark';
    setThemePreference(saved);
  }, [storageKey, user?.preferences?.theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const resolvedTheme = themePreference === 'system' ? (media.matches ? 'dark' : 'light') : themePreference;
      setTheme(resolvedTheme);
      document.documentElement.dataset.theme = resolvedTheme;
      document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    };
    applyTheme();
    if (themePreference !== 'system') return undefined;
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [themePreference]);

  const updateThemePreference = useCallback((preference) => {
    if (!['light', 'dark', 'system'].includes(preference)) return;
    setThemePreference(preference);
    localStorage.setItem(storageKey, preference);
  }, [storageKey]);

  const toggleTheme = () => updateThemePreference(themePreference === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, themePreference, setTheme: updateThemePreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
