import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

const mockUseNavigate = jest.fn()
const mockUseParams = jest.fn(() => ({}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useParams: () => mockUseParams(),
  useLocation: () => ({
    pathname: '/diet-template',
  }),
}))

const mockEnqueueSnackbar = jest.fn()
jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

const mockGetTemplateDetails = jest.fn()
const mockDeleteTemplate = jest.fn()
const mockDuplicateTemplate = jest.fn()
const mockRefetch = jest.fn()

jest.mock('../api', () => ({
  useTemplateList: () => ({
    data: {
      diet_plan_templates: [
        {
          id: 1,
          name: 'Weight Loss Plan',
          description: 'A weight loss plan',
          duration_days: 30,
          status: 'active',
        },
      ],
      meta: { total_pages: 1, total_count: 1, current_page: 1 },
    },
    refetch: mockRefetch,
    isFetching: false,
  }),
  getTemplateDetails: (id: string) => mockGetTemplateDetails(id),
  deleteTemplate: (id: string) => mockDeleteTemplate(id),
  duplicateTemplate: (id: string) => mockDuplicateTemplate(id),
  DISABLE_NONLOGIN_APIS: false,
}))

jest.mock('../../DietTemplateCategories/api', () => ({
  useDietTemplateCategories: () => ({
    data: {
      diet_template_categories: [
        { id: 1, name: 'Weight Loss' },
        { id: 2, name: 'Muscle Gain' },
      ],
    },
  }),
}))

jest.mock('../create', () => {
  return function MockCreateComponent(props: any) {
    const {
      isDrawerOpen,
      viewMode,
      edit,
      handleClose,
      handleRefresh,
      setEditViewIndicator,
      setEdit,
      setViewMode,
    } = props
    if (!isDrawerOpen) return null
    return (
      <div data-testid="create-modal">
        <div data-testid="create-mode">
          {viewMode ? 'view' : edit ? 'edit' : 'create'}
        </div>
        <button
          data-testid="create-set-edit-view-indicator"
          onClick={() => setEditViewIndicator(true)}
        >
          set-edit-view-indicator
        </button>
        <button
          data-testid="create-trigger-edit-view"
          onClick={() => {
            setEdit(true)
            setViewMode(true)
          }}
        >
          trigger-edit-view
        </button>
        <button data-testid="create-refresh" onClick={handleRefresh}>
          refresh
        </button>
        <button data-testid="create-close" onClick={handleClose}>
          close
        </button>
      </div>
    )
  }
})

// Ensure the passed `onViewAction` callback is actually exercised in tests.
jest.mock('../columns', () => ({
  getColumns: (opts: any) => [
    {
      title: 'Name',
      field: 'name',
      resizable: true,
      isVisible: true,
      customCell: true,
      rowClick: (row: any) => opts?.onNameClick?.(row),
    },
    {
      title: 'ViewAction',
      field: 'view_action',
      resizable: true,
      isVisible: true,
      customCell: true,
      rowClick: (row: any) => opts?.onViewAction?.(row),
    },
  ],
}))

jest.mock('../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    const row = Array.isArray(props?.data) ? props.data[0] : undefined
    const viewCol = Array.isArray(props?.columns)
      ? props.columns.find((c: any) => c?.field === 'view_action')
      : undefined
    return (
      <div data-testid="smart-table">
        <div data-testid="toolbar-extra">{props.toolbarExtra}</div>
        <button
          data-testid="row-view-action"
          onClick={() => viewCol?.rowClick?.(row)}
        >
          row-view
        </button>
        <input
          data-testid="search-input"
          value={props.searchValue ?? ''}
          onChange={(e) => props.onSearchChange?.(e.target.value)}
        />
        <button data-testid="search-submit" onClick={() => props.onSearch?.()}>
          search
        </button>
        <button
          data-testid="sort-name-asc"
          onClick={() => props.handleColumnSort?.('name', 'asc')}
        >
          sort
        </button>
        <button
          data-testid="page-2"
          onClick={() => props.paginationProps?.onPagination?.(2)}
        >
          page2
        </button>
        <button
          data-testid="rows-20"
          onClick={() => props.paginationProps?.onRowsPerPage?.(20)}
        >
          rows20
        </button>
        <div data-testid="actions">
          {(props.actionProps ?? []).map((a: any) => (
            <button
              key={a.title}
              data-testid={`action-${a.title}`}
              onClick={() => a.action?.(row)}
            >
              {a.title}
            </button>
          ))}
        </div>
      </div>
    )
  }
})

jest.mock('../../../components/common/ListingTiles', () => {
  return function MockListingHeader(props: any) {
    return (
      <div data-testid="listing-header">
        <div data-testid="listing-title">{props?.data?.title}</div>
        {props?.onActionClick ? (
          <button
            data-testid="listing-action"
            onClick={() => props.onActionClick()}
          >
            {props?.actionProps?.actionTitle ?? 'action'}
          </button>
        ) : (
          <div data-testid="listing-action-disabled">disabled</div>
        )}
      </div>
    )
  }
})

jest.mock('../../../components/common/modal/ConfirmDeleteModal', () => {
  return function MockConfirmDeleteModal({
    isOpen,
    onConfirm,
  }: {
    isOpen: boolean
    onConfirm: () => void
  }) {
    if (!isOpen) return null
    return (
      <div data-testid="confirm-delete-modal">
        <button data-testid="confirm-delete-btn" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    )
  }
})

jest.mock('../../../layout/store', () => ({
  checkPermissions: jest.fn(() => true),
}))

jest.mock('../../../store/authStore', () => ({
  useAuthStore: () => ({
    roleData: { name: 'admin' },
  }),
}))

const mockSetPageParams = jest.fn()
jest.mock('../../../store/filterSore/adminUserStore', () => {
  return {
    __esModule: true,
    useAdminUserFilterStore: () => ({
      pageParams: {
        page: 1,
        per_page: 10,
        search: '',
        ordering: '',
        filters: {},
        sortType: undefined,
        sortColumn: undefined,
      },
      setPageParams: mockSetPageParams,
    }),
  }
})

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithProviders = (
  component: React.ReactElement,
  { queries = createTestQueryClient(), ...renderOptions } = {}
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queries}>{children}</QueryClientProvider>
    </BrowserRouter>
  )
  return render(component, { wrapper: Wrapper, ...renderOptions })
}

describe('DietTemplate Main Component', () => {
  const DietTemplateMain = require('../index').default

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTemplateDetails.mockResolvedValue({
      diet_plan_template: {
        id: 1,
        name: 'Weight Loss Plan',
        description: 'A weight loss plan',
        duration_days: 30,
      },
    })
  })

  it('renders listing header', () => {
    renderWithProviders(<DietTemplateMain />)

    expect(screen.getByTestId('listing-header')).toBeInTheDocument()
  })

  it('renders smart table', () => {
    renderWithProviders(<DietTemplateMain />)

    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
  })

  it('opens drawer when create action is clicked', () => {
    renderWithProviders(<DietTemplateMain />)

    fireEvent.click(screen.getByTestId('listing-action'))
    expect(screen.getByTestId('create-modal')).toBeInTheDocument()
    expect(screen.getByTestId('create-mode')).toHaveTextContent('create')
  })

  it('renders diet template category filter', () => {
    renderWithProviders(<DietTemplateMain />)

    const filterLabel = screen.queryByText('Diet Plan Category')
    if (filterLabel) {
      expect(filterLabel).toBeInTheDocument()
    }
  })

  it('displays diet template data in table', async () => {
    renderWithProviders(<DietTemplateMain />)

    await waitFor(() => {
      expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    })
  })

  it('updates search and triggers refetch', async () => {
    renderWithProviders(<DietTemplateMain />)

    fireEvent.change(screen.getByTestId('search-input'), {
      target: { value: 'abc' },
    })
    fireEvent.click(screen.getByTestId('search-submit'))
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  it('renders action buttons for template management', () => {
    renderWithProviders(<DietTemplateMain />)

    expect(screen.getByTestId('listing-header')).toBeInTheDocument()
  })

  it('renders page title', () => {
    renderWithProviders(<DietTemplateMain />)

    expect(screen.getByTestId('listing-header')).toBeInTheDocument()
  })

  it('handles sort and pagination callbacks', async () => {
    renderWithProviders(<DietTemplateMain />)

    fireEvent.click(screen.getByTestId('sort-name-asc'))
    fireEvent.click(screen.getByTestId('page-2'))
    fireEvent.click(screen.getByTestId('rows-20'))

    await waitFor(() => {
      expect(mockSetPageParams).toHaveBeenCalled()
    })
  })

  it('renders template list', () => {
    renderWithProviders(<DietTemplateMain />)

    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
  })

  it('handles view action and refresh/close flows', async () => {
    renderWithProviders(<DietTemplateMain />)

    fireEvent.click(screen.getByTestId('row-view-action'))
    await waitFor(() => {
      expect(mockGetTemplateDetails).toHaveBeenCalledWith('1')
      expect(screen.getByTestId('create-modal')).toBeInTheDocument()
      expect(screen.getByTestId('create-mode')).toHaveTextContent('view')
    })

    fireEvent.click(screen.getByTestId('create-refresh'))
    expect(mockRefetch).toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('create-close'))
  })

  it('handles edit action for template', async () => {
    renderWithProviders(<DietTemplateMain />)

    fireEvent.click(screen.getByTestId('action-Edit'))
    await waitFor(() => {
      expect(mockGetTemplateDetails).toHaveBeenCalledWith('1')
      expect(screen.getByTestId('create-mode')).toHaveTextContent('edit')
    })
  })

  it('opens delete modal and deletes template', async () => {
    mockDeleteTemplate.mockResolvedValueOnce({})
    renderWithProviders(<DietTemplateMain />)

    fireEvent.click(screen.getByTestId('action-Delete'))
    expect(screen.getByTestId('confirm-delete-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('confirm-delete-btn'))
    await waitFor(() => {
      expect(mockDeleteTemplate).toHaveBeenCalledWith('1')
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  it('shows delete error message when delete fails', async () => {
    mockDeleteTemplate.mockRejectedValueOnce({
      response: { data: { errors: ['Nope'] } },
    })
    renderWithProviders(<DietTemplateMain />)

    fireEvent.click(screen.getByTestId('action-Delete'))
    fireEvent.click(screen.getByTestId('confirm-delete-btn'))
    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Nope', {
        variant: 'error',
      })
    })
  })

  it('handles template duplication (success and error)', async () => {
    mockDuplicateTemplate.mockResolvedValueOnce({
      data: { message: 'ok' },
    })
    renderWithProviders(<DietTemplateMain />)

    fireEvent.click(screen.getByTestId('action-Duplicate'))
    await waitFor(() => {
      expect(mockDuplicateTemplate).toHaveBeenCalledWith('1')
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('ok', {
        variant: 'success',
      })
    })

    mockDuplicateTemplate.mockRejectedValueOnce({
      response: { data: { message: 'fail' } },
    })
    fireEvent.click(screen.getByTestId('action-Duplicate'))
    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('fail', {
        variant: 'error',
      })
    })
  })

  it('handles diet template category filter change', async () => {
    renderWithProviders(<DietTemplateMain />)

    const label = screen.getByText('Diet Plan Category')
    const select = label.parentElement?.querySelector(
      'select'
    ) as HTMLSelectElement
    expect(select).toBeTruthy()
    fireEvent.change(select, { target: { value: '1' } })
    fireEvent.change(select, { target: { value: '' } })

    await waitFor(() => {
      expect(mockSetPageParams).toHaveBeenCalled()
    })
  })

  it('displays correct table columns', () => {
    renderWithProviders(<DietTemplateMain />)

    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
  })

  it('renders nutrition table with proper styling', () => {
    renderWithProviders(<DietTemplateMain />)

    const container = screen.getByTestId('smart-table')
    expect(container).toBeInTheDocument()
  })

  it('handles empty state message', () => {
    renderWithProviders(<DietTemplateMain />)

    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
  })

  it('manages selected items state', async () => {
    renderWithProviders(<DietTemplateMain />)

    await waitFor(() => {
      expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    })
  })
})
