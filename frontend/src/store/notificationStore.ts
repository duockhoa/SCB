import { create } from 'zustand';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  /** Mã hồ sơ liên quan */
  maHoSo?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  /** Thêm notification mới (đẩy lên đầu) */
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  /** Đánh dấu 1 notification đã đọc */
  markAsRead: (id: string) => void;
  /** Đánh dấu tất cả đã đọc */
  markAllAsRead: () => void;
  /** Xóa tất cả notifications */
  clearAll: () => void;
  /** Số thông báo chưa đọc */
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notif) => {
    const newNotification: AppNotification = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date(),
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50), // Giữ tối đa 50
    }));
  },

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearAll: () => set({ notifications: [] }),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
