import { getInactiveUserColumns } from '../inactiveUserColumns'
import { fireEvent, render } from '@testing-library/react'
describe('AdminUser inactiveUserColumns', () => {
  it('is defined', () => {
    expect(getInactiveUserColumns).toBeDefined()
  })

  it('returns a columns array', () => {
    const cols = getInactiveUserColumns({ onNameClick: () => {} })
    expect(Array.isArray(cols)).toBe(true)
    expect(cols.length).toBeGreaterThan(0)
  })

  it('renders expected cells for common columns', () => {
    const onNameClick = jest.fn()
    const cols = getInactiveUserColumns({ onNameClick })

    const row: any = {
      id: 1,
      name: 'john doe',
      email: 'john@example.com',
      phone: '123',
      last_login: '2026-01-01T00:00:00Z',
      days_inactive: 30,
      last_activity_date: '2026-01-01T00:00:00Z',
      subscription: { plan_name: 'Plan A' },
    }

    const colWithRender = cols.find(
      (c: any) => typeof c?.renderCell === 'function'
    )
    expect(colWithRender).toBeTruthy()

    cols.forEach((c: any) => {
      if (typeof c?.renderCell === 'function') {
        const rendered = c.renderCell(row)
        expect(rendered).toBeTruthy()
      }
    })

    // Trigger the name click handler by rendering the anchor and clicking it
    const nameCol = cols.find((c: any) => c.field === 'name')
    const rendered = nameCol?.renderCell?.(row)
    render(rendered.cell)
    const link = document.querySelector('a') as HTMLAnchorElement
    fireEvent.click(link)
    expect(onNameClick).toHaveBeenCalled()
  })

  it('covers days inactive thresholds and empty subscription', () => {
    const cols = getInactiveUserColumns({ onNameClick: () => {} }) as any[]

    const rows = [
      { id: 1, days_inactive: 0, subscription: null, last_activity_date: null },
      { id: 2, days_inactive: 7, subscription: {}, last_activity_date: '2026-01-01T00:00:00Z' },
      { id: 3, days_inactive: 14, subscription: { plan_name: '' }, last_activity_date: '2026-01-01T00:00:00Z' },
      { id: 4, days_inactive: 30, subscription: { plan_name: 'Plan X' }, last_activity_date: '2026-01-01T00:00:00Z' },
    ]

    rows.forEach((row) => {
      cols.forEach((c) => {
        if (typeof c?.renderCell === 'function') {
          expect(c.renderCell(row)).toBeTruthy()
        }
      })
    })
  })
})
