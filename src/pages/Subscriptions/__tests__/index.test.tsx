import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Subscriptions from '../index'
import { getData } from '../../../apis/api.helpers'
import { useAdminUserFilterStore } from '../../../store/filterSore/adminUserStore'
import { useSnackbarManager } from '../../../components/common/snackbar'

const mockNavigate = jest.fn()
let mockPathname = '/subscriptions'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
  useParams: () => ({ id: undefined }),
}))

const mockRefetch = jest.fn()
const mockUseAdminUser = jest.fn()
const mockDeleteAdmin = jest.fn()
const mockFreezeUser = jest.fn()
const mockUnfreezeUser = jest.fn()

jest.mock('../api', () => ({
  DISABLE_NONLOGIN_APIS: false,
  useAdminUser: (params: any) => mockUseAdminUser(params),
  getAdminDetails: jest.fn(),
  deleteAdmin: (id?: string) => mockDeleteAdmin(id),
  freezeUser: (id: string, payload?: any) => mockFreezeUser(id, payload),
  unfreezeUser: (id: string, payload?: any) =>
    mockUnfreezeUser(id, payload),
}))

const mockPageParams: any = {
  page: 1,
  page_size: 10,
  search: '',
  ordering: '',
  filters: {},
  sortColumn: '',
  sortType: '',
}
const mockSetPageParams = jest.fn((next: any) => {
  Object.keys(mockPageParams).forEach((key) => delete mockPageParams[key])
  Object.assign(mockPageParams, next)
})

jest.mock('../../../store/filterSore/adminUserStore', () => ({
  useAdminUserFilterStore: jest.fn(() => ({
    pageParams: mockPageParams,
    setPageParams: mockSetPageParams,
  })),
}))

const mockEnqueueSnackbar = jest.fn()

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: jest.fn(() => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  })),
}))

jest.mock('../../../apis/api.helpers', () => ({
  getData: jest.fn(),
}))

jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    PLANS: 'plans',
  },
}))

jest.mock('../../../components/common/table/SmartTable', () => {
  const React = require('react')

  const MockSmartTable = (props: any) => (
    <div data-testid="smart-table">
      <span data-testid="row-count">{props.data.length}</span>
      <span data-testid="column-count">{props.columns.length}</span>
      <span data-testid="empty-subtitle">{props.emptySubTitle}</span>
      <input
        aria-label="subscription-search"
        value={props.searchValue}
        onChange={(event) => props.onSearchChange(event.target.value)}
      />
      <button type="button" onClick={() => props.onSearch('anna')}>
        Run Search
      </button>
      <button
        type="button"
        onClick={() => props.paginationProps.onPagination(3)}
      >
        Go Page 3
      </button>
      <button
        type="button"
        onClick={() => props.paginationProps.onRowsPerPage(50)}
      >
        Rows 50
      </button>
      <button
        type="button"
        onClick={() => props.handleColumnSort('plan_name', 'desc')}
      >
        Sort Plan
      </button>
      <div data-testid="toolbar-extra">{props.toolbarExtra}</div>
      {props.data.map((row: any, rowIndex: number) => (
        <div data-testid={`row-${row.id}`} key={row.id}>
          {props.columns.map((column: any) => {
            if (!column.renderCell) return null
            const rendered = column.renderCell(row)
            return (
              <div key={column.field || column.title}>
                {rendered?.cell ?? null}
              </div>
            )
          })}
          {props.actionProps.map((action: any) => (
            <button
              key={`${row.id}-${action.title}`}
              type="button"
              onClick={() => action.action(row)}
              data-testid={`${action.title.toLowerCase()}-${rowIndex}`}
            >
              {action.title}
            </button>
          ))}
        </div>
      ))}
    </div>
  )

  return MockSmartTable
})

jest.mock('../../../components/common/DynamicDropdown', () => {
  const React = require('react')

  const MockDynamicDropdown = ({ tileItem, setUpdateCREId, getData }: any) => {
    const [options, setOptions] = React.useState<any[]>([])

    return (
      <div data-testid={`${tileItem.label.toLowerCase()}-dropdown`}>
        <span>{tileItem.value}</span>
        <button
          type="button"
          onClick={async () => setOptions(await getData('standard'))}
        >
          Load {tileItem.label} Options
        </button>
        <div data-testid={`${tileItem.label.toLowerCase()}-options`}>
          {options.map((option) => (
            <span key={`${tileItem.label}-${option.id ?? option.value}`}>
              {option.value}
            </span>
          ))}
        </div>
        {tileItem.label === 'Plan' ? (
          <>
            <button type="button" onClick={() => setUpdateCREId(10)}>
              Select Standard Plan
            </button>
            <button type="button" onClick={() => setUpdateCREId(null)}>
              Clear Plan
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setUpdateCREId('active')}>
              Select Active
            </button>
            <button type="button" onClick={() => setUpdateCREId(null)}>
              Clear Status
            </button>
          </>
        )}
      </div>
    )
  }

  return MockDynamicDropdown
})

jest.mock('../../../components/common/modal/DialogModal', () => {
  const MockDialogModal = ({
    isOpen,
    title,
    body,
    onSubmit,
    secondaryAction,
    actionLabel,
  }: any) =>
    isOpen ? (
      <section data-testid="dialog-modal">
        <h2>{title}</h2>
        <div>{body}</div>
        <button type="button" onClick={onSubmit} data-testid="dialog-submit">
          {actionLabel || 'Submit'}
        </button>
        <button type="button" onClick={secondaryAction}>
          Cancel
        </button>
      </section>
    ) : null

  return MockDialogModal
})

jest.mock('../../../components/common/modal/ConfirmDeleteModal', () => {
  const MockConfirmDeleteModal = ({
    isOpen,
    title,
    subTitle,
    onClose,
    onConfirm,
    confirmLabel,
    cancelLabel,
  }: any) =>
    isOpen ? (
      <section data-testid={`confirm-${confirmLabel}`}>
        <h2>{title}</h2>
        <p>{subTitle}</p>
        <button type="button" onClick={onConfirm} data-testid="confirm-submit">
          {confirmLabel}
        </button>
        <button type="button" onClick={onClose}>
          {cancelLabel}
        </button>
      </section>
    ) : null

  return MockConfirmDeleteModal
})

jest.mock('../../../components/app/alertBox/infoBox', () => {
  const MockInfoBox = ({ content }: { content: string }) => (
    <div data-testid="info-box">{content}</div>
  )

  return MockInfoBox
})

jest.mock('../../../components/app/resetPassword', () => {
  const MockResetPassword = () => <div data-testid="reset-password" />
  return MockResetPassword
})

jest.mock('../../../components/common/modal/FreezeUserModal', () => {
  const MockFreezeUserModal = () => <div data-testid="freeze-user-modal" />
  return MockFreezeUserModal
})

jest.mock('../../../components/common/icons', () => {
  const MockIcons = ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  )
  return MockIcons
})

jest.mock('../../../components/common/ListingTiles', () => {
  const MockListingHeader = ({ data }: any) => (
    <header data-testid="listing-header">{data.title}</header>
  )

  return MockListingHeader
})

jest.mock('../create', () => {
  const MockCreateAdmin = ({ isDrawerOpen }: any) => (
    <div data-testid="create-admin">{isDrawerOpen ? 'open' : 'closed'}</div>
  )

  return MockCreateAdmin
})

const rows = [
  {
    id: 1,
    user_name: 'Anna Client',
    plan_name: 'Standard',
    start_date: '2026-05-01',
    end_date: '2026-05-31',
    days_remaining: 10,
    status: 'active',
  },
  {
    id: 2,
    user_name: 'Ben Paused',
    plan_name: 'Premium',
    start_date: '2026-05-01',
    end_date: '2026-05-31',
    days_remaining: 5,
    status: 'paused',
    freeze_dates: ['2026-05-03', '2026-05-04'],
  },
]

const resetPageParams = (overrides: any = {}) => {
  Object.keys(mockPageParams).forEach((key) => delete mockPageParams[key])
  Object.assign(mockPageParams, {
    page: 1,
    page_size: 10,
    search: '',
    ordering: '',
    filters: {},
    sortColumn: '',
    sortType: '',
    ...overrides,
  })
}

const renderSubscriptions = () =>
  render(
    <MemoryRouter>
      <Subscriptions />
    </MemoryRouter>
  )

describe('Subscriptions page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPathname = '/subscriptions'
    resetPageParams()
    ;(useSnackbarManager as jest.Mock).mockReturnValue({
      enqueueSnackbar: mockEnqueueSnackbar,
    })
    ;(useAdminUserFilterStore as jest.Mock).mockReturnValue({
      pageParams: mockPageParams,
      setPageParams: mockSetPageParams,
    })
    mockUseAdminUser.mockReturnValue({
      data: { items: rows, total: 2 },
      refetch: mockRefetch,
      isFetching: false,
    })
    mockDeleteAdmin.mockResolvedValue({})
    mockFreezeUser.mockResolvedValue({})
    mockUnfreezeUser.mockResolvedValue({})
    ;(getData as jest.Mock).mockResolvedValue({
      items: [{ id: 10, name: 'Standard Plan' }],
    })
  })

  it('renders subscriptions table with listing header, rows, and columns', async () => {
    renderSubscriptions()

    expect(screen.getByTestId('listing-header')).toHaveTextContent(
      'Subscriptions'
    )
    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    expect(screen.getByTestId('row-count')).toHaveTextContent('2')

    await waitFor(() => {
      expect(screen.getByTestId('column-count')).toHaveTextContent('6')
    })
    expect(mockUseAdminUser).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 10 })
    )
  })

  it('updates page params for search, pagination, rows per page, and sorting', async () => {
    renderSubscriptions()
    await waitFor(() => expect(screen.getByTestId('column-count')).toHaveTextContent('6'))
    mockSetPageParams.mockClear()

    fireEvent.change(screen.getByLabelText('subscription-search'), {
      target: { value: 'ann' },
    })
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'ann', page: 1 })
    )

    fireEvent.click(screen.getByText('Run Search'))
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'anna', page: 1 })
    )

    fireEvent.click(screen.getByText('Go Page 3'))
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3 })
    )

    fireEvent.click(screen.getByText('Rows 50'))
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ page_size: 50, page: 1 })
    )

    fireEvent.click(screen.getByText('Sort Plan'))
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        sortColumn: 'plan_name',
        sortType: 'desc',
        ordering: expect.any(String),
      })
    )
  })

  it('navigates from the client name and view action', async () => {
    renderSubscriptions()
    await waitFor(() => expect(screen.getByText('Anna Client')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Anna Client'))
    expect(mockNavigate).toHaveBeenCalledWith('/subscriptions/1')

    fireEvent.click(screen.getByTestId('view-0'))
    expect(mockNavigate).toHaveBeenCalledWith('/subscriptions/1')
  })

  it('applies plan and status filters from dropdown selections', async () => {
    renderSubscriptions()
    await waitFor(() => expect(screen.getByText('All Plans')).toBeInTheDocument())
    mockSetPageParams.mockClear()

    fireEvent.click(screen.getByText('Select Standard Plan'))
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ plan_id: 10 }),
        page: 1,
      })
    )

    fireEvent.click(screen.getByText('Select Active'))
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ status: 'active' }),
        page: 1,
      })
    )
  })

  it('loads plan and status dropdown options', async () => {
    renderSubscriptions()
    await waitFor(() => expect(screen.getByText('All Plans')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Load Plan Options'))
    await waitFor(() => {
      expect(getData).toHaveBeenCalledWith('plans?per_page=1000')
      expect(screen.getByText('Standard Plan')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Load Status Options'))
    await waitFor(() => {
      expect(screen.getAllByText('Paused').length).toBeGreaterThan(0)
      expect(screen.getByText('Expired')).toBeInTheDocument()
    })
  })

  it('resolves persisted plan and status filter labels', async () => {
    resetPageParams({
      filters: { plan_id: 10, status: 'paused' },
    })
    ;(getData as jest.Mock).mockResolvedValueOnce({
      data: { plan_name: 'Persisted Plan' },
    })

    renderSubscriptions()

    await waitFor(() => {
      expect(getData).toHaveBeenCalledWith('plans/10')
      expect(screen.getByText('Persisted Plan')).toBeInTheDocument()
      expect(screen.getAllByText('Paused').length).toBeGreaterThan(0)
    })
  })

  it('deletes a subscription and refreshes the table', async () => {
    renderSubscriptions()
    await waitFor(() => expect(screen.getByTestId('delete-0')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('delete-0'))
    expect(screen.getByText('Do you really want to delete this subscription? This process cannot be undone.')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('confirm-submit'))

    await waitFor(() => {
      expect(mockDeleteAdmin).toHaveBeenCalledWith(1)
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Subscription deleted successfully',
        { variant: 'success' }
      )
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  it('shows delete API errors', async () => {
    mockDeleteAdmin.mockRejectedValueOnce({
      response: { data: { message: 'Delete failed' } },
    })
    renderSubscriptions()
    await waitFor(() => expect(screen.getByTestId('delete-0')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('delete-0'))
    fireEvent.click(screen.getByTestId('confirm-submit'))

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Delete failed', {
        variant: 'error',
      })
    })
  })

  it('validates freeze form and freezes an active subscription', async () => {
    renderSubscriptions()
    await waitFor(() => expect(screen.getByTestId('freeze-0')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('freeze-0'))
    expect(screen.getByText('Freeze Subscription')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('dialog-submit'))
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Please fill reason, start date and end date',
      { variant: 'warning' }
    )

    fireEvent.change(screen.getByPlaceholderText('Enter reason'), {
      target: { value: 'Vacation' },
    })
    fireEvent.change(screen.getByPlaceholderText('Select start date'), {
      target: { value: '2026-05-10' },
    })
    fireEvent.change(screen.getByPlaceholderText('Select end date'), {
      target: { value: '2026-05-12' },
    })
    fireEvent.click(screen.getByTestId('dialog-submit'))

    await waitFor(() => {
      expect(mockFreezeUser).toHaveBeenCalledWith('1', {
        reason: 'Vacation',
        start_date: '2026-05-10',
        end_date: '2026-05-12',
      })
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Subscription frozen successfully',
        { variant: 'success' }
      )
    })
  })

  it('keeps freeze dates ordered and shows freeze API errors', async () => {
    mockFreezeUser.mockRejectedValueOnce({
      response: { data: { error: { message: 'Freeze failed' } } },
    })
    renderSubscriptions()
    await waitFor(() => expect(screen.getByTestId('freeze-0')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('freeze-0'))
    fireEvent.change(screen.getByPlaceholderText('Enter reason'), {
      target: { value: 'Schedule change' },
    })
    fireEvent.change(screen.getByPlaceholderText('Select end date'), {
      target: { value: '2026-05-08' },
    })
    fireEvent.change(screen.getByPlaceholderText('Select start date'), {
      target: { value: '2026-05-10' },
    })
    fireEvent.click(screen.getByTestId('dialog-submit'))

    await waitFor(() => {
      expect(mockFreezeUser).toHaveBeenCalledWith('1', {
        reason: 'Schedule change',
        start_date: '2026-05-10',
        end_date: '2026-05-10',
      })
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Freeze failed', {
        variant: 'error',
      })
    })
  })

  it('requires a selected date before unfreezing a paused subscription', async () => {
    renderSubscriptions()
    await waitFor(() => expect(screen.getByTestId('unfreeze-1')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('unfreeze-1'))
    expect(screen.getByText('Unfreeze Subscription')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('dialog-submit'))
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Select at least one date to unfreeze',
      { variant: 'warning' }
    )

    fireEvent.click(screen.getByText('Select all'))
    fireEvent.click(screen.getByTestId('dialog-submit'))

    await waitFor(() => {
      expect(mockUnfreezeUser).toHaveBeenCalledWith('2', {
        unfreeze_dates: ['2026-05-03', '2026-05-04'],
      })
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Subscription unfrozen successfully',
        { variant: 'success' }
      )
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  it('toggles individual unfreeze dates and clears selected dates', async () => {
    renderSubscriptions()
    await waitFor(() => expect(screen.getByTestId('unfreeze-1')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('unfreeze-1'))
    fireEvent.click(screen.getByText('3 May 2026'))
    fireEvent.click(screen.getByText('Clear all'))
    fireEvent.click(screen.getByTestId('dialog-submit'))

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Select at least one date to unfreeze',
      { variant: 'warning' }
    )
  })

  it('shows an empty-state message when paused rows have no freeze dates', async () => {
    mockUseAdminUser.mockReturnValue({
      data: {
        items: [{ ...rows[1], freeze_dates: [], paused_dates: '' }],
        total: 1,
      },
      refetch: mockRefetch,
      isFetching: false,
    })
    renderSubscriptions()
    await waitFor(() => expect(screen.getByTestId('unfreeze-0')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('unfreeze-0'))

    expect(screen.getByTestId('info-box')).toHaveTextContent(
      'No freeze dates are available to unfreeze.'
    )
  })
})
