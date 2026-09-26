import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';

const relativeTime = (value) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min${Math.floor(seconds / 60) === 1 ? '' : 's'} ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr${Math.floor(seconds / 3600) === 1 ? '' : 's'} ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) === 1 ? '' : 's'} ago`;
  return new Date(value).toLocaleDateString();
};

const NotificationDropdown = ({ open, setOpen, bellRef, notifications, onMarkAsRead, onMarkAllAsRead }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const isDark = theme === 'dark';
  const pagePath = user?.role === 'barangay' ? '/barangay/notifications' : user?.role === 'superadmin' ? '/superadmin/notifications' : '/admin/notifications';

  useEffect(() => {
    if (!open || !bellRef.current) return undefined;
    const updatePosition = () => {
      const rect = bellRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(360, window.innerWidth - 24);
      const sidebarRight = bellRef.current.closest('aside')?.getBoundingClientRect().right || 0;
      const anchorRight = window.innerWidth >= 1024 ? Math.max(rect.right, sidebarRight) : rect.right;
      const left = Math.min(Math.max(12, anchorRight + 8), window.innerWidth - width - 12);
      setPosition({ top: Math.min(rect.bottom + 8, window.innerHeight - 480), left });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, bellRef]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (!dropdownRef.current?.contains(event.target) && !bellRef.current?.contains(event.target)) setOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, setOpen, bellRef]);

  if (!open) return null;
  return createPortal(
    <section
      ref={dropdownRef}
      role="dialog"
      aria-label="Notifications"
      className={`fixed z-[60] flex max-h-[min(30rem,calc(100vh-2rem))] w-[min(22.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border shadow-2xl ${isDark ? 'border-[#2e303a] bg-[#14151d] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
      style={{ top: Math.max(12, position.top), left: position.left }}
    >
      <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
        <h2 className="text-sm font-bold">Notifications</h2>
        <button type="button" onClick={onMarkAllAsRead} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400" title="Mark all as read">
          <CheckCheck size={15} aria-hidden="true" /> Mark all read
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className={`px-5 py-10 text-center text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>You’re all caught up.</p>
        ) : notifications.map((notification) => (
          <button
            type="button"
            key={notification._id}
            onClick={() => !notification.read && onMarkAsRead(notification._id)}
            className={`flex w-full gap-3 border-b px-4 py-3 text-left transition ${isDark ? 'border-[#2e303a] hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'} ${!notification.read ? isDark ? 'bg-blue-500/10' : 'bg-blue-50/70' : ''}`}
          >
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? 'bg-transparent' : 'bg-blue-500'}`} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{notification.title}</span>
              <span className={`mt-0.5 block text-xs leading-5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{notification.message}</span>
              <span className={`mt-1 block text-[11px] ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{relativeTime(notification.createdAt)}</span>
            </span>
          </button>
        ))}
      </div>
      <Link to={pagePath} onClick={() => setOpen(false)} className={`border-t px-4 py-3 text-center text-sm font-semibold text-blue-600 hover:bg-blue-500/5 dark:text-blue-400 ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
        View all notifications
      </Link>
    </section>,
    document.body,
  );
};

export default NotificationDropdown;