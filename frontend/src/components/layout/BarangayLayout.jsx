import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import BarangaySidebar from './BarangaySidebar';
import PrivilegedTopBar from './PrivilegedTopBar';
import ProtectedRoute from './ProtectedRoute';
import useTheme from '../../hooks/useTheme';

const BarangayLayout = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');

  useEffect(() => {
    const syncCollapsed = () => setSidebarCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
    const handleSidebarState = (event) => {
      const next = event.detail?.collapsed ?? (localStorage.getItem('sidebarCollapsed') === 'true');
      setSidebarCollapsed(Boolean(next));
    };

    syncCollapsed();
    window.addEventListener('storage', syncCollapsed);
    window.addEventListener('hw:barangay-sidebar-state', handleSidebarState);

    return () => {
      window.removeEventListener('storage', syncCollapsed);
      window.removeEventListener('hw:barangay-sidebar-state', handleSidebarState);
    };
  }, []);

  return (
    <ProtectedRoute allowedRoles={['barangay']}>
      <div className={`min-h-screen ${isDark ? 'bg-[#0a0b0f] text-white' : 'bg-slate-100 text-slate-900'}`}>
        <PrivilegedTopBar
          sidebarEventName="hw:toggle-barangay-sidebar"
          sidebarWidthClass="lg:left-64 lg:w-[calc(100%-16rem)]"
          sidebarCollapsed={sidebarCollapsed}
        />
        <BarangaySidebar />
        <main className={`min-h-screen overflow-auto p-5 pt-24 transition-[margin] duration-300 ease-in-out motion-reduce:transition-none ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} lg:p-8 lg:pt-20 ${isDark ? 'bg-[#0a0b0f]' : 'bg-slate-100'}`}>
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default BarangayLayout;