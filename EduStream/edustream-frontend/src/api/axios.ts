import axios from 'axios';

/** En dev, utilise le proxy Vite (/api). En prod, VITE_API_URL ou URL absolue. */
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

const PUBLIC_AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const requestUrl = err.config?.url ?? '';
      const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some(p => requestUrl.includes(p));
      const isOnPublicPage = PUBLIC_AUTH_PATHS.includes(window.location.pathname);

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Ne pas forcer une redirection si déjà sur une page publique ou requête auth
      if (!isPublicAuthRequest && !isOnPublicPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
