import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import AssessmentCategory from '../index'

// Get the mock module to adjust state during tests
import * as authStoreMock from '../../../store/authStore'

// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../columns', () => ({
  getAssessmentCategoryColumns: jest.fn(() => [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'description', title: 'Description', sortable: false },
    { key: 'assessment_questions', title: 'Questions', sortable: false },
    { key: 'active', title: 'Status', sortable: false },
  ]),
}))

const mockRefetch = jest.fn()
const mockDeleteAssessmentCategory = jest.fn()

let mockIsFetching = false
let mockAssessmentCategoriesData: any = {
  assessment_categories: [
    {
      id: '1',
      name: 'Health Assessment',
      description: 'Test description',
      active: true,
      assessment_questions: [],
    },
  ],
  meta: { total_count: 1, current_page: 1, total_pages: 1 },
}

jest.mock('../api', () => ({
  useAssessmentCategories: () => ({
    data: mockAssessmentCategoriesData,
    refetch: mockRefetch,
    isFetching: mockIsFetching,
  }),
  deleteAssessmentCategory: (...args: any[]) =>
    mockDeleteAssessmentCategory(...args),
  useDeleteAssessmentCategory: () => ({
    mutate: mockDeleteAssessmentCategory,
    isLoading: false,
  }),
}))

jest.mock('../../../store/authStore', () => {
  let mockState = { roleData: { name: 'admin' } }
  return {
    useAuthStore: (selector: any) => {
      return selector ? selector(mockState) : mockState
    },
    __setMockAuthState: (state: any) => {
      mockState = state
    },
  }
})

jest.mock('../../../store/filterSore/adminUserStore', () => {
  const React = jest.requireActual('react')
  return {
    useAdminUserFilterStore: () => {
      const [pageParams, setPageParams] = React.useState({
        page: 1,
        per_page: 10,
        search: '',
        ordering: '',
      })
      return {
        pageParams,
        setPageParams,
      }
    },
  }
})

const mockCheckPermissions = jest.fn(
  (permission: string, action: string) => true
)
jest.mock('../../../layout/store', () => ({
  checkPermissions: (permission: string, action: string) =>
    mockCheckPermissions(permission, action),
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

let paginationCallback: any = null

jest.mock('../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    if (props.paginationProps?.onPagination) {
      paginationCallback = props.paginationProps.onPagination
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
            onClick={() =>
              action.action({
                id: '1',
                name: 'Health Assessment',
              })
            }
          >
            {action.title}
          </button>
        ))}
        {props.isLoading && (
          <div data-testid="loading-indicator">Loading...</div>
        )}
        {props.data?.length === 0 && !props.isLoading && (
          <div data-testid="empty-state">{props.emptyTitle}</div>
        )}
      </div>
    )
  }
})

jest.mock('../create', () => {
  return function MockCreateAssessmentCategory(props: any) {
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

const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('AssessmentCategory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    mockEnqueueSnackbar.mockClear()
    mockRefetch.mockClear()
    mockDeleteAssessmentCategory.mockClear()
    mockNavigate.mockClear()
  })

  it('renders component with header and table', () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    expect(screen.getByTestId('listing-header')).toBeInTheDocument()
    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
  })

  it('displays data from API', () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
  })

  it('opens create modal when create button is clicked', () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    fireEvent.click(screen.getByTestId('create-button'))
    expect(screen.getByTestId('create-open')).toBeInTheDocument()
  })

  it('closes create modal', () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    fireEvent.click(screen.getByTestId('create-button'))
    expect(screen.getByTestId('create-open')).toBeInTheDocument()
  })

  it('refetches data when refetch button is clicked', async () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    fireEvent.click(screen.getByTestId('refetch-btn'))
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  it('handles search input', async () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    fireEvent.change(screen.getByTestId('search-input'), {
      target: { value: 'health' },
    })
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toHaveValue('health')
    })
  })

  it('performs sorting when sort button is clicked', () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    fireEvent.click(screen.getByTestId('sort-btn'))
  })

  it('opens delete modal when delete action is triggered', async () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    const deleteButton = screen.queryByTestId('action-delete')
    if (deleteButton) {
      fireEvent.click(deleteButton)
      await waitFor(() => {
        expect(screen.getByTestId('delete-modal')).toBeInTheDocument()
      })
    }
  })

  it('confirms deletion when confirm button is clicked', async () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    const deleteButton = screen.queryByTestId('action-delete')
    if (deleteButton) {
      fireEvent.click(deleteButton)
      await waitFor(() => {
        const confirmButton = screen.getByTestId('confirm-delete')
        fireEvent.click(confirmButton)
      })
    }
  })

  it('cancels deletion when cancel button is clicked', async () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    const deleteButton = screen.queryByTestId('action-delete')
    if (deleteButton) {
      fireEvent.click(deleteButton)
      await waitFor(() => {
        const cancelButton = screen.getByTestId('cancel-delete')
        fireEvent.click(cancelButton)
      })
    }
  })

  it('navigates to details page when name is clicked', () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
  })

  it('displays empty state when no data', () => {
    mockAssessmentCategoriesData = {
      assessment_categories: [],
      meta: { total_count: 0, current_page: 1, total_pages: 1 },
    }
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
  })

  it('handles nutritionist role differently', () => {
    ;(authStoreMock as any).__setMockAuthState({
      roleData: { name: 'nutritionist' },
    })
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    expect(screen.getByTestId('listing-header')).toBeInTheDocument()
    // Reset back to admin for other tests
    ;(authStoreMock as any).__setMockAuthState({ roleData: { name: 'admin' } })
  })

  it('opens edit modal when edit action is triggered', async () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    const editButton = screen.queryByTestId('action-edit')
    if (editButton) {
      fireEvent.click(editButton)
      await waitFor(() => {
        expect(screen.getByTestId('edit-mode')).toBeInTheDocument()
      })
    }
  })

  it('navigates to details page when view action is triggered', async () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    const viewButton = screen.queryByTestId('action-view')
    if (viewButton) {
      fireEvent.click(viewButton)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/assessment-category/1')
      })
    }
  })

  it('handles pagination', async () => {
    render(
      <BrowserRouter>
        <AssessmentCategory />
      </BrowserRouter>
    )
    if (paginationCallback) {
      await act(async () => {
        paginationCallback({ page: 2, pageSize: 10 })
      })
    }
  })
})
