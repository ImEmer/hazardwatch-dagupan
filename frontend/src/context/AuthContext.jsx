import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'hazardwatch_token';
const USER_KEY = 'hazardwatch_user';

const decodeToken = (value) => {
  try {
    const payload = value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const getStoredSession = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    return { token, user: savedUser ? JSON.parse(savedUser) : null };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { token: null, user: null };
  }
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
    const requestError = new Error(error.response?.data?.message || 'The request could not be completed.');
    requestError.status = error.response?.status;
    requestError.data = error.response?.data;
    throw requestError;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getStoredSession().token);
  const [user, setUser] = useState(() => getStoredSession().user);
  const [loading, setLoading] = useState(true);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setShowExpiryWarning(false);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('token');
    window.__hw_redirecting = false;
  }, []);

  const persistSession = useCallback((session) => {
    const nextToken = session.token;
    const nextUser = session.user;
    window.__hw_redirecting = false;
    setToken(nextToken);
    setUser(nextUser);
    setShowExpiryWarning(false);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem('token', nextToken);
  }, []);

  const logout = useCallback(async () => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    try {
      if (currentToken) {
        await request('/auth/logout', { method: 'POST' }, currentToken);
      }
    } finally {
      clearSession();
      window.location.href = '/login';
    }
  }, [clearSession, token]);

  useEffect(() => {
    try {
      const storedSession = getStoredSession();
      if (storedSession.token && storedSession.user) {
        setToken(storedSession.token);
        setUser(storedSession.user);
      } else if (storedSession.token || storedSession.user) {
        clearSession();
      }
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, []);

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
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
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
    if (!token) return undefined;

    const decoded = decodeToken(token);
    const expiresAt = decoded?.exp ? decoded.exp * 1000 : 0;
    if (!expiresAt) return undefined;

    const warningDelay = expiresAt - Date.now() - 5 * 60 * 1000;
    const expiryDelay = expiresAt - Date.now();
    if (expiryDelay <= 0) {
      logout().catch(() => {});
      return undefined;
    }

    const warningTimer = window.setTimeout(() => setShowExpiryWarning(true), Math.max(0, warningDelay));
    const expiryTimer = window.setTimeout(() => logout().catch(() => {}), expiryDelay);
    return () => {
      window.clearTimeout(warningTimer);
      window.clearTimeout(expiryTimer);
    };
  }, [logout, token]);

  const login = useCallback(async (email, password) => {
    const response = await request('/auth/login', { 
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const session = response.token ? response : response.data;
    persistSession(session);
    return session.user;
  }, [persistSession]);

  const refreshSession = useCallback(async () => {
    const response = await request('/auth/refresh', { method: 'POST' }, token);
    const session = response.token ? response : response.data;
    persistSession(session);
    return session.user;
  }, [persistSession, token]);

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

  const verifyEmail = useCallback(async (email, code) => {
    const response = await request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }, token);
    await getCurrentUser();
    return response;
  }, [getCurrentUser, token]);

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

  const updatePreferences = useCallback(async (preferences) => {
    const response = await api.patch('/users/me/preferences', preferences, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const nextUser = { ...user, preferences: response.data.preferences };
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    return response.data.preferences;
  }, [token, user]);

  const deleteAccount = useCallback(async () => {
    await request('/auth/account', { method: 'DELETE' }, token); 
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('token');
    setShowExpiryWarning(false);
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

  const verifyResetCode = useCallback(async (email, code) => {
    return request('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    showExpiryWarning,
    isAuthenticated: Boolean(user && token),
    login,
    refreshSession,
    logout,
    register,
    getCurrentUser,
    changePassword,
    verifyEmail,
    updateProfile,
    updatePreferences,
    deleteAccount,
    forgotPassword,
    verifyResetCode,
    resetPassword,
  }), [changePassword, deleteAccount, forgotPassword, getCurrentUser, loading, login, logout, refreshSession, register, resetPassword, token, updatePreferences, updateProfile, user, verifyEmail, verifyResetCode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };