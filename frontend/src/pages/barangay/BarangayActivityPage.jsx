import React from 'react';
import ActivityPage from '../../components/ActivityPage';
import useAuth from '../../hooks/useAuth';

const BarangayActivityPage = () => {
  const { user } = useAuth();
  const endpoint = user?.barangay ? `/activity/barangay/${encodeURIComponent(user.barangay)}` : '/activity/me';
  return <ActivityPage endpoint={endpoint} tabs={[{ key: 'all', label: 'All' }]} title={`${user?.barangay || 'Barangay'} activity`} />;
};

export default BarangayActivityPage;
