import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotificationStore } from '../notificationStore'
import { useAuthStore } from '../authStore'
import { mockBackendActor, mockPrincipal } from '../../test/__mocks__/auth'
import { Notification } from '../../types'

// Mock the auth store
vi.mock('../authStore', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}))

describe('notificationStore', () => {
  const mockNotifications: Notification[] = [
    {
      id: 'notif-1',
      recipient: mockPrincipal,
      title: 'Family Invitation',
      message: 'You have been invited to join the Smith family',
      notification_type: { FamilyInvitation: null },
      created_at: BigInt(Date.now() * 1000000),
      read: false,
      action_url: [],
      metadata: [],
    },
    {
      id: 'notif-2',
      recipient: mockPrincipal,
      title: 'System Alert',
      message: 'Your profile has been updated',
      notification_type: { SystemAlert: null },
      created_at: BigInt(Date.now() * 1000000),
      read: true,
      action_url: [],
      metadata: [],
    },
  ]

  beforeEach(() => {
    // Reset store state
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
    })
    
    // Mock auth store to return authenticated state
    vi.mocked(useAuthStore.getState).mockReturnValue({
      actor: mockBackendActor as any,
      isAuthenticated: true,
      user: null,
      principal: mockPrincipal,
      loading: false,
      error: null,
      init: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      createProfile: vi.fn(),
      updateProfile: vi.fn(),
      fetchProfile: vi.fn(),
      clearError: vi.fn(),
      setLoading: vi.fn(),
    })
    
    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useNotificationStore())
      
      expect(result.current.notifications).toEqual([])
      expect(result.current.unreadCount).toBe(0)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  describe('fetchNotifications', () => {
    it('should fetch notifications successfully', async () => {
      mockBackendActor.get_my_notifications?.mockResolvedValue({ Ok: mockNotifications })
      
      const { result } = renderHook(() => useNotificationStore())
      
      await act(async () => {
        await result.current.fetchNotifications()
      })
      
      expect(mockBackendActor.get_my_notifications).toHaveBeenCalledOnce()
      expect(result.current.notifications).toEqual(mockNotifications)
      expect(result.current.unreadCount).toBe(1) // Only one unread notification
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle fetch notifications failure', async () => {
      mockBackendActor.get_my_notifications?.mockResolvedValue({ Err: 'Failed to fetch notifications' })
      
      const { result } = renderHook(() => useNotificationStore())
      
      await act(async () => {
        await result.current.fetchNotifications()
      })
      
      expect(result.current.notifications).toEqual([])
      expect(result.current.error).toBe('Failed to fetch notifications')
      expect(result.current.loading).toBe(false)
    })

    it('should handle not authenticated state', async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        actor: null,
        isAuthenticated: false,
        user: null,
        principal: null,
        loading: false,
        error: null,
        init: vi.fn(),
        login: vi.fn(),
        logout: vi.fn(),
        createProfile: vi.fn(),
        updateProfile: vi.fn(),
        fetchProfile: vi.fn(),
        clearError: vi.fn(),
        setLoading: vi.fn(),
      })
      
      const { result } = renderHook(() => useNotificationStore())
      
      await act(async () => {
        await result.current.fetchNotifications()
      })
      
      expect(result.current.error).toBe('Not authenticated')
    })
  })

  describe('fetchUnreadCount', () => {
    it('should fetch unread count successfully', async () => {
      mockBackendActor.get_unread_notification_count?.mockResolvedValue({ Ok: BigInt(5) })
      
      const { result } = renderHook(() => useNotificationStore())
      
      await act(async () => {
        await result.current.fetchUnreadCount()
      })
      
      expect(mockBackendActor.get_unread_notification_count).toHaveBeenCalledOnce()
      expect(result.current.unreadCount).toBe(5)
    })

    it('should handle fetch unread count failure silently', async () => {
      mockBackendActor.get_unread_notification_count?.mockResolvedValue({ Err: 'Failed to fetch count' })
      
      const { result } = renderHook(() => useNotificationStore())
      
      await act(async () => {
        await result.current.fetchUnreadCount()
      })
      
      // Should not set error for this method as it's called silently
      expect(result.current.error).toBe(null)
    })

    it('should return early if not authenticated', async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        actor: null,
        isAuthenticated: false,
        user: null,
        principal: null,
        loading: false,
        error: null,
        init: vi.fn(),
        login: vi.fn(),
        logout: vi.fn(),
        createProfile: vi.fn(),
        updateProfile: vi.fn(),
        fetchProfile: vi.fn(),
        clearError: vi.fn(),
        setLoading: vi.fn(),
      })
      
      const { result } = renderHook(() => useNotificationStore())
      
      await act(async () => {
        await result.current.fetchUnreadCount()
      })
      
      expect(mockBackendActor.get_unread_notification_count).not.toHaveBeenCalled()
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      useNotificationStore.setState({
        notifications: mockNotifications,
        unreadCount: 1,
      })
      
      mockBackendActor.mark_notification_read?.mockResolvedValue({ Ok: 'Marked as read' })
      
      const { result } = renderHook(() => useNotificationStore())
      
      await act(async () => {
        await result.current.markAsRead('notif-1')
      })
      
      expect(mockBackendActor.mark_notification_read).toHaveBeenCalledWith('notif-1')
      
      // Find the notification that should be marked as read
      const updatedNotification = result.current.notifications.find(n => n.id === 'notif-1')
      expect(updatedNotification?.read).toBe(true)
      expect(result.current.unreadCount).toBe(0)
    })

    it('should handle mark as read failure', async () => {
      mockBackendActor.mark_notification_read?.mockResolvedValue({ Err: 'Failed to mark as read' })
      
      const { result } = renderHook(() => useNotificationStore())
      
      await act(async () => {
        await result.current.markAsRead('notif-1')
      })
      
      expect(result.current.error).toBe('Failed to mark as read')
    })

    it('should handle not authenticated state', async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        actor: null,
        isAuthenticated: false,
        user: null,
        principal: null,
        loading: false,
        error: null,
        init: vi.fn(),
        login: vi.fn(),
        logout: vi.fn(),
        createProfile: vi.fn(),
        updateProfile: vi.fn(),
        fetchProfile: vi.fn(),
        clearError: vi.fn(),
        setLoading: vi.fn(),
      })
      
      const { result } = renderHook(() => useNotificationStore())
      
      await act(async () => {
        await result.current.markAsRead('notif-1')
      })
      
      expect(result.current.error).toBe('Not authenticated')
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      useNotificationStore.setState({
        notifications: mockNotifications,
        unreadCount: 1,
      })
      
      mockBackendActor.mark_all_notifications_read?.mockResolvedValue({ Ok: 'All marked as read' })
      
      const { result } = renderHook(() => useNotificationStore())
      
      await act(async () => {
        await result.current.markAllAsRead()
      })
      
      expect(mockBackendActor.mark_all_notifications_read).toHaveBeenCalledOnce()
      
      // All notifications should be marked as read
      const allRead = result.current.notifications.every(n => n.read === true)
      expect(allRead).toBe(true)
      expect(result.current.unreadCount).toBe(0)
      expect(result.current.loading).toBe(false)
    })

    it('should handle mark all as read failure', async () => {
      mockBackendActor.mark_all_notifications_read?.mockResolvedValue({ Err: 'Failed to mark all as read' })
      
      const { result } = renderHook(() => useNotificationStore())
      
      await act(async () => {
        await result.current.markAllAsRead()
      })
      
      expect(result.current.error).toBe('Failed to mark all as read')
      expect(result.current.loading).toBe(false)
    })
  })

  describe('Utility functions', () => {
    it('should clear error', () => {
      useNotificationStore.setState({ error: 'Some error' })
      
      const { result } = renderHook(() => useNotificationStore())
      
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBe(null)
    })

    it('should reset store', () => {
      useNotificationStore.setState({
        notifications: mockNotifications,
        unreadCount: 5,
        loading: true,
        error: 'Some error',
      })
      
      const { result } = renderHook(() => useNotificationStore())
      
      act(() => {
        result.current.reset()
      })
      
      expect(result.current.notifications).toEqual([])
      expect(result.current.unreadCount).toBe(0)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })
})