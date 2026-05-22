import React from 'react'

import { createColumnRenderCell } from '../columns'

describe('DietTemplate createColumnRenderCell', () => {
  it('renders fullname', () => {
    const renderCell = createColumnRenderCell('user.first_name', 'fullname')
    const out: any = renderCell({
      user: { first_name: 'John', last_name: 'Doe' },
    } as any)
    expect(out.cell).toBeTruthy()
  })

  it('renders last login date or empty', () => {
    const renderCell = createColumnRenderCell('user.last_login', 'lastlogin')
    const outEmpty: any = renderCell({ user: {} } as any)
    expect(outEmpty.cell).toBeTruthy()

    const out: any = renderCell({
      user: { last_login: '2026-05-22T00:00:00Z' },
    } as any)
    expect(out.cell).toBeTruthy()
  })

  it('capitalizes values', () => {
    const renderCell = createColumnRenderCell('name', 'capitalize')
    expect(renderCell({ name: 'hELLo' } as any).cell).toBe('Hello')
    expect(renderCell({ name: null } as any).cell).toBe('')
  })

  it('renders link and tooltip', () => {
    const renderCell = createColumnRenderCell('video_url', 'link')
    const outEmpty: any = renderCell({ video_url: null } as any)
    expect(outEmpty.toolTip).toBe('')

    const out: any = renderCell({ video_url: 'https://example.com' } as any)
    expect(out.toolTip).toBe('https://example.com')
  })

  it('role-capitalize handles superadmin', () => {
    const renderCell = createColumnRenderCell('role', 'role-capitalize')
    expect(renderCell({ role: 'superadmin' } as any).cell).toBe('Super Admin')
    expect(renderCell({ role: 'admin' } as any).cell).toBe('Admin')
  })

  it('fulldate returns tooltip', () => {
    const renderCell = createColumnRenderCell('created_at', 'fulldate')
    const out: any = renderCell({ created_at: '2026-05-22T00:00:00Z' } as any)
    expect(out.toolTip).toBe('2026-05-22T00:00:00Z')
  })

  it('default branch returns nested property', () => {
    const renderCell = createColumnRenderCell('meta.total')
    const out: any = renderCell({ meta: { total: 5 } } as any)
    expect(out.cell).toBe(5)
    expect(out.toolTip).toBe(5)
  })
})

