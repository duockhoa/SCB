import axios from 'axios';
import { API_URL } from '@/constants/endpoints';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

axiosInstance.interceptors.request.use((config) => {
  // Gắn Token ở đây (Lấy từ localStorage hoặc Zustand sau)
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
