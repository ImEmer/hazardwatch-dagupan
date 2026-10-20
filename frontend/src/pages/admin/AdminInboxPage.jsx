import React, { useCallback, useEffect, useState } from 'react';
import { Check, Mail } from 'lucide-react';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';
import { showError, showSuccess } from '../../services/alerts';
import { formatDateTime } from '../../utils/formatDate';
import { useSocket } from '../../context/SocketContext';

const AdminInboxPage = () => {
  const { socket } = useSocket();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('unread');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/contact');
      const fetchedMessages = response.data?.messages || [];
      setMessages((current) => {
        const liveById = new Map(current.map((message) => [message._id, message]));
        const fetchedIds = new Set(fetchedMessages.map((message) => message._id));
        return [
          ...fetchedMessages.map((message) => liveById.get(message._id) || message),
          ...current.filter((message) => !fetchedIds.has(message._id)),
        ];
      });
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load contact messages.';
      setError(message);
      await showError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!socket) return undefined;

    const prependMessage = (incomingMessage) => {
      setMessages((current) => [
        incomingMessage,
        ...current.filter((message) => message._id !== incomingMessage._id),
      ]);
    };
    const updateMessage = (updatedMessage) => {
      setMessages((current) => {
        const exists = current.some((message) => message._id === updatedMessage._id);
        return exists
          ? current.map((message) => message._id === updatedMessage._id ? updatedMessage : message)
          : [updatedMessage, ...current];
      });
    };

    socket.on('new-contact-message', prependMessage);
    socket.on('contact-message-updated', updateMessage);
    return () => {
      socket.off('new-contact-message', prependMessage);
      socket.off('contact-message-updated', updateMessage);
    };
  }, [socket]);

  const markResolved = async (messageId) => {
    setUpdatingId(messageId);
    try {
      const response = await api.patch(`/contact/${messageId}/status`, { status: 'resolved' });
      setMessages((current) => current.map((message) => (
        message._id === messageId ? response.data.message : message
      )));
      await showSuccess('Message marked as resolved.');
    } catch (requestError) {
      await showError(requestError.response?.data?.message || 'Unable to update message status.');
    } finally {
      setUpdatingId('');
    }
  };

  const panelClass = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';
  const visibleMessages = messages.filter((message) => {
    if (activeTab === 'unread') return message.status === 'new' || message.status === 'unread';
    if (activeTab === 'resolved') return message.status === 'resolved';
    return true;
  });
  const tabs = [
    { key: 'unread', label: 'Unread', count: messages.filter((message) => message.status === 'new' || message.status === 'unread').length },
    { key: 'resolved', label: 'Resolved' },
    { key: 'all', label: 'All' },
  ];

  return (
    <main className="space-y-6">
      <header>
        <div>
          <p className={`text-xs uppercase tracking-[0.25em] ${mutedClass}`}>Support</p>
          <h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Contact Inbox</h1>
        </div>
      </header>

      <nav className={`flex gap-2 border-b ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`} aria-label="Filter contact messages">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}
            className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${activeTab === tab.key ? 'border-[#3b82f6] text-[#3b82f6]' : `border-transparent ${mutedClass}`}`}
          >
            {tab.label}
            {tab.count > 0 && <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-400">{tab.count}</span>}
          </button>
        ))}
      </nav>

      {loading ? (
        <p className={`rounded-xl border p-8 text-center ${panelClass} ${mutedClass}`}>Loading messages...</p>
      ) : error ? (
        <div className={`rounded-xl border p-8 text-center ${panelClass}`}>
          <p className="text-red-400">{error}</p>
          <button type="button" onClick={loadMessages} className="mt-3 text-sm text-[#60a5fa] hover:underline">Try again</button>
        </div>
      ) : visibleMessages.length === 0 ? (
        <div className={`rounded-xl border p-10 text-center ${panelClass}`}>
          <Mail className={`mx-auto h-8 w-8 ${mutedClass}`} aria-hidden="true" />
          <p className={`mt-3 ${mutedClass}`}>{messages.length ? `No ${activeTab} messages.` : 'No contact messages yet.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleMessages.map((message) => {
            const unread = message.status === 'new' || message.status === 'unread';
            const resolved = message.status === 'resolved';
            return (
              <article key={message._id} className={`rounded-xl border p-5 shadow-sm ${panelClass} ${unread ? 'border-l-4 border-l-blue-500' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={`break-words text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{message.subject}</h2>
                      {unread ? (
                        <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-400">Unread</span>
                      ) : (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${resolved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'}`}>
                          {resolved ? 'Resolved' : 'Read'}
                        </span>
                      )}
                    </div>
                    <p className={`mt-2 text-sm ${mutedClass}`}>{message.name} · <a href={`mailto:${message.email}`} className="text-[#60a5fa] hover:underline">{message.email}</a></p>
                  </div>
                  <time dateTime={message.createdAt} className={`shrink-0 text-xs ${mutedClass}`}>{formatDateTime(message.createdAt)}</time>
                </div>
                <p className={`mt-4 whitespace-pre-wrap break-words text-sm leading-6 ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{message.message}</p>
                {!resolved && (
                  <button
                    type="button"
                    onClick={() => markResolved(message._id)}
                    disabled={updatingId === message._id}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {updatingId === message._id ? 'Updating...' : 'Mark as Resolved'}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default AdminInboxPage;
