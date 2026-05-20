import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'
import { BrowserRouter } from 'react-router-dom'

const mockEnqueueSnackbar = jest.fn()
jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/workout',
    search: '',
    hash: '',
    state: null,
  }),
  useParams: () => ({}),
}))

const mockRefetch = jest.fn()
const mockGetWorkoutDetails = jest.fn()
const mockDeleteWorkout = jest.fn()

const mockRowData = {
  id: '1',
  name: 'Test Workout',
  description: 'Test Description',
  duration_minutes: 30,
}

const mockUseWorkoutList = jest.fn()
jest.mock('../api', () => ({
  getWorkoutDetails: (...args: any[]) => mockGetWorkoutDetails(...args),
  useWorkoutList: (...args: any[]) => mockUseWorkoutList(...args),
  deleteWorkout: (...args: any[]) => mockDeleteWorkout(...args),
  DISABLE_NONLOGIN_APIS: false,
}))

jest.mock('../../../apis/api.helpers', () => ({
  getData: jest.fn(() =>
    Promise.resolve({
      categories: [
        {
          id: 1,
          name: 'strength',
          subcategories: [{ id: 2, name: 'Push' }],
        },
      ],
    })
  ),
}))

jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    CATEGORIES: '/categories',
  },
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      categories: [
        {
          id: 1,
          name: 'strength',
          subcategories: [{ id: 2, name: 'Push' }],
        },
      ],
    },
    isLoading: false,
  }),
}))

const mockSetPageParams = jest.fn()
let mockPageParams: any = {
  page: 1,
  per_page: 10,
  search: '',
  ordering: '',
  filters: {},
}

jest.mock('../../../store/filterSore/adminUserStore', () => ({
  useAdminUserFilterStore: () => ({
    pageParams: mockPageParams,
    setPageParams: mockSetPageParams,
  }),
}))

let mockRoleData: any = { name: 'admin' }
jest.mock('../../../store/authStore', () => ({
  useAuthStore: (selector?: any) => {
    const store = { roleData: mockRoleData }
    return selector ? selector(store) : store
  },
}))

jest.mock('../columns', () => ({
  getColumns: ({ onNameClick }: any) => [
    {
      title: 'Name',
      field: 'name',
      sortable: true,
      resizable: true,
      isVisible: true,
      rowClick: onNameClick,
    },
  ],
}))

let capturedProps: any = {}
jest.mock('../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    capturedProps = props
    return (
      <div data-testid="smart-table">
        <input
          data-testid="search-input"
          placeholder={props.searchPlaceholder || ''}
          value={props.searchValue || ''}
          onChange={(event) => props.onSearchChange?.(event.target.value)}
          readOnly={false}
        />
        <button data-testid="search-button" onClick={props.onSearch}>
          Search
        </button>
        {props.toolbarExtra ? (
          <div data-testid="toolbar-extra">{props.toolbarExtra}</div>
        ) : null}
        <div data-testid="table-data">
          {props.emptyTitle && props.data?.length === 0
            ? props.emptyTitle
            : `${props.data?.length || 0} items`}
          {props.isLoading && <span data-testid="loading-indicator" />}
        </div>
        <button
          data-testid="sort-button"
          onClick={() => props.handleColumnSort?.('name', 'asc')}
        >
          Sort
        </button>
        <button
          data-testid="page-2"
          onClick={() => props.paginationProps?.onPagination?.(2)}
        >
          Page 2
        </button>
        <button
          data-testid="rows-20"
          onClick={() => props.paginationProps?.onRowsPerPage?.(20)}
        >
          Rows 20
        </button>
        {props.actionProps?.map((action: any) => (
          <button
            key={action.title}
            data-testid={`action-${String(action.title).toLowerCase()}`}
            onClick={() => action.action?.({ id: '1', name: 'Test Workout' })}
          >
            {action.title}
          </button>
        ))}
      </div>
    )
  }
})

jest.mock('../../../components/common/ListingTiles', () => {
  return function MockListingTiles({ onActionClick, actionProps }: any) {
    return (
      <div data-testid="listing-header">
        {actionProps ? (
          <button data-testid="create-button" onClick={onActionClick}>
            {actionProps.actionTitle}
          </button>
        ) : null}
      </div>
    )
  }
})

jest.mock('../../../components/common/modal/ConfirmDeleteModal', () => {
  return function MockConfirmDeleteModal({
    isOpen,
    onConfirm,
    onClose,
    confirmLabel,
  }: any) {
    if (!isOpen) return null
    return (
      <div data-testid="delete-modal">
        <button data-testid="confirm-delete" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button data-testid="cancel-delete" onClick={onClose}>
          Cancel
        </button>
      </div>
    )
  }
})

jest.mock('../create', () => {
  return function MockCreateWorkout({
    isDrawerOpen,
    handleClose,
    handleRefresh,
    edit,
  }: any) {
    if (!isDrawerOpen) return null
    return (
      <div data-testid="create-workout">
        <span>{edit ? 'Edit' : 'Create'}</span>
        <button data-testid="close-create" onClick={handleClose} />
        <button data-testid="refresh-after-create" onClick={handleRefresh} />
      </div>
    )
  }
})

jest.mock('../../../layout/store', () => ({
  checkPermissions: () => true,
}))

jest.mock('../../../utilities/calcHeight', () => ({
  calcWindowHeight: (offset: number) => `calc(100vh - ${offset}px)`,
}))

jest.mock('../../../utilities/parsers', () => ({
  getSortedColumnName: (column: string, direction: string) =>
    `${column}_${direction}`,
}))

jest.mock('../../../utilities/validation', () => ({
  handleReturnEmptyMsg: () => 'No results found',
}))

jest.mock('../../../components/common/icons', () => {
  return function MockIcons({ name }: any) {
    return <span data-testid={`icon-${name}`}>{name}</span>
  }
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('WorkoutMain Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRoleData = { name: 'admin' }
    mockPageParams = {
      page: 1,
      per_page: 10,
      search: '',
      ordering: '',
      filters: {},
    }
    mockRefetch.mockResolvedValue([])
    mockGetWorkoutDetails.mockResolvedValue({ workout: mockRowData })
    mockDeleteWorkout.mockResolvedValue({})
    mockUseWorkoutList.mockReturnValue({
      data: {
        workouts: [mockRowData],
        meta: {
          total_count: 1,
          current_page: 1,
          per_page: 10,
          total_pages: 1,
        },
      },
      refetch: mockRefetch,
      isFetching: false,
    })
  })

  const renderComponent = async () => {
    const WorkoutMain = require('../index').default
    await act(async () => {
      render(
        <TestWrapper>
          <WorkoutMain />
        </TestWrapper>
      )
    })
  }

  it('renders workout listing and table', async () => {
    await renderComponent()

    expect(screen.getByTestId('listing-header')).toBeInTheDocument()
    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    expect(screen.getByTestId('create-button')).toHaveTextContent(
      'Create Workout'
    )
  })

  it('opens and closes create drawer', async () => {
    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('create-button'))
    })

    expect(screen.getByTestId('create-workout')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByTestId('close-create'))
    })

    expect(screen.queryByTestId('create-workout')).not.toBeInTheDocument()
  })

  it('handles refresh from create drawer', async () => {
    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('create-button'))
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('refresh-after-create'))
    })

    expect(mockRefetch).toHaveBeenCalled()
  })

  it('handles search and search button', async () => {
    await renderComponent()

    await act(async () => {
      fireEvent.change(screen.getByTestId('search-input'), {
        target: { value: 'push' },
      })
    })

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'push', page: 1 })
    )

    await act(async () => {
      fireEvent.click(screen.getByTestId('search-button'))
    })

    expect(mockRefetch).toHaveBeenCalled()
  })

  it('handles pagination and rows per page', async () => {
    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('page-2'))
    })

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 })
    )

    await act(async () => {
      fireEvent.click(screen.getByTestId('rows-20'))
    })

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ per_page: 20, page: 1 })
    )
  })

  it('handles column sorting', async () => {
    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('sort-button'))
    })

    expect(mockSetPageParams).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sortColumn: 'name',
        sortType: 'asc',
        ordering: 'name_asc',
      })
    )
  })

  it('clears sorting when sort params are empty', async () => {
    await renderComponent()

    await act(async () => {
      capturedProps.handleColumnSort('', undefined)
    })

    expect(mockSetPageParams).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sortColumn: undefined,
        sortType: undefined,
        ordering: undefined,
      })
    )
  })

  it('handles edit action', async () => {
    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('action-edit'))
    })

    await waitFor(() => {
      expect(mockGetWorkoutDetails).toHaveBeenCalledWith('1')
    })
    expect(screen.getByTestId('create-workout')).toBeInTheDocument()
  })

  it('handles view action', async () => {
    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('action-view'))
    })

    expect(mockNavigate).toHaveBeenCalledWith('/workout/1')
  })

  it('navigates from generated name column callback', async () => {
    await renderComponent()

    await act(async () => {
      capturedProps.columns[0].rowClick({ id: '25' })
      capturedProps.columns[0].rowClick({})
    })

    expect(mockNavigate).toHaveBeenCalledWith('/workout/25')
    expect(mockNavigate).toHaveBeenCalledWith('/workout/undefined')
  })

  it('handles delete success and error', async () => {
    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('action-delete'))
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-delete'))
    })

    await waitFor(() => {
      expect(mockDeleteWorkout).toHaveBeenCalledWith('1')
    })
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Workout deleted successfully',
      { variant: 'success' }
    )
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows delete error snackbar', async () => {
    mockDeleteWorkout.mockRejectedValueOnce({
      response: { data: { message: 'Delete failed' } },
    })

    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('action-delete'))
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-delete'))
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Delete failed', {
        variant: 'error',
      })
    })
  })

  it('shows delete errors from errors array', async () => {
    mockDeleteWorkout.mockRejectedValueOnce({
      response: { data: { errors: ['Cannot delete workout'] } },
    })

    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('action-delete'))
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-delete'))
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Cannot delete workout',
        { variant: 'error' }
      )
    })
  })

  it('closes delete modal without confirming', async () => {
    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('action-delete'))
    })

    expect(screen.getByTestId('delete-modal')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByTestId('cancel-delete'))
    })

    expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument()
  })

  it('handles intensity, category, and subcategory filters', async () => {
    await renderComponent()

    const selects = screen.getByTestId('toolbar-extra').querySelectorAll('select')

    await act(async () => {
      fireEvent.change(selects[0], { target: { value: 'High' } })
    })

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ intensity_level: 'High' }),
        page: 1,
      })
    )

    await waitFor(() => {
      expect(selects[1].querySelector('option[value="1"]')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.change(selects[1], { target: { value: '1' } })
    })

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ category_id: 1 }),
        page: 1,
      })
    )
  })

  it('clears selected filters', async () => {
    mockPageParams = {
      ...mockPageParams,
      filters: {
        intensity_level: 'High',
        category_id: 1,
        subcategory_ids: '2',
      },
    }

    await renderComponent()

    const selects = screen.getByTestId('toolbar-extra').querySelectorAll('select')

    await act(async () => {
      fireEvent.change(selects[0], { target: { value: '' } })
    })

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.not.objectContaining({ intensity_level: 'High' }),
        page: 1,
      })
    )

    await act(async () => {
      fireEvent.change(selects[1], { target: { value: '' } })
    })

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.not.objectContaining({ category_id: 1 }),
        page: 1,
      })
    )

    await act(async () => {
      fireEvent.change(selects[2], { target: { value: '' } })
    })

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.not.objectContaining({ subcategory_ids: '2' }),
        page: 1,
      })
    )
  })

  it('normalizes invalid page numbers against total pages', async () => {
    mockPageParams = {
      ...mockPageParams,
      page: 5,
    }
    mockUseWorkoutList.mockReturnValue({
      data: {
        workouts: [mockRowData],
        meta: {
          total_count: 20,
          current_page: 5,
          per_page: 10,
          total_pages: 2,
        },
      },
      refetch: mockRefetch,
      isFetching: false,
    })

    await renderComponent()

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 })
    )
  })

  it('normalizes page numbers below one', async () => {
    mockPageParams = {
      ...mockPageParams,
      page: 0,
    }

    await renderComponent()

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    )
  })

  it('hides create and actions for nutritionist role', async () => {
    mockRoleData = { name: 'nutritionist' }

    await renderComponent()

    expect(screen.queryByTestId('create-button')).not.toBeInTheDocument()
    expect(capturedProps.actionProps).toEqual([])
  })

  it('renders empty and loading table states', async () => {
    mockUseWorkoutList.mockReturnValue({
      data: {
        workouts: [],
        meta: { total_count: 0, current_page: 1, total_pages: 1 },
      },
      refetch: mockRefetch,
      isFetching: true,
    })

    await renderComponent()

    expect(screen.getByTestId('table-data')).toHaveTextContent(
      'No records to display'
    )
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
  })

  it('removes inactive filter from workout list params', async () => {
    mockPageParams = {
      ...mockPageParams,
      filters: {
        active: false,
        intensity_level: 'Low',
      },
    }

    await renderComponent()

    expect(mockUseWorkoutList).toHaveBeenCalledWith(
      expect.not.objectContaining({ active: false })
    )
    expect(mockUseWorkoutList).toHaveBeenCalledWith(
      expect.objectContaining({ intensity_level: 'Low' })
    )
  })

  it('normalizes page below one when total pages are unavailable', async () => {
    mockPageParams = {
      ...mockPageParams,
      page: 0,
    }
    mockUseWorkoutList.mockReturnValue({
      data: {
        workouts: [mockRowData],
        meta: {},
      },
      refetch: mockRefetch,
      isFetching: false,
    })

    await renderComponent()

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    )
  })

  it('uses filter page when current page is missing from meta', async () => {
    mockPageParams = {
      ...mockPageParams,
      page: 3,
      per_page: 20,
    }
    mockUseWorkoutList.mockReturnValue({
      data: {
        workouts: [mockRowData],
        meta: {
          total_count: 42,
          total_pages: 3,
        },
      },
      refetch: mockRefetch,
      isFetching: false,
    })

    await renderComponent()

    expect(capturedProps.paginationProps.currentPage).toBe(3)
    expect(capturedProps.paginationProps.rowsPerPage).toBe(20)
  })

  it('shows delete error from generic error message', async () => {
    mockDeleteWorkout.mockRejectedValueOnce(new Error('Network down'))

    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('action-delete'))
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-delete'))
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Network down', {
        variant: 'error',
      })
    })
  })
})
