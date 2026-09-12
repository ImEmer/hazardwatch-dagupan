import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { confirmAction } from '../../services/alerts';

const MenuIcon = ({ close = false }) => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">{close ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /> : <><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></>}</svg>;
const LogoutIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M10 17l5-5-5-5M15 12H3m8 8h7a2 2 0 002-2V6a2 2 0 00-2-2h-7" /></svg>;

const BarangaySidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isDark = theme === 'dark';
  const normalized = (user?.barangay || '').trim().toLowerCase();
  const barangayPath = ['bonuan', 'lucao', 'tapuac'].includes(normalized) ? `/barangay/${normalized}` : '/barangay/bonuan';

  useEffect(() => setIsOpen(false), [pathname]);
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogout = async () => {
    const result = await confirmAction('Are you sure you want to logout?');
    if (!result.isConfirmed) return;
    setIsOpen(false);
    await logout();
    navigate('/login');
  };
  const linkClass = ({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? isDark ? 'bg-[#3b82f6]/15 text-[#60a5fa]' : 'bg-blue-50 text-blue-700' : isDark ? 'text-gray-300 hover:bg-[#14151d] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;
  const sidebar = <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r transition-transform duration-300 lg:z-40 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-white'}`}>
    <div className={`flex items-center justify-between border-b px-5 py-5 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}><NavLink to={`${barangayPath}/dashboard`} onClick={() => setIsOpen(false)} className="text-xl font-bold text-[#3b82f6]">HazardWatch</NavLink><button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/10 lg:hidden" aria-label="Close menu"><MenuIcon close /></button></div>
    <div className={`border-b px-5 py-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}><p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{user?.barangay || 'Barangay'} Dashboard</p><p className={`mt-2 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name}</p></div>
    <nav className="flex-1 space-y-1 px-3 py-4"><NavLink to={`${barangayPath}/dashboard`} end onClick={() => setIsOpen(false)} className={linkClass}><span aria-hidden="true">📊</span>Dashboard</NavLink><NavLink to={`${barangayPath}/reports`} onClick={() => setIsOpen(false)} className={linkClass}><span aria-hidden="true">📋</span>Reports</NavLink><NavLink to={`${barangayPath}/activity`} onClick={() => setIsOpen(false)} className={linkClass}><span aria-hidden="true">🕘</span>Activity</NavLink></nav>
    <div className={`space-y-2 border-t px-3 py-4 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}><button type="button" onClick={toggleTheme} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${isDark ? 'text-gray-300 hover:bg-[#14151d]' : 'text-slate-600 hover:bg-slate-100'}`}><span>Theme</span><span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span></button><button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"><LogoutIcon />Logout</button></div>
  </aside>;

  return <>
    <div className={`fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b px-4 lg:hidden ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}><button type="button" onClick={() => setIsOpen((value) => !value)} className="rounded-lg p-2" aria-label={isOpen ? 'Close menu' : 'Open menu'}><MenuIcon close={isOpen} /></button><span className="text-sm font-semibold">{user?.barangay || 'Barangay'} Barangay</span><button type="button" onClick={handleLogout} className="rounded-lg p-2 text-red-400" aria-label="Logout"><LogoutIcon /></button></div>
    {isOpen && <button type="button" aria-label="Close navigation" onClick={() => setIsOpen(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />}
    {sidebar}
  </>;
};

export default BarangaySidebar;
