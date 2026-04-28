import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import CategoriesMain from '../index'
import * as authStore from '../../../store/authStore'

// Mock child components that are not under test
jest.mock(
  '../../../components/common/ListingTiles',
  () =>
    function ListingHeaderMock(props: any) {
      return (
        <div data-testid="listing-header-mock">
          <span>{props.data?.title}</span>
          {props.onActionClick && (
            <button onClick={props.onActionClick}>Create Category</button>
          )}
        </div>
      )
    }
)

jest.mock(
  '../../../components/common/table/SmartTable',
  () =>
    function SmartTableMock(props: any) {
      return (
        <div data-testid="smart-table-mock">
          <div>rows: {props.data?.length ?? 0}</div>
          {props.search && (
            <input
              aria-label="search-input"
              value={props.searchValue || ''}
              onChange={(e) => props.onSearchChange?.(e.target.value)}
            />
          )}
          {props.pagination && (
            <>
              <button
                data-testid="page-button"
                onClick={() => props.paginationProps?.onPagination?.(2)}
              >
                Go to page 2
              </button>
              <select
                aria-label="rows-per-page"
                value={props.paginationProps?.rowsPerPage}
                onChange={(e) =>
                  props.paginationProps?.onRowsPerPage?.(e.target.value)
                }
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
              </select>
            </>
          )}
          {props.actionProps && props.actionProps.length > 0 && (
            <div>
              {props.actionProps.map((action: any, index: number) => (
                <button
                  key={index}
                  data-testid={`action-${action.title}`}
                  onClick={() =>
                    action.action({ id: 1, name: 'Test Category' })
                  }
                >
                  {action.title}
                </button>
              ))}
            </div>
          )}
          {props.handleColumnSort && (
            <button
              data-testid="sort-button"
              onClick={() => props.handleColumnSort('name', 'asc')}
            >
              Sort
            </button>
          )}
        </div>
      )
    }
)

jest.mock(
  '../../../components/app/alertBox/infoBox',
  () =>
    function InfoBoxMock({ content }: { content: string }) {
      return <div data-testid="info-box-mock">{content}</div>
    }
)

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: jest.fn() }),
}))

// Mock stores and hooks
const mockSetPageParams = jest.fn()
let mockPageParams = {
  page: 1,
  per_page: 10,
  search: '',
  ordering: undefined,
  filters: {},
  sortColumn: undefined,
  sortType: undefined,
}

jest.mock('../../../store/filterSore/adminUserStore', () => ({
  useAdminUserFilterStore: () => ({
    pageParams: mockPageParams,
    setPageParams: mockSetPageParams,
  }),
}))

const mockUseCategoriesList = jest.fn()
const mockGetCategoriesDetails = jest.fn()
const mockDeleteCategories = jest.fn()

jest.mock('../api', () => ({
  __esModule: true,
  DISABLE_NONLOGIN_APIS: false,
  useCategoriesList: (...args: any[]) => mockUseCategoriesList(...args),
  getCategoriesDetails: (...args: any[]) => mockGetCategoriesDetails(...args),
  deleteCategories: (...args: any[]) => mockDeleteCategories(...args),
}))

jest.mock('../columns', () => ({
  getColumns: () => [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'actions', title: 'Actions' },
  ],
}))

jest.mock(
  '../create',
  () =>
    function CreateAdminMock(props: any) {
      // Only render if isDrawerOpen is true
      if (!props.isDrawerOpen) return null

      return (
        <div data-testid="create-admin-mock">
          <button data-testid="close-modal" onClick={props.handleClose}>
            Close
          </button>
          <button data-testid="refresh-data" onClick={props.handleRefresh}>
            Refresh
          </button>
        </div>
      )
    }
)

jest.mock('../../../layout/store', () => ({
  checkPermissions: () => true,
}))

jest.mock(
  '../../../components/common/modal/ConfirmDeleteModal',
  () =>
    function ConfirmDeleteModalMock(props: any) {
      if (!props.isOpen) return null
      return (
        <div data-testid="confirm-delete-modal-mock">
          <button onClick={props.onConfirm} data-testid="confirm-delete">
            Confirm Delete
          </button>
          <button onClick={props.onClose} data-testid="cancel-delete">
            Close
          </button>
        </div>
      )
    }
)

// Mock useAuthStore with a default admin role
jest.mock('../../../store/authStore', () => ({
  useAuthStore: jest.fn((selector) =>
    selector({ roleData: { name: 'admin' } })
  ),
}))

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('CategoriesMain', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSetPageParams.mockClear()

    // Reset mock page params
    mockPageParams = {
      page: 1,
      per_page: 10,
      search: '',
      ordering: undefined,
      filters: {},
      sortColumn: undefined,
      sortType: undefined,
    }

    // Default mock return
    mockUseCategoriesList.mockReturnValue({
      data: {
        categories: [
          { id: 1, name: 'Category 1' },
          { id: 2, name: 'Category 2' },
        ],
        meta: { total_pages: 1, total_count: 2, current_page: 1 },
      },
      refetch: jest.fn(),
      isFetching: false,
    })

    mockGetCategoriesDetails.mockResolvedValue({
      category: { id: 1, name: 'Test Category' },
    })

    mockDeleteCategories.mockResolvedValue({})
  })

  test('renders workout categories table with data', async () => {
    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('listing-header-mock')).toBeInTheDocument()
    })

    expect(screen.getByText('Workout Categories')).toBeInTheDocument()
    expect(screen.getByTestId('smart-table-mock')).toBeInTheDocument()
    expect(screen.getByText(/rows: 2/i)).toBeInTheDocument()
  })

  test('allows searching and updates search value', async () => {
    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByLabelText('search-input')).toBeInTheDocument()
    })

    const searchInput = screen.getByLabelText('search-input')

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'abs' } })
    })

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'abs',
        page: 1,
      })
    )
  })

  test('opens create modal when Create Category button is clicked', async () => {
    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByText('Create Category')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Create Category')

    await act(async () => {
      fireEvent.click(createButton)
    })

    expect(screen.getByTestId('create-admin-mock')).toBeInTheDocument()
  })

  test('handles edit action correctly', async () => {
    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('action-Edit')).toBeInTheDocument()
    })

    const editButton = screen.getByTestId('action-Edit')

    await act(async () => {
      fireEvent.click(editButton)
    })

    await waitFor(() => {
      expect(mockGetCategoriesDetails).toHaveBeenCalledWith('1')
      expect(screen.getByTestId('create-admin-mock')).toBeInTheDocument()
    })
  })

  test('handles delete confirmation and deletion', async () => {
    const mockRefetch = jest.fn()
    mockUseCategoriesList.mockReturnValue({
      data: {
        categories: [{ id: 1, name: 'Category 1' }],
        meta: { total_pages: 1, total_count: 1, current_page: 1 },
      },
      refetch: mockRefetch,
      isFetching: false,
    })

    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('action-Delete')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTestId('action-Delete')

    await act(async () => {
      fireEvent.click(deleteButton)
    })

    await waitFor(() => {
      expect(
        screen.getByTestId('confirm-delete-modal-mock')
      ).toBeInTheDocument()
    })

    const confirmButton = screen.getByTestId('confirm-delete')

    await act(async () => {
      fireEvent.click(confirmButton)
    })

    await waitFor(() => {
      expect(mockDeleteCategories).toHaveBeenCalledWith('1')
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  test('handles delete error gracefully', async () => {
    mockDeleteCategories.mockRejectedValue({
      response: { data: { message: 'Delete failed' } },
    })

    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('action-Delete')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTestId('action-Delete')

    await act(async () => {
      fireEvent.click(deleteButton)
    })

    await waitFor(() => {
      expect(
        screen.getByTestId('confirm-delete-modal-mock')
      ).toBeInTheDocument()
    })

    const confirmButton = screen.getByTestId('confirm-delete')

    await act(async () => {
      fireEvent.click(confirmButton)
    })

    await waitFor(() => {
      expect(mockDeleteCategories).toHaveBeenCalled()
    })
  })

  test('handles view action correctly', async () => {
    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('action-View')).toBeInTheDocument()
    })

    const viewButton = screen.getByTestId('action-View')

    await act(async () => {
      fireEvent.click(viewButton)
    })

    expect(viewButton).toBeInTheDocument()
  })

  test('handles pagination changes', async () => {
    mockUseCategoriesList.mockReturnValue({
      data: {
        categories: [{ id: 1, name: 'Category 1' }],
        meta: { total_pages: 3, total_count: 25, current_page: 1 },
      },
      refetch: jest.fn(),
      isFetching: false,
    })

    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('page-button')).toBeInTheDocument()
    })

    const pageButton = screen.getByTestId('page-button')

    await act(async () => {
      fireEvent.click(pageButton)
    })

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
      })
    )
  })

  test('handles rows per page change', async () => {
    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByLabelText('rows-per-page')).toBeInTheDocument()
    })

    const rowsPerPageSelect = screen.getByLabelText('rows-per-page')

    await act(async () => {
      fireEvent.change(rowsPerPageSelect, { target: { value: '20' } })
    })

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        per_page: 20,
        page: 1,
      })
    )
  })

  test('handles sorting functionality', async () => {
    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('sort-button')).toBeInTheDocument()
    })

    const sortButton = screen.getByTestId('sort-button')

    await act(async () => {
      fireEvent.click(sortButton)
    })

    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({
        sortColumn: 'name',
        sortType: 'asc',
      })
    )
  })

  test('handles loading state', async () => {
    mockUseCategoriesList.mockReturnValue({
      data: {
        categories: [],
        meta: { total_pages: 0, total_count: 0, current_page: 1 },
      },
      refetch: jest.fn(),
      isFetching: true,
    })

    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    expect(screen.getByTestId('smart-table-mock')).toBeInTheDocument()
  })

  test('handles empty data state', async () => {
    mockUseCategoriesList.mockReturnValue({
      data: {
        categories: [],
        meta: { total_pages: 0, total_count: 0, current_page: 1 },
      },
      refetch: jest.fn(),
      isFetching: false,
    })

    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByText(/rows: 0/i)).toBeInTheDocument()
    })
  })

  test('handles nutritionist role restrictions', async () => {
    ;(authStore.useAuthStore as any).mockImplementation((selector: any) =>
      selector({ roleData: { name: 'nutritionist' } })
    )

    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('listing-header-mock')).toBeInTheDocument()
    })

    expect(screen.queryByText('Create Category')).not.toBeInTheDocument()
  })

  test('closes modal and cleans up', async () => {
    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByText('Create Category')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Create Category')

    await act(async () => {
      fireEvent.click(createButton)
    })

    expect(screen.getByTestId('create-admin-mock')).toBeInTheDocument()

    const closeButton = screen.getByTestId('close-modal')

    await act(async () => {
      fireEvent.click(closeButton)
    })

    // Wait for the modal to close and DOM to update
    await waitFor(
      () => {
        expect(
          screen.queryByTestId('create-admin-mock')
        ).not.toBeInTheDocument()
      },
      { timeout: 2000 }
    )
  })

  test('handles refresh functionality', async () => {
    const mockRefetch = jest.fn()
    mockUseCategoriesList.mockReturnValue({
      data: {
        categories: [{ id: 1, name: 'Category 1' }],
        meta: { total_pages: 1, total_count: 1, current_page: 1 },
      },
      refetch: mockRefetch,
      isFetching: false,
    })

    await act(async () => {
      renderWithRouter(<CategoriesMain />)
    })

    await waitFor(() => {
      expect(screen.getByText('Create Category')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Create Category')

    await act(async () => {
      fireEvent.click(createButton)
    })

    const refreshButton = screen.getByTestId('refresh-data')

    await act(async () => {
      fireEvent.click(refreshButton)
    })

    expect(mockRefetch).toHaveBeenCalled()
  })
})
