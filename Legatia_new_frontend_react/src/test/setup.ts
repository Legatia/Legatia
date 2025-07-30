import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_DFX_NETWORK: 'local',
  VITE_CANISTER_ID_LEGATIA_NEW_BACKEND: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
}))

// Mock process.env for compatibility
Object.defineProperty(globalThis, 'process', {
  value: {
    env: {
      DFX_NETWORK: 'local',
      CANISTER_ID_LEGATIA_NEW_BACKEND: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
    }
  }
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
    pathname: '/',
  },
  writable: true,
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ICP services
vi.mock('../services/auth', () => ({
  authService: {
    init: vi.fn().mockResolvedValue(true),
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    getIdentity: vi.fn().mockReturnValue({ getPrincipal: () => ({ toString: () => 'test-principal' }) }),
    isAuthenticated: vi.fn().mockReturnValue(true),
    createActor: vi.fn().mockReturnValue({
      // Authentication methods
      get_profile: vi.fn().mockResolvedValue([{
        id: 'test-profile-id',
        principal: 'test-principal',
        full_name: 'Test User',
        surname_at_birth: 'User',
        sex: 'Other',
        birthday: '1990-01-01',
        birth_city: 'Test City',
        birth_country: 'Test Country',
        created_at: BigInt(Date.now() * 1000000),
      }]),
      create_profile: vi.fn().mockResolvedValue({ Ok: 'test-profile-id' }),
      update_profile: vi.fn().mockResolvedValue({ Ok: null }),
      
      // Family methods
      get_families: vi.fn().mockResolvedValue([]),
      get_family: vi.fn().mockResolvedValue([{
        id: 'test-family-id',
        name: 'Test Family',
        description: 'Test family description',
        admin: 'test-principal',
        members: [],
        is_visible: true,
        created_at: BigInt(Date.now() * 1000000),
      }]),
      create_family: vi.fn().mockResolvedValue({ Ok: 'test-family-id' }),
      add_family_member: vi.fn().mockResolvedValue({ Ok: null }),
      remove_family_member: vi.fn().mockResolvedValue({ Ok: null }),
      toggle_family_visibility: vi.fn().mockResolvedValue({ Ok: null }),
      add_member_event: vi.fn().mockResolvedValue({ Ok: null }),
      
      // Notification methods
      get_notifications: vi.fn().mockResolvedValue([]),
      mark_notification_read: vi.fn().mockResolvedValue({ Ok: null }),
      mark_all_notifications_read: vi.fn().mockResolvedValue({ Ok: null }),
    }),
  },
}))

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  }
})

// Suppress console warnings in tests
const originalWarn = console.warn
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
     args[0].includes('Warning: `ReactDOMTestUtils.act`'))
  ) {
    return
  }
  originalWarn.call(console, ...args)
}