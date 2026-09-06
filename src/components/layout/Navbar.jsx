import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const publicLinks = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/submit', label: 'Submit Report', icon: '✎' },
  { to: '/map', label: 'Hazard Map', icon: '⌖' },
  { to: '/track', label: 'Track Report', icon: '⌕' },
  { to: '/about', label: 'About', icon: 'ⓘ' },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/map', label: 'Map' },
  { to: '/admin/users', label: 'Users', roles: ['superadmin', 'admin'] },
  { to: '/admin/settings', label: 'Settings' },
];

const linkClass = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition ${
  isActive ? 'bg-[#3b82f6]/10 text-[#60a5fa]' : 'text-gray-300 hover:bg-[#14151d] hover:text-white'
}`;

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const links = isAuthenticated
    ? adminLinks.filter((item) => !item.roles || item.roles.includes(user.role))
    : publicLinks;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 h-16 transition ${
      scrolled ? 'border-b border-[#2e303a] bg-[#0a0b0f]/95 backdrop-blur-md' : 'bg-transparent'
    }`}>
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 md:px-6">
        <Link to="/" className="text-lg font-bold tracking-tight text-white" onClick={() => setMenuOpen(false)}>
          ⚠️ HazardWatch
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((item) => <NavLink key={item.to} to={item.to} className={linkClass}>{item.icon ? `${item.icon} ` : ''}{item.label}</NavLink>)}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-300">{user.name}</span>
              <button onClick={handleLogout} className="rounded-lg border border-[#2e303a] px-3 py-2 text-sm text-gray-300 hover:text-white">Logout</button>
            </>
          ) : (
            <Link to="/login" className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2563eb]">Login</Link>
          )}
        </div>

        <button className="rounded-lg border border-[#2e303a] px-3 py-2 text-white md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation menu">
          {menuOpen ? '×' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <nav className="border-b border-[#2e303a] bg-[#0a0b0f] px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((item) => <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setMenuOpen(false)}>{item.icon ? `${item.icon} ` : ''}{item.label}</NavLink>)}
            {isAuthenticated ? (
              <button onClick={handleLogout} className="mt-2 rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-[#14151d]">Logout ({user.name})</button>
            ) : <NavLink to="/login" className={linkClass} onClick={() => setMenuOpen(false)}>🔐 Login</NavLink>}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
