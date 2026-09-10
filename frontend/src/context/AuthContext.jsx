import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'hazardwatch_token';
const USER_KEY = 'hazardwatch_user';

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
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token')));

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
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
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem('token', nextToken);
  }, []);

  const logout = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
    try {
      if (currentToken) {
        await request('/auth/logout', { method: 'POST' }, currentToken);
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const getCurrentUser = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
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