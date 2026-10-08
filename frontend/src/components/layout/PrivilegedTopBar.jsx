import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { confirmAction } from '../../services/alerts';
import NotificationBell from '../common/NotificationBell';

const PrivilegedTopBar = ({ sidebarWidthClass = 'lg:left-72 lg:w-[calc(100%-18rem)]', sidebarCollapsed = false }) => {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const resolvedSidebarWidthClass = sidebarCollapsed ? 'lg:left-20 lg:w-[calc(100%-5rem)]' : sidebarWidthClass;

  const handleLogout = async () => {
    const result = await confirmAction('Are you sure you want to logout?');
    if (!result.isConfirmed) return;
    await logout();
    navigate('/');
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-40 h-16 border-b backdrop-blur-md transition-[width,margin] duration-300 ease-in-out motion-reduce:transition-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]/95 text-white' : 'border-slate-200 bg-white/95 text-slate-900'} ${resolvedSidebarWidthClass}`}>
      <div className="flex h-full items-center justify-end gap-2 px-4 sm:gap-3">
        <NotificationBell onOpen={() => {}} />

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-red-500 px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500 hover:text-white dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default PrivilegedTopBar;
