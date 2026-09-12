import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'hazardwatch_token';
const USER_KEY = 'hazardwatch_user';
const PRIVILEGED_ROLES = ['superadmin', 'admin', 'barangay'];

const readStoredUser = (storage) => {
  try {
    const savedUser = storage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
};

const getStoredSession = () => {
  const sessionUser = readStoredUser(sessionStorage);
  const sessionToken = sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem('token');
  if (sessionToken) return { token: sessionToken, user: sessionUser, storage: sessionStorage };
  const localUser = readStoredUser(localStorage);
  const localToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
  return { token: localToken, user: localUser, storage: localStorage };
};

const request = async (path, options = {}, token = null) => {
  try {
    const config = {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    };

    let response;
    if (options.method === 'POST') {
      response = await api.post(path, options.body ? JSON.parse(options.body) : {}, config);
    } else if (options.method === 'PUT') {
      response = await api.put(path, options.body ? JSON.parse(options.body) : {}, config);
    } else if (options.method === 'DELETE') {
      response = await api.delete(path, config);
    } else {
      response = await api.get(path, config);
    }

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'The request could not be completed.');
  }
};

export const AuthProvider = ({ children }) => {
  // localStorage keeps regular user sessions; sessionStorage scopes privileged sessions to one tab.
  const [initialSession] = useState(getStoredSession);
  const [token, setToken] = useState(initialSession.token);
  const [user, setUser] = useState(initialSession.user);
  const [loading, setLoading] = useState(Boolean(initialSession.token));

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('token');
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('token');
    window.__hw_redirecting = false;
  }, []);

  const persistSession = useCallback((session) => {
    const nextToken = session.token;
    const nextUser = session.user;
    window.__hw_redirecting = false;
    setToken(nextToken);
    setUser(nextUser);
    const storage = PRIVILEGED_ROLES.includes(nextUser?.role) ? sessionStorage : localStorage;
    const otherStorage = storage === sessionStorage ? localStorage : sessionStorage;
    otherStorage.removeItem(TOKEN_KEY);
    otherStorage.removeItem(USER_KEY);
    otherStorage.removeItem('token');
    storage.setItem(TOKEN_KEY, nextToken);
    storage.setItem(USER_KEY, JSON.stringify(nextUser));
    storage.setItem('token', nextToken);
  }, []);

  const logout = useCallback(async () => {
    const currentToken = getStoredSession().token;
    try {
      if (currentToken) {
        await request('/auth/logout', { method: 'POST' }, currentToken);
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const getCurrentUser = useCallback(async () => {
    const storedSession = getStoredSession();
    const currentToken = storedSession.token;
    if (!currentToken) {
      setLoading(false);
      return null;
    }

    try {
      const response = await request('/auth/me', {}, currentToken);
      const nextUser = response.user || response;
      setUser(nextUser);
      const storage = PRIVILEGED_ROLES.includes(nextUser?.role) ? sessionStorage : localStorage;
      storage.setItem(USER_KEY, JSON.stringify(nextUser));
      return nextUser;
    } catch (error) {
      clearSession();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    if (token) {
      getCurrentUser().catch(() => {});
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const handleSessionExpired = () => {
      logout().catch(() => {});
    };

    window.addEventListener('hw:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('hw:session-expired', handleSessionExpired);
    };
  }, [logout]);

  useEffect(() => {
    const clearPrivilegedTabSession = () => {
      if (PRIVILEGED_ROLES.includes(user?.role)) {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        sessionStorage.removeItem('token');
      }
    };
    window.addEventListener('beforeunload', clearPrivilegedTabSession);
    return () => window.removeEventListener('beforeunload', clearPrivilegedTabSession);
  }, [user?.role]);

  const login = useCallback(async (email, password) => {
    const response = await request('/auth/login', { 
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const session = response.token ? response : response.data;
    persistSession(session);
    return session.user;
  }, [persistSession]);

  const register = useCallback(async (userData) => {
    const response = await request('/auth/register', { 
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.user || response;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return request('/auth/change-password', { 
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }, token);
  }, [token]);

  const updateProfile = useCallback(async (name, email) => {
    const response = await request('/auth/profile', { 
      method: 'PUT',
      body: JSON.stringify({ name, email }),
    }, token);
    const nextUser = response.user || response;
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    return nextUser;
  }, [token]);

  const deleteAccount = useCallback(async () => {
    await request('/auth/account', { method: 'DELETE' }, token); 
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('token');
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('token');
  }, [token]);

  const forgotPassword = useCallback(async (email) => {
    return request('/auth/forgot-password', { 
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }, []);

  const resetPassword = useCallback(async (resetToken, password) => {
    return request('/auth/reset-password', { 
      method: 'POST',
      body: JSON.stringify({ token: resetToken, password }),
    });
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    logout,
    register,
    getCurrentUser,
    changePassword,
    updateProfile,
    deleteAccount,
    forgotPassword,
    resetPassword,
  }), [changePassword, deleteAccount, forgotPassword, getCurrentUser, loading, login, logout, register, resetPassword, token, updateProfile, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };