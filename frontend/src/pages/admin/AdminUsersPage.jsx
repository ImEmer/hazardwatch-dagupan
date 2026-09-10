import React, { useCallback, useEffect, useState } from 'react';
import useTheme from '../../hooks/useTheme';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { showError, showSuccess } from '../../services/alerts';

const roleBadge = {
  superadmin: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  admin: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  staff: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  barangay: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  user: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
};

const statusBadge = {
  Active: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Inactive: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

const PAGE_SIZE = 10;
const EMPTY_FORM = { name: '', email: '', role: 'staff', barangay: '' };

const AdminUsersPage = () => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const { theme } = useTheme();
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
    const interval = window.setInterval(() => fetchUsers().catch(() => {}), 30000);
    const handleFocus = () => fetchUsers().catch(() => {});
    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [users.length]);

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

    if (currentUser?.role === 'admin' && (form.role === 'superadmin' || selectedUser.role === 'superadmin')) {
      await showError('Admins cannot edit or promote a superadmin account.');
      return;
    }

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

  const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const visibleUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-4 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Staff access</p>
            <h2 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>User management</h2>
          </div>
          <button className="rounded-lg bg-[#3b82f6] px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-[#3b82f6]/20 hover:bg-[#2563eb]">
            + Add user
          </button>
        </div>
      </div>

      <div className={`overflow-hidden rounded-2xl border shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-200">
            <thead className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'bg-[#0a0b0f] text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
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
              {visibleUsers.length === 0 ? (
                <tr><td colSpan="7" className={`px-4 py-10 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No users found.</td></tr>
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
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusBadge[user.status] || statusBadge.Inactive}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className={`px-4 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{user.lastLogin}</td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => openEditor(user)}
                      className="text-xs text-[#3b82f6] hover:text-[#60a5fa]"
                    >
                      Edit
                    </button>
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
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className={`px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`} aria-label="Previous page">&lt;</button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button type="button" key={pageNumber} onClick={() => setPage(pageNumber)} className={`px-2 py-1.5 text-sm ${page === pageNumber ? 'font-bold text-[#3b82f6]' : isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}>{pageNumber}</button>
          ))}
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className={`px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`} aria-label="Next page">&gt;</button>
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
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                />
              </label>

              <label className="block text-sm">
                <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                />
              </label>

              <label className="block text-sm">
                <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>Role</span>
                <select
                  value={form.role}
                  onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                  disabled={currentUser?.role === 'admin' && selectedUser.role === 'superadmin'}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                >
                  <option value="staff">Staff</option>
                  <option value="barangay">Barangay</option>
                  <option value="user">Citizen</option>
                  {currentUser?.role === 'superadmin' && <option value="admin">Admin</option>}
                  {currentUser?.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                </select>
              </label>

              {form.role === 'barangay' && (
                <label className="block text-sm">
                  <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>Barangay</span>
                  <input
                    value={form.barangay}
                    onChange={(event) => setForm((prev) => ({ ...prev, barangay: event.target.value }))}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                    placeholder="Bonuan"
                  />
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
    </div>
  );
};

export default AdminUsersPage;
