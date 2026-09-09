import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { confirmAction } from '../../services/alerts';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/submit', label: 'Submit Report' },
  { to: '/my-reports', label: 'My Reports', authenticated: true },
  { to: '/map', label: 'Hazard Map' },
  { to: '/about', label: 'About' },
  { to: '/help', label: 'Help' },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', roles: ['superadmin', 'admin', 'staff'] },
  { to: '/admin/reports', label: 'Reports', roles: ['superadmin', 'admin', 'staff'] },
  { to: '/admin/map', label: 'Map View', roles: ['superadmin', 'admin', 'staff'] },
  { to: '/admin/users', label: 'Users', roles: ['superadmin', 'admin'] },
  { to: '/admin/settings', label: 'Settings', roles: ['superadmin', 'admin', 'staff'] },
];

const linkClass = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition ${
  isActive ? 'text-[#3b82f6]' : 'text-gray-300 hover:text-[#3b82f6]'
}`;

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const canAccessAdmin = Boolean(isAuthenticated && ['superadmin', 'admin', 'staff'].includes(user?.role));

  useEffect(() => {
    const roleNotifications = {
      superadmin: [
        { id: 1, message: 'New report submitted in Bonuan', createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), isRead: false },
        { id: 2, message: 'Admin updated a report in Lucao', createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), isRead: false },
        { id: 3, message: 'System settings changed by super admin', createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), isRead: true },
      ],
      admin: [
        { id: 1, message: 'New user registered: Maria Santos', createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), isRead: false },
        { id: 2, message: 'Staff updated report #456', createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(), isRead: true },
      ],
      barangay: [
        { id: 1, message: 'Report #789 updated to Resolved', createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), isRead: false },
        { id: 2, message: 'New report submitted in your barangay', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), isRead: true },
      ],
      user: [
        { id: 1, message: 'Your report is under review', createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), isRead: false },
      ],
    };

    if (isAuthenticated && user?.role) {
      setNotifications(roleNotifications[user.role] || []);
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, user?.role]);

  const authenticatedLinks = publicLinks.filter((item) => !item.authenticated || isAuthenticated);
  const links = canAccessAdmin
    ? [...authenticatedLinks, ...adminLinks.filter((item) => item.roles.includes(user.role))]
    : authenticatedLinks;

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const formatTime = (value) => {
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.max(1, Math.round(diff / 60000));
    if (minutes < 60) return `${minutes} min ago`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} hr ago`;
    return `${Math.round(minutes / 1440)} day ago`;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    const result = await confirmAction('Are you sure you want to logout?');
    if (result.isConfirmed) {
      await logout();
      setMenuOpen(false);
      navigate('/');
    }
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 h-16 transition ${
      scrolled ? 'border-b border-[#2e303a] bg-[#0a0b0f]/95 backdrop-blur-md' : 'bg-transparent'
    }`}>
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 md:px-6">
        <Link to="/" className="text-lg font-bold tracking-tight text-white" onClick={() => setMenuOpen(false)}>
          HazardWatch
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((item) => <NavLink key={item.to} to={item.to} className={linkClass}>{item.label}</NavLink>)}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications((open) => !open)}
                  className="relative rounded-lg p-2 text-gray-300 transition hover:bg-[#14151d] hover:text-white"
                  aria-label="Open notifications"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 rounded-xl border border-[#2e303a] bg-[#14151d] p-1 shadow-xl">
                    <div className="border-b border-[#2e303a] p-3"><p className="font-semibold text-white">Notifications</p></div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-sm text-gray-400">No notifications</div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="border-b border-[#2e303a] p-3 last:border-0 hover:bg-[#0a0b0f]">
                          <p className="text-sm text-white">{notification.message}</p>
                          <p className="mt-1 text-xs text-gray-400">{formatTime(notification.createdAt)}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={() => setAccountOpen((open) => !open)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-300 hover:text-white" aria-expanded={accountOpen}>
                  <span aria-hidden="true">{user.name}</span><span aria-hidden="true" className="text-xs">&#9662;</span>
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-12 w-44 rounded-xl border border-[#2e303a] bg-[#14151d] p-1 shadow-xl">
                    <Link to="/profile" onClick={() => setAccountOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-[#0a0b0f] hover:text-white">Go to My Profile</Link>
                  </div>
                )}
              </div>
              <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-sm text-gray-300 transition hover:bg-red-500/10 hover:text-red-400">Logout</button>
            </>
          ) : (
            <Link to="/login" className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2563eb]">Login</Link>
          )}
        </div>

        <button type="button" className="rounded-lg border border-[#2e303a] p-2 text-gray-300 transition hover:bg-[#14151d] hover:text-white md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen}>
          {menuOpen ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
          ) : (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      <nav className={`overflow-hidden border-b border-[#2e303a] bg-[#0a0b0f] px-4 transition-all duration-300 md:hidden ${menuOpen ? 'max-h-96 py-2 pb-4 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
          <div className="flex flex-col gap-1">
            {links.map((item) => <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setMenuOpen(false)}>{item.label}</NavLink>)}
            {isAuthenticated ? (
              <><NavLink to="/profile" className={linkClass} onClick={() => setMenuOpen(false)}>Go to My Profile ({user.name})</NavLink><button onClick={handleLogout} className="mt-2 rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition hover:bg-red-500/10 hover:text-red-400">Logout</button></>
            ) : <NavLink to="/login" className={linkClass} onClick={() => setMenuOpen(false)}>Login</NavLink>}
          </div>
      </nav>
    </header>
  );
};

export default Navbar;
