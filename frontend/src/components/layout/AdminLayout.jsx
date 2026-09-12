import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import ProtectedRoute from './ProtectedRoute';
import useTheme from '../../hooks/useTheme';

const AdminLayout = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <ProtectedRoute roles={['superadmin', 'admin', 'staff']}>
      <div className={`h-screen overflow-hidden ${isDark ? 'bg-[#0a0b0f] text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className="h-full">
          <AdminSidebar />
          <main className={`h-screen overflow-y-auto overflow-x-hidden p-6 pt-20 lg:ml-72 lg:pt-6 ${isDark ? 'bg-[#0a0b0f]' : 'bg-slate-100'}`}>
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
