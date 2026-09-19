import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://hazardwatch-dagupan.onrender.com/api',
  timeout: 15000,
});

const TOKEN_KEY = 'hazardwatch_token';
const USER_KEY = 'hazardwatch_user';

const isAuthRoute = (url = '') => {
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/forgot-password') || url.includes('/auth/verify-reset-code') || url.includes('/auth/reset-password') || url.includes('/auth/refresh');
};

const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('token');
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem('token');
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
      || localStorage.getItem('token')
      || sessionStorage.getItem(TOKEN_KEY)
      || sessionStorage.getItem('token');
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    if (status === 401) {
      clearStoredSession();
      if (!isAuthRoute(requestUrl) && !window.__hw_redirecting) {
        window.__hw_redirecting = true;
        window.dispatchEvent(new Event('hw:session-expired'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export const analyticsApi = {
  getReportsPerBarangay: () => api.get('/analytics/reports-per-barangay'),
  getReportsPerCategory: () => api.get('/analytics/reports-per-category'),
  getReportsPerPriority: () => api.get('/analytics/reports-per-priority'),
  getReportsPerDay: () => api.get('/analytics/reports-per-day'),
  getTumblingHourly: () => api.get('/analytics/tumbling-hourly'),
  getSliding: () => api.get('/analytics/sliding'),
  getSessions: () => api.get('/analytics/sessions'),
};