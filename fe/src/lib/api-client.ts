import axios from 'axios';
import { authStorage } from './auth';

const DEFAULT_DEV_API_URL = 'http://localhost:4000/api';
const DEFAULT_PROD_API_URL = 'https://taskpulse-production-d71e.up.railway.app/api';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL
  || (process.env.NODE_ENV === 'production' ? DEFAULT_PROD_API_URL : DEFAULT_DEV_API_URL);

/**
 * Axios instance configured with JWT bearer authentication.
 */
export const apiClient = axios.create({
  baseURL: NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status as number | undefined;

    if (status === 401 && typeof window !== 'undefined') {
      authStorage.clearToken();
      const path = window.location.pathname;

      if (path !== '/login' && path !== '/register') {
        window.location.replace(`/login?next=${encodeURIComponent(path)}`);
      }
    }

    return Promise.reject(error);
  },
);
