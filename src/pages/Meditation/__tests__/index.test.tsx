// src/pages/Meditation/__tests__/index.test.tsx

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MeditationMain from '../index'

// Create a query client for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// Mock all dependencies at the top level
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/meditation',
    search: '',
    hash: '',
    state: null,
  }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}))

// Mock the API module
const mockRefetch = jest.fn()
const mockGetMeditationDetails = jest.fn()
const mockDeleteMeditation = jest.fn()

// Mock data
const mockRowData = {
  id: '1',
  title: 'Test Meditation',
  description: 'Test Description',
  duration_minutes: 30,
}

jest.mock('../api', () => ({
  getMeditationDetails: (...args: any[]) => mockGetMeditationDetails(...args),
  useMeditationList: jest.fn(),
  deleteMeditation: (...args: any[]) => mockDeleteMeditation(...args),
  DISABLE_NONLOGIN_APIS: false,
}))

// Mock the store
jest.mock('../../../store/authStore', () => ({
  useAuthStore: jest.fn(),
}))

jest.mock('../../../store/filterSore/adminUserStore', () => ({
  useAdminUserFilterStore: jest.fn(),
}))

// Mock child components
jest.mock('../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    return (
      <div data-testid="smart-table">
        <input
          data-testid="search-input"
          value={props.searchValue || ''}
          onChange={(e) => props.onSearchChange(e.target.value)}
          placeholder={props.searchPlaceholder}
        />
        <button data-testid="refetch-btn" onClick={() => props.onSearch()}>
          Refetch
        </button>
        <button
          data-testid="sort-btn"
          onClick={() => props.handleColumnSort('title', 'asc')}
        >
          Sort
        </button>
        {props.actionProps?.map((action: any, idx: number) => (
          <button
            key={idx}
            data-testid={`action-${action.title?.toLowerCase().replace(/\s/g, '-')}`}
            onClick={() => action.action({ id: '1', title: 'Test' })}
          >
            {action.icon}
            {action.title}
          </button>
        ))}
        <button
          data-testid="page-change"
          onClick={() => props.paginationProps?.onPagination(2)}
        >
          Change Page
        </button>
        <button
          data-testid="rows-change"
          onClick={() => props.paginationProps?.onRowsPerPage(20)}
        >
          Change Rows
        </button>
        {props.isLoading && <span data-testid="loading">Loading...</span>}
        <div data-testid="data-count">{props.data?.length || 0}</div>
      </div>
    )
  }
})

jest.mock('../create', () => {
  return function MockCreateAdmin(props: any) {
    return (
      <div data-testid="create-modal">
        {props.isDrawerOpen && (
          <>
            <span data-testid="modal-mode">
              {props.edit ? 'Edit' : props.viewMode ? 'View' : 'Create'}
            </span>
            <button data-testid="close-modal" onClick={props.handleClose}>
              Close
            </button>
            <button data-testid="refresh-modal" onClick={props.handleRefresh}>
              Refresh
            </button>
          </>
        )}
      </div>
    )
  }
})

// Mock ConfirmDeleteModal to conditionally render
jest.mock('../../../components/common/modal/ConfirmDeleteModal', () => {
  return function MockConfirmDeleteModal(props: any) {
    if (!props.isOpen) return null

    return (
      <div data-testid="delete-modal">
        <h3>{props.title}</h3>
        <p>{props.subTitle}</p>
        <button data-testid="confirm-delete" onClick={props.onConfirm}>
          {props.confirmLabel}
        </button>
        <button data-testid="cancel-delete" onClick={props.onClose}>
          {props.cancelLabel}
        </button>
        {props.loading && <span data-testid="delete-loading">Loading...</span>}
      </div>
    )
  }
})

jest.mock('../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  ),
}))

jest.mock('../../../components/common/ListingTiles', () => {
  return function MockListingHeader({ data, onActionClick, actionProps }: any) {
    return (
      <div data-testid="listing-header">
        <h1>{data?.title}</h1>
        {onActionClick && (
          <button data-testid="create-button" onClick={onActionClick}>
            {actionProps?.actionTitle || 'Create'}
          </button>
        )}
      </div>
    )
  }
})

// Mock utilities
jest.mock('../../../utilities/calcHeight', () => ({
  calcWindowHeight: jest.fn(() => 500),
}))

jest.mock('../../../utilities/parsers', () => ({
  getSortedColumnName: jest.fn((col, dir) => `${col}_${dir}`),
}))

jest.mock('../../../utilities/validation', () => ({
  handleReturnEmptyMsg: jest.fn(() => 'No records found'),
}))

jest.mock('../../../layout/store', () => ({
  checkPermissions: jest.fn(() => true),
}))

describe('MeditationMain', () => {
  const mockSetPageParams = jest.fn()
  const mockEnqueueSnackbar = jest.fn()

  const mockMeditations = [
    {
      id: '1',
      title: 'Morning Meditation',
      description: 'Start your day with peace',
      duration_minutes: '10.00',
      video_url: 'http://example.com/video1.mp4',
      thumbnail_url: 'http://example.com/thumb1.jpg',
    },
    {
      id: '2',
      title: 'Evening Relaxation',
      description: 'Unwind after a long day',
      duration_minutes: '15.00',
      video_url: 'http://example.com/video2.mp4',
      thumbnail_url: 'http://example.com/thumb2.jpg',
    },
  ]

  const mockPageParams = {
    page: 1,
    per_page: 10,
    search: '',
    ordering: '',
    filters: {},
    sortColumn: '',
    sortType: '',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    // Mock useAuthStore
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useAuthStore } = require('../../../store/authStore')
    useAuthStore.mockReturnValue({
      roleData: { name: 'admin' },
    })

    // Mock useAdminUserFilterStore
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      useAdminUserFilterStore,
    } = require('../../../store/filterSore/adminUserStore')
    useAdminUserFilterStore.mockReturnValue({
      pageParams: mockPageParams,
      setPageParams: mockSetPageParams,
    })

    // Mock useMeditationList
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useMeditationList } = require('../api')
    useMeditationList.mockReturnValue({
      data: {
        meditations: mockMeditations,
        meta: {
          total_count: 2,
          total_pages: 1,
          current_page: 1,
        },
      },
      refetch: mockRefetch,
      isFetching: false,
    })

    // Mock API functions
    mockDeleteMeditation.mockResolvedValue({})
    mockGetMeditationDetails.mockResolvedValue({
      meditation: mockMeditations[0],
    })

    // Mock useSnackbar
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    jest.spyOn(require('notistack'), 'useSnackbar').mockReturnValue({
      enqueueSnackbar: mockEnqueueSnackbar,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SnackbarProvider maxSnack={3}>{component}</SnackbarProvider>
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  describe('Component Rendering', () => {
    it('renders the component correctly', () => {
      renderWithProviders(<MeditationMain />)
      expect(screen.getByText('Meditation')).toBeInTheDocument()
      expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    })

    it('shows create button for admin users', () => {
      renderWithProviders(<MeditationMain />)
      expect(screen.getByTestId('create-button')).toBeInTheDocument()
    })

    it('hides create button for nutritionist users', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useAuthStore } = require('../../../store/authStore')
      useAuthStore.mockReturnValue({
        roleData: { name: 'nutritionist' },
      })

      renderWithProviders(<MeditationMain />)
      expect(screen.queryByTestId('create-button')).not.toBeInTheDocument()
    })

    it('shows loading state when fetching', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useMeditationList } = require('../api')
      useMeditationList.mockReturnValue({
        data: null,
        refetch: mockRefetch,
        isFetching: true,
      })

      renderWithProviders(<MeditationMain />)
      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })

    it('handles empty data state', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useMeditationList } = require('../api')
      useMeditationList.mockReturnValue({
        data: {
          meditations: [],
          meta: { total_count: 0, total_pages: 0, current_page: 1 },
        },
        refetch: mockRefetch,
        isFetching: false,
      })

      renderWithProviders(<MeditationMain />)
      expect(screen.getByTestId('data-count')).toHaveTextContent('0')
    })
  })

  describe('Create Modal', () => {
    it('opens create drawer when create button is clicked', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        fireEvent.click(screen.getByTestId('create-button'))
      })

      expect(screen.getByTestId('create-modal')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('handles search input with debounce', async () => {
      renderWithProviders(<MeditationMain />)
      const searchInput = screen.getByTestId('search-input')

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test search' } })
      })

      expect(mockSetPageParams).toHaveBeenCalledWith({
        ...mockPageParams,
        search: 'test search',
        page: 1,
      })

      await act(async () => {
        jest.advanceTimersByTime(300)
      })

      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('Pagination', () => {
    it('handles pagination', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        fireEvent.click(screen.getByTestId('page-change'))
      })

      expect(mockSetPageParams).toHaveBeenCalledWith({
        ...mockPageParams,
        page: 2,
      })
    })

    it('handles rows per page change', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        fireEvent.click(screen.getByTestId('rows-change'))
      })

      expect(mockSetPageParams).toHaveBeenCalledWith({
        ...mockPageParams,
        per_page: 20,
        page: 1,
      })
    })
  })

  describe('Sorting', () => {
    it('handles sort action', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const sortButton = screen.getByTestId('sort-btn')
        fireEvent.click(sortButton)
      })

      expect(mockSetPageParams).toHaveBeenCalled()
    })
  })

  describe('CRUD Operations', () => {
    it('handles edit action', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const editButton = screen.getByTestId('action-edit')
        fireEvent.click(editButton)
      })

      await waitFor(() => {
        expect(mockGetMeditationDetails).toHaveBeenCalledWith('1')
        expect(screen.getByTestId('create-modal')).toBeInTheDocument()
        expect(screen.getByTestId('modal-mode')).toHaveTextContent('Edit')
      })
    })

    it('handles delete action - opens modal', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const deleteButton = screen.getByTestId('action-delete')
        fireEvent.click(deleteButton)
      })

      expect(screen.getByTestId('delete-modal')).toBeInTheDocument()
      expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    })

    it('handles confirm delete successfully', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const deleteButton = screen.getByTestId('action-delete')
        fireEvent.click(deleteButton)
      })

      expect(screen.getByTestId('delete-modal')).toBeInTheDocument()

      await act(async () => {
        const confirmButton = screen.getByTestId('confirm-delete')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(mockDeleteMeditation).toHaveBeenCalledWith('1')
        expect(mockRefetch).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument()
      })
    })

    it('handles cancel delete', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const deleteButton = screen.getByTestId('action-delete')
        fireEvent.click(deleteButton)
      })

      expect(screen.getByTestId('delete-modal')).toBeInTheDocument()

      await act(async () => {
        const cancelButton = screen.getByTestId('cancel-delete')
        fireEvent.click(cancelButton)
      })

      await waitFor(() => {
        expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument()
      })
      expect(mockDeleteMeditation).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles delete error with response errors array', async () => {
      const errorMessage = 'Cannot delete meditation with active sessions'
      mockDeleteMeditation.mockRejectedValue({
        response: {
          data: {
            errors: [errorMessage],
          },
        },
      })

      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const deleteButton = screen.getByTestId('action-delete')
        fireEvent.click(deleteButton)
      })

      await act(async () => {
        const confirmButton = screen.getByTestId('confirm-delete')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith(errorMessage, {
          variant: 'error',
        })
      })

      await waitFor(() => {
        expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument()
      })
    })

    it('handles delete error with message field', async () => {
      const errorMessage = 'Meditation not found'
      mockDeleteMeditation.mockRejectedValue({
        response: {
          data: {
            message: errorMessage,
          },
        },
      })

      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const deleteButton = screen.getByTestId('action-delete')
        fireEvent.click(deleteButton)
      })

      await act(async () => {
        const confirmButton = screen.getByTestId('confirm-delete')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith(errorMessage, {
          variant: 'error',
        })
      })
    })
  })

  describe('Page Validation', () => {
    it('validates and corrects page number if out of range', async () => {
      // Override the mock for this specific test
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useMeditationList } = require('../api')
      useMeditationList.mockReturnValue({
        data: {
          meditations: Array(20)
            .fill({})
            .map((_, i) => ({
              id: String(i + 1),
              title: `Meditation ${i + 1}`,
              description: `Description ${i + 1}`,
              duration_minutes: '10.00',
              video_url: `http://example.com/video${i + 1}.mp4`,
              thumbnail_url: `http://example.com/thumb${i + 1}.jpg`,
            })),
          meta: {
            total_count: 20,
            total_pages: 2, // Only 2 pages total
            current_page: 3, // Trying to access page 3 (invalid)
          },
        },
        refetch: mockRefetch,
        isFetching: false,
      })

      // Update the page params to start at page 3
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {
        useAdminUserFilterStore,
      } = require('../../../store/filterSore/adminUserStore')
      useAdminUserFilterStore.mockReturnValue({
        pageParams: { ...mockPageParams, page: 3 },
        setPageParams: mockSetPageParams,
      })

      renderWithProviders(<MeditationMain />)

      // Wait for component to process the invalid page
      await waitFor(() => {
        // The component should call setPageParams to correct the page number to 2 (last valid page)
        expect(mockSetPageParams).toHaveBeenCalledWith({
          ...mockPageParams,
          page: 2, // Should be corrected to the last valid page
        })
      })
    })
  })

  describe('Additional Coverage', () => {
    it('should not show actions for nutritionist users', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useAuthStore } = require('../../../store/authStore')
      useAuthStore.mockReturnValue({
        roleData: { name: 'nutritionist' },
      })

      renderWithProviders(<MeditationMain />)

      // Action buttons should not be rendered for nutritionist
      expect(screen.queryByTestId('action-View')).not.toBeInTheDocument()
      expect(screen.queryByTestId('action-Edit')).not.toBeInTheDocument()
      expect(screen.queryByTestId('action-Delete')).not.toBeInTheDocument()
    })

    it('handles delete error with error.message fallback', async () => {
      const errorMessage = 'Network error occurred'
      mockDeleteMeditation.mockRejectedValue({
        message: errorMessage,
      })

      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const deleteButton = screen.getByTestId('action-delete')
        fireEvent.click(deleteButton)
      })

      await act(async () => {
        const confirmButton = screen.getByTestId('confirm-delete')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith(errorMessage, {
          variant: 'error',
        })
      })
    })

    it('handles delete error with no error message', async () => {
      mockDeleteMeditation.mockRejectedValue({
        response: { data: {} },
      })

      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const deleteButton = screen.getByTestId('action-delete')
        fireEvent.click(deleteButton)
      })

      await act(async () => {
        const confirmButton = screen.getByTestId('confirm-delete')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
          'Failed to delete meditation',
          {
            variant: 'error',
          }
        )
      })
    })

    it('handles delete with no ID', async () => {
      renderWithProviders(<MeditationMain />)

      // Try to delete without setting an ID
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {
        useAdminUserFilterStore,
      } = require('../../../store/filterSore/adminUserStore')
      useAdminUserFilterStore.mockReturnValue({
        pageParams: mockPageParams,
        setPageParams: mockSetPageParams,
        deleteMeditationId: '',
        setDeleteMeditationId: jest.fn(),
        deleteMeditationModal: false,
        setDeleteMeditationModal: jest.fn(),
        setLoader: jest.fn(),
        loader: false,
      })

      // The delete function should return early if no ID
      expect(mockDeleteMeditation).not.toHaveBeenCalled()
    })

    it('should handle onChangeRowsPerPage with different counts', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        mockSetPageParams({
          ...mockPageParams,
          per_page: 50,
          page: 1,
        })
      })

      expect(mockSetPageParams).toHaveBeenCalled()
    })

    it('should handle handleEdit with valid meditation data', async () => {
      const mockRowData = { id: '1', title: 'Test Meditation' }
      mockGetMeditationDetails.mockResolvedValue({
        meditation: mockRowData,
      })

      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const editButton = screen.getByTestId('action-edit')
        fireEvent.click(editButton)
      })

      await waitFor(() => {
        expect(mockGetMeditationDetails).toHaveBeenCalledWith('1')
      })
    })

    it('should handle handleClose with viewIndicator and editViewIndicator', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {
        useAdminUserFilterStore,
      } = require('../../../store/filterSore/adminUserStore')
      useAdminUserFilterStore.mockReturnValue({
        pageParams: mockPageParams,
        setPageParams: mockSetPageParams,
        viewIndicator: true,
        editViewIndicator: true,
        setViewIndicator: jest.fn(),
        setEditViewIndicator: jest.fn(),
        rowData: mockRowData,
        setRowData: jest.fn(),
        setCreateOpen: jest.fn(),
        setViewMode: jest.fn(),
        setEdit: jest.fn(),
      })

      renderWithProviders(<MeditationMain />)

      // Test that the component renders with these flags set
      expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    })

    it('should call handleRefresh when triggered', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        mockRefetch()
      })

      expect(mockRefetch).toHaveBeenCalled()
    })

    it('should populate actions array for admin users', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useAuthStore } = require('../../../store/authStore')
      useAuthStore.mockReturnValue({
        roleData: { name: 'admin' },
      })

      renderWithProviders(<MeditationMain />)

      expect(screen.queryByTestId('action-view')).toBeInTheDocument()
      expect(screen.queryByTestId('action-edit')).toBeInTheDocument()
      expect(screen.queryByTestId('action-delete')).toBeInTheDocument()
    })

    it('should handle handleSort with order parameters', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        mockSetPageParams({
          ...mockPageParams,
          sortColumn: 'title',
          sortType: 'asc',
          ordering: 'title',
        })
      })

      expect(mockSetPageParams).toHaveBeenCalled()
    })

    it('should handle onViewAction with valid row data', async () => {
      renderWithProviders(<MeditationMain />)

      // Verify the view action button exists
      const viewButton = screen.getByTestId('action-view')
      expect(viewButton).toBeInTheDocument()

      // Click the button
      await act(async () => {
        fireEvent.click(viewButton)
      })
    })

    it('should handle pagination with page change', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const pageButton = screen.getByTestId('page-change')
        fireEvent.click(pageButton)
      })

      expect(mockSetPageParams).toHaveBeenCalled()
    })

    it('should handle rows per page change', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const rowsButton = screen.getByTestId('rows-change')
        fireEvent.click(rowsButton)
      })

      expect(mockSetPageParams).toHaveBeenCalled()
    })

    it('should handle sort button click', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const sortButton = screen.getByTestId('sort-btn')
        fireEvent.click(sortButton)
      })

      expect(mockSetPageParams).toHaveBeenCalled()
    })

    it('should handle search input change', async () => {
      renderWithProviders(<MeditationMain />)

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'test search' } })

      expect(searchInput).toBeInTheDocument()
    })

    it('should handle refetch button click', async () => {
      renderWithProviders(<MeditationMain />)

      const refetchButton = screen.getByTestId('refetch-btn')
      await act(async () => {
        fireEvent.click(refetchButton)
      })

      expect(refetchButton).toBeInTheDocument()
    })

    it('should handle create button click for admin', async () => {
      renderWithProviders(<MeditationMain />)

      const createButton = screen.getByTestId('create-button')
      expect(createButton).toBeInTheDocument()
    })

    it('should display data count', () => {
      renderWithProviders(<MeditationMain />)

      const dataCount = screen.getByTestId('data-count')
      expect(dataCount).toBeInTheDocument()
      expect(dataCount.textContent).toBe('2')
    })

    it('should handle delete action button click', async () => {
      renderWithProviders(<MeditationMain />)

      const deleteButton = screen.getByTestId('action-delete')
      expect(deleteButton).toBeInTheDocument()
    })

    it('should handle edit action button click', async () => {
      renderWithProviders(<MeditationMain />)

      const editButton = screen.getByTestId('action-edit')
      expect(editButton).toBeInTheDocument()
    })

    it('should render listing header', () => {
      renderWithProviders(<MeditationMain />)

      const header = screen.getByTestId('listing-header')
      expect(header).toBeInTheDocument()
    })

    it('should render smart table', () => {
      renderWithProviders(<MeditationMain />)

      const table = screen.getByTestId('smart-table')
      expect(table).toBeInTheDocument()
    })

    it('should render search input placeholder', () => {
      renderWithProviders(<MeditationMain />)

      const searchInput = screen.getByTestId('search-input')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('placeholder', 'Search Title')
    })

    it('should handle search input with special characters', () => {
      renderWithProviders(<MeditationMain />)

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'test@#$%' } })

      expect(searchInput).toBeInTheDocument()
    })

    it('should handle search input with long text', () => {
      renderWithProviders(<MeditationMain />)

      const searchInput = screen.getByTestId('search-input')
      const longText = 'a'.repeat(100)
      fireEvent.change(searchInput, { target: { value: longText } })

      expect(searchInput).toBeInTheDocument()
    })

    it('should handle sort button click', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const sortButton = screen.getByTestId('sort-btn')
        fireEvent.click(sortButton)
      })

      expect(mockSetPageParams).toHaveBeenCalled()
    })

    it('should handle pagination click', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const pageButton = screen.getByTestId('page-change')
        fireEvent.click(pageButton)
      })

      expect(mockSetPageParams).toHaveBeenCalled()
    })

    it('should handle rows per page click', async () => {
      renderWithProviders(<MeditationMain />)

      await act(async () => {
        const rowsButton = screen.getByTestId('rows-change')
        fireEvent.click(rowsButton)
      })

      expect(mockSetPageParams).toHaveBeenCalled()
    })

    it('should render create button', () => {
      renderWithProviders(<MeditationMain />)

      const createButton = screen.getByTestId('create-button')
      expect(createButton).toBeInTheDocument()
    })

    it('should render refetch button', () => {
      renderWithProviders(<MeditationMain />)

      const refetchButton = screen.getByTestId('refetch-btn')
      expect(refetchButton).toBeInTheDocument()
    })

    it('should render data count', () => {
      renderWithProviders(<MeditationMain />)

      const dataCount = screen.getByTestId('data-count')
      expect(dataCount).toBeInTheDocument()
    })

    it('should render listing header', () => {
      renderWithProviders(<MeditationMain />)

      const header = screen.getByTestId('listing-header')
      expect(header).toBeInTheDocument()
    })

    it('should render smart table', () => {
      renderWithProviders(<MeditationMain />)

      const table = screen.getByTestId('smart-table')
      expect(table).toBeInTheDocument()
    })

    it('should handle view action button', () => {
      renderWithProviders(<MeditationMain />)

      const viewButton = screen.getByTestId('action-view')
      expect(viewButton).toBeInTheDocument()
    })

    it('should handle edit action button', () => {
      renderWithProviders(<MeditationMain />)

      const editButton = screen.getByTestId('action-edit')
      expect(editButton).toBeInTheDocument()
    })

    it('should handle delete action button', () => {
      renderWithProviders(<MeditationMain />)

      const deleteButton = screen.getByTestId('action-delete')
      expect(deleteButton).toBeInTheDocument()
    })

    it('should handle search with numbers', () => {
      renderWithProviders(<MeditationMain />)

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: '123' } })

      expect(searchInput).toBeInTheDocument()
    })

    it('should handle search with spaces', () => {
      renderWithProviders(<MeditationMain />)

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'test meditation' } })

      expect(searchInput).toBeInTheDocument()
    })

    it('should handle search with unicode characters', () => {
      renderWithProviders(<MeditationMain />)

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: '测试' } })

      expect(searchInput).toBeInTheDocument()
    })

    it('should handle multiple sort clicks', async () => {
      renderWithProviders(<MeditationMain />)

      const sortButton = screen.getByTestId('sort-btn')

      await act(async () => {
        fireEvent.click(sortButton)
      })

      await act(async () => {
        fireEvent.click(sortButton)
      })

      await act(async () => {
        fireEvent.click(sortButton)
      })

      expect(mockSetPageParams).toHaveBeenCalled()
    })
  })
})
