import React from 'react';
import ActivityPage from '../../components/ActivityPage';

const tabs = [{ key: 'all', label: 'All' }, { key: 'barangay', label: 'Barangay' }, { key: 'user', label: 'User' }];
const AdminActivityPage = () => <ActivityPage endpoint="/activity/public" tabs={tabs} title="Activity" />;

export default AdminActivityPage;
