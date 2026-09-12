import React from 'react';
import { Outlet } from 'react-router-dom';
import BarangaySidebar from './BarangaySidebar';
import ProtectedRoute from './ProtectedRoute';
import useTheme from '../../hooks/useTheme';

const BarangayLayout = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <ProtectedRoute allowedRoles={['barangay']}>
      <div className={`min-h-screen ${isDark ? 'bg-[#0a0b0f] text-white' : 'bg-slate-100 text-slate-900'}`}>
        <BarangaySidebar />
        <main className={`min-h-screen overflow-auto p-5 pt-20 lg:ml-64 lg:p-8 lg:pt-8 ${isDark ? 'bg-[#0a0b0f]' : 'bg-slate-100'}`}>
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default BarangayLayout;