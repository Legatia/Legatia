import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../authStore'
import { mockAuthService, mockUserProfile, mockPrincipal, mockBackendActor } from '../../test/__mocks__/auth'

// Mock the auth service
vi.mock('../../services/auth', () => ({
  authService: mockAuthService,
  getBackendActor: vi.fn().mockResolvedValue(mockBackendActor),
}))

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      principal: null,
      loading: false,
      error: null,
      actor: null,
    })
    
    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)
      expect(result.current.principal).toBe(null)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.actor).toBe(null)
    })
  })

  describe('init', () => {
    it('should initialize successfully when authenticated', async () => {
      mockAuthService.init.mockResolvedValue(true)
      mockAuthService.getActor.mockReturnValue(mockBackendActor)
      mockAuthService.getPrincipal.mockReturnValue(mockPrincipal)
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.init()
      })
      
      expect(mockAuthService.init).toHaveBeenCalledOnce()
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.actor).toBe(mockBackendActor)
      expect(result.current.principal).toBe(mockPrincipal)
      expect(result.current.loading).toBe(false)
    })

    it('should handle initialization failure', async () => {
      const error = new Error('Initialization failed')
      mockAuthService.init.mockRejectedValue(error)
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.init()
      })
      
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Initialization failed')
      expect(result.current.loading).toBe(false)
    })

    it('should fetch profile when authenticated', async () => {
      mockAuthService.init.mockResolvedValue(true)
      mockAuthService.getActor.mockReturnValue(mockBackendActor)
      mockAuthService.getPrincipal.mockReturnValue(mockPrincipal)
      mockBackendActor.get_profile?.mockResolvedValue({ Ok: mockUserProfile })
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.init()
      })
      
      expect(mockBackendActor.get_profile).toHaveBeenCalledOnce()
      expect(result.current.user).toEqual(mockUserProfile)
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      mockAuthService.login.mockResolvedValue(true)
      mockAuthService.getActor.mockReturnValue(mockBackendActor)
      mockAuthService.getPrincipal.mockReturnValue(mockPrincipal)
      mockBackendActor.get_profile?.mockResolvedValue({ Ok: mockUserProfile })
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.login()
      })
      
      expect(mockAuthService.login).toHaveBeenCalledOnce()
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.actor).toBe(mockBackendActor)
      expect(result.current.principal).toBe(mockPrincipal)
      expect(result.current.user).toEqual(mockUserProfile)
    })

    it('should handle login failure', async () => {
      const error = new Error('Login failed')
      mockAuthService.login.mockRejectedValue(error)
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.login()
      })
      
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Login failed')
      expect(result.current.loading).toBe(false)
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockUserProfile,
        principal: mockPrincipal,
        actor: mockBackendActor as any,
      })
      
      mockAuthService.logout.mockResolvedValue(undefined)
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.logout()
      })
      
      expect(mockAuthService.logout).toHaveBeenCalledOnce()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)
      expect(result.current.principal).toBe(null)
      expect(result.current.actor).toBe(null)
      expect(result.current.error).toBe(null)
    })

    it('should handle logout failure', async () => {
      const error = new Error('Logout failed')
      mockAuthService.logout.mockRejectedValue(error)
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.logout()
      })
      
      expect(result.current.error).toBe('Logout failed')
    })
  })

  describe('createProfile', () => {
    it('should create profile successfully', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        actor: mockBackendActor as any,
      })
      
      const profileData = {
        full_name: 'John Doe',
        surname_at_birth: 'Doe',
        sex: 'Male',
        birthday: '1990-01-01',
        birth_city: 'New York',
        birth_country: 'USA',
      }
      
      mockBackendActor.create_profile?.mockResolvedValue({ Ok: mockUserProfile })
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.createProfile(profileData)
      })
      
      expect(mockBackendActor.create_profile).toHaveBeenCalledWith(profileData)
      expect(result.current.user).toEqual(mockUserProfile)
      expect(result.current.loading).toBe(false)
    })

    it('should handle create profile failure', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        actor: mockBackendActor as any,
      })
      
      const profileData = {
        full_name: 'John Doe',
        surname_at_birth: 'Doe',
        sex: 'Male',
        birthday: '1990-01-01',
        birth_city: 'New York',
        birth_country: 'USA',
      }
      
      mockBackendActor.create_profile?.mockResolvedValue({ Err: 'Profile creation failed' })
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.createProfile(profileData)
      })
      
      expect(result.current.error).toBe('Profile creation failed')
      expect(result.current.user).toBe(null)
    })

    it('should handle not authenticated state', async () => {
      const profileData = {
        full_name: 'John Doe',
        surname_at_birth: 'Doe',
        sex: 'Male',
        birthday: '1990-01-01',
        birth_city: 'New York',
        birth_country: 'USA',
      }
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.createProfile(profileData)
      })
      
      expect(result.current.error).toBe('Not authenticated')
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        actor: mockBackendActor as any,
        user: mockUserProfile,
      })
      
      const updateData = {
        full_name: ['Jane Doe'],
        birth_city: ['Los Angeles'],
      }
      
      const updatedProfile = { ...mockUserProfile, full_name: 'Jane Doe', birth_city: 'Los Angeles' }
      mockBackendActor.update_profile?.mockResolvedValue({ Ok: updatedProfile })
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.updateProfile(updateData)
      })
      
      expect(mockBackendActor.update_profile).toHaveBeenCalledWith(updateData)
      expect(result.current.user).toEqual(updatedProfile)
    })

    it('should handle update profile failure', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        actor: mockBackendActor as any,
      })
      
      const updateData = {
        full_name: ['Jane Doe'],
      }
      
      mockBackendActor.update_profile?.mockResolvedValue({ Err: 'Update failed' })
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.updateProfile(updateData)
      })
      
      expect(result.current.error).toBe('Update failed')
    })
  })

  describe('fetchProfile', () => {
    it('should fetch profile successfully', async () => {
      useAuthStore.setState({
        actor: mockBackendActor as any,
      })
      
      mockBackendActor.get_profile?.mockResolvedValue({ Ok: mockUserProfile })
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.fetchProfile()
      })
      
      expect(mockBackendActor.get_profile).toHaveBeenCalledOnce()
      expect(result.current.user).toEqual(mockUserProfile)
    })

    it('should handle profile not found', async () => {
      useAuthStore.setState({
        actor: mockBackendActor as any,
      })
      
      mockBackendActor.get_profile?.mockResolvedValue({ Err: 'Profile not found' })
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.fetchProfile()
      })
      
      expect(result.current.user).toBe(null)
      expect(result.current.loading).toBe(false)
    })
  })

  describe('Utility functions', () => {
    it('should clear error', () => {
      useAuthStore.setState({ error: 'Some error' })
      
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBe(null)
    })

    it('should set loading state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setLoading(true)
      })
      
      expect(result.current.loading).toBe(true)
      
      act(() => {
        result.current.setLoading(false)
      })
      
      expect(result.current.loading).toBe(false)
    })
  })
})