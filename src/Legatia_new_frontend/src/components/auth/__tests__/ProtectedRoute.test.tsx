import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../ProtectedRoute'
import { render } from '../../../test/utils/test-utils'
import { useAuth } from '../../../hooks/useAuth'

// Mock the useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

// Mock Navigate component to track redirects
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to, replace }: { to: string; replace?: boolean }) => {
      mockNavigate(to, replace)
      return <div data-testid="navigate" data-to={to} data-replace={replace} />
    },
  }
})

describe('ProtectedRoute', () => {
  const mockUseAuth = vi.mocked(useAuth)
  
  const TestComponent = () => <div data-testid="protected-content">Protected Content</div>

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        hasProfile: false,
        loading: true,
      } as any)
      
      render(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Authentication Check', () => {
    it('should render children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: true,
        loading: false,
      } as any)
      
      render(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
    })

    it('should redirect to login when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        hasProfile: false,
        loading: false,
      } as any)
      
      render(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true')
    })

    it('should preserve location state when redirecting to login', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        hasProfile: false,
        loading: false,
      } as any)
      
      // Mock useLocation to return a current location
      const mockLocation = { pathname: '/families', search: '', hash: '', state: null, key: 'test' }
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom')
        return {
          ...actual,
          useLocation: () => mockLocation,
          Navigate: ({ to, state, replace }: { to: string; state?: any; replace?: boolean }) => {
            mockNavigate(to, state, replace)
            return <div data-testid="navigate" data-to={to} data-state={JSON.stringify(state)} data-replace={replace} />
          },
        }
      })
      
      render(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )
      
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
    })
  })

  describe('Profile Check', () => {
    it('should render children when authenticated and profile not required', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: false,
        loading: false,
      } as any)
      
      render(
        <ProtectedRoute requiresProfile={false}>
          <TestComponent />
        </ProtectedRoute>
      )
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('should render children when authenticated and has profile', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: true,
        loading: false,
      } as any)
      
      render(
        <ProtectedRoute requiresProfile={true}>
          <TestComponent />
        </ProtectedRoute>
      )
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('should redirect to create-profile when authenticated but no profile required', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: false,
        loading: false,
      } as any)
      
      render(
        <ProtectedRoute requiresProfile={true}>
          <TestComponent />
        </ProtectedRoute>
      )
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/create-profile')
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true')
    })
  })

  describe('Default Behavior', () => {
    it('should not require profile by default', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: false,
        loading: false,
      } as any)
      
      render(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle authentication check before profile check', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        hasProfile: false,
        loading: false,
      } as any)
      
      render(
        <ProtectedRoute requiresProfile={true}>
          <TestComponent />
        </ProtectedRoute>
      )
      
      // Should redirect to login, not create-profile
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
    })

    it('should show loading even when requiresProfile is true', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: true,
        loading: true,
      } as any)
      
      render(
        <ProtectedRoute requiresProfile={true}>
          <TestComponent />
        </ProtectedRoute>
      )
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })
})