import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminUser from '../index'

const mockUseAdminUser = jest.fn()
const mockGetAdminDetails = jest.fn()
const mockSendAdminInvitation = jest.fn()
const mockDeactivateAdmin = jest.fn()
const mockActivateAdmin = jest.fn()
const mockDeleteAdmin = jest.fn()
const mockNavigate = jest.fn()
const mockEnqueueSnackbar = jest.fn()
const mockSetPageParams = jest.fn()
const mockSetSelectedRows = jest.fn()

let mockDisableApis = false
let mockLocationPathname = '/users'
let mockAuthRole = 'admin'
let mockPermission = true
let mockPageParams: any = {
  page: 1,
  page_size: 10,
  search: '',
  ordering: '',
  filters: {},
  sortColumn: '',
  sortType: '',
}
let mockLatestColumnsArgs: any = null

jest.mock('../api', () => ({
  get DISABLE_NONLOGIN_APIS() {
    return mockDisableApis
  },
  useAdminUser: (...args: any[]) => mockUseAdminUser(...args),
  getAdminDetails: (...args: any[]) => mockGetAdminDetails(...args),
  sendAdminInvitation: (...args: any[]) => mockSendAdminInvitation(...args),
  deActivateAdmin: (...args: any[]) => mockDeactivateAdmin(...args),
  activateAdmin: (...args: any[]) => mockActivateAdmin(...args),
  deleteAdmin: (...args: any[]) => mockDeleteAdmin(...args),
}))

jest.mock('../columns', () => ({
  getColumns: jest.fn((args) => {
    mockLatestColumnsArgs = args
    return [{ name: 'Name' }]
  }),
}))

jest.mock('../create', () => {
  return function MockCreateAdmin(props: any) {
    if (!props.isDrawerOpen) return null
    return (
      <div data-testid="create-admin">
        <div>{props.viewMode ? 'view-mode' : 'form-mode'}</div>
        <div>{props.edit ? 'editing' : 'not-editing'}</div>
        <div>{props.activeRole}</div>
        <button type="button" onClick={() => props.setEditViewIndicator(true)}>
          Mark Edit View
        </button>
        <button type="button" onClick={() => props.handleClose()}>
          Close Drawer
        </button>
      </div>
    )
  }
})

jest.mock('../../../components/app/resetPassword', () => {
  return function MockResetPassword(props: any) {
    return props.changePassword ? <div>Reset Password</div> : null
  }
})

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: any) =>
    selector({ roleData: { name: mockAuthRole } }),
}))

jest.mock('../../../layout/store', () => ({
  checkPermissions: () => mockPermission,
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockLocationPathname }),
  useParams: () => ({ id: 'route-id' }),
}))

jest.mock('../../../components/common/snackbar', () => {
  const actual = jest.requireActual('../../../components/common/snackbar')
  return {
    ...actual,
    useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
  }
})

jest.mock('../../../store/filterSore/adminUserStore', () => {
  const storeFn: any = () => ({
    pageParams: mockPageParams,
    setPageParams: mockSetPageParams,
    selectedRows: ['active-row', 'inactive-row'],
    setSelectedRows: mockSetSelectedRows,
  })
  storeFn.getState = () => ({ pageParams: mockPageParams })
  return { useAdminUserFilterStore: storeFn }
})

jest.mock('../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    const activeRow = {
      id: 'active-row',
      email: 'active@example.com',
      status: 'active',
      subscribed_plan: true,
    }
    const inactiveRow = {
      id: 'inactive-row',
      email: 'inactive@example.com',
      status: 'deactivated',
      subscribed_plan: false,
    }

    return (
      <div data-testid="smart-table">
        <div>{props.toolbarExtra}</div>
        <button
          type="button"
          onClick={() => props.paginationProps?.onPagination?.(2)}
        >
          Page 2
        </button>
        <button
          type="button"
          onClick={() => props.paginationProps?.onRowsPerPage?.(20)}
        >
          Rows 20
        </button>
        <button
          type="button"
          onClick={() => props.handleColumnSort?.('name', 'asc')}
        >
          Sort Name
        </button>
        <button
          type="button"
          onClick={() => props.onSearchChange?.('john')}
        >
          Search Change
        </button>
        <button type="button" onClick={() => props.onSearch?.('john')}>
          Search Submit
        </button>
        <button
          type="button"
          onClick={() => mockLatestColumnsArgs?.onNameClick?.({ id: 'name-row' })}
        >
          Name Click
        </button>
        <button
          type="button"
          onClick={() => mockLatestColumnsArgs?.onViewAction?.({ id: 'view-row' })}
        >
          Column View
        </button>
        <button
          type="button"
          onClick={() => props.actionProps?.[0]?.action?.({ id: 'view-action' })}
        >
          Row View
        </button>
        <button
          type="button"
          onClick={() => props.actionProps?.[1]?.action?.({ id: 'edit-row' })}
        >
          Row Edit
        </button>
        <button
          type="button"
          onClick={() => props.actionProps?.[2]?.action?.(activeRow)}
        >
          Row Deactivate
        </button>
        <button
          type="button"
          onClick={() => props.actionProps?.[3]?.action?.(inactiveRow)}
        >
          Row Activate
        </button>
        <button
          type="button"
          onClick={() => props.actionProps?.[4]?.action?.({ id: 'delete-row' })}
        >
          Row Delete
        </button>
      </div>
    )
  }
})

jest.mock('../../../components/common/modal/ConfirmDeleteModal', () => {
  return function MockConfirmDeleteModal(props: any) {
    if (!props.isOpen) return null
    return (
      <div>
        <div>{props.title}</div>
        <div>{props.subTitle}</div>
        <button type="button" onClick={props.onConfirm}>
          {props.confirmLabel || 'Confirm'}
        </button>
        <button type="button" onClick={props.onClose}>
          {props.cancelLabel || 'Close'}
        </button>
      </div>
    )
  }
})

jest.mock('../../../components/common', () => ({
  DialogModal: (props: any) =>
    props.isOpen ? (
      <div>
        <div>{props.title}</div>
        <div>{props.body}</div>
        <button type="button" onClick={props.onSubmit}>
          {props.actionLabel || 'Submit'}
        </button>
        <button type="button" onClick={props.secondaryAction || props.onClose}>
          {props.secondaryActionLabel || 'Close'}
        </button>
      </div>
    ) : null,
  TextField: (props: any) => <input aria-label={props.label} value={props.value} readOnly />,
}))

jest.mock('../../../components/common/buttons/Button', () => {
  return function MockButton(props: any) {
    return (
      <button type="button" className={props.className} onClick={props.onClick}>
        {props.label}
      </button>
    )
  }
})

jest.mock('../../../components/common/icons', () => {
  return function MockIcons(props: any) {
    return <span>{props.name}</span>
  }
})

describe('AdminUser index', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDisableApis = false
    mockLocationPathname = '/users'
    mockAuthRole = 'admin'
    mockPermission = true
    mockPageParams = {
      page: 1,
      page_size: 10,
      search: '',
      ordering: '',
      filters: {},
      sortColumn: '',
      sortType: '',
    }
    mockLatestColumnsArgs = null
    mockUseAdminUser.mockReturnValue({
      data: {
        items: [{ id: '1' }],
        total: 1,
        current_page: 1,
      },
      refetch: jest.fn(),
      isFetching: false,
    })
    mockGetAdminDetails.mockResolvedValue({ id: 'details-id' })
    mockSendAdminInvitation.mockResolvedValue({ message: 'Invitation sent' })
    mockDeactivateAdmin.mockResolvedValue({ message: 'Deactivated' })
    mockActivateAdmin.mockResolvedValue({ message: 'Activated' })
    mockDeleteAdmin.mockResolvedValue({})
  })

  it('renders disabled build state when APIs are disabled', () => {
    mockDisableApis = true
    render(<AdminUser />)

    expect(
      screen.getByText('This section is disabled for this build.')
    ).toBeInTheDocument()
  })

  it('wires filters, tabs, create flow, view flow, and edit flow', async () => {
    const refetch = jest.fn()
    mockUseAdminUser.mockReturnValue({
      data: { items: [{ id: '1' }], total: 1, current_page: 1 },
      refetch,
      isFetching: false,
    })

    render(<AdminUser />)

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'active' },
    })
    fireEvent.click(screen.getByText('Page 2'))
    fireEvent.click(screen.getByText('Rows 20'))
    fireEvent.click(screen.getByText('Sort Name'))
    fireEvent.click(screen.getByText('Search Change'))
    fireEvent.click(screen.getByText('Search Submit'))
    fireEvent.click(screen.getByText('Client'))
    fireEvent.click(screen.getByText('Nutritionist'))
    fireEvent.click(screen.getByText('Inactive Users'))
    fireEvent.click(screen.getByText('Create Client'))

    expect(screen.getByTestId('create-admin')).toBeInTheDocument()

    const columnsModule = jest.requireMock('../columns')
    await waitFor(() => expect(columnsModule.getColumns).toHaveBeenCalled())
    await columnsModule.getColumns.mock.calls[0][0].onViewAction({ id: 'view-row' })
    await waitFor(() =>
      expect(mockGetAdminDetails).toHaveBeenCalledWith('view-row')
    )
    await waitFor(() =>
      expect(screen.getByText('view-mode')).toBeInTheDocument()
    )

    fireEvent.click(screen.getByText('Mark Edit View'))
    fireEvent.click(screen.getByText('Close Drawer'))
    await waitFor(() => expect(mockGetAdminDetails).toHaveBeenCalledTimes(2))

    fireEvent.click(screen.getByText('Row Edit'))
    await waitFor(() => expect(mockGetAdminDetails).toHaveBeenCalledWith('edit-row'))
    await waitFor(() =>
      expect(screen.getByText('editing')).toBeInTheDocument()
    )

    columnsModule.getColumns.mock.calls[0][0].onNameClick({ id: 'name-row' })
    fireEvent.click(screen.getByText('Row View'))

    expect(mockNavigate).toHaveBeenCalledWith('/users')
    expect(mockNavigate).toHaveBeenCalledWith('/users/nutritionist')
    expect(mockNavigate).toHaveBeenCalledWith('/admin/inactive-users')
    expect(mockNavigate).toHaveBeenCalledWith('/users/name-row')
    expect(mockNavigate).toHaveBeenCalledWith('/users/view-action')
    expect(mockSetPageParams).toHaveBeenCalled()
  })

  it('handles active-plan deactivation warning and confirmation', async () => {
    const refetch = jest.fn()
    mockUseAdminUser.mockReturnValue({
      data: { items: [{ id: '1' }], total: 1, current_page: 1 },
      refetch,
      isFetching: false,
    })

    render(<AdminUser />)
    fireEvent.click(screen.getByText('Row Deactivate'))

    expect(screen.getByText('Deactivate this user?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Yes, Continue'))

    await waitFor(() =>
      expect(mockDeactivateAdmin).toHaveBeenCalledWith('active-row')
    )
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Deactivated', {
      variant: 'success',
    })
    expect(refetch).toHaveBeenCalled()
    expect(mockSetSelectedRows).toHaveBeenCalled()
  })

  it('activates an inactive user directly', async () => {
    render(<AdminUser />)
    fireEvent.click(screen.getByText('Row Activate'))

    await waitFor(() =>
      expect(mockActivateAdmin).toHaveBeenCalledWith('inactive-row')
    )
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Activated', {
      variant: 'success',
    })
  })

  it('deletes a user through the delete confirmation modal', async () => {
    const refetch = jest.fn()
    mockUseAdminUser.mockReturnValue({
      data: { items: [{ id: '1' }], total: 1, current_page: 1 },
      refetch,
      isFetching: false,
    })

    render(<AdminUser />)
    fireEvent.click(screen.getByText('Row Delete'))
    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() => expect(mockDeleteAdmin).toHaveBeenCalledWith('delete-row'))
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('User deleted successfully', {
      variant: 'success',
    })
    expect(refetch).toHaveBeenCalled()
  })

  it('shows API errors for status and delete actions', async () => {
    mockActivateAdmin.mockRejectedValue({
      response: { data: { message: 'Activation failed' } },
    })
    mockDeleteAdmin.mockRejectedValue({
      response: { data: { message: 'Delete failed' } },
    })

    render(<AdminUser />)
    fireEvent.click(screen.getByText('Row Activate'))
    fireEvent.click(screen.getByText('Row Delete'))
    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() =>
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Activation failed', {
        variant: 'error',
      })
    )
    await waitFor(() =>
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Delete failed', {
        variant: 'error',
      })
    )
  })

  it('hides create controls for nutritionist login while staying on user tab', () => {
    mockAuthRole = 'nutritionist'
    mockLocationPathname = '/users/nutritionist'

    render(<AdminUser />)

    expect(screen.queryByText('Create Nutritionist')).not.toBeInTheDocument()
    expect(screen.queryByText('Nutritionist')).not.toBeInTheDocument()
  })
})
