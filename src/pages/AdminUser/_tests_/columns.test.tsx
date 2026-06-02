import { getColumns } from '../columns'
describe('AdminUser columns', () => {
  it('is defined', () => {
    expect(getColumns).toBeDefined()
  })

  it('returns a columns array', () => {
    const cols = getColumns({
      activeRole: 'user',
      onNameClick: () => {},
    })
    expect(Array.isArray(cols)).toBe(true)
    expect(cols.length).toBeGreaterThan(0)
  })

  it('supports fullname and last login renderers', () => {
    const cols = getColumns({
      activeRole: 'user',
      onNameClick: () => {},
    }) as any[]

    const row: any = {
      id: 1,
      user: {
        first_name: 'John',
        last_name: 'Doe',
        last_login: '2026-01-02T00:00:00Z',
      },
    }

    const renderedCells = cols
      .filter((c) => typeof c?.renderCell === 'function')
      .map((c) => c.renderCell(row))

    expect(renderedCells.length).toBeGreaterThan(0)
  })

  it('invokes renderers for all columns', () => {
    const onNameClick = jest.fn()
    const cols = getColumns({
      activeRole: 'user',
      onNameClick,
    }) as any[]

    const row: any = {
      id: 1,
      name: 'john',
      phone: '123',
      email: 'john@example.com',
      role: 'superadmin',
      status: 'active',
      bmi: 22,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
      user: { first_name: 'John', last_name: 'Doe', last_login: '2026-01-03T00:00:00Z' },
    }

    cols.forEach((c) => {
      if (typeof c?.renderCell === 'function') {
        expect(c.renderCell(row)).toBeTruthy()
      }
      if (typeof c?.rowClick === 'function') {
        c.rowClick(row)
      }
    })

    expect(onNameClick).toHaveBeenCalled()
  })
})
