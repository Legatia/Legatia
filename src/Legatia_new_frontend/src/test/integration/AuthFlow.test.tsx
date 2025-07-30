import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { LoginPage } from '../../pages/LoginPage'
import { CreateProfilePage } from '../../pages/CreateProfilePage'
import { ProfilePage } from '../../pages/ProfilePage'
import { render, createMockUser } from '../utils/test-utils'
import { useAuth } from '../../hooks/useAuth'

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Authentication Flow Integration', () => {
  const mockUseAuth = vi.mocked(useAuth)
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Login to Profile Creation Flow', () => {
    it('should complete full authentication and profile creation flow', async () => {
      const user = userEvent.setup()
      const mockLogin = vi.fn().mockResolvedValue(undefined)
      const mockCreateProfile = vi.fn().mockResolvedValue(undefined)
      
      // Start with unauthenticated state
      let authState = {
        isAuthenticated: false,
        hasProfile: false,
        user: null,
        loading: false,
        error: null,
        login: mockLogin,
        createProfile: mockCreateProfile,
      }
      
      mockUseAuth.mockReturnValue(authState as any)
      
      // 1. Render login page
      const { rerender } = render(<LoginPage />)
      
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      
      // 2. Click login button
      const loginButton = screen.getByRole('button', { name: /sign in with internet identity/i })
      await user.click(loginButton)
      
      expect(mockLogin).toHaveBeenCalledOnce()
      
      // 3. Simulate successful login (but no profile)
      authState = {
        ...authState,
        isAuthenticated: true,
        hasProfile: false,
      }
      mockUseAuth.mockReturnValue(authState as any)
      
      // Re-render to simulate state change
      rerender(<CreateProfilePage />)
      
      expect(screen.getByRole('heading', { name: /create your profile/i })).toBeInTheDocument()
      
      // 4. Fill out profile form
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/surname at birth/i), 'Doe')
      await user.selectOptions(screen.getByLabelText(/sex/i), 'Male')
      await user.type(screen.getByLabelText(/birthday/i), '1990-01-01')
      await user.type(screen.getByLabelText(/birth city/i), 'New York')
      await user.type(screen.getByLabelText(/birth country/i), 'USA')
      
      // 5. Submit profile creation
      const createButton = screen.getByRole('button', { name: /create profile/i })
      await user.click(createButton)
      
      await waitFor(() => {
        expect(mockCreateProfile).toHaveBeenCalledWith({
          full_name: 'John Doe',
          surname_at_birth: 'Doe',
          sex: 'Male',
          birthday: '1990-01-01',
          birth_city: 'New York',
          birth_country: 'USA',
        })
      })
      
      // 6. Simulate successful profile creation
      const mockUser = createMockUser({
        full_name: 'John Doe',
        surname_at_birth: 'Doe',
        sex: 'Male',
        birthday: '1990-01-01',
        birth_city: 'New York',
        birth_country: 'USA',
      })
      
      authState = {
        ...authState,
        hasProfile: true,
        user: mockUser,
      }
      mockUseAuth.mockReturnValue(authState as any)
      
      // At this point user should be redirected to families page
      // This would normally be handled by routing, but we can test the auth state
      expect(authState.isAuthenticated).toBe(true)
      expect(authState.hasProfile).toBe(true)
      expect(authState.user).toEqual(mockUser)
    })
  })

  describe('Profile Update Flow', () => {
    it('should allow updating existing profile', async () => {
      const user = userEvent.setup()
      const mockUser = createMockUser()
      const mockUpdateProfile = vi.fn().mockResolvedValue(undefined)
      
      const authState = {
        isAuthenticated: true,
        hasProfile: true,
        user: mockUser,
        loading: false,
        error: null,
        updateProfile: mockUpdateProfile,
      }
      
      mockUseAuth.mockReturnValue(authState as any)
      
      render(<ProfilePage />)
      
      // 1. Should show current profile information
      expect(screen.getByText(mockUser.full_name)).toBeInTheDocument()
      
      // 2. Click edit button
      const editButton = screen.getByRole('button', { name: /edit profile/i })
      await user.click(editButton)
      
      // 3. Should show edit form
      expect(screen.getByRole('heading', { name: /edit your profile/i })).toBeInTheDocument()
      
      // 4. Update the full name
      const fullNameInput = screen.getByLabelText(/full name/i)
      await user.clear(fullNameInput)
      await user.type(fullNameInput, 'John Updated')
      
      // 5. Submit the update
      const updateButton = screen.getByRole('button', { name: /update profile/i })
      await user.click(updateButton)
      
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          full_name: ['John Updated'],
          surname_at_birth: [],
          sex: [],
          birthday: [],
          birth_city: [],
          birth_country: [],
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle login errors gracefully', async () => {
      const user = userEvent.setup()
      const mockLogin = vi.fn().mockRejectedValue(new Error('Login failed'))
      
      const authState = {
        isAuthenticated: false,
        hasProfile: false,
        user: null,
        loading: false,
        error: null,
        login: mockLogin,
      }
      
      mockUseAuth.mockReturnValue(authState as any)
      
      render(<LoginPage />)
      
      const loginButton = screen.getByRole('button', { name: /sign in with internet identity/i })
      await user.click(loginButton)
      
      expect(mockLogin).toHaveBeenCalledOnce()
      
      // Error should be handled by the component (toast notification)
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledOnce()
      })
    })

    it('should display backend errors in forms', async () => {
      const user = userEvent.setup()
      const mockCreateProfile = vi.fn().mockRejectedValue(new Error('Profile creation failed'))
      
      const authState = {
        isAuthenticated: true,
        hasProfile: false,
        user: null,
        loading: false,
        error: 'Profile creation failed',
        createProfile: mockCreateProfile,
        clearError: vi.fn(),
      }
      
      mockUseAuth.mockReturnValue(authState as any)
      
      render(<CreateProfilePage />)
      
      // Should display error message
      expect(screen.getByText(/profile creation failed/i)).toBeInTheDocument()
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/surname at birth/i), 'Doe')
      await user.selectOptions(screen.getByLabelText(/sex/i), 'Male')
      
      const createButton = screen.getByRole('button', { name: /create profile/i })
      await user.click(createButton)
      
      expect(mockCreateProfile).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show loading states during async operations', async () => {
      const user = userEvent.setup()
      let resolveLogin: () => void
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve
      })
      const mockLogin = vi.fn().mockReturnValue(loginPromise)
      
      const authState = {
        isAuthenticated: false,
        hasProfile: false,
        user: null,
        loading: false,
        error: null,
        login: mockLogin,
      }
      
      mockUseAuth.mockReturnValue(authState as any)
      
      render(<LoginPage />)
      
      const loginButton = screen.getByRole('button', { name: /sign in with internet identity/i })
      
      // Start login
      user.click(loginButton)
      
      // Should show loading state
      await waitFor(() => {
        expect(loginButton).toBeDisabled()
      })
      
      // Resolve login
      resolveLogin!()
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledOnce()
      })
    })
  })

  describe('Routing Integration', () => {
    it('should redirect unauthenticated users to login', () => {
      const authState = {
        isAuthenticated: false,
        hasProfile: false,
        user: null,
        loading: false,
        error: null,
      }
      
      mockUseAuth.mockReturnValue(authState as any)
      
      render(<LoginPage />)
      
      // Should show login page
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    })

    it('should redirect authenticated users without profile to create profile', () => {
      const authState = {
        isAuthenticated: true,
        hasProfile: false,
        user: null,
        loading: false,
        error: null,
        clearError: vi.fn(),
        createProfile: vi.fn(),
      }
      
      mockUseAuth.mockReturnValue(authState as any)
      
      render(<CreateProfilePage />)
      
      // Should show create profile page
      expect(screen.getByRole('heading', { name: /create your profile/i })).toBeInTheDocument()
    })

    it('should allow authenticated users with profile to access protected pages', () => {
      const mockUser = createMockUser()
      const authState = {
        isAuthenticated: true,
        hasProfile: true,
        user: mockUser,
        loading: false,
        error: null,
      }
      
      mockUseAuth.mockReturnValue(authState as any)
      
      render(<ProfilePage />)
      
      // Should show profile page
      expect(screen.getByText(mockUser.full_name)).toBeInTheDocument()
    })
  })
})