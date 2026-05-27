import React from 'react'
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

let Plans: any

const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleLog = console.log
beforeAll(() => {
  console.error = jest.fn((...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    if (msg.includes('ReactDOMTestUtils.act')) return
    // react-query errors can be expected in mocked tests; keep console clean
    if (args[0] && typeof args[0] === 'object' && 'response' in args[0]) return
    originalConsoleError(...args)
  })
  console.warn = jest.fn((...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    if (msg.includes('React Router Future Flag Warning')) return
    originalConsoleWarn(...args)
  })
  console.log = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  console.log = originalConsoleLog
})

const mockNavigate = jest.fn()
const mockLocation = { pathname: '/plans' }

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}))


jest.mock('../../../utilities/format', () => ({
  convertUTCtoBrowserTimeZone: (v: any) => v,
}))

const mockRefetch = jest.fn()
const mockUsePlans = jest.fn()
const mockDeletePlan = jest.fn()
const mockUpdatePlanMutate = jest.fn()

jest.mock('../api', () => ({
  DISABLE_NONLOGIN_APIS: false,
  usePlans: (...args: any[]) => mockUsePlans(...args),
  deletePlan: (...args: any[]) => mockDeletePlan(...args),
  useUpdatePlan: () => ({ mutate: mockUpdatePlanMutate }),
  // non-plans exports referenced but not exercised in these tests
  deActivateAdmin: jest.fn(),
  getAdminDetails: jest.fn(),
  sendAdminInvitation: jest.fn(),
}))

const mockEnqueueSnackbar = jest.fn()
jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}))

jest.mock('../../../layout/store', () => ({
  checkPermissions: () => true,
}))

const mockSetPageParams = jest.fn()
const mockSetSelectedRows = jest.fn()
const mockReset = jest.fn()
let mockRoleName = 'admin'

const mockPlanFilterState: any = {
  pageParams: {
    page: 1,
    per_page: 10,
    search: '',
    ordering: '',
    sortColumn: undefined,
    sortType: undefined,
    filters: {},
  },
  setPageParams: mockSetPageParams,
  selectedRows: [],
  setSelectedRows: mockSetSelectedRows,
  reset: mockReset,
}

jest.mock('../../../store/filterSore/planFilterStore', () => ({
  usePlanFilterStore: () => mockPlanFilterState,
  // component reads getState() at init
  __esModule: true,
}))
;(jest.requireMock('../../../store/filterSore/planFilterStore') as any).usePlanFilterStore.getState =
  () => mockPlanFilterState

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: any) => selector({ roleData: { name: mockRoleName } }),
}))

jest.mock('../../../utilities/parsers', () => ({
  getSortedColumnName: (c: string, d: string) => `${c}_${d}`,
  getNestedProperty: (obj: any, path: string) =>
    path.split('.').reduce((acc: any, key: string) => acc?.[key], obj),
}))

jest.mock('../../../utilities/calcHeight', () => ({
  calcWindowHeight: () => 600,
}))

jest.mock('../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>,
}))

jest.mock('../../../components/common/ListingTiles', () => {
  return function MockListingHeader({ data, onActionClick, actionProps }: any) {
    return (
      <div data-testid="listing-header">
        <h1>{data?.title}</h1>
        {onActionClick && (
          <button data-testid="create-btn" onClick={onActionClick}>
            {actionProps?.actionTitle ?? 'Create'}
          </button>
        )}
      </div>
    )
  }
})

jest.mock('../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    const row =
      (props.data && props.data.length ? props.data[0] : null) ?? {
        id: 1,
        active: true,
        name: 'Plan',
      }
    return (
      <div data-testid="smart-table">
        <div data-testid="table-title">{props.title}</div>
        <div data-testid="toolbar-extra">{props.toolbarExtra}</div>
        <input
          data-testid="search-input"
          value={props.searchValue || ''}
          onChange={(e) => props.onSearchChange?.((e.target as any).value)}
        />
        <button data-testid="do-search" onClick={() => props.onSearch?.()}>
          Search
        </button>
        <button
          data-testid="do-sort"
          onClick={() => props.handleColumnSort?.('name', 'asc')}
        >
          Sort
        </button>
        <button
          data-testid="page-2"
          onClick={() => props.paginationProps?.onPagination?.(2)}
        >
          Page2
        </button>
        <button
          data-testid="per-20"
          onClick={() => props.paginationProps?.onRowsPerPage?.(20)}
        >
          Per20
        </button>
        <div data-testid="columns-length">{String((props.columns || []).length)}</div>
        <div data-testid="rendered-cells">
          {(props.columns || []).map((c: any, idx: number) => {
            if (typeof c?.renderCell === 'function') {
              const rendered = c.renderCell(row)
              return (
                <div key={idx} data-testid={`cell-${String(c.field ?? idx)}`}>
                  {rendered?.cell ?? null}
                </div>
              )
            }
            return null
          })}
        </div>
        {props.actionProps?.map((a: any, idx: number) =>
          a.hide?.(row) ? null : (
            <button
              key={idx}
              data-testid={`action-${String(a.title).toLowerCase()}`}
              onClick={() => a.action(row)}
            >
              {a.title}
            </button>
          )
        )}
      </div>
    )
  }
})

jest.mock('../../../components/app/alertBox/infoBox', () => ({
  __esModule: true,
  default: ({ content }: any) => <div data-testid="info-box">{content}</div>,
}))

jest.mock('../../../components/app/resetPassword', () => ({
  __esModule: true,
  default: () => <div data-testid="reset-password" />,
}))

jest.mock('../../../components/common', () => ({
  DialogModal: () => null,
  TextField: () => null,
}))

jest.mock('../../../components/common/modal/ConfirmDeleteModal', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm, onClose, loading }: any) =>
    isOpen ? (
      <div data-testid="confirm-delete">
        <button data-testid="confirm-delete-btn" onClick={onConfirm}>
          Confirm
        </button>
        <button data-testid="confirm-delete-close" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}))

jest.mock('../create', () => {
  return function MockCreatePlan(props: any) {
    return (
      <div data-testid="create-plan">
        {props.isDrawerOpen ? <span data-testid="create-open" /> : null}
      </div>
    )
  }
})

Plans = require('../index').default

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  )

describe('Plans page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRoleName = 'admin'
    ;(mockDeletePlan as any).mockResolvedValue?.({} as any)
    mockUsePlans.mockReturnValue({
      data: {
        plans: [{ id: 1, name: 'Plan', active: true }],
        meta: { total_count: 1, current_page: 1, per_page: 10 },
      },
      refetch: mockRefetch,
      isFetching: false,
    })
  })

  it('renders listing header and table', () => {
    renderWithProviders(<Plans />)
    expect(screen.getByTestId('listing-header')).toBeInTheDocument()
    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    expect(screen.getByText('Plans')).toBeInTheDocument()
  })

  it('opens create drawer when create clicked', async () => {
    renderWithProviders(<Plans />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('create-btn'))
    })
    expect(screen.getByTestId('create-open')).toBeInTheDocument()
  })

  it('does not open create drawer for nutritionist role', async () => {
    mockRoleName = 'nutritionist'
    renderWithProviders(<Plans />)
    expect(screen.queryByTestId('create-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('create-open')).not.toBeInTheDocument()
  })

  it('navigates to plan details on view action', async () => {
    renderWithProviders(<Plans />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('action-view'))
    })
    expect(mockNavigate).toHaveBeenCalledWith('/plans/1')
  })

  it('navigates to plan details on name click', async () => {
    renderWithProviders(<Plans />)
    const cell = await screen.findByTestId('cell-name')
    const link = within(cell).getByRole('button', { name: /plan/i })
    await act(async () => {
      fireEvent.click(link)
    })
    expect(mockNavigate).toHaveBeenCalledWith('/plans/1')
  })

  it('opens edit drawer when edit action clicked', async () => {
    renderWithProviders(<Plans />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('action-edit'))
    })
    expect(screen.getByTestId('create-open')).toBeInTheDocument()
  })

  it('toggles status via Activate/Deactivate actions', async () => {
    renderWithProviders(<Plans />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('action-deactivate'))
    })
    expect(mockUpdatePlanMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        payload: { plan: { active: false } },
      })
    )
  })

  it('shows Activate when inactive and toggles status', async () => {
    mockUsePlans.mockReturnValue({
      data: {
        plans: [{ id: 1, name: 'Plan', active: false }],
        meta: { total_count: 1, current_page: 1, per_page: 10 },
      },
      refetch: mockRefetch,
      isFetching: false,
    })

    renderWithProviders(<Plans />)
    expect(screen.queryByTestId('action-deactivate')).not.toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByTestId('action-activate'))
    })
    expect(mockUpdatePlanMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        payload: { plan: { active: true } },
      })
    )
  })

  it('deletes plan via ConfirmDeleteModal', async () => {
    renderWithProviders(<Plans />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('action-delete'))
    })
    expect(screen.getByTestId('confirm-delete')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-delete-btn'))
    })
    expect(mockDeletePlan).toHaveBeenCalledWith(1)
  })

  it('closes confirm modal when not deleting', async () => {
    renderWithProviders(<Plans />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('action-delete'))
    })
    expect(screen.getByTestId('confirm-delete')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-delete-close'))
    })
    expect(screen.queryByTestId('confirm-delete')).not.toBeInTheDocument()
  })

  it('shows delete error snackbar when deletePlan fails', async () => {
    ;(mockDeletePlan as any).mockRejectedValueOnce({
      response: { data: { message: 'Boom' } },
    })
    renderWithProviders(<Plans />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('action-delete'))
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-delete-btn'))
    })
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Boom', {
      variant: 'error',
    })
  })

  it('does not close confirm modal while deleting', async () => {
    let resolveDelete!: (v: any) => void
    ;(mockDeletePlan as any).mockImplementationOnce(
      () => new Promise((res) => (resolveDelete = res))
    )

    renderWithProviders(<Plans />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('action-delete'))
    })
    expect(screen.getByTestId('confirm-delete')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-delete-btn'))
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-delete-close'))
    })
    expect(screen.getByTestId('confirm-delete')).toBeInTheDocument()

    await act(async () => {
      resolveDelete({} as any)
    })
  })

  it('clears initial search in store on mount', () => {
    mockPlanFilterState.pageParams.search = 'hello'
    renderWithProviders(<Plans />)
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ search: '', page: 1 })
    )
    mockPlanFilterState.pageParams.search = ''
  })

  it('clamps page when total_pages is lower', () => {
    mockPlanFilterState.pageParams.page = 5
    mockUsePlans.mockReturnValueOnce({
      data: {
        plans: [{ id: 1, name: 'Plan', active: true }],
        meta: { total_count: 1, current_page: 5, per_page: 10, total_pages: 1 },
      },
      refetch: mockRefetch,
      isFetching: false,
    })
    renderWithProviders(<Plans />)
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    )
    mockPlanFilterState.pageParams.page = 1
  })

  it('clamps page to 1 when page is less than 1 (with total_pages)', () => {
    mockPlanFilterState.pageParams.page = 0
    mockUsePlans.mockReturnValueOnce({
      data: {
        plans: [{ id: 1, name: 'Plan', active: true }],
        meta: { total_count: 1, current_page: 0, per_page: 10, total_pages: 5 },
      },
      refetch: mockRefetch,
      isFetching: false,
    })
    renderWithProviders(<Plans />)
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    )
    mockPlanFilterState.pageParams.page = 1
  })

  it('clamps page to 1 when page is less than 1 (without total_pages)', () => {
    mockPlanFilterState.pageParams.page = 0
    mockUsePlans.mockReturnValueOnce({
      data: {
        plans: [{ id: 1, name: 'Plan', active: true }],
        meta: { total_count: 1, current_page: 0, per_page: 10 },
      },
      refetch: mockRefetch,
      isFetching: false,
    })
    renderWithProviders(<Plans />)
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    )
    mockPlanFilterState.pageParams.page = 1
  })

  it('runs search handler when clicking search button', async () => {
    renderWithProviders(<Plans />)
    await act(async () => {
      fireEvent.change(screen.getByTestId('search-input'), {
        target: { value: 'abc' },
      })
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('do-search'))
    })
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'abc', page: 1 })
    )
  })

  it('applies status filter and updates pagination/search params', async () => {
    jest.useFakeTimers()
    renderWithProviders(<Plans />)

    const select = screen.getByRole('combobox') as HTMLSelectElement
    await act(async () => {
      fireEvent.change(select, { target: { value: 'false' } })
    })
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ active: false }),
        page: 1,
      })
    )

    await act(async () => {
      fireEvent.change(screen.getByTestId('search-input'), {
        target: { value: 'abc' },
      })
    })
    await act(async () => {
      jest.advanceTimersByTime(350)
    })
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'abc', page: 1 })
    )

    await act(async () => {
      fireEvent.click(screen.getByTestId('page-2'))
      fireEvent.click(screen.getByTestId('per-20'))
      fireEvent.click(screen.getByTestId('do-sort'))
    })

    jest.useRealTimers()
  })
})
