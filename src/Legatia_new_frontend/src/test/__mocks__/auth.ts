import { vi } from 'vitest'
import { Principal } from '@dfinity/principal'
import { BackendActor, UserProfile } from '../../types'

// Mock user profile
export const mockUserProfile: UserProfile = {
  id: 'test-user-id',
  full_name: 'John Doe',
  surname_at_birth: 'Doe',
  sex: 'Male',
  birthday: '1990-01-01',
  birth_city: 'New York',
  birth_country: 'USA',
  created_at: BigInt(Date.now() * 1000000),
  updated_at: BigInt(Date.now() * 1000000),
}

// Mock principal
export const mockPrincipal = Principal.fromText('rdmx6-jaaaa-aaaaa-aaadq-cai')

// Mock backend actor
export const mockBackendActor: Partial<BackendActor> = {
  whoami: vi.fn().mockResolvedValue(mockPrincipal),
  get_profile: vi.fn().mockResolvedValue({ Ok: mockUserProfile }),
  create_profile: vi.fn().mockResolvedValue({ Ok: mockUserProfile }),
  update_profile: vi.fn().mockResolvedValue({ Ok: mockUserProfile }),
  get_user_families: vi.fn().mockResolvedValue({ Ok: [] }),
  create_family: vi.fn().mockResolvedValue({ 
    Ok: {
      id: 'test-family-id',
      name: 'Test Family',
      description: 'A test family',
      admin: mockPrincipal,
      members: [],
      is_visible: true,
      created_at: BigInt(Date.now() * 1000000),
      updated_at: BigInt(Date.now() * 1000000),
    }
  }),
  get_my_notifications: vi.fn().mockResolvedValue({ Ok: [] }),
  get_unread_notification_count: vi.fn().mockResolvedValue({ Ok: BigInt(0) }),
}

// Mock auth service
export const mockAuthService = {
  init: vi.fn().mockResolvedValue(true),
  login: vi.fn().mockResolvedValue(true),
  logout: vi.fn().mockResolvedValue(undefined),
  getActor: vi.fn().mockReturnValue(mockBackendActor),
  getPrincipal: vi.fn().mockReturnValue(mockPrincipal),
  getIsAuthenticated: vi.fn().mockReturnValue(true),
  isLocalDevelopment: vi.fn().mockReturnValue(true),
}

// Mock AuthClient
export const mockAuthClient = {
  create: vi.fn().mockResolvedValue({
    isAuthenticated: vi.fn().mockResolvedValue(true),
    login: vi.fn().mockImplementation(({ onSuccess }) => {
      setTimeout(() => onSuccess?.(), 100)
      return Promise.resolve()
    }),
    logout: vi.fn().mockResolvedValue(undefined),
    getIdentity: vi.fn().mockReturnValue({
      getPrincipal: vi.fn().mockReturnValue(mockPrincipal),
    }),
  }),
}

// Mock @dfinity/auth-client
vi.mock('@dfinity/auth-client', () => ({
  AuthClient: mockAuthClient,
}))

// Mock declarations
vi.mock('../../declarations/Legatia_new_backend', () => ({
  createActor: vi.fn().mockReturnValue(mockBackendActor),
  idlFactory: {},
  canisterId: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
}))

// Mock auth service
vi.mock('../../services/auth', () => ({
  authService: mockAuthService,
  getBackendActor: vi.fn().mockResolvedValue(mockBackendActor),
}))