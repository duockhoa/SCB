import axios from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from '@/constants/endpoints';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

const domain = process.env.NEXT_PUBLIC_DOMAIN || '.dkpharma.io.vn';
const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'https://server.dkpharma.io.vn';
const frontendRootUrl = process.env.NEXT_PUBLIC_FRONTEND_ROOT_URL || 'https://hrm.dkpharma.io.vn';

export const authAxiosInstance = axios.create({
  baseURL: authUrl,
  timeout: 12000,
});

const cookieOptions = {
  domain: domain,
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  sameSite: 'lax' as const,
  path: '/',
  expires: 70, // 70 days
};

let refreshPromise: Promise<string> | null = null;
let isRedirectingToLogin = false;

function redirectToLogin() {
  if (isRedirectingToLogin || typeof window === 'undefined') return;

  isRedirectingToLogin = true;
  Cookies.remove('accessToken', { domain, path: '/' });
  Cookies.remove('refreshToken', { domain, path: '/' });
  Cookies.remove('id', { domain, path: '/' });
  window.location.href = `${frontendRootUrl}/login`;
}

function refreshAccessToken(): Promise<string> {
  const refreshToken = Cookies.get('refreshToken');
  if (!refreshToken) {
    return Promise.reject(new Error('Missing refresh token'));
  }

  // Các request cùng nhận 401 sẽ dùng chung một lần refresh, tránh refresh token bị xoay vòng nhiều lần.
  if (!refreshPromise) {
    const pendingRefresh = axios
      .post(`${authUrl}/auth/refresh-token`, { refreshToken }, { timeout: 12000 })
      .then((response) => {
        const newAccessToken = response.data?.accessToken;
        if (!newAccessToken) {
          throw new Error('Refresh token response does not contain accessToken');
        }

        Cookies.set('accessToken', newAccessToken, cookieOptions);
        return newAccessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });

    refreshPromise = pendingRefresh;
  }

  return refreshPromise;
}

function addAuthInterceptors(instance: typeof axiosInstance) {
  instance.interceptors.request.use((config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._retry ||
        typeof window === 'undefined'
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }
  );
}

addAuthInterceptors(axiosInstance);
addAuthInterceptors(authAxiosInstance);

// API Upload file
export const uploadFile = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axiosInstance.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response?.data || response;
};
