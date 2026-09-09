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
      <div className={`min-h-screen ${isDark ? 'bg-[#0a0b0f] text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className="min-h-screen">
          <AdminSidebar />
          <main className={`min-h-screen overflow-auto p-6 pl-6 md:ml-72 ${isDark ? 'bg-[#0a0b0f]' : 'bg-slate-100'}`}>
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
