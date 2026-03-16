import axios from 'axios';
import { authStorage } from './auth';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
