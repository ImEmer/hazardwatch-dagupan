import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { confirmAction } from '../../services/alerts';

const items = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/map', label: 'Map View' },
  { to: '/admin/users', label: 'Users', roles: ['superadmin', 'admin'] },
  { to: '/admin/settings', label: 'Settings', roles: ['superadmin', 'admin', 'staff'] },
];

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const visibleItems = items.filter((item) => !item.roles || item.roles.includes(user?.role));

  const handleLogout = async () => {
    const result = await confirmAction('Are you sure you want to logout?');
    if (result.isConfirmed) {
      await logout();
      navigate('/');
    }
  };

  const isDark = theme === 'dark';

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 hidden h-screen w-72 flex-col border-r md:flex ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-800'}`}>
      <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
        <div>
          <p className="text-lg font-bold tracking-tight">HazardWatch</p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className={`relative flex h-8 w-14 items-center rounded-full border p-1 transition ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-slate-100'}`}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        >
          <span className={`flex h-6 w-6 items-center justify-center rounded-full transition-transform ${isDark ? 'translate-x-0 bg-slate-800 text-blue-200' : 'translate-x-6 bg-white text-amber-500 shadow-sm'}`}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {isDark ? <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A8.5 8.5 0 1111.2 3 6.5 6.5 0 0021 12.8z" /> : <><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3l1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3l1.42-1.42" /></>}
            </svg>
          </span>
        </button>
      </div>

      <div className={`border-b px-5 py-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Signed in as</p>
        <p className="mt-2 font-semibold">{user?.name || 'User'}</p>
        <p className={`text-xs capitalize ${isDark ? 'text-[#60a5fa]' : 'text-blue-600'}`}>{user?.role || 'staff'}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? isDark
                  ? 'bg-[#3b82f6]/15 text-[#60a5fa]'
                  : 'bg-blue-50 text-blue-700'
                : isDark
                  ? 'text-gray-300 hover:bg-[#14151d] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={`border-t px-3 py-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full rounded-xl px-3 py-2 text-left text-sm ${isDark ? 'text-red-300 hover:bg-[#14151d]' : 'text-red-600 hover:bg-red-50'}`}
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 17l5-5-5-5M15 12H3m8 8h7a2 2 0 002-2V6a2 2 0 00-2-2h-7" />
            </svg>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
