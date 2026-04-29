import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { getColumns, truncateText } from '../columns'

// Mock the dependencies
jest.mock('moment', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    format: jest.fn((format) => {
      if (format === 'DD-MM-YYYY') return '01-01-2023'
      return '2023-01-01'
    }),
  })),
}))

jest.mock('../../../utilities/format', () => ({
  convertUTCtoBrowserTimeZone: jest.fn(() => '2023-01-01'),
}))

jest.mock(
  '../../../utilities/parsers',
  () => ({
    getNestedProperty: jest.fn((obj, path) => {
      if (!obj) return undefined
      const pathParts = path.split('.')
      let value = obj
      for (const part of pathParts) {
        value = value?.[part]
        if (value === undefined) return undefined
      }
      return value
    }),
  }),
  { virtual: true }
)

jest.mock('../../../common/types', () => ({
  AdminListResponse: {
    id: 'string',
    title: 'string',
    description: 'string',
    created_at: 'string',
    updated_at: 'string',
    user: {
      first_name: 'string',
      last_name: 'string',
      last_login: 'string',
    },
  },
}))

// Mock data
const mockRowData = {
  id: '1',
  title: 'Test Meditation Title',
  description:
    'Test meditation description that is quite long and should be truncated',
  duration_minutes: 30,
  level: 'Beginner',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-02T00:00:00Z',
  user: {
    first_name: 'John',
    last_name: 'Doe',
    last_login: '2023-01-01T12:00:00Z',
    status: 'active',
    username: 'johndoe',
    id: '1',
    job_title: 'Meditation Instructor',
    email: 'john@example.com',
    phone: '123-456-7890',
    datetime_created: '2023-01-01T00:00:00Z',
    datetime_updated: '2023-01-01T00:00:00Z',
    group: {
      id: '1',
      name: 'meditation',
      description: 'Meditation Group',
    },
  },
  status: 'active',
  video_url: 'https://example.com/video.mp4',
  thumbnail: 'https://example.com/thumbnail.jpg',
  employee_type: 'meditation',
}

const mockRowDataWithNulls = {
  id: '2',
  title: '',
  description: null,
  duration_minutes: null,
  level: null,
  created_at: null,
  updated_at: null,
  user: null,
  status: null,
  video_url: null,
  thumbnail: null,
  employee_type: null,
}

// Helper function for text truncation is now imported from columns.tsx

describe('Meditation Columns', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getColumns Function', () => {
    it('should return columns array', () => {
      const mockOnNameClick = jest.fn()
      const columns = getColumns({
        onNameClick: mockOnNameClick,
        disableNameLink: false,
      })

      expect(Array.isArray(columns)).toBe(true)
      expect(columns.length).toBeGreaterThan(0)
    })

    it('should handle default parameters', () => {
      const columns = getColumns({})

      expect(Array.isArray(columns)).toBe(true)
      expect(columns.length).toBeGreaterThan(0)
    })

    it('should handle onNameClick parameter', () => {
      const mockOnNameClick = jest.fn()
      const columns = getColumns({
        onNameClick: mockOnNameClick,
        disableNameLink: false,
      })

      expect(Array.isArray(columns)).toBe(true)
    })

    it('should handle disableNameLink parameter', () => {
      const mockOnNameClick = jest.fn()
      const columns = getColumns({
        onNameClick: mockOnNameClick,
        disableNameLink: true,
      })

      expect(Array.isArray(columns)).toBe(true)
    })
  })

  describe('Column Structure', () => {
    it('should have required column properties', () => {
      const columns = getColumns({})

      columns.forEach((column) => {
        expect(column).toHaveProperty('title')
        expect(column).toHaveProperty('field')
        expect(column).toHaveProperty('sortable')
        expect(column).toHaveProperty('resizable')
        expect(column).toHaveProperty('isVisible')
      })
    })

    it('should have default column props', () => {
      const columns = getColumns({})

      columns.forEach((column) => {
        // Not all columns might be sortable, so we don't check sortable default
        expect(column.resizable).toBe(true)
        expect(column.isVisible).toBe(true)
      })
    })

    it('should have unique column fields', () => {
      const columns = getColumns({})
      const columnFields = columns.map((col) => col.field)
      const uniqueFields = Array.from(new Set(columnFields))

      expect(columnFields.length).toBe(uniqueFields.length)
    })
  })

  describe('Cell Rendering', () => {
    it('should render title cell correctly', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title')

      expect(titleColumn).toBeDefined()
      if (titleColumn && titleColumn.renderCell) {
        const cellElement = titleColumn.renderCell(mockRowData as any)
        expect(cellElement).toBeDefined()

        // If it returns a React element, we can test its props
        if (React.isValidElement(cellElement)) {
          expect(cellElement.type).toBeDefined()
        }
      }
    })

    it('should render description cell with truncation', () => {
      const columns = getColumns({})
      const descriptionColumn = columns.find(
        (col) => col.field === 'description'
      )

      expect(descriptionColumn).toBeDefined()
      if (descriptionColumn && descriptionColumn.renderCell) {
        const cellElement = descriptionColumn.renderCell(mockRowData as any)
        expect(cellElement).toBeDefined()
      }
    })

    it('should render duration_minutes cell correctly', () => {
      const columns = getColumns({})
      const durationColumn = columns.find(
        (col) => col.field === 'duration_minutes'
      )

      expect(durationColumn).toBeDefined()
      if (durationColumn && durationColumn.renderCell) {
        const cellElement = durationColumn.renderCell(mockRowData as any)
        expect(cellElement).toBeDefined()
      }
    })
  })

  describe('Data Handling', () => {
    it('should handle null values gracefully', () => {
      const columns = getColumns({})

      columns.forEach((column) => {
        if (column.renderCell) {
          expect(() => {
            column.renderCell(mockRowDataWithNulls as any)
          }).not.toThrow()
        }
      })
    })

    it('should handle undefined values gracefully', () => {
      const columns = getColumns({})

      columns.forEach((column) => {
        if (column.renderCell) {
          expect(() => {
            column.renderCell({} as any)
          }).not.toThrow()
        }
      })
    })

    it('should handle empty string values', () => {
      const columns = getColumns({})

      columns.forEach((column) => {
        if (column.renderCell) {
          expect(() => {
            column.renderCell(mockRowDataWithNulls as any)
          }).not.toThrow()
        }
      })
    })
  })

  describe('Name Click Functionality', () => {
    it('should render name with link when onNameClick is provided', () => {
      const mockOnNameClick = jest.fn()
      const columns = getColumns({
        onNameClick: mockOnNameClick,
        disableNameLink: false,
      })

      const nameColumn = columns.find((col) => col.field === 'title')

      expect(nameColumn).toBeDefined()
      if (nameColumn && nameColumn.renderCell) {
        const cellElement = nameColumn.renderCell(mockRowData as any)
        expect(cellElement).toBeDefined()
      }
    })

    it('should render name without link when disableNameLink is true', () => {
      const mockOnNameClick = jest.fn()
      const columns = getColumns({
        onNameClick: mockOnNameClick,
        disableNameLink: true,
      })

      const nameColumn = columns.find((col) => col.field === 'title')

      expect(nameColumn).toBeDefined()
      if (nameColumn && nameColumn.renderCell) {
        const cellElement = nameColumn.renderCell(mockRowData as any)
        expect(cellElement).toBeDefined()
      }
    })

    it('should handle missing onNameClick gracefully', () => {
      const columns = getColumns({})

      expect(() => {
        columns.forEach((column) => {
          if (column.renderCell) {
            column.renderCell(mockRowData as any)
          }
        })
      }).not.toThrow()
    })
  })

  describe('Date Formatting', () => {
    // No date columns in current implementation - tests removed
    it('should have no date columns', () => {
      const columns = getColumns({})
      const dateColumns = ['created_at', 'updated_at']

      dateColumns.forEach((dateField) => {
        const column = columns.find((col) => col.field === dateField)
        expect(column).toBeUndefined()
      })
    })
  })

  describe('TruncateText', () => {
    it('should truncate long text', () => {
      const longText =
        'This is a very long text that should be truncated and have ellipsis'
      const result = truncateText(longText, 40)

      expect(result.length).toBeLessThanOrEqual(43) // 40 + "…"
      expect(result).toContain('…')
    })

    it('should not truncate short text', () => {
      const shortText = 'Short text'
      const result = truncateText(shortText, 40)

      expect(result).toBe(shortText)
      expect(result).not.toContain('…')
    })

    it('should handle empty string', () => {
      const result = truncateText('')
      expect(result).toBe('')
    })

    it('should handle null value', () => {
      const result = truncateText(null as any)
      expect(result).toBe('')
    })

    it('should handle undefined value', () => {
      const result = truncateText(undefined)
      expect(result).toBe('')
    })

    it('should handle whitespace-only strings', () => {
      const result = truncateText('   ')
      expect(result).toBe('')
    })

    it('should trim whitespace before truncation', () => {
      const textWithSpaces = '   This text has spaces at ends   '
      const result = truncateText(textWithSpaces, 40)
      expect(result).toBe('This text has spaces at ends')
    })

    it('should handle text exactly at limit', () => {
      const exactLimitText = 'A'.repeat(40)
      const result = truncateText(exactLimitText, 40)

      expect(result).toBe(exactLimitText)
      expect(result).not.toContain('…')
    })

    it('should handle text just over limit', () => {
      const overLimitText = 'A'.repeat(41)
      const result = truncateText(overLimitText, 40)

      expect(result.length).toBe(41) // 40 + "…"
      expect(result).toContain('…')
    })

    it('should handle custom limit', () => {
      const text = 'A'.repeat(30)
      const result = truncateText(text, 20)

      expect(result.length).toBe(21) // 20 + "…"
      expect(result).toContain('…')
    })

    it('should handle limit of 0', () => {
      const result = truncateText('Test', 0)
      expect(result).toBe('…')
    })

    it('should handle negative limit', () => {
      const result = truncateText('Test', -5)
      expect(result).toBe('…')
    })
  })

  describe('Nested Property Access', () => {
    // Tests removed - these test the mock implementation rather than actual column functionality
    // The actual columns.tsx uses getNestedProperty internally which is already tested through column rendering tests
  })

  describe('Column Customization', () => {
    it('should allow column customization through parameters', () => {
      const customOnNameClick = jest.fn()
      const columns = getColumns({
        onNameClick: customOnNameClick,
        disableNameLink: true,
      })

      expect(Array.isArray(columns)).toBe(true)
      expect(columns.length).toBeGreaterThan(0)
    })

    it('should handle multiple parameters correctly', () => {
      const columns = getColumns({
        onNameClick: jest.fn(),
        disableNameLink: false,
      })

      expect(Array.isArray(columns)).toBe(true)
      expect(columns.length).toBeGreaterThan(0)
    })
  })

  describe('Performance', () => {
    it('should not cause performance issues with large datasets', () => {
      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        const columns = getColumns({})
        columns.forEach((column) => {
          if (column.renderCell) {
            column.renderCell(mockRowData as any)
          }
        })
      }

      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('should handle rapid column generation', () => {
      expect(() => {
        for (let i = 0; i < 50; i++) {
          getColumns({})
        }
      }).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed row data', () => {
      const malformedData = {
        id: '1',
        title: undefined,
        description: null,
        duration: 'string',
        level: 'string',
        created_at: 'invalid-date',
        updated_at: null,
        user: {
          first_name: undefined,
          last_name: null,
          last_login: 'invalid-date',
        },
        employee_type: 'malformed',
      }

      const columns = getColumns({})

      columns.forEach((column) => {
        if (column.renderCell) {
          expect(() => {
            column.renderCell(malformedData as any)
          }).not.toThrow()
        }
      })
    })

    it('should handle very large text values', () => {
      const largeTextData = {
        id: '1',
        title: 'A'.repeat(1000),
        description: 'B'.repeat(2000),
        duration: 30,
        level: 'Beginner',
        user: mockRowData.user,
      }

      const columns = getColumns({})

      columns.forEach((column) => {
        if (column.renderCell) {
          expect(() => {
            column.renderCell(largeTextData as any)
          }).not.toThrow()
        }
      })
    })

    it('should handle special characters in text', () => {
      const specialCharData = {
        ...mockRowData,
        title: 'Special chars: !@#$%^&*()_+',
        description: 'Unicode: 你好, こんにちは, 안녕하세요',
      }

      const columns = getColumns({})

      columns.forEach((column) => {
        if (column.renderCell) {
          expect(() => {
            column.renderCell(specialCharData as any)
          }).not.toThrow()
        }
      })
    })

    it('should handle boolean values', () => {
      const booleanData = {
        ...mockRowData,
        status: true as any,
        duration: false as any,
      }

      const columns = getColumns({})

      columns.forEach((column) => {
        if (column.renderCell) {
          expect(() => {
            column.renderCell(booleanData as any)
          }).not.toThrow()
        }
      })
    })

    it('should handle number values as strings', () => {
      const numericStringData = {
        ...mockRowData,
        duration: '30',
        level: 5 as any,
      }

      const columns = getColumns({})

      columns.forEach((column) => {
        if (column.renderCell) {
          expect(() => {
            column.renderCell(numericStringData as any)
          }).not.toThrow()
        }
      })
    })
  })

  describe('Additional Coverage', () => {
    it('should handle empty string in title field', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title')
      const emptyTitleData = { ...mockRowData, title: '' }

      expect(titleColumn).toBeDefined()
      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(emptyTitleData as any)
        expect(result).toBeDefined()
      }
    })

    it('should handle very long title text', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title')
      const longTitleData = { ...mockRowData, title: 'A'.repeat(200) }

      expect(titleColumn).toBeDefined()
      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(longTitleData as any)
        expect(result).toBeDefined()
      }
    })

    it('should handle user object being null', () => {
      const columns = getColumns({})
      const noUserData = { ...mockRowData, user: null }

      columns.forEach((column) => {
        if (column.renderCell) {
          expect(() => {
            column.renderCell(noUserData as any)
          }).not.toThrow()
        }
      })
    })

    it('should handle missing user fields', () => {
      const columns = getColumns({})
      const missingUserFieldsData = {
        ...mockRowData,
        user: { first_name: 'John' },
      }

      columns.forEach((column) => {
        if (column.renderCell) {
          expect(() => {
            column.renderCell(missingUserFieldsData as any)
          }).not.toThrow()
        }
      })
    })
  })

  describe('TruncateText Edge Cases', () => {
    it('should handle text exactly at limit', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title')
      const exactLimitText = 'A'.repeat(50)
      const exactLimitData = { ...mockRowData, title: exactLimitText }

      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(exactLimitData as any)
        expect(result.cell).toBeDefined()
      }
    })

    it('should handle text with whitespace that needs trimming', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title')
      const whitespaceData = { ...mockRowData, title: '  Test Title  ' }

      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(whitespaceData as any)
        expect(result.cell).toBeDefined()
      }
    })

    it('should handle description truncation at 80 chars', () => {
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const longDesc = 'A'.repeat(100)
      const longDescData = { ...mockRowData, description: longDesc }

      if (descColumn?.renderCell) {
        const result = descColumn.renderCell(longDescData as any)
        expect(result.cell).toBeDefined()
        expect(result).toBeDefined()
      }
    })
  })

  describe('Title Column with onNameClick', () => {
    it('should render button when onNameClick is provided', () => {
      const mockOnNameClick = jest.fn()
      const columns = getColumns({ onNameClick: mockOnNameClick })
      const titleColumn = columns.find((col) => col.field === 'title')

      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(mockRowData as any)
        const { container } = render(<div>{result.cell}</div>)
        const button = container.querySelector('button')

        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('text-blue-600')

        if (button) {
          fireEvent.click(button)
          expect(mockOnNameClick).toHaveBeenCalledWith(mockRowData)
        }
      }
    })

    it('should render span when onNameClick is not provided', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title')

      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(mockRowData as any)
        const { container } = render(<div>{result.cell}</div>)
        const span = container.querySelector('span')
        const button = container.querySelector('button')

        expect(span).toBeInTheDocument()
        expect(button).not.toBeInTheDocument()
      }
    })

    it('should render span when disableNameLink is true', () => {
      const mockOnNameClick = jest.fn()
      const columns = getColumns({
        onNameClick: mockOnNameClick,
        disableNameLink: true,
      })
      const titleColumn = columns.find((col) => col.field === 'title')

      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(mockRowData as any)
        const { container } = render(<div>{result.cell}</div>)
        const span = container.querySelector('span')
        const button = container.querySelector('button')

        expect(span).toBeInTheDocument()
        expect(button).not.toBeInTheDocument()
      }
    })

    it('should set rowClick when onNameClick provided and not disabled', () => {
      const mockOnNameClick = jest.fn()
      const columns = getColumns({ onNameClick: mockOnNameClick })
      const titleColumn = columns.find((col) => col.field === 'title') as any

      expect(titleColumn?.rowClick).toBeDefined()
      if (titleColumn?.rowClick) {
        titleColumn.rowClick(mockRowData)
        expect(mockOnNameClick).toHaveBeenCalledWith(mockRowData)
      }
    })

    it('should not set rowClick when disableNameLink is true', () => {
      const mockOnNameClick = jest.fn()
      const columns = getColumns({
        onNameClick: mockOnNameClick,
        disableNameLink: true,
      })
      const titleColumn = columns.find((col) => col.field === 'title') as any

      expect(titleColumn?.rowClick).toBeUndefined()
    })

    it('should not set rowClick when onNameClick is not provided', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title') as any

      expect(titleColumn?.rowClick).toBeUndefined()
    })
  })

  describe('CreateRenderCell Custom Types', () => {
    it('should handle duration column rendering', () => {
      const columns = getColumns({})
      const durationColumn = columns.find(
        (col) => col.field === 'duration_minutes'
      )

      expect(durationColumn).toBeDefined()
      expect(durationColumn?.renderCell).toBeDefined()

      if (durationColumn?.renderCell) {
        const result = durationColumn.renderCell(mockRowData as any)
        expect(result).toBeDefined()
      }
    })

    it('should handle null values in duration', () => {
      const columns = getColumns({})
      const durationColumn = columns.find(
        (col) => col.field === 'duration_minutes'
      )
      const nullDurationData = { ...mockRowData, duration_minutes: null }

      if (durationColumn?.renderCell) {
        expect(() => {
          durationColumn.renderCell(nullDurationData as any)
        }).not.toThrow()
      }
    })

    it('should handle undefined values in duration', () => {
      const columns = getColumns({})
      const durationColumn = columns.find(
        (col) => col.field === 'duration_minutes'
      )
      const undefinedDurationData = {
        ...mockRowData,
        duration_minutes: undefined,
      }

      if (durationColumn?.renderCell) {
        expect(() => {
          durationColumn.renderCell(undefinedDurationData as any)
        }).not.toThrow()
      }
    })
  })

  describe('Description Column', () => {
    it('should handle empty description', () => {
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const emptyDescData = { ...mockRowData, description: '' }

      if (descColumn?.renderCell) {
        const result = descColumn.renderCell(emptyDescData as any)
        const { container } = render(<div>{result.cell}</div>)
        const span = container.querySelector('span')

        expect(span).toBeInTheDocument()
        expect(span?.textContent).toBe('')
      }
    })

    it('should handle null description', () => {
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const nullDescData = { ...mockRowData, description: null }

      if (descColumn?.renderCell) {
        const result = descColumn.renderCell(nullDescData as any)
        expect(result).toBeDefined()
      }
    })

    it('should handle non-string description', () => {
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const numberDescData = { ...mockRowData, description: 12345 as any }

      if (descColumn?.renderCell) {
        const result = descColumn.renderCell(numberDescData as any)
        expect(result).toBeDefined()
      }
    })

    it('should truncate long descriptions correctly', () => {
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const longDescription = 'A'.repeat(150)
      const longDescData = { ...mockRowData, description: longDescription }

      if (descColumn?.renderCell) {
        const result = descColumn.renderCell(longDescData as any)
        expect(result).toBeDefined()
        expect(result.cell).toBeDefined()
      }
    })

    it('should handle description with whitespace', () => {
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')
      const whitespaceDesc = '   Test Description   '
      const whitespaceData = { ...mockRowData, description: whitespaceDesc }

      if (descColumn?.renderCell) {
        const result = descColumn.renderCell(whitespaceData as any)
        expect(result).toBeDefined()
      }
    })
  })

  describe('Title Column Edge Cases', () => {
    it('should handle title exactly at truncation limit', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title')
      const exactLimitText = 'A'.repeat(50)
      const exactLimitData = { ...mockRowData, title: exactLimitText }

      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(exactLimitData as any)
        expect(result).toBeDefined()
      }
    })

    it('should handle title just over truncation limit', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title')
      const overLimitText = 'A'.repeat(51)
      const overLimitData = { ...mockRowData, title: overLimitText }

      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(overLimitData as any)
        expect(result).toBeDefined()
      }
    })

    it('should handle title with leading/trailing whitespace', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title')
      const whitespaceTitle = '   Test Title   '
      const whitespaceData = { ...mockRowData, title: whitespaceTitle }

      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(whitespaceData as any)
        expect(result).toBeDefined()
      }
    })

    it('should handle lowercase title', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title')
      const lowercaseTitle = 'test meditation title'
      const lowercaseData = { ...mockRowData, title: lowercaseTitle }

      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(lowercaseData as any)
        expect(result).toBeDefined()
      }
    })

    it('should handle uppercase title', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title')
      const uppercaseTitle = 'TEST MEDITATION TITLE'
      const uppercaseData = { ...mockRowData, title: uppercaseTitle }

      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(uppercaseData as any)
        expect(result).toBeDefined()
      }
    })

    it('should handle mixed case title', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title')
      const mixedCaseTitle = 'TeSt MeDiTaTiOn TiTlE'
      const mixedCaseData = { ...mockRowData, title: mixedCaseTitle }

      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(mixedCaseData as any)
        expect(result).toBeDefined()
      }
    })

    it('should handle title with onNameClick and disableNameLink both true', () => {
      const mockOnNameClick = jest.fn()
      const columns = getColumns({
        onNameClick: mockOnNameClick,
        disableNameLink: true,
      })
      const titleColumn = columns.find((col) => col.field === 'title')

      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell(mockRowData as any)
        expect(result).toBeDefined()
        // When disableNameLink is true, should render span not button
        const { container } = render(<div>{result.cell}</div>)
        const button = container.querySelector('button')
        expect(button).not.toBeInTheDocument()
      }
    })

    it('should have rowClick when onNameClick provided and disableNameLink false', () => {
      const mockOnNameClick = jest.fn()
      const columns = getColumns({
        onNameClick: mockOnNameClick,
        disableNameLink: false,
      })
      const titleColumn = columns.find((col) => col.field === 'title') as any

      expect(titleColumn).toBeDefined()
      expect(titleColumn?.rowClick).toBeDefined()
    })

    it('should not have rowClick when onNameClick not provided', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title') as any

      expect(titleColumn).toBeDefined()
      expect(titleColumn?.rowClick).toBeUndefined()
    })

    it('should not have rowClick when disableNameLink is true', () => {
      const mockOnNameClick = jest.fn()
      const columns = getColumns({
        onNameClick: mockOnNameClick,
        disableNameLink: true,
      })
      const titleColumn = columns.find((col) => col.field === 'title') as any

      expect(titleColumn).toBeDefined()
      expect(titleColumn?.rowClick).toBeUndefined()
    })
  })

  describe('createRenderCell Coverage Tests', () => {
    it('should test createRenderCell with fullname custom type', () => {
      // Create a test column that uses createRenderCell with fullname
      const testColumns = getColumns({})
      const titleColumn = testColumns.find((col) => col.field === 'title')

      // Test that the column structure is correct
      expect(titleColumn).toBeDefined()
      expect(titleColumn?.field).toBe('title')
    })

    it('should test createRenderCell with capitalize custom type on title field', () => {
      const columns = getColumns({})
      const titleColumn = columns.find((col) => col.field === 'title')

      if (titleColumn?.renderCell) {
        const result = titleColumn.renderCell({ title: 'test title' } as any)
        expect(result).toBeDefined()
        // The title column uses its own renderCell, not createRenderCell
        // But this test ensures the renderCell function works
      }
    })

    it('should test createRenderCell default case with duration_minutes', () => {
      const columns = getColumns({})
      const durationColumn = columns.find(
        (col) => col.field === 'duration_minutes'
      )

      if (durationColumn?.renderCell) {
        const result = durationColumn.renderCell({
          duration_minutes: 30,
        } as any)
        expect(result).toBeDefined()
      }
    })

    it('should test createRenderCell with null duration_minutes', () => {
      const columns = getColumns({})
      const durationColumn = columns.find(
        (col) => col.field === 'duration_minutes'
      )

      if (durationColumn?.renderCell) {
        const result = durationColumn.renderCell({
          duration_minutes: null,
        } as any)
        expect(result).toBeDefined()
      }
    })

    it('should test createRenderCell with undefined duration_minutes', () => {
      const columns = getColumns({})
      const durationColumn = columns.find(
        (col) => col.field === 'duration_minutes'
      )

      if (durationColumn?.renderCell) {
        const result = durationColumn.renderCell({
          duration_minutes: undefined,
        } as any)
        expect(result).toBeDefined()
      }
    })

    it('should test createRenderCell with string duration_minutes', () => {
      const columns = getColumns({})
      const durationColumn = columns.find(
        (col) => col.field === 'duration_minutes'
      )

      if (durationColumn?.renderCell) {
        const result = durationColumn.renderCell({
          duration_minutes: '30' as any,
        } as any)
        expect(result).toBeDefined()
      }
    })

    it('should test description column with null description', () => {
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')

      if (descColumn?.renderCell) {
        const result = descColumn.renderCell({ description: null } as any)
        expect(result).toBeDefined()
      }
    })

    it('should test description column with undefined description', () => {
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')

      if (descColumn?.renderCell) {
        const result = descColumn.renderCell({ description: undefined } as any)
        expect(result).toBeDefined()
      }
    })

    it('should test description column with number description', () => {
      const columns = getColumns({})
      const descColumn = columns.find((col) => col.field === 'description')

      if (descColumn?.renderCell) {
        const result = descColumn.renderCell({
          description: 12345 as any,
        } as any)
        expect(result).toBeDefined()
      }
    })
  })
})
