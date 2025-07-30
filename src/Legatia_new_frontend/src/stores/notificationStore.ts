import { create } from 'zustand';
import { Notification } from '../types';
import { useAuthStore } from './authStore';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  // Fetch notifications
  fetchNotifications: async () => {
    const actor = useAuthStore.getState().actor;
    if (!actor) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const result = await actor.get_my_notifications();
      
      if ('Ok' in result) {
        const notifications = result.Ok;
        const unreadCount = notifications.filter(n => !n.read).length;
        
        set({ 
          notifications,
          unreadCount,
          loading: false 
        });
      } else {
        set({ 
          error: result.Err,
          loading: false 
        });
      }
    } catch (error) {
      console.error('Fetch notifications failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
        loading: false 
      });
    }
  },

  // Fetch unread count
  fetchUnreadCount: async () => {
    const actor = useAuthStore.getState().actor;
    if (!actor) return;

    try {
      const result = await actor.get_unread_notification_count();
      
      if ('Ok' in result) {
        set({ unreadCount: Number(result.Ok) });
      }
    } catch (error) {
      console.error('Fetch unread count failed:', error);
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const actor = useAuthStore.getState().actor;
    if (!actor) {
      set({ error: 'Not authenticated' });
      return;
    }

    try {
      const result = await actor.mark_notification_read(notificationId);
      
      if ('Ok' in result) {
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
      } else {
        set({ error: result.Err });
      }
    } catch (error) {
      console.error('Mark as read failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to mark notification as read'
      });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const actor = useAuthStore.getState().actor;
    if (!actor) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const result = await actor.mark_all_notifications_read();
      
      if ('Ok' in result) {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
          loading: false
        }));
      } else {
        set({ 
          error: result.Err,
          loading: false 
        });
      }
    } catch (error) {
      console.error('Mark all as read failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
        loading: false 
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({ notifications: [], unreadCount: 0, loading: false, error: null }),
}));