import { create } from 'zustand';
import axios from 'axios';
import Cookies from 'js-cookie';

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
      
      const hrmApiUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000';
      const response = await axios.get(`${hrmApiUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data) {
        set({ user: response.data, token });
      }
    } catch (error) {
      console.error('Failed to fetch user from HRM:', error);
    }
  }
}));
