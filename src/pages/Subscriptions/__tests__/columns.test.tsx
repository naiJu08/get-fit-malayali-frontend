import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { getColumns } from '../columns'

const row = {
  id: 1,
  user_name: 'Anna Client',
  plan_name: 'Premium Plan',
  start_date: '2026-05-01',
  end_date: '2026-05-31',
  days_remaining: 12,
  status: 'active',
}

describe('Subscriptions columns', () => {
  it('returns the expected column structure', () => {
    const columns = getColumns()

    expect(columns).toHaveLength(6)
    expect(columns.map((column) => column.title)).toEqual([
      'Client',
      'Plan',
      'Start Date',
      'End Date',
      'Days Remaining',
      'Status',
    ])
    columns.forEach((column: any) => {
      expect(column.customCell).toBe(true)
      expect(column.sortable).toBe(false)
      expect(column.resizable).toBe(true)
      expect(column.isVisible).toBe(true)
      expect(typeof column.renderCell).toBe('function')
    })
  })

  it('renders client as a clickable button and calls onNameClick with the row', () => {
    const onNameClick = jest.fn()
    const [clientColumn] = getColumns(onNameClick)
    const result = clientColumn.renderCell(row)

    render(<>{result.cell}</>)
    fireEvent.click(screen.getByRole('button', { name: 'Anna Client' }))

    expect(result.toolTip).toBe('Anna Client')
    expect(onNameClick).toHaveBeenCalledWith(row)
  })

  it('renders an empty client button when user name is missing', () => {
    const [clientColumn] = getColumns()
    const result = clientColumn.renderCell({ ...row, user_name: null })

    const { container } = render(<>{result.cell}</>)

    expect(container.querySelector('button')).toHaveTextContent('')
    expect(result.toolTip).toBe('')
  })

  it('renders plain value columns with string tooltips', () => {
    const columns = getColumns()
    const planResult = columns[1].renderCell(row)
    const daysResult = columns[4].renderCell(row)

    expect(planResult).toEqual({
      cell: 'Premium Plan',
      toolTip: 'Premium Plan',
    })
    expect(daysResult).toEqual({
      cell: 12,
      toolTip: '',
    })
  })

  it('formats start and end dates as DD-MM-YYYY', () => {
    const columns = getColumns()

    expect(columns[2].renderCell(row).cell).toBe('01-05-2026')
    expect(columns[3].renderCell(row).cell).toBe('31-05-2026')
    expect(columns[2].renderCell({ ...row, start_date: '' }).cell).toBe('')
  })

  it.each([
    ['active', 'Active', 'bg-green-100 text-green-800 border-green-200'],
    ['inactive', 'Inactive', 'bg-gray-100 text-gray-800 border-gray-200'],
    ['paused', 'Paused', 'bg-red-100 text-red-800 border-red-200'],
    ['suspended', 'Suspended', 'bg-red-100 text-red-800 border-red-200'],
    ['expired', 'Expired', 'bg-orange-100 text-orange-800 border-orange-200'],
    ['canceled', 'Canceled', 'bg-red-100 text-red-800 border-red-200'],
    ['pending', 'Pending', 'bg-blue-100 text-blue-800 border-blue-200'],
    ['unknown', 'Unknown', 'bg-gray-100 text-gray-800 border-gray-200'],
  ])('renders %s status badge', (status, label, className) => {
    const statusColumn = getColumns()[5]
    const result = statusColumn.renderCell({ ...row, status })

    const { container } = render(<>{result.cell}</>)

    expect(screen.getByText(label)).toBeInTheDocument()
    expect(container.querySelector('span')).toHaveClass(...className.split(' '))
    expect(result.toolTip).toBe('')
  })

  it('renders fallback label for null or undefined statuses', () => {
    const statusColumn = getColumns()[5]

    const nullResult = statusColumn.renderCell({ ...row, status: null })
    const undefinedResult = statusColumn.renderCell({
      ...row,
      status: undefined,
    })

    const { rerender } = render(<>{nullResult.cell}</>)
    expect(screen.getByText('--')).toBeInTheDocument()

    rerender(<>{undefinedResult.cell}</>)
    expect(screen.getByText('--')).toBeInTheDocument()
  })
})
