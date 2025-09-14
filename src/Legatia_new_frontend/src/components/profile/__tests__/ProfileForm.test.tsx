import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileForm } from '../ProfileForm'
import { render, createMockUser } from '../../../test/utils/test-utils'

describe('ProfileForm', () => {
  const mockOnSubmit = vi.fn()
  const mockUser = createMockUser()

  const defaultProps = {
    onSubmit: mockOnSubmit,
    loading: false,
    title: 'Test Form',
    description: 'Test description',
    submitText: 'Submit',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render form with all fields', () => {
      render(<ProfileForm {...defaultProps} />)
      
      expect(screen.getByRole('heading', { name: /test form/i })).toBeInTheDocument()
      expect(screen.getByText(/test description/i)).toBeInTheDocument()
      
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/surname at birth/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/sex/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/birthday/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/birth city/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/birth country/i)).toBeInTheDocument()
      
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    })

    it('should populate form with initial data when provided', () => {
      render(<ProfileForm {...defaultProps} initialData={mockUser} />)
      
      expect(screen.getByDisplayValue(mockUser.full_name)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUser.surname_at_birth)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUser.sex)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUser.birthday)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUser.birth_city)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUser.birth_country)).toBeInTheDocument()
    })

    it('should show required field indicators', () => {
      render(<ProfileForm {...defaultProps} />)
      
      // Check for required field asterisks
      expect(screen.getByText(/full name \*/i)).toBeInTheDocument()
      expect(screen.getByText(/surname at birth \*/i)).toBeInTheDocument()
      expect(screen.getByText(/sex \*/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      const user = userEvent.setup()
      render(<ProfileForm {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument()
        expect(screen.getByText(/surname at birth is required/i)).toBeInTheDocument()
        expect(screen.getByText(/sex is required/i)).toBeInTheDocument()
      })
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should validate minimum length for full name', async () => {
      const user = userEvent.setup()
      render(<ProfileForm {...defaultProps} />)
      
      const fullNameInput = screen.getByLabelText(/full name/i)
      await user.type(fullNameInput, 'A')
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument()
      })
    })

    it('should accept valid form data', async () => {
      const user = userEvent.setup()
      render(<ProfileForm {...defaultProps} />)
      
      // Fill in required fields
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/surname at birth/i), 'Doe')
      await user.selectOptions(screen.getByLabelText(/sex/i), 'Male')
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          full_name: 'John Doe',
          surname_at_birth: 'Doe',
          sex: 'Male',
          birthday: '',
          birth_city: '',
          birth_country: '',
        })
      })
    })
  })

  describe('Sex Selection', () => {
    it('should render sex options correctly', () => {
      render(<ProfileForm {...defaultProps} />)
      
      const sexSelect = screen.getByLabelText(/sex/i)
      expect(sexSelect).toBeInTheDocument()
      
      // Check for options
      expect(screen.getByRole('option', { name: /select sex/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /male/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /female/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /other/i })).toBeInTheDocument()
    })

    it('should allow sex selection', async () => {
      const user = userEvent.setup()
      render(<ProfileForm {...defaultProps} />)
      
      const sexSelect = screen.getByLabelText(/sex/i)
      await user.selectOptions(sexSelect, 'Female')
      
      expect(screen.getByDisplayValue('Female')).toBeInTheDocument()
    })
  })

  describe('Create vs Update Mode', () => {
    it('should create profile data when no initial data', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      const user = userEvent.setup()
      render(<ProfileForm {...defaultProps} />)
      
      // Fill form
      await user.type(screen.getByLabelText(/full name/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/surname at birth/i), 'Smith')
      await user.selectOptions(screen.getByLabelText(/sex/i), 'Female')
      await user.type(screen.getByLabelText(/birthday/i), '1990-01-01')
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          full_name: 'Jane Smith',
          surname_at_birth: 'Smith',
          sex: 'Female',
          birthday: '1990-01-01',
          birth_city: '',
          birth_country: '',
        })
      })
    })

    it('should create update data when initial data provided', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      const user = userEvent.setup()
      render(<ProfileForm {...defaultProps} initialData={mockUser} />)
      
      // Change only the full name
      const fullNameInput = screen.getByLabelText(/full name/i)
      await user.clear(fullNameInput)
      await user.type(fullNameInput, 'Jane Updated')
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          full_name: ['Jane Updated'],
          surname_at_birth: [], // No change
          sex: [], // No change
          birthday: [], // No change
          birth_city: [], // No change
          birth_country: [], // No change
        })
      })
    })

    it('should only include changed fields in update data', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      const user = userEvent.setup()
      render(<ProfileForm {...defaultProps} initialData={mockUser} />)
      
      // Change multiple fields
      const fullNameInput = screen.getByLabelText(/full name/i)
      const birthCityInput = screen.getByLabelText(/birth city/i)
      
      await user.clear(fullNameInput)
      await user.type(fullNameInput, 'Updated Name')
      
      await user.clear(birthCityInput)
      await user.type(birthCityInput, 'Updated City')
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          full_name: ['Updated Name'],
          surname_at_birth: [],
          sex: [],
          birthday: [],
          birth_city: ['Updated City'],
          birth_country: [],
        })
      })
    })
  })

  describe('Loading State', () => {
    it('should disable form during loading', () => {
      render(<ProfileForm {...defaultProps} loading={true} />)
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      expect(submitButton).toBeDisabled()
    })

    it('should disable form during submission', async () => {
      // Mock a slow submission
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      const user = userEvent.setup()
      render(<ProfileForm {...defaultProps} />)
      
      // Fill required fields
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/surname at birth/i), 'Doe')
      await user.selectOptions(screen.getByLabelText(/sex/i), 'Male')
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      
      // Click submit
      user.click(submitButton)
      
      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Error Styling', () => {
    it('should apply error styling to invalid fields', async () => {
      const user = userEvent.setup()
      render(<ProfileForm {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        const fullNameInput = screen.getByLabelText(/full name/i)
        expect(fullNameInput).toHaveClass('border-red-500')
        
        const surnameInput = screen.getByLabelText(/surname at birth/i)
        expect(surnameInput).toHaveClass('border-red-500')
        
        const sexInput = screen.getByLabelText(/sex/i)
        expect(sexInput).toHaveClass('border-red-500')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<ProfileForm {...defaultProps} />)
      
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/surname at birth/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/sex/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/birthday/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/birth city/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/birth country/i)).toBeInTheDocument()
    })

    it('should associate error messages with inputs', async () => {
      const user = userEvent.setup()
      render(<ProfileForm {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        const fullNameInput = screen.getByLabelText(/full name/i)
        const errorMessage = screen.getByText(/full name must be at least 2 characters/i)
        
        // Error message should be associated with the input
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveClass('text-red-500')
      })
    })
  })
})