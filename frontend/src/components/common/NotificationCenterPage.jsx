import React, { useEffect, useState } from 'react';
import { CheckCheck, ChevronLeft, ChevronRight, Mail, MailOpen } from 'lucide-react';
import { toast } from 'sonner';
import useTheme from '../../hooks/useTheme';
import { notificationApi } from '../../services/api';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

const relativeTime = (value) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min${Math.floor(seconds / 60) === 1 ? '' : 's'} ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr${Math.floor(seconds / 3600) === 1 ? '' : 's'} ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) === 1 ? '' : 's'} ago`;
  return new Date(value).toLocaleString();
};

const broadcastUnreadCount = (count) => window.dispatchEvent(new CustomEvent('hw:notifications-count', { detail: count }));

const NotificationCenterPage = () => {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  const fetchPage = async () => {
    setLoading(true);
    try {
      const { data } = await notificationApi.getNotifications({ filter, page, limit: 10 });
      setNotifications(data.notifications || []);
      setPagination(data.pagination || { page, pages: 1, total: 0 });
      setUnreadCount(data.unreadCount || 0);
      broadcastUnreadCount(data.unreadCount || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(); }, [filter, page]);

  const toggleRead = async (notification) => {
    setNotifications((current) => current.map((item) => item._id === notification._id ? { ...item, read: !notification.read } : item));
    const nextCount = Math.max(0, unreadCount + (notification.read ? 1 : -1));
    setUnreadCount(nextCount);
    broadcastUnreadCount(nextCount);
    try {
      if (notification.read) await notificationApi.markAsUnread(notification._id);
      else await notificationApi.markAsRead(notification._id);
      if (filter !== 'all') fetchPage();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update notification.');
      fetchPage();
    }
  };

  const markAllAsRead = async () => {
    const previous = notifications;
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    broadcastUnreadCount(0);
    try {
      await notificationApi.markAllAsRead();
      if (filter === 'unread') fetchPage();
    } catch (error) {
      setNotifications(previous);
      toast.error(error.response?.data?.message || 'Could not mark notifications as read.');
      fetchPage();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Stay up to date with report and account activity.</p>
        </div>
        <button type="button" onClick={markAllAsRead} disabled={!unreadCount} className="inline-flex items-center gap-2 rounded-lg border border-blue-500/40 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400">
          <CheckCheck size={16} aria-hidden="true" /> Mark all as read
        </button>
      </header>

      <div className={`flex gap-1 border-b ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`} role="tablist" aria-label="Filter notifications">
        {filters.map((item) => (
          <button key={item.value} type="button" role="tab" aria-selected={filter === item.value} onClick={() => { setFilter(item.value); setPage(1); }} className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${filter === item.value ? 'border-blue-500 text-blue-600 dark:text-blue-400' : `border-transparent ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}`}>
            {item.label}{item.value === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
        ))}
      </div>

      <section className={`overflow-hidden rounded-lg border ${isDark ? 'border-[#2e303a] bg-[#101116]' : 'border-slate-200 bg-white'}`} aria-live="polite">
        {loading ? <p className={`px-5 py-12 text-center text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Loading notifications...</p> : notifications.length === 0 ? (
          <p className={`px-5 py-14 text-center text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No notifications to show.</p>
        ) : notifications.map((notification) => (
          <article key={notification._id} className={`flex items-start gap-4 border-b p-4 last:border-b-0 sm:p-5 ${isDark ? 'border-[#2e303a]' : 'border-slate-100'} ${notification.read ? '' : isDark ? 'bg-blue-500/[0.06]' : 'bg-blue-50/50'}`}>
            <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${notification.read ? 'bg-transparent' : 'bg-blue-500'}`} aria-label={notification.read ? 'Read' : 'Unread'} />
            <div className="min-w-0 flex-1">
              <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{notification.title}</h2>
              <p className={`mt-1 text-sm leading-6 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{notification.message}</p>
              <time className={`mt-2 block text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`} dateTime={notification.createdAt}>{relativeTime(notification.createdAt)}</time>
            </div>
            <button type="button" onClick={() => toggleRead(notification)} className={`shrink-0 rounded-md p-2 ${isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`} title={notification.read ? 'Mark as unread' : 'Mark as read'} aria-label={notification.read ? 'Mark as unread' : 'Mark as read'}>
              {notification.read ? <Mail size={17} aria-hidden="true" /> : <MailOpen size={17} aria-hidden="true" />}
            </button>
          </article>
        ))}
      </section>

      <footer className={`flex flex-wrap items-center justify-between gap-3 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
        <span>{pagination.total || 0} notifications</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading} className={`rounded-md border p-2 disabled:opacity-40 ${isDark ? 'border-[#2e303a] hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`} aria-label="Previous page"><ChevronLeft size={16} /></button>
          <span>Page {pagination.page || page} of {Math.max(1, pagination.pages || 1)}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(pagination.pages || 1, current + 1))} disabled={page >= (pagination.pages || 1) || loading} className={`rounded-md border p-2 disabled:opacity-40 ${isDark ? 'border-[#2e303a] hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`} aria-label="Next page"><ChevronRight size={16} /></button>
        </div>
      </footer>
    </div>
  );
};

export default NotificationCenterPage;