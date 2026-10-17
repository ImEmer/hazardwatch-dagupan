import React from 'react';
import ActivityPage from '../../components/ActivityPage';
import useAuth from '../../hooks/useAuth';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'reports', label: 'Reports' },
  { key: 'users', label: 'Users' },
];

const BarangayActivityPage = () => {
  const { user, loading } = useAuth();

  if (loading) return <p className="py-8 text-center text-gray-400">Loading activity...</p>;
  if (!user?.barangay) return <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">Your account is not assigned to a barangay.</p>;

  return (
    <ActivityPage
      endpoint={`/activity/barangay/${encodeURIComponent(user.barangay)}`}
      tabs={tabs}
      title={`${user.barangay} activity`}
      roleParam={false}
      categoryParam
    />
  );
};

export default BarangayActivityPage;
