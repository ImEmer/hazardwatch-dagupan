import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';
import { showInfo, showWarning } from '../services/alerts';
import { toast } from 'sonner';

const SocketContext = createContext({ socket: null, latestReport: null });
const API_URL = import.meta.env.VITE_API_URL || 'https://hazardwatch-dagupan.onrender.com/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [latestReport, setLatestReport] = useState(null);

  useEffect(() => {
    setLatestReport(null);
    if (!token || !['admin', 'superadmin', 'barangay', 'user'].includes(user?.role)) {
      setSocket(null);
      return undefined;
    }

    const connection = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    const handleNewReport = (report) => {
      setLatestReport(report);
      showInfo('New report submitted', `${report.category} in ${report.barangay}`);
    };
    const handleGlobalBroadcast = ({ message, type } = {}) => {
      if (typeof message !== 'string' || !['info', 'warning', 'emergency'].includes(type)) return;
      if (type === 'emergency') {
        toast.error('Emergency Broadcast', { description: message, duration: Infinity });
      } else if (type === 'warning') {
        showWarning('Global Broadcast', message);
      } else {
        showInfo('Global Broadcast', message);
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
    connection.on('global-broadcast', handleGlobalBroadcast);
    connection.on('connect', handleConnect);
    connection.on('disconnect', handleDisconnect);
    connection.on('connect_error', handleConnectError);
    setSocket(connection);

    return () => {
      connection.off('new-report', handleNewReport);
      connection.off('global-broadcast', handleGlobalBroadcast);
      connection.off('connect', handleConnect);
      connection.off('disconnect', handleDisconnect);
      connection.off('connect_error', handleConnectError);
      connection.disconnect();
    };
  }, [token, user?.barangay, user?.role]);

  const value = useMemo(() => ({ socket, latestReport }), [latestReport, socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
