import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ProtectedRoute from './ProtectedRoute';

const AdminLayout = () => (
  <ProtectedRoute>
    <div className="min-h-screen bg-[#0a0b0f] pt-20 text-white">
      <Navbar />
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 pb-10 md:px-6 xl:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  </ProtectedRoute>
);

export default AdminLayout;
