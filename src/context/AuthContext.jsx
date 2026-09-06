import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const TOKEN_KEY = 'hazardwatch_token';
const USER_KEY = 'hazardwatch_user';
const API_URL = import.meta.env.VITE_API_URL || '';

const request = async (path, options = {}, token = null) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'The request could not be completed.');
  }

  return response.status === 204 ? null : response.json();
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const persistSession = useCallback((session) => {
    const nextToken = session.token;
    const nextUser = session.user;
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    try {
      if (currentToken) {
        await request('/api/auth/logout', { method: 'POST' }, currentToken);
      }
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const getCurrentUser = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setLoading(false);
      return null;
    }

    try {
      const response = await request('/api/auth/me', {}, currentToken);
      const nextUser = response.user || response;
      setUser(nextUser);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      return nextUser;
    } catch (error) {
      await logout();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      getCurrentUser().catch(() => {});
    } else {
      setLoading(false);
    }
  }, [getCurrentUser, token]);

  const login = useCallback(async (email, password) => {
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const session = response.token ? response : response.data;
    persistSession(session);
    return session.user;
  }, [persistSession]);

  const register = useCallback(async (userData) => {
    const response = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.user || response;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }, token);
  }, [token]);

  const forgotPassword = useCallback(async (email) => {
    return request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }, []);

  const resetPassword = useCallback(async (resetToken, password) => {
    return request('/api/auth/reset-password', {
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
    forgotPassword,
    resetPassword,
  }), [changePassword, forgotPassword, getCurrentUser, loading, login, logout, register, resetPassword, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
