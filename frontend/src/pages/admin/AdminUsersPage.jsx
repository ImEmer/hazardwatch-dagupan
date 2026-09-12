import React, { useCallback, useEffect, useState } from 'react';
import useTheme from '../../hooks/useTheme';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { confirmAction, showError, showSuccess } from '../../services/alerts';

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
const EMPTY_FORM = { name: '', email: '', password: '', role: 'user', barangay: '' };

const AdminUsersPage = () => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
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
      password: '',
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

  const openCreator = () => {
    setSelectedUser(null);
    setForm(EMPTY_FORM);
    setIsCreating(true);
  };

  const closeCreator = () => {
    setForm(EMPTY_FORM);
    setIsCreating(false);
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

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      await showError('Name, email, and password are required.');
      return;
    }

    try {
      await api.post('/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        barangay: form.role === 'barangay' ? form.barangay.trim() : '',
      }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchUsers();
      closeCreator();
      await showSuccess('User created successfully.');
    } catch (error) {
      await showError(error.response?.data?.message || error.message || 'Failed to create user.');
    }
  };

  const handleDelete = async (user) => {
    if (user.role === 'superadmin' || user.role === 'admin' || user.role === 'staff' || user.id === currentUser?._id) return;
    const result = await confirmAction(`Deactivate ${user.name}'s account?`, 'Delete user');
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/users/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchUsers();
      await showSuccess('User deactivated successfully.');
    } catch (error) {
      await showError(error.response?.data?.message || error.message || 'Failed to delete user.');
    }
  };

  const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const filteredUsers = users.filter((user) => [user.name, user.email, user.role, user.barangay]
    .some((value) => String(value || '').toLowerCase().includes(search.toLowerCase())));
  const filteredPageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const visibleUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-4 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Staff access</p>
            <h2 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>User management</h2>
          </div>
          <button type="button" onClick={openCreator} className="rounded-lg bg-[#3b82f6] px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-[#3b82f6]/20 hover:bg-[#2563eb]">
            + Add user
          </button>
        </div>
      </div>

      <div className={`overflow-hidden rounded-2xl border shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className={`border-b p-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
          <label htmlFor="user-search" className={`sr-only ${isDark ? 'text-white' : 'text-slate-900'}`}>Search users</label>
          <input id="user-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by name, email, role, or barangay" className={`w-full rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white placeholder:text-gray-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`} />
        </div>
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
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditor(user)}
                        disabled={currentUser?.role === 'admin' && user.role === 'superadmin'}
                        title={currentUser?.role === 'admin' && user.role === 'superadmin' ? 'Only a SuperAdmin can modify another SuperAdmin.' : 'Edit user'}
                        aria-label="Edit user"
                        className="rounded-lg p-2 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        disabled={user.role === 'admin' || user.role === 'superadmin' || user.role === 'staff' || user.id === (currentUser?._id || currentUser?.id)}
                        title="Delete user"
                        aria-label="Delete user"
                        className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
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
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Page {page} of {filteredPageCount}</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className={`px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`} aria-label="Previous page">&lt;</button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button type="button" key={pageNumber} onClick={() => setPage(pageNumber)} className={`px-2 py-1.5 text-sm ${page === pageNumber ? 'font-bold text-[#3b82f6]' : isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}>{pageNumber}</button>
          ))}
          <button type="button" onClick={() => setPage((current) => Math.min(filteredPageCount, current + 1))} disabled={page === filteredPageCount} className={`px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`} aria-label="Next page">&gt;</button>
        </div>
      </div>

      {(isEditing && selectedUser || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{isCreating ? 'Add user' : 'Edit user'}</h3>
              <button type="button" onClick={isCreating ? closeCreator : closeEditor} className="text-sm text-gray-400 hover:text-white">Close</button>
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

              {isCreating && (
                <label className="block text-sm">
                  <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>Password</span>
                  <input type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`} />
                </label>
              )}

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
                  <option value="barangay">Barangay</option>
                  <option value="user">Citizen</option>
                  {!isCreating && <option value="staff">Staff</option>}
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
              <button type="button" onClick={isCreating ? closeCreator : closeEditor} className="rounded-lg border border-[#2e303a] px-4 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
              <button type="button" onClick={isCreating ? handleCreate : handleSave} className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2563eb]">{isCreating ? 'Create user' : 'Save changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
