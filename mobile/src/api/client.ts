import axios from 'axios';
import { getToken, removeToken } from '@/services/secureStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080/api/v1';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
      // Auth store cleanup happens via the store subscription to the token
    }
    return Promise.reject(error);
  }
);

export default client;
