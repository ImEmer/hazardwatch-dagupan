import React from 'react';
import { Link } from 'react-router-dom';
import AdminReportsPage from './AdminReportsPage';

const AdminResolvedReportsPage = ({ basePath = '/admin' }) => (
  <div className="space-y-4">
    <Link to={`${basePath}/reports`} className="inline-flex items-center rounded-lg border border-[#3b82f6] px-3 py-2 text-sm text-[#60a5fa] hover:bg-[#3b82f6]/10">Back to Reports</Link>
    <AdminReportsPage resolvedOnly basePath={basePath} />
  </div>
);

export default AdminResolvedReportsPage;