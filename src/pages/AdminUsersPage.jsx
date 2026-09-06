import React, { useState } from 'react';

const initialUsers = [
  { id: 1, name: 'Marian Dela Cruz', email: 'marian@hazardwatch.gov', role: 'Admin', barangay: 'City Hall', status: 'Active', lastLogin: '2026-09-04' },
  { id: 2, name: 'Joel Ramos', email: 'joel@hazardwatch.gov', role: 'Staff', barangay: 'Bonuan Gueset', status: 'Active', lastLogin: '2026-09-05' },
  { id: 3, name: 'Rhea Santos', email: 'rhea@hazardwatch.gov', role: 'Barangay', barangay: 'Lucao', status: 'Inactive', lastLogin: '2026-09-01' },
  { id: 4, name: 'Aldrin Perez', email: 'aldrin@hazardwatch.gov', role: 'Staff', barangay: 'Tapuac', status: 'Active', lastLogin: '2026-09-06' },
];

const roleBadge = {
  Admin: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  Staff: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  Barangay: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
};

const statusBadge = {
  Active: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Inactive: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

const AdminUsersPage = () => {
  const [users] = useState(initialUsers);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-4 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Staff access</p>
            <h2 className="mt-2 text-2xl font-bold text-white">User management</h2>
          </div>
          <button className="rounded-lg bg-[#3b82f6] px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-[#3b82f6]/20 hover:bg-[#2563eb]">
            + Add user
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#2e303a] bg-[#14151d] shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-200">
            <thead className="bg-[#0a0b0f] text-xs uppercase tracking-[0.2em] text-gray-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Barangay</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-[#2e303a]">
                  <td className="px-4 py-4 font-medium text-white">{user.name}</td>
                  <td className="px-4 py-4 text-gray-300">{user.email}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${roleBadge[user.role] || roleBadge.Staff}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-300">{user.barangay}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusBadge[user.status] || statusBadge.Inactive}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-300">{user.lastLogin}</td>
                  <td className="px-4 py-4">
                    <button className="text-xs text-[#3b82f6] hover:text-[#60a5fa]">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
