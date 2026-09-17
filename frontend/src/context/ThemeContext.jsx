import React, { createContext, useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const userKey = user?._id || user?.id || 'guest';
  const storageKey = `hazardwatch-theme-${userKey}`;
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setTheme(localStorage.getItem(storageKey) || 'dark');
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, theme);
    document.documentElement.dataset.theme = theme;
  }, [storageKey, theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
