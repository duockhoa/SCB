import { create } from 'zustand';
import Cookies from 'js-cookie';
import { axiosInstance } from '@/services/api';
import axios from 'axios';

interface AuthState {
  token: string | null;
  user: any | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
  fetchUser: async () => {
    try {
      const token = Cookies.get('accessToken');
      if (!token) return;
      
      // 1. Lấy thông tin chi tiết (bao gồm cả avatar) từ HRM
      const hrmApiUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000';
      const hrmResponse = await axios.get(`${hrmApiUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const hrmUser = hrmResponse.data;

      // 2. Lấy thông tin vai trò cục bộ từ SCB Backend
      const response = await axiosInstance.get('/users/me');
      const scbUser = response?.data || response;
      
      if (hrmUser && scbUser) {
        // Hợp nhất thông tin: giữ avatar từ HRM và vai trò/ID từ SCB
        const mergedUser = {
          ...hrmUser,
          role: scbUser.role,
          vai_tro: scbUser.vai_tro,
          userId: scbUser.userId || scbUser.id,
          // Nếu HRM lưu avatar ở đường dẫn tương đối, ghép với hrmApiUrl
          avatar: hrmUser.avatar 
            ? (hrmUser.avatar.startsWith('http') ? hrmUser.avatar : `${hrmApiUrl}${hrmUser.avatar}`)
            : null
        };
        set({ user: mergedUser, token });
      } else if (scbUser) {
        set({ user: scbUser, token });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }
}));
