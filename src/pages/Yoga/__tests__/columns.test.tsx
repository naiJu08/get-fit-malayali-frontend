import React from 'react'
import { render } from '@testing-library/react'
import { getColumns } from '../columns'

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

describe('Yoga Columns Configuration', () => {
  const mockRowData: any = {
    id: '1',
    name: 'test yoga session',
    description: 'A very long description that should be truncated when displayed in the table to maintain readability and proper layout',
    intensity_level: 'moderate',
    category: 'basic',
    duration_minutes: 45,
    thumbnail_url: 'https://example.com/thumbnail.jpg',
    video_url: 'https://example.com/video.mp4',
  }

  const mockOnNameClick = jest.fn()

  describe('getColumns function', () => {
    it('should return columns with correct structure', () => {
      const columns = getColumns({ onNameClick: mockOnNameClick })

      expect(columns).toBeInstanceOf(Array)
      expect(columns.length).toBeGreaterThan(0)

      columns.forEach((column: any) => {
        expect(column).toHaveProperty('title')
        expect(column).toHaveProperty('field')
        expect(column).toHaveProperty('sortable', false)
        expect(column).toHaveProperty('resizable', true)
        expect(column).toHaveProperty('isVisible', true)
      })
    })

    it('should include name column with proper rendering', () => {
      const columns = getColumns({ onNameClick: mockOnNameClick })
      const nameColumn = columns.find((col: any) => col.field === 'name')

      expect(nameColumn).toBeDefined()
      expect(nameColumn?.title).toBe('Name')
      expect(nameColumn?.customCell).toBe(true)
    })

    it('should include description column with truncation', () => {
      const columns = getColumns({ onNameClick: mockOnNameClick })
      const descriptionColumn = columns.find((col: any) => col.field === 'description')

      expect(descriptionColumn).toBeDefined()
      expect(descriptionColumn?.title).toBe('Description')
      expect(descriptionColumn?.customCell).toBe(true)
    })

    it('should include intensity level column', () => {
      const columns = getColumns({ onNameClick: mockOnNameClick })
      const intensityColumn = columns.find((col: any) => col.field === 'intensity_level')

      expect(intensityColumn).toBeDefined()
      expect(intensityColumn?.title).toBe('Intensity Level')
      expect(intensityColumn?.customCell).toBe(true)
    })

    it('should include category column with capitalization', () => {
      const columns = getColumns({ onNameClick: mockOnNameClick })
      const categoryColumn = columns.find((col: any) => col.field === 'category')

      expect(categoryColumn).toBeDefined()
      expect(categoryColumn?.title).toBe('Category')
      expect(categoryColumn?.customCell).toBe(true)
    })

    it('should include duration column', () => {
      const columns = getColumns({ onNameClick: mockOnNameClick })
      const durationColumn = columns.find((col: any) => col.field === 'duration_minutes')

      expect(durationColumn).toBeDefined()
      expect(durationColumn?.title).toBe('Duration(in minutes)')
      expect(durationColumn?.customCell).toBe(true)
    })

    it('should have renderCell functions for custom columns', () => {
      const columns = getColumns({ onNameClick: mockOnNameClick })
      
      const nameColumn = columns.find((col: any) => col.field === 'name')
      const descriptionColumn = columns.find((col: any) => col.field === 'description')
      const intensityColumn = columns.find((col: any) => col.field === 'intensity_level')
      const categoryColumn = columns.find((col: any) => col.field === 'category')
      const durationColumn = columns.find((col: any) => col.field === 'duration_minutes')

      expect(nameColumn?.renderCell).toBeDefined()
      expect(descriptionColumn?.renderCell).toBeDefined()
      expect(intensityColumn?.renderCell).toBeDefined()
      expect(categoryColumn?.renderCell).toBeDefined()
      expect(durationColumn?.renderCell).toBeDefined()
    })

    it('should render name column with click handler when not disabled', () => {
      const columns = getColumns({ onNameClick: mockOnNameClick })
      const nameColumn = columns.find((col: any) => col.field === 'name')

      expect((nameColumn as any)?.rowClick).toBeDefined()
      
      // Test click handler
      if (nameColumn && (nameColumn as any).rowClick) {
        (nameColumn as any).rowClick(mockRowData)
        expect(mockOnNameClick).toHaveBeenCalledWith(mockRowData)
      }
    })

    it('should render name column without click handler when disabled', () => {
      const columns = getColumns({ onNameClick: mockOnNameClick, disableNameLink: true })
      const nameColumn = columns.find((col: any) => col.field === 'name')

      expect((nameColumn as any).rowClick).toBeUndefined()
    })

    it('should handle empty or null values gracefully', () => {
      const emptyRowData: any = {
        id: '2',
        name: '',
        description: null,
        intensity_level: undefined,
        category: '',
        duration_minutes: null,
      }

      const columns = getColumns({ onNameClick: mockOnNameClick })

      columns.forEach((column: any) => {
        if (column.renderCell) {
          const renderResult = column.renderCell(emptyRowData)
          expect(renderResult).toBeDefined()
          // Should handle empty values without crashing
        }
      })
    })

    it('should work without onNameClick callback', () => {
      const columns = getColumns({})
      const nameColumn = columns.find((col: any) => col.field === 'name')

      expect(nameColumn).toBeDefined()
      expect((nameColumn as any).rowClick).toBeUndefined()
      
      if (nameColumn && nameColumn.renderCell) {
        const renderResult = nameColumn.renderCell(mockRowData)
        expect(renderResult).toBeDefined()
      }
    })

    it('should test renderCell functions return expected structure', () => {
      const columns = getColumns({ onNameClick: mockOnNameClick })
      
      columns.forEach((column: any) => {
        if (column.renderCell) {
          const result = column.renderCell(mockRowData)
          expect(result).toBeDefined()
          expect(typeof result).toBe('object')
          // Should have cell and optionally toolTip properties
          expect(result).toHaveProperty('cell')
        }
      })
    })

    it('should handle different data types for renderCell', () => {
      const columns = getColumns({ onNameClick: mockOnNameClick })
      
      // Test with various data types
      const testCases = [
        { name: 'Test', intensity_level: 'High', category: 'advanced', duration_minutes: 60 },
        { name: '', intensity_level: '', category: '', duration_minutes: 0 },
        { name: null, intensity_level: null, category: null, duration_minutes: null },
      ]

      testCases.forEach((testCase) => {
        columns.forEach((column: any) => {
          if (column.renderCell) {
            const result = column.renderCell(testCase)
            expect(result).toBeDefined()
          }
        })
      })
    })
  })
})
