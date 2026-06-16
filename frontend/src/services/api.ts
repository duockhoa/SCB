import axios from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from '@/constants/endpoints';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

axiosInstance.interceptors.request.use((config) => {
  // Lấy token từ cookie (ưu tiên) do HRM share qua domain
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const currentUrl = encodeURIComponent(window.location.href);
      window.location.href = `https://hrm.dkpharma.io.vn/login?redirect=${currentUrl}`;
    }
    return Promise.reject(error);
  }
);
