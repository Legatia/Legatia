import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFamilyStore } from '../familyStore'
import { useAuthStore } from '../authStore'
import { mockBackendActor, mockPrincipal } from '../../test/__mocks__/auth'
import { createMockFamily } from '../../test/utils/test-utils'

// Mock the auth store
vi.mock('../authStore', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}))

describe('familyStore', () => {
  const mockFamily = createMockFamily()
  const mockFamilies = [mockFamily, createMockFamily({ id: 'family-2', name: 'Second Family' })]

  beforeEach(() => {
    // Reset store state
    useFamilyStore.setState({
      families: [],
      currentFamily: null,
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
      const { result } = renderHook(() => useFamilyStore())
      
      expect(result.current.families).toEqual([])
      expect(result.current.currentFamily).toBe(null)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  describe('fetchFamilies', () => {
    it('should fetch families successfully', async () => {
      mockBackendActor.get_user_families?.mockResolvedValue({ Ok: mockFamilies })
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.fetchFamilies()
      })
      
      expect(mockBackendActor.get_user_families).toHaveBeenCalledOnce()
      expect(result.current.families).toEqual(mockFamilies)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle fetch families failure', async () => {
      mockBackendActor.get_user_families?.mockResolvedValue({ Err: 'Failed to fetch families' })
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.fetchFamilies()
      })
      
      expect(result.current.families).toEqual([])
      expect(result.current.error).toBe('Failed to fetch families')
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
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.fetchFamilies()
      })
      
      expect(result.current.error).toBe('Not authenticated')
    })
  })

  describe('createFamily', () => {
    it('should create family successfully', async () => {
      const createData = {
        name: 'New Family',
        description: 'A new family description',
        is_visible: [true],
      }
      
      mockBackendActor.create_family?.mockResolvedValue({ Ok: mockFamily })
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.createFamily(createData)
      })
      
      expect(mockBackendActor.create_family).toHaveBeenCalledWith(createData)
      expect(result.current.families).toContain(mockFamily)
      expect(result.current.currentFamily).toEqual(mockFamily)
      expect(result.current.loading).toBe(false)
    })

    it('should handle create family failure', async () => {
      const createData = {
        name: 'New Family',
        description: 'A new family description',
        is_visible: [true],
      }
      
      mockBackendActor.create_family?.mockResolvedValue({ Err: 'Family creation failed' })
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.createFamily(createData)
      })
      
      expect(result.current.error).toBe('Family creation failed')
      expect(result.current.families).toEqual([])
    })
  })

  describe('selectFamily', () => {
    it('should select family by id', () => {
      useFamilyStore.setState({ families: mockFamilies })
      
      const { result } = renderHook(() => useFamilyStore())
      
      act(() => {
        result.current.selectFamily('family-2')
      })
      
      expect(result.current.currentFamily?.id).toBe('family-2')
      expect(result.current.currentFamily?.name).toBe('Second Family')
    })

    it('should handle selecting non-existent family', () => {
      useFamilyStore.setState({ families: mockFamilies })
      
      const { result } = renderHook(() => useFamilyStore())
      
      act(() => {
        result.current.selectFamily('non-existent-id')
      })
      
      expect(result.current.currentFamily).toBe(null)
    })
  })

  describe('fetchFamily', () => {
    it('should fetch specific family successfully', async () => {
      useFamilyStore.setState({ families: mockFamilies })
      mockBackendActor.get_family?.mockResolvedValue({ Ok: mockFamily })
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.fetchFamily(mockFamily.id)
      })
      
      expect(mockBackendActor.get_family).toHaveBeenCalledWith(mockFamily.id)
      expect(result.current.currentFamily).toEqual(mockFamily)
      expect(result.current.loading).toBe(false)
    })

    it('should handle fetch family failure', async () => {
      mockBackendActor.get_family?.mockResolvedValue({ Err: 'Family not found' })
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.fetchFamily('non-existent-id')
      })
      
      expect(result.current.error).toBe('Family not found')
    })
  })

  describe('addFamilyMember', () => {
    it('should add family member successfully', async () => {
      const memberData = {
        family_id: mockFamily.id,
        full_name: 'Jane Doe',
        surname_at_birth: 'Smith',
        sex: 'Female',
        relationship_to_admin: 'Sister',
      }
      
      const mockMember = {
        id: 'member-1',
        profile_principal: [],
        full_name: 'Jane Doe',
        surname_at_birth: 'Smith',
        sex: 'Female',
        birthday: [],
        birth_city: [],
        birth_country: [],
        death_date: [],
        relationship_to_admin: 'Sister',
        events: [],
        created_at: BigInt(Date.now() * 1000000),
        created_by: mockPrincipal,
      }
      
      mockBackendActor.add_family_member?.mockResolvedValue({ Ok: mockMember })
      mockBackendActor.get_family?.mockResolvedValue({ Ok: mockFamily })
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.addFamilyMember(memberData)
      })
      
      expect(mockBackendActor.add_family_member).toHaveBeenCalledWith(memberData)
      expect(mockBackendActor.get_family).toHaveBeenCalledWith(mockFamily.id)
    })

    it('should handle add family member failure', async () => {
      const memberData = {
        family_id: mockFamily.id,
        full_name: 'Jane Doe',
        surname_at_birth: 'Smith',
        sex: 'Female',
        relationship_to_admin: 'Sister',
      }
      
      mockBackendActor.add_family_member?.mockResolvedValue({ Err: 'Failed to add member' })
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.addFamilyMember(memberData)
      })
      
      expect(result.current.error).toBe('Failed to add member')
    })
  })

  describe('removeFamilyMember', () => {
    it('should remove family member successfully', async () => {
      mockBackendActor.remove_family_member?.mockResolvedValue({ Ok: 'Member removed' })
      mockBackendActor.get_family?.mockResolvedValue({ Ok: mockFamily })
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.removeFamilyMember(mockFamily.id, 'member-id')
      })
      
      expect(mockBackendActor.remove_family_member).toHaveBeenCalledWith(mockFamily.id, 'member-id')
      expect(mockBackendActor.get_family).toHaveBeenCalledWith(mockFamily.id)
    })

    it('should handle remove family member failure', async () => {
      mockBackendActor.remove_family_member?.mockResolvedValue({ Err: 'Failed to remove member' })
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.removeFamilyMember(mockFamily.id, 'member-id')
      })
      
      expect(result.current.error).toBe('Failed to remove member')
    })
  })

  describe('addMemberEvent', () => {
    it('should add member event successfully', async () => {
      const eventData = {
        family_id: mockFamily.id,
        member_id: 'member-1',
        title: 'Birthday',
        description: 'Member birthday celebration',
        event_date: '2023-01-01',
        event_type: 'Birthday',
      }
      
      const mockEvent = {
        id: 'event-1',
        member_id: 'member-1',
        title: 'Birthday',
        description: 'Member birthday celebration',
        event_date: '2023-01-01',
        event_type: 'Birthday',
        created_at: BigInt(Date.now() * 1000000),
        created_by: mockPrincipal,
      }
      
      mockBackendActor.add_member_event?.mockResolvedValue({ Ok: mockEvent })
      mockBackendActor.get_family?.mockResolvedValue({ Ok: mockFamily })
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.addMemberEvent(eventData)
      })
      
      expect(mockBackendActor.add_member_event).toHaveBeenCalledWith(eventData)
      expect(mockBackendActor.get_family).toHaveBeenCalledWith(mockFamily.id)
    })
  })

  describe('toggleFamilyVisibility', () => {
    it('should toggle family visibility successfully', async () => {
      useFamilyStore.setState({ 
        families: [mockFamily],
        currentFamily: mockFamily 
      })
      
      mockBackendActor.toggle_family_visibility?.mockResolvedValue({ Ok: 'Visibility updated' })
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.toggleFamilyVisibility(mockFamily.id, false)
      })
      
      expect(mockBackendActor.toggle_family_visibility).toHaveBeenCalledWith(mockFamily.id, false)
      expect(result.current.families[0].is_visible).toBe(false)
      expect(result.current.currentFamily?.is_visible).toBe(false)
    })

    it('should handle toggle visibility failure', async () => {
      mockBackendActor.toggle_family_visibility?.mockResolvedValue({ Err: 'Failed to update visibility' })
      
      const { result } = renderHook(() => useFamilyStore())
      
      await act(async () => {
        await result.current.toggleFamilyVisibility(mockFamily.id, false)
      })
      
      expect(result.current.error).toBe('Failed to update visibility')
    })
  })

  describe('Utility functions', () => {
    it('should clear error', () => {
      useFamilyStore.setState({ error: 'Some error' })
      
      const { result } = renderHook(() => useFamilyStore())
      
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBe(null)
    })

    it('should reset store', () => {
      useFamilyStore.setState({
        families: mockFamilies,
        currentFamily: mockFamily,
        loading: true,
        error: 'Some error',
      })
      
      const { result } = renderHook(() => useFamilyStore())
      
      act(() => {
        result.current.reset()
      })
      
      expect(result.current.families).toEqual([])
      expect(result.current.currentFamily).toBe(null)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })
})