import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://hazardwatch-dagupan.onrender.com/api',
});

const isPublicAuthRoute = (url = '') => {
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/forgot-password') || url.includes('/auth/reset-password');
};

const redirectToLoginOnce = () => {
  const currentPath = window.location.pathname;
  if (window.__redirectingToLogin || currentPath === '/login' || currentPath === '/register' || isPublicAuthRoute(currentPath)) {
    return;
  }

  window.__redirectingToLogin = true;
  window.setTimeout(() => {
    window.__redirectingToLogin = false;
  }, 1500);

  window.location.assign('/login');
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
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

    if (status === 401 && !isPublicAuthRoute(requestUrl)) {
      localStorage.removeItem('token');
      redirectToLoginOnce();
    }

    return Promise.reject(error);
  }
);

export default api;