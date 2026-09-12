import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { confirmAction } from '../../services/alerts';

const items = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/map', label: 'Map View' },
  { to: '/admin/activity', label: 'Activity', roles: ['admin'] },
  { to: '/superadmin/activity', label: 'Activity', roles: ['superadmin'] },
  { to: '/admin/users', label: 'Users', roles: ['superadmin', 'admin'] },
  { to: '/admin/settings', label: 'Settings', roles: ['superadmin', 'admin', 'staff'] },
];

const MenuIcon = ({ close = false }) => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">{close ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /> : <><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></>}</svg>;
const LogoutIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M10 17l5-5-5-5M15 12H3m8 8h7a2 2 0 002-2V6a2 2 0 00-2-2h-7" /></svg>;

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isDark = theme === 'dark';
  const visibleItems = items.filter((item) => !item.roles || item.roles.includes(user?.role));

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogout = async () => {
    const result = await confirmAction('Are you sure you want to logout?');
    if (result.isConfirmed) {
      setIsOpen(false);
      await logout();
      navigate('/');
    }
  };

  const linkClass = ({ isActive }) => `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? isDark ? 'bg-[#3b82f6]/15 text-[#60a5fa]' : 'bg-blue-50 text-blue-700' : isDark ? 'text-gray-300 hover:bg-[#14151d] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;

  const sidebar = <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r transition-transform duration-300 lg:z-40 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-800'}`}>
    <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
      <p className="text-lg font-bold tracking-tight">HazardWatch</p>
      <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/10 lg:hidden" aria-label="Close menu"><MenuIcon close /></button>
      <button type="button" onClick={toggleTheme} className={`relative hidden h-8 w-14 items-center rounded-full border p-1 transition lg:flex ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-slate-100'}`} aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`} title={`Switch to ${isDark ? 'light' : 'dark'} theme`}>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full transition-transform ${isDark ? 'translate-x-0 bg-slate-800 text-blue-200' : 'translate-x-6 bg-white text-amber-500 shadow-sm'}`}><span aria-hidden="true">{isDark ? '◐' : '☼'}</span></span>
      </button>
    </div>
    <div className={`border-b px-5 py-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}><p className="text-xs uppercase tracking-[0.2em] text-gray-400">Signed in as</p><p className="mt-2 font-semibold">{user?.name || 'User'}</p><p className={`text-xs capitalize ${isDark ? 'text-[#60a5fa]' : 'text-blue-600'}`}>{user?.role || 'staff'}</p></div>
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">{visibleItems.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setIsOpen(false)} className={linkClass}>{item.label}</NavLink>)}</nav>
    <div className={`border-t px-3 py-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}><button type="button" onClick={handleLogout} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${isDark ? 'text-red-300 hover:bg-[#14151d]' : 'text-red-600 hover:bg-red-50'}`}><LogoutIcon />Logout</button></div>
  </aside>;

  return <>
    <div className={`fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b px-4 lg:hidden ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
      <button type="button" onClick={() => setIsOpen((value) => !value)} className="rounded-lg p-2" aria-label={isOpen ? 'Close menu' : 'Open menu'}><MenuIcon close={isOpen} /></button>
      <span className="text-sm font-semibold">{user?.role === 'superadmin' ? 'SuperAdmin Panel' : 'Admin Panel'}</span>
      <button type="button" onClick={handleLogout} className="rounded-lg p-2 text-red-400" aria-label="Logout"><LogoutIcon /></button>
    </div>
    {isOpen && <button type="button" aria-label="Close navigation" onClick={() => setIsOpen(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />}
    {sidebar}
  </>;
};

export default AdminSidebar;
