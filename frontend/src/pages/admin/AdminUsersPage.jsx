import React, { useCallback, useEffect, useState } from 'react';
import useTheme from '../../hooks/useTheme';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { confirmAction, showError, showSuccess } from '../../services/alerts';
import UserFormModal from '../../components/common/UserFormModal';
import SuspendUserModal from '../../components/SuspendUserModal';
import { DAGUPAN_BARANGAYS } from '../../services/reportOptions';
import Skeleton from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import useDebounce from '../../hooks/useDebounce';

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

const roleKeyword = (value) => {
  const query = value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (query.startsWith('superadmin') || query.startsWith('super admin')) return 'superadmin';
  if (query.startsWith('cit') || query.startsWith('user')) return 'user';
  if (query.startsWith('bar')) return 'barangay';
  if (query.startsWith('admin')) return 'admin';
  return '';
};

const UserRow = React.memo(({ user, className, children }) => <tr data-user-id={user._id || user.id} className={className}>{children}</tr>);

const AdminUsersPage = () => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: PAGE_SIZE });
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [suspendingUser, setSuspendingUser] = useState(null);
  const [suspensionSaving, setSuspensionSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const handleSearchChange = useCallback((event) => {
    setSearch(event.target.value);
    setPage(1);
    setLoading(true);
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    if (search !== debouncedSearch) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users', {
        params: { page, limit: PAGE_SIZE, search: roleKeyword(debouncedSearch) || debouncedSearch.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = response.data || {};
      setUsers((body.users || []).filter((user) => user.status !== 'deleted').map((user) => ({
        ...user,
        id: user._id || user.id,
        status: user.status || (user.isActive ? 'active' : 'inactive'),
        statusLabel: user.status === 'suspended' ? 'Suspended' : user.status === 'banned' ? 'Banned' : user.status === 'deleted' ? 'Deleted' : user.isActive ? 'Active' : 'Inactive',
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
      })));
      setPagination(body.pagination || { total: 0, pages: 1, limit: PAGE_SIZE });
    } catch (error) {
      setUsers([]);
      setError(error.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, token]);

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

  const openEditor = (user) => {
    setSelectedUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'user',
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

    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      await showError('Password must be at least 8 characters and include uppercase, lowercase, and a number.');
      return;
    }
    if (form.role === 'barangay' && !form.barangay) {
      await showError('Barangay is required for Barangay users.');
      return;
    }
    setSaving(true);
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
    } finally { setSaving(false); }
  };

  const handleDelete = async (targetUser) => {
    if (!canManageTarget(targetUser)) return;
    const result = await confirmAction(`Delete ${targetUser.name}'s account? This action cannot be undone.`, 'Delete user');
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/users/${targetUser.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers((currentUsers) => currentUsers.filter((rowUser) => rowUser.id !== targetUser.id));
      await showSuccess('User deleted successfully.');
    } catch (error) {
      await showError(error.response?.data?.message || error.message || 'Failed to delete user.');
    }
  };

  const deleteSelected = async () => {
    const result = await confirmAction(`Delete ${selectedIds.length} selected users?`, 'Delete users');
    if (!result.isConfirmed) return;
    try {
      await api.delete('/users/bulk', { data: { ids: selectedIds }, headers: { Authorization: `Bearer ${token}` } });
      setSelectedIds([]);
      await fetchUsers();
      await showSuccess('Selected users deleted successfully.');
    } catch (error) { await showError(error.response?.data?.message || 'Unable to delete selected users.'); }
  };

  const confirmSuspension = async (details) => {
    if (!suspendingUser) return;
    setSuspensionSaving(true);
    try { await api.post(`/users/${suspendingUser.id}/suspend`, details, { headers: { Authorization: `Bearer ${token}` } }); setSuspendingUser(null); await fetchUsers(); await showSuccess('User suspended successfully.'); } catch (error) { await showError(error.response?.data?.message || 'Unable to suspend user.'); } finally { setSuspensionSaving(false); }
  };

  const changeRestriction = async (targetUser, action) => {
    if (!canManageTarget(targetUser)) return;
    if (action === 'suspend') { setSuspendingUser(targetUser); return; }
    const result = await confirmAction(`Unsuspend ${targetUser.name}'s account?`, 'Unsuspend user');
    if (!result.isConfirmed) return;
    try { await api.post(`/users/${targetUser.id}/unsuspend`, {}, { headers: { Authorization: `Bearer ${token}` } }); await fetchUsers(); await showSuccess('User unsuspended successfully.'); } catch (error) { await showError(error.response?.data?.message || 'Unable to unsuspend user.'); }
  };

  const visibleUsers = users;
  const userStats = [
    ['Total users', users.length, 'border-blue-500'],
    ['Citizens', users.filter((user) => user.role === 'user').length, 'border-gray-500'],
    ['Barangay accounts', users.filter((user) => user.role === 'barangay').length, 'border-emerald-500'],
    ['Admins', users.filter((user) => ['admin', 'superadmin'].includes(user.role)).length, 'border-red-500'],
  ];
  const canManageTarget = (targetUser) => {
    const levels = { user: 1, barangay: 2, staff: 2, admin: 3, superadmin: 4 };
    const currentId = currentUser?._id || currentUser?.id;
    return String(targetUser.id) !== String(currentId)
      && targetUser.role !== 'superadmin'
      && (levels[currentUser?.role] || 0) > (levels[targetUser.role] || 0);
  };

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {userStats.map(([label, value, tone]) => <div key={label} className={`rounded-2xl border-l-4 ${tone} border-y border-r p-4 shadow-xl ${isDark ? 'border-y-[#2e303a] border-r-[#2e303a] bg-[#14151d]' : 'border-y-slate-200 border-r-slate-200 bg-white'}`}><p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{label}</p><p className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p></div>)}
      </div>

      <div className={`overflow-hidden rounded-2xl border shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className={`border-b p-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
          <label htmlFor="user-search" className={`sr-only ${isDark ? 'text-white' : 'text-slate-900'}`}>Search users</label>
          <input id="user-search" type="search" value={search} onChange={handleSearchChange} placeholder="Search by name, email, role, or barangay" className={`w-full rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white placeholder:text-gray-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-200">
            <thead className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'bg-[#0a0b0f] text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
              <tr>
                <th className="px-4 py-3"><input type="checkbox" aria-label="Select all users" checked={visibleUsers.some(canManageTarget) && visibleUsers.filter(canManageTarget).every((user) => selectedIds.includes(user.id))} onChange={(event) => setSelectedIds(event.target.checked ? visibleUsers.filter(canManageTarget).map((user) => user.id) : [])} /></th>
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
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, rowIndex) => <tr key={rowIndex} className={`border-t ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>{Array.from({ length: 8 }).map((__, columnIndex) => <td key={columnIndex} className="px-4 py-4"><Skeleton className="h-5 w-3/4" /></td>)}</tr>)
              ) : error ? (
                <tr><td colSpan="8" className="px-4 py-10 text-center text-red-400">{error}</td></tr>
              ) : visibleUsers.length === 0 ? (
                <tr><td colSpan="7" className={`px-4 py-10 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No users found.</td></tr>
              ) : (
                visibleUsers.map((user) => (
                <UserRow key={user._id || user.id} user={user} className={`border-t ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
                  <td className="px-4 py-4"><input type="checkbox" aria-label={`Select ${user.name}`} disabled={!canManageTarget(user)} checked={selectedIds.includes(user.id)} onChange={() => setSelectedIds((current) => current.includes(user.id) ? current.filter((id) => id !== user.id) : [...current, user.id])} /></td>
                  <td className={`px-4 py-4 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</td>
                  <td className={`px-4 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{user.email}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${roleBadge[user.role] || roleBadge.staff}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className={`px-4 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{user.barangay || '—'}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusBadge[user.statusLabel] || statusBadge.Inactive}`}>
                      {user.statusLabel}
                    </span>
                  </td>
                  <td className={`px-4 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{user.lastLogin}</td>
                  <td className="px-4 py-4">
                    {canManageTarget(user) && <div className="flex items-center gap-1">
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
                      {['suspended', 'banned'].includes(user.status) ? <button type="button" onClick={() => changeRestriction(user, 'unsuspend')} className="rounded-lg p-2 text-emerald-400 hover:bg-emerald-500/10" title="Unsuspend user" aria-label="Unsuspend user"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 0113.7-5.7L20 9m0-5v5h-5M20 12a8 8 0 01-13.7 5.7L4 15m0 5v-5h5" /></svg></button> : <button type="button" onClick={() => changeRestriction(user, 'suspend')} className="rounded-lg p-2 text-amber-400 hover:bg-amber-500/10" title="Suspend user" aria-label="Suspend user"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M9 9l6 6M15 9l-6 6" /></svg></button>}
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
                    </div>}
                  </td>
                </UserRow>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedIds.length > 0 && <div className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-[#2e303a] bg-[#14151d] px-4 py-3 text-sm text-white shadow-2xl"><span>{selectedIds.length} selected</span><button type="button" onClick={deleteSelected} className="rounded-lg bg-red-600 px-3 py-2 font-semibold text-white">Delete Selected</button><button type="button" onClick={() => setSelectedIds([])} className="rounded-lg border border-[#2e303a] px-3 py-2 text-gray-300">Cancel</button></div>}
      <Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} itemsPerPage={PAGE_SIZE} onPageChange={setPage} isDark={isDark} />

      <SuspendUserModal isOpen={Boolean(suspendingUser)} isDark={isDark} targetUser={suspendingUser} currentUser={currentUser} userName={suspendingUser?.name || ''} saving={suspensionSaving} onClose={() => setSuspendingUser(null)} onConfirm={confirmSuspension} />

      {isEditing && selectedUser && (
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
                <input value={form.role} readOnly className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white opacity-80' : 'border-slate-200 bg-white text-slate-900 opacity-80'}`} />
              </label>

              {form.role === 'barangay' && (
                <label className="block text-sm">
                  <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>Barangay</span>
                  <select
                    value={form.barangay}
                    onChange={(event) => setForm((prev) => ({ ...prev, barangay: event.target.value }))}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                    required
                  ><option value="">Select barangay</option>{DAGUPAN_BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}</select>
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
      <UserFormModal isOpen={isCreating} isDark={isDark} form={form} saving={saving} isCreating barangayOptions={DAGUPAN_BARANGAYS} roleOptions={currentUser?.role === 'superadmin' ? [{ value: 'admin', label: 'Admin' }, { value: 'barangay', label: 'Barangay' }, { value: 'user', label: 'Citizen' }] : [{ value: 'barangay', label: 'Barangay' }, { value: 'user', label: 'Citizen' }]} onChange={(key, value) => setForm((previous) => ({ ...previous, [key]: value }))} onClose={closeCreator} onSubmit={(event) => { event.preventDefault(); handleCreate(); }} />
    </div>
  );
};

export default AdminUsersPage;
