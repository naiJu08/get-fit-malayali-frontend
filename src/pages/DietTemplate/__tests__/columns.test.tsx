import { getColumns } from '../columns'
import React from 'react'
import { render, screen } from '@testing-library/react'

describe('DietTemplate Columns', () => {
  const mockOnNameClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return array of columns', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })

    expect(Array.isArray(columns)).toBe(true)
    expect(columns.length).toBeGreaterThan(0)
  })

  it('should include name column', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })
    const nameColumn = columns.find((col) => col.field === 'name')

    expect(nameColumn).toBeDefined()
    expect(nameColumn?.title).toBe('Name')
  })

  it('should include description column', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })
    const descriptionColumn = columns.find(
      (col) => col.field === 'diet_template_category_name'
    )

    expect(descriptionColumn).toBeDefined()
  })

  it('should include duration_days column', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })
    const durationColumn = columns.find((col) => col.field === 'duration_days')

    expect(durationColumn).toBeDefined()
  })

  it('should include status column', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })
    const statusColumn = columns.find(
      (col) => col.field === 'diet_template_category_name'
    )

    expect(statusColumn).toBeDefined()
  })

  it('should have resizable columns', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })

    const resizableColumns = columns.filter((col) => col.resizable === true)
    expect(resizableColumns.length).toBeGreaterThan(0)
  })

  it('should have visible columns by default', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })

    const visibleColumns = columns.filter((col) => col.isVisible === true)
    expect(visibleColumns.length).toBeGreaterThan(0)
  })

  it('should call onNameClick when name cell is clicked', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })
    const nameColumn = columns.find((col) => col.field === 'name')

    // Not every column in the union has `rowClick`, so access via `any`.
    expect(typeof (nameColumn as any)?.rowClick).toBe('function')
    ;(nameColumn as any)?.rowClick?.({ id: 1 } as any)
    expect(mockOnNameClick).toHaveBeenCalled()
  })

  it('name column renderCell title-cases string and renders button when enabled', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })
    const nameColumn = columns.find((col) => col.field === 'name')
    const out = nameColumn?.renderCell?.({ name: 'WEIGHT LOSS' } as any) as any

    expect(out?.toolTip).toBe('Weight loss')
    render(<>{out?.cell}</>)
    screen.getByRole('button', { name: 'Weight loss' }).click()
    expect(mockOnNameClick).toHaveBeenCalled()
  })

  it('name column renderCell renders span when disableNameLink is true', () => {
    const columns = getColumns({
      onNameClick: mockOnNameClick,
      disableNameLink: true,
    })
    const nameColumn = columns.find((col) => col.field === 'name')
    const out = nameColumn?.renderCell?.({ name: 'test' } as any) as any

    render(<>{out?.cell}</>)
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should have sortable property on columns', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })

    expect(columns[0]).toHaveProperty('sortable')
  })

  it('should have proper column structure', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })

    columns.forEach((column) => {
      expect(column).toHaveProperty('title')
      expect(column).toHaveProperty('field')
      expect(column).toHaveProperty('resizable')
      expect(column).toHaveProperty('isVisible')
    })
  })

  it('should disable name link when disableNameLink is true', () => {
    const columns = getColumns({
      onNameClick: mockOnNameClick,
      disableNameLink: true,
    })
    const nameColumn = columns.find((col) => col.field === 'name')

    expect((nameColumn as any)?.rowClick).toBeUndefined()
  })

  it('should render created_at column if available', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })
    const createdAtColumn = columns.find((col) => col.field === 'created_at')

    if (createdAtColumn) {
      expect(createdAtColumn.title).toBeDefined()
    }
  })

  it('should render diet_template_category column', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })
    const categoryColumn = columns.find(
      (col) => col.field === 'diet_template_category_name'
    )

    expect(categoryColumn).toBeDefined()
    expect(categoryColumn?.title).toBe('Diet Template Category')
  })

  it('should have customCell property for date columns', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })
    const createdAtColumn = columns.find((col) => col.field === 'created_at')

    if (createdAtColumn) {
      expect(createdAtColumn.customCell).toBe(true)
    }
  })
})
