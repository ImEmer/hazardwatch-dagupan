import React from 'react';
import ActivityPage from '../../components/ActivityPage';

const tabs = [{ key: 'all', label: 'All' }, { key: 'admin', label: 'Admin' }, { key: 'barangay', label: 'Barangay' }, { key: 'user', label: 'User' }, { key: 'superadmin', label: 'SuperAdmin' }];
const SuperAdminActivityPage = () => <ActivityPage endpoint="/activity/all" tabs={tabs} title="System activity" />;

export default SuperAdminActivityPage;
