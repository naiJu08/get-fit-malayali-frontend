import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { getColumns } from '../columns'

const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn((...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    if (msg.includes('ReactDOMTestUtils.act')) return
    originalConsoleError(...args)
  })
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('MealTiming Columns', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns columns array with required properties', () => {
    const columns = getColumns({})
    expect(Array.isArray(columns)).toBe(true)
    expect(columns.length).toBeGreaterThan(0)
    columns.forEach((col) => {
      expect(col).toHaveProperty('title')
      expect(col).toHaveProperty('field')
      expect(col).toHaveProperty('sortable')
      expect(col).toHaveProperty('resizable')
      expect(col).toHaveProperty('isVisible')
    })
  })

  it('renders Name cell as a button when onNameClick provided', () => {
    const onNameClick = jest.fn()
    const columns = getColumns({ onNameClick, disableNameLink: false })
    const nameCol: any = columns.find((c) => c.field === 'name')
    const row = { id: '1', name: 'breakfast' }

    const res = nameCol.renderCell(row)
    const { getByRole } = render(<>{res.cell}</>)
    const button = getByRole('button')
    expect(button).toHaveTextContent('Breakfast')
    fireEvent.click(button)
    expect(onNameClick).toHaveBeenCalledWith(row)
  })

  it('capitalizes Name value', () => {
    const columns = getColumns({})
    const nameCol: any = columns.find((c) => c.field === 'name')
    const res = nameCol.renderCell({ name: 'bReAkFaSt' })
    expect(res.toolTip).toBe('Breakfast')
  })

  it('renders Status badge as Active/Inactive', () => {
    const columns = getColumns({})
    const statusCol: any = columns.find((c) => c.field === 'status')

    const active = statusCol.renderCell({ status: 'active' })
    const inactive = statusCol.renderCell({ status: 'inactive' })

    const { getByText: getByTextActive } = render(<>{active.cell}</>)
    getByTextActive('Active')

    const { getByText: getByTextInactive } = render(<>{inactive.cell}</>)
    getByTextInactive('Inactive')
  })
})
