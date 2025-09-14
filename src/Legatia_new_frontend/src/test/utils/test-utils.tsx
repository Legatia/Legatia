import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
  Toaster: () => null,
}))

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Custom test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  full_name: 'John Doe',
  surname_at_birth: 'Doe',
  sex: 'Male',
  birthday: '1990-01-01',
  birth_city: 'New York',
  birth_country: 'USA',
  created_at: BigInt(Date.now() * 1000000),
  updated_at: BigInt(Date.now() * 1000000),
  ...overrides,
})

export const createMockFamily = (overrides = {}) => ({
  id: 'test-family-id',
  name: 'Test Family',
  description: 'A test family',
  admin: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
  members: [],
  is_visible: true,
  created_at: BigInt(Date.now() * 1000000),
  updated_at: BigInt(Date.now() * 1000000),
  ...overrides,
})

export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}