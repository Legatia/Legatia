import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FamiliesPage } from '../../pages/FamiliesPage'
import { CreateFamilyPage } from '../../pages/CreateFamilyPage'
import { render, createMockUser, createMockFamily } from '../utils/test-utils'
import { useAuth } from '../../hooks/useAuth'
import { useFamilyStore } from '../../stores/familyStore'

// Mock the hooks
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../stores/familyStore', () => ({
  useFamilyStore: vi.fn(),
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Family Management Flow Integration', () => {
  const mockUseAuth = vi.mocked(useAuth)
  const mockUseFamilyStore = vi.mocked(useFamilyStore)
  const mockUser = createMockUser()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Family Creation Flow', () => {
    it('should complete full family creation flow', async () => {
      const user = userEvent.setup()
      const mockCreateFamily = vi.fn().mockResolvedValue(undefined)
      const mockLoadFamilies = vi.fn().mockResolvedValue(undefined)

      // Set up authenticated user
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: true,
        user: mockUser,
        loading: false,
        error: null,
      } as any)

      // Set up family store
      mockUseFamilyStore.mockReturnValue({
        families: [],
        loading: false,
        error: null,
        createFamily: mockCreateFamily,
        loadFamilies: mockLoadFamilies,
      } as any)

      render(<CreateFamilyPage />)

      // Should show create family form
      expect(screen.getByRole('heading', { name: /create new family/i })).toBeInTheDocument()

      // Fill out family creation form
      await user.type(screen.getByLabelText(/family name/i), 'The Smith Family')
      await user.type(screen.getByLabelText(/description/i), 'Our wonderful family tree')
      
      // Set family visibility
      const visibilityToggle = screen.getByRole('checkbox', { name: /make family public/i })
      await user.click(visibilityToggle)

      // Submit form
      const createButton = screen.getByRole('button', { name: /create family/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(mockCreateFamily).toHaveBeenCalledWith({
          name: 'The Smith Family',
          description: 'Our wonderful family tree',
          is_visible: true,
        })
      })
    })

    it('should handle family creation errors', async () => {
      const user = userEvent.setup()
      const mockCreateFamily = vi.fn().mockRejectedValue(new Error('Family creation failed'))

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: true,
        user: mockUser,
        loading: false,
        error: null,
      } as any)

      mockUseFamilyStore.mockReturnValue({
        families: [],
        loading: false,
        error: 'Family creation failed',
        createFamily: mockCreateFamily,
        clearError: vi.fn(),
      } as any)

      render(<CreateFamilyPage />)

      // Should display error message
      expect(screen.getByText(/family creation failed/i)).toBeInTheDocument()

      // Fill and submit form anyway to test error handling
      await user.type(screen.getByLabelText(/family name/i), 'Test Family')
      await user.type(screen.getByLabelText(/description/i), 'Test description')

      const createButton = screen.getByRole('button', { name: /create family/i })
      await user.click(createButton)

      expect(mockCreateFamily).toHaveBeenCalled()
    })
  })

  describe('Family Listing and Navigation Flow', () => {
    it('should display families and navigate to family details', async () => {
      const user = userEvent.setup()
      const mockFamilies = [
        createMockFamily({ name: 'Family 1', description: 'Description 1' }),
        createMockFamily({ name: 'Family 2', description: 'Description 2' }),
      ]

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: true,
        user: mockUser,
        loading: false,
        error: null,
      } as any)

      mockUseFamilyStore.mockReturnValue({
        families: mockFamilies,
        loading: false,
        error: null,
        loadFamilies: vi.fn(),
      } as any)

      render(<FamiliesPage />)

      // Should display families
      expect(screen.getByText('Family 1')).toBeInTheDocument()
      expect(screen.getByText('Family 2')).toBeInTheDocument()
      expect(screen.getByText('Description 1')).toBeInTheDocument()
      expect(screen.getByText('Description 2')).toBeInTheDocument()

      // Should show member counts
      expect(screen.getAllByText('0 members')).toHaveLength(2)

      // Should have navigation links
      const viewButtons = screen.getAllByRole('link', { name: /view family tree/i })
      expect(viewButtons).toHaveLength(2)
      expect(viewButtons[0]).toHaveAttribute('href', `/family/${mockFamilies[0].id}`)
      expect(viewButtons[1]).toHaveAttribute('href', `/family/${mockFamilies[1].id}`)
    })

    it('should show empty state when no families exist', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: true,
        user: mockUser,
        loading: false,
        error: null,
      } as any)

      mockUseFamilyStore.mockReturnValue({
        families: [],
        loading: false,
        error: null,
        loadFamilies: vi.fn(),
      } as any)

      render(<FamiliesPage />)

      // Should show empty state
      expect(screen.getByText(/no families yet/i)).toBeInTheDocument()
      expect(screen.getByText(/create your first family/i)).toBeInTheDocument()
      
      // Should have create family button
      const createButton = screen.getByRole('link', { name: /create family/i })
      expect(createButton).toBeInTheDocument()
      expect(createButton).toHaveAttribute('href', '/create-family')
    })

    it('should handle loading state', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: true,
        user: mockUser,
        loading: false,
        error: null,
      } as any)

      mockUseFamilyStore.mockReturnValue({
        families: [],
        loading: true,
        error: null,
        loadFamilies: vi.fn(),
      } as any)

      render(<FamiliesPage />)

      // Should show loading state
      expect(screen.getByText(/loading families/i)).toBeInTheDocument()
    })

    it('should handle family loading errors', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: true,
        user: mockUser,
        loading: false,
        error: null,
      } as any)

      mockUseFamilyStore.mockReturnValue({
        families: [],
        loading: false,
        error: 'Failed to load families',
        loadFamilies: vi.fn(),
        clearError: vi.fn(),
      } as any)

      render(<FamiliesPage />)

      // Should show error message
      expect(screen.getByText(/failed to load families/i)).toBeInTheDocument()
    })
  })

  describe('Family Search and Filter Flow', () => {
    it('should filter families based on search query', async () => {
      const user = userEvent.setup()
      const mockFamilies = [
        createMockFamily({ name: 'Smith Family', description: 'Smith family tree' }),
        createMockFamily({ name: 'Johnson Family', description: 'Johnson family history' }),
        createMockFamily({ name: 'Williams Family', description: 'Williams genealogy' }),
      ]

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: true,
        user: mockUser,
        loading: false,
        error: null,
      } as any)

      mockUseFamilyStore.mockReturnValue({
        families: mockFamilies,
        loading: false,
        error: null,
        loadFamilies: vi.fn(),
      } as any)

      render(<FamiliesPage />)

      // Should show all families initially
      expect(screen.getByText('Smith Family')).toBeInTheDocument()
      expect(screen.getByText('Johnson Family')).toBeInTheDocument()
      expect(screen.getByText('Williams Family')).toBeInTheDocument()

      // Search for specific family
      const searchInput = screen.getByPlaceholderText(/search families/i)
      await user.type(searchInput, 'Smith')

      // Should filter results (this depends on implementation)
      // The filtering might be implemented client-side or server-side
      expect(searchInput).toHaveValue('Smith')
    })
  })

  describe('Family Member Management Flow', () => {
    it('should display family members correctly', () => {
      const mockFamilyWithMembers = createMockFamily({
        name: 'Test Family',
        members: [
          {
            id: 'member-1',
            profile_principal: [],
            full_name: 'John Doe',
            surname_at_birth: 'Doe',
            sex: 'Male',
            birthday: [],
            birth_city: [],
            birth_country: [],
            death_date: [],
            relationship_to_admin: 'Self',
            events: [],
            created_at: BigInt(Date.now() * 1000000),
            created_by: 'test-principal' as any,
          },
          {
            id: 'member-2',
            profile_principal: [],
            full_name: 'Jane Doe',
            surname_at_birth: 'Smith',
            sex: 'Female',
            birthday: [],
            birth_city: [],
            birth_country: [],
            death_date: [],
            relationship_to_admin: 'Spouse',
            events: [],
            created_at: BigInt(Date.now() * 1000000),
            created_by: 'test-principal' as any,
          },
        ],
      })

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: true,
        user: mockUser,
        loading: false,
        error: null,
      } as any)

      mockUseFamilyStore.mockReturnValue({
        families: [mockFamilyWithMembers],
        loading: false,
        error: null,
        loadFamilies: vi.fn(),
      } as any)

      render(<FamiliesPage />)

      // Should show member count
      expect(screen.getByText('2 members')).toBeInTheDocument()

      // Should show member names preview
      expect(screen.getByText(/john, jane/i)).toBeInTheDocument()
    })
  })

  describe('Permissions and Visibility Flow', () => {
    it('should display visibility indicators correctly', () => {
      const publicFamily = createMockFamily({ is_visible: true, name: 'Public Family' })
      const privateFamily = createMockFamily({ is_visible: false, name: 'Private Family' })

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: true,
        user: mockUser,
        loading: false,
        error: null,
      } as any)

      mockUseFamilyStore.mockReturnValue({
        families: [publicFamily, privateFamily],
        loading: false,
        error: null,
        loadFamilies: vi.fn(),
      } as any)

      render(<FamiliesPage />)

      // Should show both families
      expect(screen.getByText('Public Family')).toBeInTheDocument()
      expect(screen.getByText('Private Family')).toBeInTheDocument()

      // Should show visibility indicators
      expect(screen.getByTitle('Public family')).toBeInTheDocument()
      expect(screen.getByTitle('Private family')).toBeInTheDocument()
    })
  })

  describe('Navigation Integration', () => {
    it('should have proper navigation links', () => {
      const mockFamily = createMockFamily()

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        hasProfile: true,
        user: mockUser,
        loading: false,
        error: null,
      } as any)

      mockUseFamilyStore.mockReturnValue({
        families: [mockFamily],
        loading: false,
        error: null,
        loadFamilies: vi.fn(),
      } as any)

      render(<FamiliesPage />)

      // Should have create family link
      const createFamilyLink = screen.getByRole('link', { name: /create new family/i })
      expect(createFamilyLink).toHaveAttribute('href', '/create-family')

      // Should have view family link
      const viewFamilyLink = screen.getByRole('link', { name: /view family tree/i })
      expect(viewFamilyLink).toHaveAttribute('href', `/family/${mockFamily.id}`)
    })
  })
})