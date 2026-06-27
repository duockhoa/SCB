import axios from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from '@/constants/endpoints';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

const domain = process.env.NEXT_PUBLIC_DOMAIN || '.dkpharma.io.vn';

const cookieOptions = {
  domain: domain,
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  sameSite: 'lax' as const,
  path: '/',
  expires: 70, // 70 days
};

axiosInstance.interceptors.request.use((config) => {
  // Lấy token từ cookie
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    // Nếu lỗi 401 và chưa thử lại
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      const refreshToken = Cookies.get('refreshToken');
      const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'https://server.dkpharma.io.vn';
      const frontendRootUrl = process.env.NEXT_PUBLIC_FRONTEND_ROOT_URL || 'https://hrm.dkpharma.io.vn';
      
      if (refreshToken) {
        try {
          const refreshInstance = axios.create({
            baseURL: authUrl,
            timeout: 12000,
          });

          // Gọi API refresh token của HRM
          const response = await refreshInstance.post('/auth/refreshtoken', { refreshToken });
          const newAccessToken = response.data.accessToken;

          // Lưu token mới
          Cookies.set('accessToken', newAccessToken, cookieOptions);

          // Cập nhật token và gọi lại request cũ
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          // Vì SCB backend đang bọc response trong cấu trúc response.data,
          // nên khi axios gọi lại, ta cần lấy data từ response trả về của original request.
          const retryResponse = await axiosInstance(originalRequest);
          return retryResponse;
        } catch (refreshError) {
          // Xóa hết cookie nếu refresh thất bại
          Cookies.remove('accessToken', { domain, path: '/' });
          Cookies.remove('refreshToken', { domain, path: '/' });
          Cookies.remove('id', { domain, path: '/' });
          window.location.href = `${frontendRootUrl}/login`;
          return Promise.reject(refreshError);
        }
      } else {
        // Không có refresh token -> Đăng xuất
        Cookies.remove('accessToken', { domain, path: '/' });
        Cookies.remove('refreshToken', { domain, path: '/' });
        Cookies.remove('id', { domain, path: '/' });
        window.location.href = `${frontendRootUrl}/login`;
      }
    }
    return Promise.reject(error);
  }
);

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

// API xin quyền truy cập file
export const requestFileAccess = async (taiLieuId: number | null, fileName: string | null, lyDo: string) => {
  const response = await axiosInstance.post('/file-access/request', { taiLieuId, fileName, lyDo });
  return response?.data || response;
};
