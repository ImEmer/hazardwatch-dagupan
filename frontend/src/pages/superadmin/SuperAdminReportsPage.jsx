import React from 'react';
import AdminReportsPage from '../admin/AdminReportsPage';

const SuperAdminReportsPage = ({ resolvedOnly = false }) => <AdminReportsPage resolvedOnly={resolvedOnly} basePath="/superadmin" />;

export default SuperAdminReportsPage;