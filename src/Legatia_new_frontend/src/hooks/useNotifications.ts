import { useNotificationStore } from '../stores/notificationStore';

export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    clearError,
    reset,
  } = useNotificationStore();

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    
    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    clearError,
    reset,
    
    // Computed
    hasNotifications: notifications.length > 0,
    hasUnread: unreadCount > 0,
    isLoading: loading,
  };
};