import React, { useCallback, useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';
import { confirmAction, showError, showSuccess } from '../../services/alerts';

const roleBadge = {
  superadmin: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  admin: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  staff: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  barangay: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  user: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
};

const EMPTY_FORM = { name: '', email: '', role: 'staff', barangay: '' };

const SuperAdminUsers = () => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const isDark = theme === 'dark';

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.get('/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = response.data || {};
      setUsers((body.users || []).map((user) => ({
        ...user,
        id: user._id || user.id,
        status: user.isActive ? 'Active' : 'Inactive',
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
      })));
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Unable to load users.');
    }
  }, [token]);

  useEffect(() => {
    fetchUsers().catch(() => {});
  }, [fetchUsers]);

  const openEditor = (user) => {
    setSelectedUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'staff',
      barangay: user.barangay || '',
    });
    setIsEditing(true);
  };

  const closeEditor = () => {
    setSelectedUser(null);
    setForm(EMPTY_FORM);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    try {
      const response = await api.put(`/users/${selectedUser._id || selectedUser.id}`, {
        name: form.name,
        email: form.email,
        role: form.role,
        barangay: form.role === 'barangay' ? form.barangay : '',
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const body = response.data || {};
      if (!body) throw new Error(body.message || 'Unable to update user.');
      await fetchUsers();
      await showSuccess('User updated successfully.');
      closeEditor();
    } catch (error) {
      await showError(error.message || 'Failed to update user.');
    }
  };

  const handleDelete = async (userToDelete) => {
    const result = await confirmAction(`Delete ${userToDelete.name}? This action cannot be undone.`, 'Delete');
    if (!result.isConfirmed) return;

    try {
      const response = await api.delete(`/users/${userToDelete._id || userToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = response.data || {};
      if (!body) throw new Error(body.message || 'Unable to delete user.');
      await fetchUsers();
      await showSuccess('User deleted successfully.');
    } catch (error) {
      await showError(error.message || 'Failed to delete user.');
    }
  };

  const pageCount = Math.max(1, Math.ceil(users.length / 10));
  const visibleUsers = users.slice((page - 1) * 10, page * 10);

  return (
    <main className="min-h-screen bg-[#0a0b0f] px-4 pb-10 pt-24 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">Super Admin</p>
              <h1 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>User management</h1>
            </div>
            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-200">All roles</span>
          </div>
        </div>

        <div className={`overflow-hidden rounded-2xl border shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className={isDark ? 'bg-[#0a0b0f] text-gray-400' : 'bg-slate-50 text-slate-500'}>
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Barangay</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.length === 0 ? (
                  <tr><td colSpan="5" className={`px-4 py-10 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No users found.</td></tr>
                ) : (
                  visibleUsers.map((user) => (
                    <tr key={user.id} className={`border-t ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
                      <td className={`px-4 py-4 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</td>
                      <td className={`px-4 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{user.email}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${roleBadge[user.role] || roleBadge.staff}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className={`px-4 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{user.barangay || '—'}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-3">
                          <button type="button" onClick={() => openEditor(user)} title="Edit user" aria-label="Edit user" className="rounded-lg p-2 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                          </button>
                          <button type="button" onClick={() => handleDelete(user)} title="Delete user" aria-label="Delete user" className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2m-9 0l1 14h8l1-14M10 10v6m4-6v6" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 py-3">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Page {page} of {pageCount}</p>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className={`px-2 py-1.5 text-sm disabled:opacity-40 ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}>&lt;</button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={`px-2 py-1.5 text-sm ${page === pageNumber ? 'font-bold text-[#3b82f6]' : isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`} >{pageNumber}</button>
            ))}
            <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className={`px-2 py-1.5 text-sm disabled:opacity-40 ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}>&gt;</button>
          </div>
        </div>
      </div>

      {isEditing && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Edit user</h3>
              <button type="button" onClick={closeEditor} className="text-sm text-gray-400 hover:text-white">Close</button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm">
                <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>Full name</span>
                <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`} />
              </label>

              <label className="block text-sm">
                <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>Email</span>
                <input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`} />
              </label>

              <label className="block text-sm">
                <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>Role</span>
                <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))} className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="barangay">Barangay</option>
                  <option value="user">Citizen</option>
                </select>
              </label>

              {form.role === 'barangay' && (
                <label className="block text-sm">
                  <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>Barangay</span>
                  <input value={form.barangay} onChange={(event) => setForm((prev) => ({ ...prev, barangay: event.target.value }))} className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`} placeholder="Bonuan" />
                </label>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeEditor} className="rounded-lg border border-[#2e303a] px-4 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
              <button type="button" onClick={handleSave} className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2563eb]">Save changes</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default SuperAdminUsers;
