import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { confirmAction } from '../../services/alerts';

const BarangaySidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const barangayPath = (() => {
    const normalized = (user?.barangay || '').trim().toLowerCase();
    if (normalized === 'bonuan') return '/barangay/bonuan';
    if (normalized === 'lucao') return '/barangay/lucao';
    if (normalized === 'tapuac') return '/barangay/tapuac';
    return '/barangay/bonuan';
  })();

  const handleLogout = async () => {
    const result = await confirmAction('Are you sure you want to logout?');
    if (!result.isConfirmed) return;
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? isDark ? 'bg-[#3b82f6]/15 text-[#60a5fa]' : 'bg-blue-50 text-blue-700' : isDark ? 'text-gray-300 hover:bg-[#14151d] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r md:flex ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-white'}`}>
      <div className={`border-b px-5 py-5 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
        <NavLink to={`${barangayPath}/dashboard`} className="text-xl font-bold text-[#3b82f6]">HazardWatch</NavLink>
        <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{user?.barangay || 'Barangay'} Dashboard</p>
      </div>
      <div className={`border-b px-5 py-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}><p className={`text-xs uppercase tracking-[0.18em] ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Signed in as</p><p className={`mt-2 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name}</p></div>
      <nav className="flex-1 space-y-1 px-3 py-4"><NavLink to={`${barangayPath}/dashboard`} end className={linkClass}><span aria-hidden="true">📊</span>Dashboard</NavLink><NavLink to={`${barangayPath}/reports`} className={linkClass}><span aria-hidden="true">📋</span>Reports</NavLink></nav>
      <div className={`space-y-2 border-t px-3 py-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
        <button type="button" onClick={toggleTheme} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${isDark ? 'text-gray-300 hover:bg-[#14151d]' : 'text-slate-600 hover:bg-slate-100'}`}><span>Theme</span><span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span></button>
        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"><span aria-hidden="true">🚪</span>Logout</button>
      </div>
    </aside>
  );
};

export default BarangaySidebar;