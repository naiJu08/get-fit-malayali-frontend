import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Clients from '../Details/Clients'

jest.mock('../api', () => ({
  useAssignedClients: jest.fn(),
  useAdminUser: jest.fn(),
  createAssignedClient: jest.fn(),
  deleteAssignedClient: jest.fn(),
}))

jest.mock('../../../components/common/icons', () => (props: any) => (
  <span data-testid={`icon-${props?.name ?? 'unknown'}`} />
))

jest.mock('../../../components/common/buttons/Button', () => (props: any) => (
  <button type="button" onClick={props?.onClick}>
    {props?.label ?? 'button'}
  </button>
))

jest.mock('../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    return (
      <div data-testid="clients-table">
        <div>
          {props?.actionProps?.map?.((a: any) => (
            <button
              key={a.title}
              type="button"
              onClick={() =>
                a?.action?.({
                  id: 'assigned-1',
                  user_id: 'user-1',
                  assigned_at: '2026-05-01',
                })
              }
            >
              {a.title}
            </button>
          ))}
        </div>
      </div>
    )
  }
})

jest.mock('qbs-core', () => ({
  AutoComplete: (props: any) => (
    <button type="button" onClick={() => props?.onChange?.(props?.data?.[0])}>
      pick-user
    </button>
  ),
}))

jest.mock('../../../components/common', () => ({
  DialogModal: (props: any) =>
    props?.isOpen ? (
      <div>
        <div>{props?.title}</div>
        {props?.body}
        <button type="button" onClick={props?.onSubmit} disabled={props?.disableSubmit}>
          {props?.actionLabel ?? 'submit'}
        </button>
        <button type="button" onClick={props?.onClose}>
          close
        </button>
      </div>
    ) : null,
}))

jest.mock('../../../components/common/snackbar', () => {
  const actual = jest.requireActual('../../../components/common/snackbar')
  return {
    ...actual,
    useSnackbarManager: () => ({ enqueueSnackbar: jest.fn() }),
  }
})

describe('Clients', () => {
  beforeEach(() => {
    const api = jest.requireMock('../api')
    api.useAssignedClients.mockReset()
    api.useAdminUser.mockReset()
    api.createAssignedClient.mockReset()
    api.deleteAssignedClient.mockReset()
  })

  it('assigns and unassigns clients', async () => {
    const api = jest.requireMock('../api')
    api.useAssignedClients.mockReturnValue({
      data: { items: [{ id: 'assigned-1', user_id: 'user-1' }], total: 1, current_page: 1 },
      isFetching: false,
      refetch: jest.fn(),
    })
    api.useAdminUser.mockReturnValue({
      data: { items: [{ id: 'user-1', name: 'john doe', role: 'user' }] },
      isFetching: false,
    })
    api.createAssignedClient.mockResolvedValue({ message: 'ok' })
    api.deleteAssignedClient.mockResolvedValue({ message: 'ok' })

    render(
      <MemoryRouter>
        <Clients user={{ id: 'admin-1', status: 'active' }} />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Assign Client/i }))
    expect(screen.getByText(/Assign Client/i, { selector: 'div' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /pick-user/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Assign$/i }))

    // Cover SmartTable action handlers
    fireEvent.click(screen.getByRole('button', { name: /View/i }))
    fireEvent.click(screen.getByRole('button', { name: /Unassign/i }))
  })

  it('hides assign button when nutritionist is suspended', () => {
    const api = jest.requireMock('../api')
    api.useAssignedClients.mockReturnValue({
      data: { items: [], total: 0, current_page: 1 },
      isFetching: false,
      refetch: jest.fn(),
    })
    api.useAdminUser.mockReturnValue({ data: { items: [] }, isFetching: false })

    render(
      <MemoryRouter>
        <Clients user={{ id: 'admin-1', status: 'suspended' }} />
      </MemoryRouter>
    )
    expect(screen.queryByRole('button', { name: /Assign Client/i })).not.toBeInTheDocument()
  })
})
