import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { getColumns } from '../columns'

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

describe('Workout Columns Configuration', () => {
  const mockRowData: any = {
    id: '1',
    name: 'test workout session',
    intensity_level: 'moderate',
    category: {
      name: 'Push',
      main_category: {
        name: 'Strength',
      },
    },
    duration_minutes: 45,
    thumbnail_url: 'https://example.com/thumbnail.jpg',
    video_url: 'https://example.com/video.mp4',
  }

  const mockOnNameClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return columns with correct shared structure', () => {
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

  it('should include workout-specific columns', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })
    const fields = columns.map((column: any) => column.field)

    expect(fields).toEqual([
      'name',
      'intensity_level',
      'category',
      'subcategory',
      'duration_minutes',
    ])
  })

  it('should render name as a clickable button when onNameClick is provided', () => {
    const columns = getColumns({ onNameClick: mockOnNameClick })
    const nameColumn = columns.find((column: any) => column.field === 'name')

    expect(nameColumn).toBeDefined()
    expect((nameColumn as any).rowClick).toBeDefined()

    const result = nameColumn?.renderCell?.(mockRowData)
    const { getByRole } = render(<div>{result?.cell}</div>)
    const button = getByRole('button', { name: 'Test workout session' })

    fireEvent.click(button)

    expect(mockOnNameClick).toHaveBeenCalledWith(mockRowData)
  })

  it('should render name as plain text when link is disabled', () => {
    const columns = getColumns({
      onNameClick: mockOnNameClick,
      disableNameLink: true,
    })
    const nameColumn = columns.find((column: any) => column.field === 'name')
    const result = nameColumn?.renderCell?.(mockRowData)

    expect((nameColumn as any).rowClick).toBeUndefined()
    expect(result?.cell).toBe('Test workout session')
    expect(result?.toolTip).toBe('Test workout session')
  })

  it('should resolve main category and derived subcategory names', () => {
    const columns = getColumns({})
    const categoryColumn = columns.find(
      (column: any) => column.field === 'category'
    )
    const subcategoryColumn = columns.find(
      (column: any) => column.field === 'subcategory'
    )

    expect(categoryColumn?.renderCell?.(mockRowData)).toEqual({
      cell: 'Strength',
      toolTip: 'Strength',
    })
    expect(subcategoryColumn?.renderCell?.(mockRowData)).toEqual({
      cell: 'Push',
      toolTip: 'Push',
    })
  })

  it('should prefer explicit subcategory when available', () => {
    const columns = getColumns({})
    const subcategoryColumn = columns.find(
      (column: any) => column.field === 'subcategory'
    )
    const result = subcategoryColumn?.renderCell?.({
      ...mockRowData,
      subcategory: { name: 'Chest' },
    })

    expect(result).toEqual({
      cell: 'Chest',
      toolTip: 'Chest',
    })
  })

  it('should render fallback dashes for missing category values', () => {
    const columns = getColumns({})
    const categoryColumn = columns.find(
      (column: any) => column.field === 'category'
    )
    const subcategoryColumn = columns.find(
      (column: any) => column.field === 'subcategory'
    )

    expect(categoryColumn?.renderCell?.({})).toEqual({
      cell: '-',
      toolTip: '-',
    })
    expect(subcategoryColumn?.renderCell?.({})).toEqual({
      cell: '-',
      toolTip: '-',
    })
  })

  it('should render all custom cells without throwing on empty data', () => {
    const columns = getColumns({})

    columns.forEach((column: any) => {
      if (column.renderCell) {
        expect(() => column.renderCell({})).not.toThrow()
      }
    })
  })
})
