import { create } from 'zustand';
import Cookies from 'js-cookie';
import { axiosInstance } from '@/services/api';

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
      
      // Lấy thông tin user kèm vai trò từ Backend của SCB
      const response = await axiosInstance.get('/users/me');
      
      if (response) {
        set({ user: response, token });
      }
    } catch (error) {
      console.error('Failed to fetch user from SCB backend:', error);
    }
  }
}));
