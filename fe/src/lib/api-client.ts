import axios from 'axios';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const NEXT_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

/**
 * Axios instance configured with API key authentication header.
 */
export const apiClient = axios.create({
  baseURL: NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': NEXT_PUBLIC_API_KEY,
  },
});
