import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

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

jest.mock('../../../utilities/format', () => ({
  convertUTCtoBrowserTimeZone: (v: any) => `tz:${String(v ?? '')}`,
}))

jest.mock('../../../utilities/parsers', () => ({
  getNestedProperty: (row: any, key: string) => {
    // minimal nested getter: "a.b" supported; plain keys too
    return key.split('.').reduce((acc: any, part: string) => acc?.[part], row)
  },
}))

describe('Plans columns', () => {
  it('renders Name as a button when onNameClick provided', () => {
    const onNameClick = jest.fn()
    const cols = getColumns({ onNameClick })
    const nameCol = cols.find((c: any) => c.field === 'name')

    const cell = nameCol.renderCell({ id: 1, name: 'diabetes' }).cell
    render(<div>{cell}</div>)

    const btn = screen.getByRole('button', { name: 'Diabetes' })
    fireEvent.click(btn)
    expect(onNameClick).toHaveBeenCalledWith({ id: 1, name: 'diabetes' })
  })

  it('renders boolean status chip for active', () => {
    const cols = getColumns()
    const statusCol = cols.find((c: any) => c.field === 'active')

    const activeCell = statusCol.renderCell({ active: 'true' }).cell
    render(<div>{activeCell}</div>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders fees with rupee label and handles NaN', () => {
    const cols = getColumns()
    const feesCol = cols.find((c: any) => c.field === 'fees')

    const okCell = feesCol.renderCell({ fees: 1500 }).cell
    const { rerender } = render(<div>{okCell}</div>)
    expect(screen.getByText(/1,500/)).toBeInTheDocument()

    rerender(<div>{feesCol.renderCell({ fees: 'oops' }).cell}</div>)
    expect(screen.queryByText(/oops/)).not.toBeInTheDocument()
  })
})
