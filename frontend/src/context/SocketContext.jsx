import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';
import { showInfo } from '../services/alerts';
import { systemSettingsApi } from '../services/api';

const SocketContext = createContext({ socket: null, latestReport: null, announcement: '' });
const API_URL = import.meta.env.VITE_API_URL || 'https://hazardwatch-dagupan.onrender.com/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const announcementUpdatedOverSocket = useRef(false);

  useEffect(() => {
    let active = true;
    systemSettingsApi.getPublic()
      .then(({ data }) => {
        if (active && !announcementUpdatedOverSocket.current) {
          setAnnouncement(data?.settings?.globalAnnouncement || '');
        }
      })
      .catch((error) => {
        console.error('Unable to load the global announcement.', error);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    setLatestReport(null);

    const connection = io(SOCKET_URL, {
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    const handleNewReport = (report) => {
      setLatestReport(report);
      showInfo('New report submitted', `${report.category} in ${report.barangay}`);
    };
    const handleAnnouncementUpdated = ({ text } = {}) => {
      if (typeof text === 'string') {
        announcementUpdatedOverSocket.current = true;
        setAnnouncement(text);
      }
    };
    const handleConnect = () => {
      console.info('[socket] connected');
    };
    const handleDisconnect = (reason) => {
      console.info('[socket] disconnected:', reason);
    };
    const handleConnectError = (error) => {
      console.error('[socket] Connection failed:', error.message);
    };

    connection.on('new-report', handleNewReport);
    connection.on('announcement-updated', handleAnnouncementUpdated);
    connection.on('connect', handleConnect);
    connection.on('disconnect', handleDisconnect);
    connection.on('connect_error', handleConnectError);
    setSocket(connection);

    return () => {
      connection.off('new-report', handleNewReport);
      connection.off('announcement-updated', handleAnnouncementUpdated);
      connection.off('connect', handleConnect);
      connection.off('disconnect', handleDisconnect);
      connection.off('connect_error', handleConnectError);
      connection.disconnect();
    };
  }, [token, user?.barangay, user?.role]);

  const value = useMemo(() => ({ socket, latestReport, announcement }), [announcement, latestReport, socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
