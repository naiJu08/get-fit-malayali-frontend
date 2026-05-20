import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import MealTimingMain from '../index'
import { useAdminUserFilterStore } from '../../../store/filterSore/adminUserStore'

// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../columns', () => ({
  getColumns: jest.fn(() => [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'time', title: 'Time', sortable: true },
  ]),
}))

const mockRefetch = jest.fn()
const mockDeleteMealTiming = jest.fn()

// Create a mutable mock that can be updated
let mockIsFetching = false
let mockMealTimingsData: any = {
  meal_timings: [{ id: '1', name: 'Breakfast', time: '08:00 AM', status: 'active' }],
  meta: { total_count: 1, current_page: 1, total_pages: 1 },
}

jest.mock('../api', () => ({
  useMealTimingList: () => ({
    data: mockMealTimingsData,
    refetch: mockRefetch,
    isFetching: mockIsFetching,
  }),
  deleteMealTiming: (...args: any[]) => mockDeleteMealTiming(...args),
}))

// Mock auth store with a default value
const mockUseAuthStore = jest.fn(() => ({ roleData: { name: 'admin' } }))
jest.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: any) => {
    const state = mockUseAuthStore()
    return selector ? selector(state) : state
  },
}))

const mockSetPageParams = jest.fn()
jest.mock('../../../store/filterSore/adminUserStore', () => ({
  useAdminUserFilterStore: jest.fn(),
}))

// Mock checkPermissions
// const mockCheckPermissions = jest.fn(() => true)
// jest.mock('../../../layout/store', () => ({
//   checkPermissions: (permission: string, action: string) => mockCheckPermissions(permission, action),
// }))
// Fix: Define mockCheckPermissions to accept two arguments
const mockCheckPermissions = jest.fn((permission: string, action: string) => true)
jest.mock('../../../layout/store', () => ({
  checkPermissions: (permission: string, action: string) => mockCheckPermissions(permission, action),
}))
jest.mock('../../../utilities/calcHeight', () => ({
  calcWindowHeight: jest.fn(() => 600),
}))

jest.mock('../../../utilities/parsers', () => ({
  getSortedColumnName: jest.fn((c: string, d: string) => `${c}_${d}`),
}))

jest.mock('../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  ),
}))

// Simplified ListingHeader mock - always shows the button
jest.mock('../../../components/common/ListingTiles', () => {
  return function MockListingHeader({ data, onActionClick, actionProps }: any) {
    return (
      <div data-testid="listing-header">
        <h1>{data?.title}</h1>
        <button data-testid="create-button" onClick={onActionClick}>
          {actionProps?.actionTitle}
        </button>
      </div>
    )
  }
})

// Store pagination callbacks for testing
let paginationCallback: any = null
let rowsPerPageCallback: any = null

jest.mock('../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    // Store callbacks for testing
    if (props.paginationProps?.onPagination) {
      paginationCallback = props.paginationProps.onPagination
    }
    if (props.paginationProps?.onRowsPerPage) {
      rowsPerPageCallback = props.paginationProps.onRowsPerPage
    }

    return (
      <div data-testid="smart-table">
        <input
          data-testid="search-input"
          value={props.searchValue || ''}
          onChange={(e) => {
            props.onSearchChange(e.target.value)
          }}
          placeholder={props.searchPlaceholder}
        />
        <button data-testid="refetch-btn" onClick={() => props.onSearch()}>
          Refetch
        </button>
        <button
          data-testid="sort-btn"
          onClick={() => props.handleColumnSort('name', 'asc')}
        >
          Sort
        </button>
        {props.actionProps?.map((action: any, idx: number) => (
          <button
            key={idx}
            data-testid={`action-${action.title?.toLowerCase()}`}
            onClick={() => action.action({ id: '1', name: 'Breakfast' })}
          >
            {action.title}
          </button>
        ))}
        {props.isLoading && <div data-testid="loading-indicator">Loading...</div>}
        {props.data?.length === 0 && !props.isLoading && (
          <div data-testid="empty-state">{props.emptyTitle}</div>
        )}
      </div>
    )
  }
})

jest.mock('../create/index', () => {
  return function MockCreateMealTiming(props: any) {
    return (
      <div data-testid="create-modal">
        {props.isDrawerOpen && <span data-testid="create-open">Open</span>}
        {props.edit && <span data-testid="edit-mode">Edit Mode</span>}
        {props.viewMode && <span data-testid="view-mode">View Mode</span>}
      </div>
    )
  }
})

jest.mock('../../../components/common/modal/ConfirmDeleteModal', () => {
  return function MockConfirmDeleteModal(props: any) {
    if (!props.isOpen) return null
    return (
      <div data-testid="delete-modal">
        <div data-testid="delete-title">{props.title}</div>
        <div data-testid="delete-subtitle">{props.subTitle}</div>
        <button data-testid="confirm-delete" onClick={props.onConfirm}>
          {props.loading ? 'Deleting...' : props.confirmLabel || 'Confirm'}
        </button>
        <button data-testid="cancel-delete" onClick={props.onClose}>
          {props.cancelLabel || 'Cancel'}
        </button>
      </div>
    )
  }
})

const mockEnqueueSnackbar = jest.fn()
jest.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

// Suppress console.error for error tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('MealTimingMain', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    mockEnqueueSnackbar.mockClear()
    mockRefetch.mockClear()
    mockSetPageParams.mockClear()
    mockDeleteMealTiming.mockClear()
    mockNavigate.mockClear()
    paginationCallback = null
    rowsPerPageCallback = null
    mockUseAuthStore.mockReturnValue({ roleData: { name: 'admin' } })
    mockCheckPermissions.mockReturnValue(true)
    
    // Reset to default values
    mockIsFetching = false
    mockMealTimingsData = {
      meal_timings: [{ id: '1', name: 'Breakfast', time: '08:00 AM', status: 'active' }],
      meta: { total_count: 1, current_page: 1, total_pages: 1 },
    }
    
    ;(useAdminUserFilterStore as unknown as jest.Mock).mockReturnValue({
      pageParams: {
        page: 1,
        page_size: 10,
        search: '',
        ordering: '',
        sortColumn: undefined,
        sortType: undefined,
        filters: {},
      },
      setPageParams: mockSetPageParams,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const renderWithProviders = (component: React.ReactElement) =>
    render(<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{component}</BrowserRouter>)

  it('renders listing header and smart table', () => {
    renderWithProviders(<MealTimingMain />)
    expect(screen.getByTestId('listing-header')).toBeInTheDocument()
    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    expect(screen.getByText('Meal Timing')).toBeInTheDocument()
  })

  it('opens create drawer on create click', async () => {
    renderWithProviders(<MealTimingMain />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('create-button'))
    })
    expect(screen.getByTestId('create-open')).toBeInTheDocument()
  })

  it('handles sort click', async () => {
    renderWithProviders(<MealTimingMain />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('sort-btn'))
    })
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        sortColumn: 'name',
        sortType: 'asc',
      })
    )
    expect(require('../../../utilities/parsers').getSortedColumnName).toHaveBeenCalledWith('name', 'asc')
  })

  describe('Delete Functionality', () => {
    it('opens delete confirmation modal when delete action is clicked', async () => {
      renderWithProviders(<MealTimingMain />)
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('action-delete'))
      })
      
      expect(screen.getByTestId('delete-modal')).toBeInTheDocument()
      expect(screen.getByTestId('delete-title')).toHaveTextContent('Delete Meal Timing')
      expect(screen.getByTestId('delete-subtitle')).toHaveTextContent(
        'Are you sure you want to delete "Breakfast"?'
      )
    })

    it('calls delete API and shows success message when confirmed', async () => {
      renderWithProviders(<MealTimingMain />)
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('action-delete'))
      })
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm-delete'))
      })
      
      expect(mockDeleteMealTiming).toHaveBeenCalledWith('1')
      expect(mockRefetch).toHaveBeenCalled()
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Meal timing deleted successfully',
        { variant: 'success' }
      )
      expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument()
    })

    it('handles delete API error with response message', async () => {
      mockDeleteMealTiming.mockRejectedValueOnce({
        response: { data: { message: 'Failed to delete meal timing' } }
      })
      
      renderWithProviders(<MealTimingMain />)
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('action-delete'))
      })
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm-delete'))
      })
      
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Failed to delete meal timing',
        { variant: 'error' }
      )
    })

    it('handles delete API error with fallback message', async () => {
      mockDeleteMealTiming.mockRejectedValueOnce(new Error('Network error'))
      
      renderWithProviders(<MealTimingMain />)
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('action-delete'))
      })
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm-delete'))
      })
      
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Network error',
        { variant: 'error' }
      )
    })

    it('closes delete modal without deleting when cancelled', async () => {
      renderWithProviders(<MealTimingMain />)
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('action-delete'))
      })
      
      expect(screen.getByTestId('delete-modal')).toBeInTheDocument()
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-delete'))
      })
      
      expect(mockDeleteMealTiming).not.toHaveBeenCalled()
      expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('updates search value and resets to page 1 on search change', async () => {
      renderWithProviders(<MealTimingMain />)
      const searchInput = screen.getByTestId('search-input')
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'breakfast' } })
      })
      
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'breakfast',
          page: 1
        })
      )
    })

    it('debounces search refetch', async () => {
      jest.useFakeTimers()
      mockRefetch.mockClear()
      
      renderWithProviders(<MealTimingMain />)
      
      const searchInput = screen.getByTestId('search-input')
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'lunch' } })
      })
      
      const initialRefetchCalls = mockRefetch.mock.calls.length
      
      jest.advanceTimersByTime(300)
      
      expect(mockRefetch.mock.calls.length).toBeGreaterThan(initialRefetchCalls)
      jest.useRealTimers()
    })

    it('triggers refetch on manual search button click', async () => {
      mockRefetch.mockClear()
      renderWithProviders(<MealTimingMain />)
      
      mockRefetch.mockClear()
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('refetch-btn'))
      })
      
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('Pagination', () => {
    it('handles page change', async () => {
      renderWithProviders(<MealTimingMain />)
      
      await act(async () => {
        if (paginationCallback) {
          paginationCallback(2)
        }
      })
      
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      )
    })

    it('handles rows per page change and resets to page 1', async () => {
      renderWithProviders(<MealTimingMain />)
      
      await act(async () => {
        if (rowsPerPageCallback) {
          rowsPerPageCallback(20)
        }
      })
      
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({
          page_size: 20,
          page: 1
        })
      )
    })
  })

  describe('View and Edit Actions', () => {
    it('navigates to view page when view action is clicked', async () => {
      renderWithProviders(<MealTimingMain />)
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('action-view'))
      })
      
      expect(mockNavigate).toHaveBeenCalledWith('/mealtiming/1')
    })

    it('opens edit drawer when edit action is clicked', async () => {
      renderWithProviders(<MealTimingMain />)
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('action-edit'))
      })
      
      expect(screen.getByTestId('create-modal')).toBeInTheDocument()
      expect(screen.getByTestId('create-open')).toBeInTheDocument()
      expect(screen.getByTestId('edit-mode')).toBeInTheDocument()
    })
  })

  describe('Nutritionist Role Behavior', () => {
    it('hides action buttons for nutritionist role', () => {
      mockUseAuthStore.mockReturnValue({ roleData: { name: 'nutritionist' } })
      
      renderWithProviders(<MealTimingMain />)
      
      expect(screen.queryByTestId('action-view')).not.toBeInTheDocument()
      expect(screen.queryByTestId('action-edit')).not.toBeInTheDocument()
      expect(screen.queryByTestId('action-delete')).not.toBeInTheDocument()
    })

    it('shows action buttons for admin role', () => {
      mockUseAuthStore.mockReturnValue({ roleData: { name: 'admin' } })
      
      renderWithProviders(<MealTimingMain />)
      
      expect(screen.getByTestId('action-view')).toBeInTheDocument()
      expect(screen.getByTestId('action-edit')).toBeInTheDocument()
      expect(screen.getByTestId('action-delete')).toBeInTheDocument()
    })
  })

  describe('Empty and Loading States', () => {
    it('handles empty data state', async () => {
      // Update mock data for empty state
      mockMealTimingsData = {
        meal_timings: [],
        meta: { total_count: 0, current_page: 1, total_pages: 0 },
      }
      mockIsFetching = false
      
      // Re-render with new data
      const { rerender } = renderWithProviders(<MealTimingMain />)
      
      // Wait for component to update
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      })
    })

    it('shows loading state when fetching data', async () => {
      // Update mock for loading state
      mockIsFetching = true
      mockMealTimingsData = null
      
      renderWithProviders(<MealTimingMain />)
      
      // Loading indicator should be visible
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })
  })

  describe('Auto-pagination Correction', () => {
    it('adjusts to last page when current page exceeds total pages', async () => {
      ;(useAdminUserFilterStore as unknown as jest.Mock).mockReturnValue({
        pageParams: {
          page: 5,
          page_size: 10,
          search: '',
          ordering: '',
          sortColumn: undefined,
          sortType: undefined,
          filters: {},
        },
        setPageParams: mockSetPageParams,
      })
      
      renderWithProviders(<MealTimingMain />)
      
      await waitFor(() => {
        expect(mockSetPageParams).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1 })
        )
      })
    })
  })

  describe('Filter Handling', () => {
    it('handles filters correctly in API call', async () => {
      ;(useAdminUserFilterStore as unknown as jest.Mock).mockReturnValue({
        pageParams: {
          page: 1,
          page_size: 10,
          search: '',
          ordering: '',
          sortColumn: undefined,
          sortType: undefined,
          filters: { category: 'morning' },
        },
        setPageParams: mockSetPageParams,
      })
      
      renderWithProviders(<MealTimingMain />)
      
      expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    })
  })
})