import { create } from 'zustand';

interface NotificationsState {
  unreadCount: number;
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  markAsRead: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,
  notifications: [],
  setNotifications: (notifications) => set({ 
    notifications, 
    unreadCount: notifications.filter((n: any) => !n.read).length 
  }),
  markAsRead: (id) => set((state) => {
    const updated = state.notifications.map((n: any) => 
      n.id === id ? { ...n, read: true } : n
    );
    return {
      notifications: updated,
      unreadCount: updated.filter((n: any) => !n.read).length
    };
  }),
}));
