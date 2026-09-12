import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { confirmAction } from '../../services/alerts';

const items = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/map', label: 'Map View' },
  { to: '/admin/activity', label: 'Activity', roles: ['superadmin', 'admin'] },
  { to: '/admin/users', label: 'Users', roles: ['superadmin', 'admin'] },
  { to: '/admin/settings', label: 'Settings', roles: ['superadmin', 'admin'] },
];
const MenuIcon = ({ close = false }) => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">{close ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /> : <><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></>}</svg>;

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const visibleItems = items.filter((item) => !item.roles || item.roles.includes(user?.role));
  useEffect(() => setIsOpen(false), [pathname]);
  useEffect(() => { const closeOnEscape = (event) => { if (event.key === 'Escape') setIsOpen(false); }; window.addEventListener('keydown', closeOnEscape); return () => window.removeEventListener('keydown', closeOnEscape); }, []);
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  const handleLogout = async () => { const result = await confirmAction('Are you sure you want to logout?'); if (result.isConfirmed) { await logout(); navigate('/'); } };
  const sidebar = <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-[#2e303a] bg-[#0a0b0f] p-4 text-white transition-transform duration-300 lg:z-40 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}><div className="mb-6 border-b border-[#2e303a] pb-4"><p className="text-xs uppercase tracking-[0.2em] text-gray-500">Signed in as</p><p className="mt-2 font-semibold">{user?.name || 'User'}</p><p className="text-xs capitalize text-[#60a5fa]">{user?.role || 'staff'}</p></div><nav className="space-y-1">{visibleItems.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setIsOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${isActive ? 'border-[#3b82f6]/20 text-[#3b82f6]' : 'border-transparent text-gray-300 hover:text-[#3b82f6]'}`}>{item.label}</NavLink>)}</nav><button type="button" onClick={handleLogout} className="mt-8 w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:text-[#3b82f6]">Logout</button></aside>;
  return <><div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#2e303a] bg-[#0a0b0f] px-4 text-white lg:hidden"><button type="button" onClick={() => setIsOpen((value) => !value)} className="rounded-lg p-2" aria-label={isOpen ? 'Close menu' : 'Open menu'}><MenuIcon close={isOpen} /></button><span className="text-sm font-semibold">Admin Panel</span><button type="button" onClick={handleLogout} className="rounded-lg p-2 text-red-400" aria-label="Logout">↪</button></div>{isOpen && <button type="button" aria-label="Close navigation" onClick={() => setIsOpen(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />}{sidebar}</>;
};

export default Sidebar;
