import React from 'react'
import { render, screen } from '@testing-library/react'

import { getDietTemplateCategoryColumns } from '../columns'

jest.mock('../../../utilities/parsers', () => ({
  getNestedProperty: (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj)
  },
}))

jest.mock('moment', () => {
  return function (date: string) {
    return {
      format: (format: string) => {
        if (format === 'DD-MM-YYYY') {
          return '01-01-2024'
        }
        return date
      },
    }
  }
})

describe('getDietTemplateCategoryColumns', () => {
  it('should return an array of columns', () => {
    const columns = getDietTemplateCategoryColumns()
    expect(Array.isArray(columns)).toBe(true)
    expect(columns.length).toBe(3)
  })

  it('should have a Name column', () => {
    const columns = getDietTemplateCategoryColumns()
    const nameColumn = columns.find((col) => col.title === 'Name')
    expect(nameColumn).toBeDefined()
    expect(nameColumn?.field).toBe('name')
    expect(nameColumn?.customCell).toBe(true)
  })

  it('should have a Status column', () => {
    const columns = getDietTemplateCategoryColumns()
    const statusColumn = columns.find((col) => col.title === 'Status')
    expect(statusColumn).toBeDefined()
    expect(statusColumn?.field).toBe('status')
    expect(statusColumn?.customCell).toBe(true)
  })

  it('should have a Created At column', () => {
    const columns = getDietTemplateCategoryColumns()
    const createdAtColumn = columns.find((col) => col.title === 'Created At')
    expect(createdAtColumn).toBeDefined()
    expect(createdAtColumn?.field).toBe('created_at')
    expect(createdAtColumn?.customCell).toBe(true)
  })

  describe('Name column renderCell', () => {
    it('should render name with title case', () => {
      const columns = getDietTemplateCategoryColumns()
      const nameColumn = columns.find((col) => col.title === 'Name')
      const result = nameColumn?.renderCell({ name: 'breakfast' })

      expect(result?.cell).toBe('Breakfast')
      expect(result?.toolTip).toBe('Breakfast')
    })

    it('should handle empty name', () => {
      const columns = getDietTemplateCategoryColumns()
      const nameColumn = columns.find((col) => col.title === 'Name')
      const result = nameColumn?.renderCell({ name: '' })

      expect(result?.cell).toBe('')
      expect(result?.toolTip).toBe('')
    })

    it('should handle null name', () => {
      const columns = getDietTemplateCategoryColumns()
      const nameColumn = columns.find((col) => col.title === 'Name')
      const result = nameColumn?.renderCell({ name: null })

      expect(result?.cell).toBe('')
    })

    it('should handle undefined name', () => {
      const columns = getDietTemplateCategoryColumns()
      const nameColumn = columns.find((col) => col.title === 'Name')
      const result = nameColumn?.renderCell({ name: undefined })

      expect(result?.cell).toBe('')
    })

    it('should handle missing name property', () => {
      const columns = getDietTemplateCategoryColumns()
      const nameColumn = columns.find((col) => col.title === 'Name')
      const result = nameColumn?.renderCell({})

      expect(result?.cell).toBe('')
    })

    it('should preserve already title-cased names', () => {
      const columns = getDietTemplateCategoryColumns()
      const nameColumn = columns.find((col) => col.title === 'Name')
      const result = nameColumn?.renderCell({ name: 'Breakfast' })

      expect(result?.cell).toBe('Breakfast')
    })

    it('should convert all lowercase to title case', () => {
      const columns = getDietTemplateCategoryColumns()
      const nameColumn = columns.find((col) => col.title === 'Name')
      const result = nameColumn?.renderCell({ name: 'lunch special' })

      expect(result?.cell).toBe('Lunch special')
    })

    it('should handle names with numbers', () => {
      const columns = getDietTemplateCategoryColumns()
      const nameColumn = columns.find((col) => col.title === 'Name')
      const result = nameColumn?.renderCell({ name: 'meal plan 1' })

      expect(result?.cell).toBe('Meal plan 1')
    })
  })

  describe('Status column renderCell', () => {
    it('should render Active status with green badge', () => {
      const columns = getDietTemplateCategoryColumns()
      const statusColumn = columns.find((col) => col.title === 'Status')
      const result = statusColumn?.renderCell({ status: 'active' })

      expect(result?.toolTip).toBe('Active')
      expect(result?.cell).toBeDefined()
    })

    it('should render Inactive status with red badge', () => {
      const columns = getDietTemplateCategoryColumns()
      const statusColumn = columns.find((col) => col.title === 'Status')
      const result = statusColumn?.renderCell({ status: 'inactive' })

      expect(result?.toolTip).toBe('Inactive')
      expect(result?.cell).toBeDefined()
    })

    it('should handle uppercase active status', () => {
      const columns = getDietTemplateCategoryColumns()
      const statusColumn = columns.find((col) => col.title === 'Status')
      const result = statusColumn?.renderCell({ status: 'ACTIVE' })

      expect(result?.toolTip).toBe('Active')
    })

    it('should handle mixed case active status', () => {
      const columns = getDietTemplateCategoryColumns()
      const statusColumn = columns.find((col) => col.title === 'Status')
      const result = statusColumn?.renderCell({ status: 'Active' })

      expect(result?.toolTip).toBe('Active')
    })

    it('should handle uppercase inactive status', () => {
      const columns = getDietTemplateCategoryColumns()
      const statusColumn = columns.find((col) => col.title === 'Status')
      const result = statusColumn?.renderCell({ status: 'INACTIVE' })

      expect(result?.toolTip).toBe('Inactive')
    })

    it('should render Inactive for empty status', () => {
      const columns = getDietTemplateCategoryColumns()
      const statusColumn = columns.find((col) => col.title === 'Status')
      const result = statusColumn?.renderCell({ status: '' })

      expect(result?.toolTip).toBe('Inactive')
    })

    it('should render Inactive for null status', () => {
      const columns = getDietTemplateCategoryColumns()
      const statusColumn = columns.find((col) => col.title === 'Status')
      const result = statusColumn?.renderCell({ status: null })

      expect(result?.toolTip).toBe('Inactive')
    })

    it('should render Inactive for undefined status', () => {
      const columns = getDietTemplateCategoryColumns()
      const statusColumn = columns.find((col) => col.title === 'Status')
      const result = statusColumn?.renderCell({ status: undefined })

      expect(result?.toolTip).toBe('Inactive')
    })

    it('should render Inactive for status with whitespace', () => {
      const columns = getDietTemplateCategoryColumns()
      const statusColumn = columns.find((col) => col.title === 'Status')
      const result = statusColumn?.renderCell({ status: '  active  ' })

      expect(result?.toolTip).toBe('Active')
    })

    it('should render Active status with correct CSS classes', () => {
      const columns = getDietTemplateCategoryColumns()
      const statusColumn = columns.find((col) => col.title === 'Status')
      const result = statusColumn?.renderCell({ status: 'active' })

      // Check that the result contains a React element with the expected classes
      const rendered = render(<div>{result?.cell}</div>)
      const badge = rendered.container.querySelector('span')
      expect(badge).toHaveClass('bg-green-100', 'text-green-700')
    })

    it('should render Inactive status with correct CSS classes', () => {
      const columns = getDietTemplateCategoryColumns()
      const statusColumn = columns.find((col) => col.title === 'Status')
      const result = statusColumn?.renderCell({ status: 'inactive' })

      const rendered = render(<div>{result?.cell}</div>)
      const badge = rendered.container.querySelector('span')
      expect(badge).toHaveClass('bg-red-100', 'text-red-700')
    })
  })

  describe('Created At column renderCell', () => {
    it('should format date as DD-MM-YYYY', () => {
      const columns = getDietTemplateCategoryColumns()
      const createdAtColumn = columns.find((col) => col.title === 'Created At')
      const result = createdAtColumn?.renderCell({ created_at: '2024-01-01' })

      expect(result?.cell).toBe('01-01-2024')
      expect(result?.toolTip).toBe('01-01-2024')
    })

    it('should handle empty date', () => {
      const columns = getDietTemplateCategoryColumns()
      const createdAtColumn = columns.find((col) => col.title === 'Created At')
      const result = createdAtColumn?.renderCell({ created_at: '' })

      expect(result?.cell).toBe('')
      expect(result?.toolTip).toBe('')
    })

    it('should handle null date', () => {
      const columns = getDietTemplateCategoryColumns()
      const createdAtColumn = columns.find((col) => col.title === 'Created At')
      const result = createdAtColumn?.renderCell({ created_at: null })

      expect(result?.cell).toBe('')
    })

    it('should handle undefined date', () => {
      const columns = getDietTemplateCategoryColumns()
      const createdAtColumn = columns.find((col) => col.title === 'Created At')
      const result = createdAtColumn?.renderCell({ created_at: undefined })

      expect(result?.cell).toBe('')
    })

    it('should handle missing created_at property', () => {
      const columns = getDietTemplateCategoryColumns()
      const createdAtColumn = columns.find((col) => col.title === 'Created At')
      const result = createdAtColumn?.renderCell({})

      expect(result?.cell).toBe('')
    })

    it('should format different date formats', () => {
      const columns = getDietTemplateCategoryColumns()
      const createdAtColumn = columns.find((col) => col.title === 'Created At')
      const result = createdAtColumn?.renderCell({
        created_at: '2024-12-25T10:30:00Z',
      })

      expect(result?.cell).toBe('01-01-2024')
    })
  })

  describe('default column props', () => {
    it('should have sortable set to false for all columns', () => {
      const columns = getDietTemplateCategoryColumns()
      columns.forEach((col) => {
        expect(col.sortable).toBe(false)
      })
    })

    it('should have resizable set to true for all columns', () => {
      const columns = getDietTemplateCategoryColumns()
      columns.forEach((col) => {
        expect(col.resizable).toBe(true)
      })
    })

    it('should have isVisible set to true for all columns', () => {
      const columns = getDietTemplateCategoryColumns()
      columns.forEach((col) => {
        expect(col.isVisible).toBe(true)
      })
    })
  })
})
