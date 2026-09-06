import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const items = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '▣' },
  { to: '/admin/reports', label: 'Reports', icon: '◫' },
  { to: '/admin/map', label: 'Map', icon: '⌖' },
  { to: '/admin/users', label: 'Users', icon: '◍', roles: ['superadmin', 'admin'] },
  { to: '/admin/settings', label: 'Settings', icon: '⚙' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const visibleItems = items.filter((item) => !item.roles || item.roles.includes(user?.role));

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <button className="mb-3 rounded-lg border border-[#2e303a] px-3 py-2 text-sm text-gray-300 xl:hidden" onClick={() => setOpen((value) => !value)}>
        {open ? 'Hide menu' : 'Show admin menu'}
      </button>
      <aside className={`${open ? 'block' : 'hidden'} w-full shrink-0 rounded-2xl border border-[#2e303a] bg-[#0a0b0f] p-4 xl:block xl:w-64`}>
        <div className="mb-6 border-b border-[#2e303a] pb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Signed in as</p>
          <p className="mt-2 font-semibold text-white">{user?.name || 'User'}</p>
          <p className="text-xs capitalize text-[#60a5fa]">{user?.role || 'staff'}</p>
        </div>
        <nav className="space-y-1">
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${isActive ? 'border-[#3b82f6]/20 bg-[#3b82f6]/10 text-[#60a5fa]' : 'border-transparent text-gray-300 hover:bg-[#14151d] hover:text-white'}`}>
              <span>{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="mt-8 w-full rounded-lg border border-red-500/20 px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10">Logout</button>
      </aside>
    </>
  );
};

export default Sidebar;
