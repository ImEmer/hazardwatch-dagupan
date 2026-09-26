import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import useTheme from '../../hooks/useTheme';
import { notificationApi } from '../../services/api';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell = ({ onOpen }) => {
  const { theme } = useTheme();
  const bellRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const isDark = theme === 'dark';

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await notificationApi.getNotifications({ filter: 'all', limit: 10 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('[notifications] Error:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 60000);
    return () => window.clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleUnreadCount = (event) => {
      setUnreadCount(event.detail);
      fetchNotifications();
    };
    window.addEventListener('hw:notifications-count', handleUnreadCount);
    return () => window.removeEventListener('hw:notifications-count', handleUnreadCount);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    const notification = notifications.find((item) => item._id === id);
    if (!notification || notification.read) return;
    setNotifications((current) => current.map((item) => item._id === id ? { ...item, read: true } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await notificationApi.markAsRead(id);
    } catch (error) {
      console.error('[notifications] Could not mark as read:', error);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    const previous = notifications;
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    try {
      await notificationApi.markAllAsRead();
    } catch (error) {
      console.error('[notifications] Could not mark all as read:', error);
      setNotifications(previous);
      fetchNotifications();
    }
  };

  return (
    <>
      <button
        ref={bellRef}
        type="button"
        onClick={() => setOpen((current) => {
          const next = !current;
          if (next) onOpen?.();
          return next;
        })}
        className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${isDark ? 'text-gray-200 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'}`}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        title="Notifications"
      >
        <Bell size={19} aria-hidden="true" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      <NotificationDropdown
        open={open}
        setOpen={setOpen}
        bellRef={bellRef}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />
    </>
  );
};

export default NotificationBell;