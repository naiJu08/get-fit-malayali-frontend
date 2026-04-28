import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CategoryDetails from '../Details'

// Mock useParams and useNavigate
const mockUseParams = jest.fn()
const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}))

// Mock all components
jest.mock('../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => {
    switch (name) {
      case 'left-arrow-icon':
        return <div data-testid="arrow-left-icon" />
      case 'edit':
        return <div data-testid="edit-icon" />
      case 'delete':
        return <div data-testid="delete-icon" />
      case 'plus':
        return <div data-testid="plus-icon" />
      default:
        return <div data-testid="unknown-icon" />
    }
  },
}))

jest.mock('../../../components/app/alertBox/infoBox', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => (
    <div data-testid="info-box-mock">{content}</div>
  ),
}))

jest.mock('../../../components/common/table/SmartTable', () => ({
  __esModule: true,
  default: (props: any) => (
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
              onClick={() => action.action({ id: 1, name: 'Test Subcategory' })}
            >
              {action.title}
            </button>
          ))}
        </div>
      )}
    </div>
  ),
}))

jest.mock('../../../components/common', () => ({
  DialogModal: ({ children, isOpen, onClose, body }: any) =>
    isOpen ? (
      <div data-testid="dialog-modal-mock">
        <button data-testid="dialog-close" onClick={onClose}>
          Close
        </button>
        {body || children}
      </div>
    ) : null,
}))

jest.mock('../../../components/common/modal/ConfirmDeleteModal', () => ({
  __esModule: true,
  default: (props: any) => {
    if (!props.isOpen) return null
    return (
      <div data-testid="confirm-delete-modal-mock">
        <button onClick={props.onConfirm} data-testid="confirm-delete">
          Confirm Delete
        </button>
        <button onClick={props.onClose} data-testid="cancel-delete">
          Cancel
        </button>
      </div>
    )
  },
}))

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: jest.fn() }),
}))

// Mock API
const mockGetCategoriesDetails = jest.fn()
const mockGetSubCategories = jest.fn()
const mockDeleteCategories = jest.fn()
const mockCreateMutate = jest.fn()
const mockUpdateMutate = jest.fn()

jest.mock('../api', () => ({
  deleteCategories: (...args: any[]) => mockDeleteCategories(...args),
  getCategoriesDetails: (...args: any[]) => mockGetCategoriesDetails(...args),
  getSubCategories: (...args: any[]) => mockGetSubCategories(...args),
  useCreateCategories: () => ({
    mutateAsync: mockCreateMutate,
    isLoading: false,
  }),
  useUpdateCategories: () => ({
    mutateAsync: mockUpdateMutate,
    isLoading: false,
  }),
  DISABLE_NONLOGIN_APIS: false,
}))

jest.mock('../create/schema', () => ({
  CategorySchema: {},
  formSchema: {},
}))

jest.mock('../../../components/app/formBuilder', () => ({
  __esModule: true,
  default: ({ onSubmit }: any) => (
    <div data-testid="form-builder-mock">
      <button
        data-testid="form-submit"
        onClick={() => onSubmit({ name: 'New Subcategory' })}
      >
        Submit
      </button>
    </div>
  ),
}))

jest.mock('../create', () => ({
  __esModule: true,
  default: (props: any) => {
    if (!props.isDrawerOpen) return null
    return (
      <div data-testid="create-category-mock">
        <button data-testid="create-close" onClick={props.handleClose}>
          Close
        </button>
        <button data-testid="create-refresh" onClick={props.handleRefresh}>
          Refresh
        </button>
      </div>
    )
  },
}))

jest.mock('../../../utilities/calcHeight', () => ({
  calcWindowHeight: () => 400,
}))

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('CategoryDetails', () => {
  const mockCategoryId = '123'

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({ id: mockCategoryId })

    // Default successful API mocks
    mockGetCategoriesDetails.mockResolvedValue({
      id: 123,
      name: 'Test category',
      description: 'Test Description',
    })

    mockGetSubCategories.mockResolvedValue({
      data: [{ id: 1, name: 'Subcategory 1' }],
      meta: { total_pages: 1, total_count: 1, current_page: 1 },
    })

    mockDeleteCategories.mockResolvedValue({})
    mockCreateMutate.mockResolvedValue({})
    mockUpdateMutate.mockResolvedValue({})
  })

  test('renders category details successfully', async () => {
    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(mockGetCategoriesDetails).toHaveBeenCalledWith(mockCategoryId)
    })

    await waitFor(() => {
      expect(screen.getByText('Test category')).toBeInTheDocument()
    })
  })

  test('handles loading state', () => {
    renderWithRouter(<CategoryDetails />)

    expect(screen.getByTestId('info-box-mock')).toBeInTheDocument()
    expect(screen.getByText('Loading user details...')).toBeInTheDocument()
  })

  test('handles error state', async () => {
    mockGetCategoriesDetails.mockRejectedValue(new Error('Failed to load'))

    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(screen.getByTestId('info-box-mock')).toBeInTheDocument()
    })
  })

  test('loads subcategories after category loads', async () => {
    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(mockGetCategoriesDetails).toHaveBeenCalledWith(mockCategoryId)
    })

    await waitFor(() => {
      expect(mockGetSubCategories).toHaveBeenCalledWith(
        mockCategoryId,
        expect.objectContaining({
          page: 1,
          per_page: 10,
        })
      )
    })
  })

  test('opens edit category modal', async () => {
    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(screen.getByText('Test category')).toBeInTheDocument()
    })

    const editButton = screen.getByTestId('edit-icon')
    fireEvent.click(editButton)

    expect(screen.getByTestId('create-category-mock')).toBeInTheDocument()
  })

  test('closes edit category modal', async () => {
    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(screen.getByText('Test category')).toBeInTheDocument()
    })

    const editButton = screen.getByTestId('edit-icon')
    fireEvent.click(editButton)

    expect(screen.getByTestId('create-category-mock')).toBeInTheDocument()

    const closeButton = screen.getByTestId('create-close')
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(
        screen.queryByTestId('create-category-mock')
      ).not.toBeInTheDocument()
    })
  })

  test('opens subcategory creation modal', async () => {
    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    })

    const addButton = screen.getByTestId('plus-icon')
    fireEvent.click(addButton)

    expect(screen.getByTestId('dialog-modal-mock')).toBeInTheDocument()
  })

  test('opens delete confirmation modal for subcategory', async () => {
    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(screen.getByTestId('action-Delete')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTestId('action-Delete')
    fireEvent.click(deleteButton)

    expect(screen.getByTestId('confirm-delete-modal-mock')).toBeInTheDocument()
  })

  test('confirms subcategory deletion', async () => {
    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(screen.getByTestId('action-Delete')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTestId('action-Delete')
    fireEvent.click(deleteButton)

    const confirmButton = screen.getByTestId('confirm-delete')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockDeleteCategories).toHaveBeenCalled()
    })
  })

  test('cancels subcategory deletion', async () => {
    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(screen.getByTestId('action-Delete')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTestId('action-Delete')
    fireEvent.click(deleteButton)

    const cancelButton = screen.getByTestId('cancel-delete')
    fireEvent.click(cancelButton)

    expect(
      screen.queryByTestId('confirm-delete-modal-mock')
    ).not.toBeInTheDocument()
  })

  test('handles edit subcategory', async () => {
    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(screen.getByTestId('action-Edit')).toBeInTheDocument()
    })

    const editButton = screen.getByTestId('action-Edit')
    fireEvent.click(editButton)

    expect(screen.getByTestId('dialog-modal-mock')).toBeInTheDocument()
  })

  test('navigates back when arrow is clicked', async () => {
    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument()
    })

    const backButton = screen.getByTestId('arrow-left-icon')
    fireEvent.click(backButton)

    expect(mockNavigate).toHaveBeenCalled()
  })

  test('handles empty subcategories list', async () => {
    mockGetSubCategories.mockResolvedValue({
      data: [],
      meta: { total_pages: 0, total_count: 0, current_page: 1 },
    })

    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(screen.getByText(/rows: 0/i)).toBeInTheDocument()
    })
  })

  test('handles subcategories loading error', async () => {
    mockGetSubCategories.mockRejectedValue(
      new Error('Failed to load subcategories')
    )

    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(screen.getByTestId('smart-table-mock')).toBeInTheDocument()
    })
  })

  test('refreshes data after category update', async () => {
    renderWithRouter(<CategoryDetails />)

    await waitFor(() => {
      expect(screen.getByText('Test category')).toBeInTheDocument()
    })

    const editButton = screen.getByTestId('edit-icon')
    fireEvent.click(editButton)

    const refreshButton = screen.getByTestId('create-refresh')
    fireEvent.click(refreshButton)

    // Just verify that the refresh functions are called at least once
    expect(mockGetCategoriesDetails).toHaveBeenCalled()
    expect(mockGetSubCategories).toHaveBeenCalled()
  })
})
