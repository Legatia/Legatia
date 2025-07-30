import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { FamilyCard } from '../FamilyCard'
import { render, createMockFamily } from '../../../test/utils/test-utils'
import { Family } from '../../../types'

describe('FamilyCard', () => {
  const mockFamily = createMockFamily()
  
  const familyWithMembers = createMockFamily({
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
        full_name: 'Jane Smith',
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

  describe('Basic Rendering', () => {
    it('should render family information correctly', () => {
      render(<FamilyCard family={mockFamily} />)
      
      expect(screen.getByText(mockFamily.name)).toBeInTheDocument()
      expect(screen.getByText(mockFamily.description)).toBeInTheDocument()
    })

    it('should display member count correctly', () => {
      render(<FamilyCard family={familyWithMembers} />)
      
      expect(screen.getByText('2 members')).toBeInTheDocument()
    })

    it('should display singular member text for one member', () => {
      const singleMemberFamily = createMockFamily({
        members: [familyWithMembers.members[0]],
      })
      
      render(<FamilyCard family={singleMemberFamily} />)
      
      expect(screen.getByText('1 member')).toBeInTheDocument()
    })

    it('should display zero members correctly', () => {
      render(<FamilyCard family={mockFamily} />)
      
      expect(screen.getByText('0 members')).toBeInTheDocument()
    })
  })

  describe('Visibility Indicators', () => {
    it('should show public family indicator when visible', () => {
      const publicFamily = createMockFamily({ is_visible: true })
      render(<FamilyCard family={publicFamily} />)
      
      // Look for the Eye icon (public indicator)
      const publicIndicator = screen.getByTitle('Public family')
      expect(publicIndicator).toBeInTheDocument()
    })

    it('should show private family indicator when not visible', () => {
      const privateFamily = createMockFamily({ is_visible: false })
      render(<FamilyCard family={privateFamily} />)
      
      // Look for the EyeOff icon (private indicator)
      const privateIndicator = screen.getByTitle('Private family')
      expect(privateIndicator).toBeInTheDocument()
    })
  })

  describe('Creation Date', () => {
    it('should display formatted creation date', () => {
      // Create a family with a specific timestamp
      const testDate = new Date('2023-01-15')
      const testFamily = createMockFamily({
        created_at: BigInt(testDate.getTime() * 1000000),
      })
      
      render(<FamilyCard family={testFamily} />)
      
      expect(screen.getByText(/created jan 15, 2023/i)).toBeInTheDocument()
    })

    it('should handle invalid dates gracefully', () => {
      const familyWithBadDate = createMockFamily({
        created_at: BigInt(0), // Invalid timestamp
      })
      
      render(<FamilyCard family={familyWithBadDate} />)
      
      // Should either show a fallback date or handle gracefully
      // The exact behavior depends on your date formatting implementation
      expect(screen.getByText(/created/i)).toBeInTheDocument()
    })
  })

  describe('Member Avatars', () => {
    it('should display member avatars when family has members', () => {
      render(<FamilyCard family={familyWithMembers} />)
      
      // Should show avatar initials for members
      expect(screen.getByText('JD')).toBeInTheDocument() // John Doe
      expect(screen.getByText('JS')).toBeInTheDocument() // Jane Smith
    })

    it('should display member names preview', () => {
      render(<FamilyCard family={familyWithMembers} />)
      
      // Should show first names of members
      expect(screen.getByText(/john, jane/i)).toBeInTheDocument()
    })

    it('should show overflow indicator for many members', () => {
      const manyMembersFamily = createMockFamily({
        members: Array.from({ length: 6 }, (_, i) => ({
          id: `member-${i}`,
          profile_principal: [],
          full_name: `Member ${i}`,
          surname_at_birth: `Surname${i}`,
          sex: 'Other',
          birthday: [],
          birth_city: [],
          birth_country: [],
          death_date: [],
          relationship_to_admin: 'Other',
          events: [],
          created_at: BigInt(Date.now() * 1000000),
          created_by: 'test-principal' as any,
        })),
      })
      
      render(<FamilyCard family={manyMembersFamily} />)
      
      // Should show +2 for the extra members beyond the first 4
      expect(screen.getByText('+2')).toBeInTheDocument()
    })

    it('should not show member avatars when family has no members', () => {
      render(<FamilyCard family={mockFamily} />)
      
      // Should not show member names preview
      expect(screen.queryByText(/john, jane/i)).not.toBeInTheDocument()
    })
  })

  describe('Navigation Link', () => {
    it('should have link to family detail page', () => {
      render(<FamilyCard family={mockFamily} />)
      
      const viewFamilyButton = screen.getByRole('link', { name: /view family tree/i })
      expect(viewFamilyButton).toBeInTheDocument()
      expect(viewFamilyButton).toHaveAttribute('href', `/family/${mockFamily.id}`)
    })

    it('should display correct button text', () => {
      render(<FamilyCard family={mockFamily} />)
      
      expect(screen.getByText(/view family tree/i)).toBeInTheDocument()
    })
  })

  describe('Card Styling', () => {
    it('should apply glass card styling', () => {
      const { container } = render(<FamilyCard family={mockFamily} />)
      
      const card = container.firstChild
      expect(card).toHaveClass('glass-card')
    })

    it('should apply hover effects', () => {
      const { container } = render(<FamilyCard family={mockFamily} />)
      
      const card = container.firstChild
      expect(card).toHaveClass('hover:shadow-lg')
      expect(card).toHaveClass('transition-all')
    })

    it('should accept custom className', () => {
      const customClass = 'custom-test-class'
      const { container } = render(<FamilyCard family={mockFamily} className={customClass} />)
      
      const card = container.firstChild
      expect(card).toHaveClass(customClass)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<FamilyCard family={mockFamily} />)
      
      // Family name should be a heading
      expect(screen.getByRole('heading', { name: mockFamily.name })).toBeInTheDocument()
    })

    it('should have accessible link text', () => {
      render(<FamilyCard family={mockFamily} />)
      
      const link = screen.getByRole('link', { name: /view family tree/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAccessibleName()
    })

    it('should have proper alt text for visibility icons', () => {
      const publicFamily = createMockFamily({ is_visible: true })
      render(<FamilyCard family={publicFamily} />)
      
      const publicIcon = screen.getByTitle('Public family')
      expect(publicIcon).toBeInTheDocument()
    })
  })

  describe('Content Truncation', () => {
    it('should handle long descriptions', () => {
      const longDescFamily = createMockFamily({
        description: 'This is a very long description that should be truncated when displayed in the card component to prevent layout issues and maintain good visual hierarchy in the family cards grid layout.',
      })
      
      render(<FamilyCard family={longDescFamily} />)
      
      // Should show the description (truncation is handled by CSS)
      expect(screen.getByText(longDescFamily.description)).toBeInTheDocument()
    })

    it('should handle long family names', () => {
      const longNameFamily = createMockFamily({
        name: 'The Very Long Family Name That Should Be Handled Gracefully',
      })
      
      render(<FamilyCard family={longNameFamily} />)
      
      expect(screen.getByText(longNameFamily.name)).toBeInTheDocument()
    })
  })

  describe('Member Count Edge Cases', () => {
    it('should handle undefined members array', () => {
      const familyWithUndefinedMembers = {
        ...mockFamily,
        members: undefined as any,
      }
      
      // This should not crash the component
      expect(() => {
        render(<FamilyCard family={familyWithUndefinedMembers} />)
      }).not.toThrow()
    })
  })
})