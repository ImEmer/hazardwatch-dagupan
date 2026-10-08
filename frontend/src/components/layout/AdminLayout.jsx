import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import PrivilegedTopBar from './PrivilegedTopBar';
import ProtectedRoute from './ProtectedRoute';
import useTheme from '../../hooks/useTheme';

const AdminLayout = () => {
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
    window.addEventListener('hw:admin-sidebar-state', handleSidebarState);

    return () => {
      window.removeEventListener('storage', syncCollapsed);
      window.removeEventListener('hw:admin-sidebar-state', handleSidebarState);
    };
  }, []);

  return (
    <ProtectedRoute roles={['superadmin', 'admin', 'staff']}>
      <div className={`h-screen overflow-hidden ${isDark ? 'bg-[#0a0b0f] text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className="h-full">
          <PrivilegedTopBar
            sidebarEventName="hw:toggle-admin-sidebar"
            sidebarWidthClass="lg:left-72 lg:w-[calc(100%-18rem)]"
            sidebarCollapsed={sidebarCollapsed}
          />
          <AdminSidebar />
          <main className={`h-screen overflow-y-auto overflow-x-hidden p-6 pt-24 transition-[margin] duration-300 ease-in-out motion-reduce:transition-none ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'} lg:pt-20 ${isDark ? 'bg-[#0a0b0f]' : 'bg-slate-100'}`}>
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminLayout;
