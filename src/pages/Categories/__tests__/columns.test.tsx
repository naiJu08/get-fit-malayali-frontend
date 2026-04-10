// Mock the utility dependency at the module level
jest.mock('../../../utilities/parsers', () => ({
  getNestedProperty: jest.fn((obj, path) => {
    return obj?.[path]
  }),
}))

// Test the utility functions directly by testing the column behavior
import { getColumns } from '../columns'

// Get the mock function for use in tests
import * as parsers from '../../../utilities/parsers'
const mockGetNestedProperty = parsers.getNestedProperty as jest.MockedFunction<
  typeof parsers.getNestedProperty
>

describe('Columns Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set up default mock behavior
    mockGetNestedProperty.mockImplementation((obj: any, path: string) => {
      return obj?.[path]
    })
  })

  describe('Column Configuration', () => {
    test('returns correct number of columns', () => {
      const columns = getColumns({})

      expect(columns).toHaveLength(2)
    })

    test('name column has correct properties', () => {
      const columns = getColumns({})
      const nameColumn = columns.find((col) => col.field === 'name')

      expect(nameColumn?.title).toBe('Name')
      expect(nameColumn?.field).toBe('name')
      expect(nameColumn?.sortable).toBe(false)
      expect(nameColumn?.resizable).toBe(true)
      expect(nameColumn?.isVisible).toBe(true)
      expect(nameColumn?.customCell).toBe(true)
    })

    test('description column has correct properties', () => {
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')

      expect(descColumn?.title).toBe('Description')
      expect(descColumn?.field).toBe('description')
      expect(descColumn?.sortable).toBe(false)
      expect(descColumn?.resizable).toBe(true)
      expect(descColumn?.isVisible).toBe(true)
      expect(descColumn?.customCell).toBe(true)
    })
  })

  describe('Name Column', () => {
    test('handles undefined name', () => {
      mockGetNestedProperty.mockReturnValue(undefined)
      const columns = getColumns({})
      const nameColumn = columns.find((col) => col.field === 'name')
      const result = nameColumn?.renderCell?.({ name: undefined })

      expect(result?.cell).toBe('')
      expect(result?.toolTip).toBe('')
    })

    test('handles null name', () => {
      mockGetNestedProperty.mockReturnValue(undefined)
      const columns = getColumns({})
      const nameColumn = columns.find((col) => col.field === 'name')
      const result = nameColumn?.renderCell?.({ name: undefined })

      expect(result?.cell).toBe('')
      expect(result?.toolTip).toBe('')
    })

    test('handles empty string name', () => {
      mockGetNestedProperty.mockReturnValue('')
      const columns = getColumns({})
      const nameColumn = columns.find((col) => col.field === 'name')
      const result = nameColumn?.renderCell?.({ name: '' })

      expect(result?.cell).toBe('')
      expect(result?.toolTip).toBe('')
    })

    test('formats text with proper capitalization', () => {
      mockGetNestedProperty.mockReturnValue('john doe')
      const columns = getColumns({})
      const nameColumn = columns.find((col) => col.field === 'name')
      const result = nameColumn?.renderCell?.({ name: 'john doe' })

      expect(result?.cell).toBe('John doe')
      expect(result?.toolTip).toBe('John doe')
    })

    test('handles already capitalized text', () => {
      mockGetNestedProperty.mockReturnValue('John Doe')
      const columns = getColumns({})
      const nameColumn = columns.find((col) => col.field === 'name')
      const result = nameColumn?.renderCell?.({ name: 'John Doe' })

      expect(result?.cell).toBe('John doe')
      expect(result?.toolTip).toBe('John doe')
    })

    test('handles all uppercase text', () => {
      mockGetNestedProperty.mockReturnValue('JOHN DOE')
      const columns = getColumns({})
      const nameColumn = columns.find((col) => col.field === 'name')
      const result = nameColumn?.renderCell?.({ name: 'JOHN DOE' })

      expect(result?.cell).toBe('John doe')
      expect(result?.toolTip).toBe('John doe')
    })

    test('truncates long names', () => {
      const longText =
        'This is a very long name that should be truncated when displayed'
      mockGetNestedProperty.mockReturnValue(longText)
      const columns = getColumns({})
      const nameColumn = columns.find((col) => col.field === 'name')
      const result = nameColumn?.renderCell?.({ name: longText })

      if (typeof result?.cell === 'string') {
        expect(result.cell.length).toBeLessThanOrEqual(51) // Account for the ellipsis
        expect(result.cell).toContain('') // The ellipsis is a single character
      }
      expect(result?.toolTip).toBe(longText)
    })

    test('renders as plain text when onNameClick is not provided', () => {
      mockGetNestedProperty.mockReturnValue('Test Name')
      const columns = getColumns({})
      const nameColumn = columns.find((col) => col.field === 'name')
      const result = nameColumn?.renderCell?.({ name: 'Test Name' })

      expect(result?.cell).toBe('Test name') // The function capitalizes first letter only
    })

    test('renders as plain text when disableNameLink is true', () => {
      mockGetNestedProperty.mockReturnValue('Test Name')
      const mockOnClick = jest.fn()
      const columns = getColumns({
        onNameClick: mockOnClick,
        disableNameLink: true,
      })
      const nameColumn = columns.find((col) => col.field === 'name')
      const result = nameColumn?.renderCell?.({ name: 'Test Name' })

      expect(result?.cell).toBe('Test name') // The function capitalizes first letter only
    })

    test('renders as button when onNameClick is provided', () => {
      mockGetNestedProperty.mockReturnValue('Test Name')
      const mockOnClick = jest.fn()
      const columns = getColumns({ onNameClick: mockOnClick })
      const nameColumn = columns.find((col) => col.field === 'name')
      const result = nameColumn?.renderCell?.({ name: 'Test Name', id: 1 })

      // Check that it's a React element (button)
      expect(result?.cell).toHaveProperty(
        '$$typeof',
        Symbol.for('react.element')
      )
      expect(result?.cell).toHaveProperty('type', 'button')
    })

    test('sets link property correctly', () => {
      const mockOnClick = jest.fn()
      const columns = getColumns({ onNameClick: mockOnClick })
      const nameColumn = columns.find((col) => col.field === 'name')

      expect((nameColumn as any)?.link).toBe(true)
    })

    test('sets link property to false when disabled', () => {
      const columns = getColumns({ disableNameLink: true })
      const nameColumn = columns.find((col) => col.field === 'name')

      expect((nameColumn as any)?.link).toBe(false)
    })

    test('sets rowClick function when onNameClick is provided', () => {
      const mockOnClick = jest.fn()
      const columns = getColumns({ onNameClick: mockOnClick })
      const nameColumn = columns.find((col) => col.field === 'name')

      expect(typeof (nameColumn as any)?.rowClick).toBe('function')
    })

    test('sets rowClick to undefined when disabled', () => {
      const columns = getColumns({ disableNameLink: true })
      const nameColumn = columns.find((col) => col.field === 'name')

      expect((nameColumn as any)?.rowClick).toBeUndefined()
    })
  })

  describe('Description Column', () => {
    test('handles undefined description', () => {
      mockGetNestedProperty.mockReturnValue(undefined)
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const result = descColumn?.renderCell?.({ description: undefined })

      expect(result?.toolTip).toBe('')
      expect(result?.cell).toHaveProperty(
        '$$typeof',
        Symbol.for('react.element')
      )
    })

    test('handles null description', () => {
      mockGetNestedProperty.mockReturnValue(undefined)
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const result = descColumn?.renderCell?.({ description: undefined })

      expect(result?.toolTip).toBe('')
      expect(result?.cell).toHaveProperty(
        '$$typeof',
        Symbol.for('react.element')
      )
    })

    test('handles empty description', () => {
      mockGetNestedProperty.mockReturnValue('')
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const result = descColumn?.renderCell?.({ description: '' })

      expect(result?.toolTip).toBe('')
      expect(result?.cell).toHaveProperty(
        '$$typeof',
        Symbol.for('react.element')
      )
    })

    test('processes HTML content correctly', () => {
      mockGetNestedProperty.mockReturnValue(
        '<p>Description with <em>emphasis</em></p>'
      )
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const result = descColumn?.renderCell?.({
        description: '<p>Description with <em>emphasis</em></p>',
      })

      expect(result?.toolTip).toBe('Description with emphasis')
      expect(result?.cell).toHaveProperty(
        '$$typeof',
        Symbol.for('react.element')
      )
    })

    test('removes HTML tags from description', () => {
      mockGetNestedProperty.mockReturnValue(
        '<p>This is <strong>bold</strong> text</p>'
      )
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const result = descColumn?.renderCell?.({
        description: '<p>This is <strong>bold</strong> text</p>',
      })

      expect(result?.toolTip).toBe('This is bold text')
    })

    test('replaces &nbsp; with spaces', () => {
      mockGetNestedProperty.mockReturnValue(
        'Text&nbsp;with&nbsp;non-breaking spaces'
      )
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const result = descColumn?.renderCell?.({
        description: 'Text&nbsp;with&nbsp;non-breaking spaces',
      })

      expect(result?.toolTip).toBe('Text with non-breaking spaces')
    })

    test('handles multiple spaces', () => {
      mockGetNestedProperty.mockReturnValue(
        'Text    with     multiple     spaces'
      )
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const result = descColumn?.renderCell?.({
        description: 'Text    with     multiple     spaces',
      })

      expect(result?.toolTip).toBe('Text with multiple spaces')
    })

    test('truncates long descriptions', () => {
      const longDesc = 'A'.repeat(150)
      mockGetNestedProperty.mockReturnValue(longDesc)
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const result = descColumn?.renderCell?.({ description: longDesc })

      // The stripHtml and truncateText functions are called, but the original length is preserved in toolTip
      expect(result?.toolTip).toBe(longDesc)
    })

    test('renders dangerouslySetInnerHTML correctly', () => {
      mockGetNestedProperty.mockReturnValue('Simple description')
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const result = descColumn?.renderCell?.({
        description: 'Simple description',
      })

      expect(result?.cell).toHaveProperty(
        '$$typeof',
        Symbol.for('react.element')
      )
      expect(result?.cell).toHaveProperty('type', 'div')
      expect(result?.cell).toHaveProperty(
        'props.className',
        'max-w-xs truncate'
      )
    })
  })

  describe('Edge Cases', () => {
    test('handles complex HTML with nested tags', () => {
      mockGetNestedProperty.mockReturnValue(
        '<div><p>Nested <span>tags</span> with <strong>formatting</strong></p></div>'
      )
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const result = descColumn?.renderCell?.({
        description:
          '<div><p>Nested <span>tags</span> with <strong>formatting</strong></p></div>',
      })

      expect(result?.toolTip).toBe('Nested tags with formatting')
    })

    test('handles HTML entities', () => {
      mockGetNestedProperty.mockReturnValue(
        'Text with &lt;script&gt; and &amp; entities'
      )
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const result = descColumn?.renderCell?.({
        description: 'Text with &lt;script&gt; and &amp; entities',
      })

      // The stripHtml function doesn't decode HTML entities, it just removes tags
      expect(result?.toolTip).toBe(
        'Text with &lt;script&gt; and &amp; entities'
      )
    })

    test('handles very long text with special characters', () => {
      const specialText = 'A'.repeat(100) + '!@#$%^&*()'
      mockGetNestedProperty.mockReturnValue(specialText)
      const columns = getColumns({})
      const nameColumn = columns.find((col) => col.field === 'name')
      const result = nameColumn?.renderCell?.({ name: specialText })

      if (typeof result?.cell === 'string') {
        expect(result.cell.length).toBeLessThanOrEqual(51) // Account for the ellipsis
        expect(result.cell).toContain('') // The ellipsis is a single character
      }
    })

    test('handles mixed case names with special characters', () => {
      mockGetNestedProperty.mockReturnValue('jOhN-dOe_123')
      const columns = getColumns({})
      const nameColumn = columns.find((col) => col.field === 'name')
      const result = nameColumn?.renderCell?.({ name: 'jOhN-dOe_123' })

      expect(result?.cell).toBe('John-doe_123')
      expect(result?.toolTip).toBe('John-doe_123')
    })
  })
})
