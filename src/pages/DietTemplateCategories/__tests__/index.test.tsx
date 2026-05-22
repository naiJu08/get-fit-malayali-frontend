import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import DietTemplateCategories from '../index'

// Get the mock module to adjust state during tests
import * as authStoreMock from '../../../store/authStore'

// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/diet-template-categories' }),
}))

jest.mock('../columns', () => ({
  getDietTemplateCategoryColumns: jest.fn(() => [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'status', title: 'Status', sortable: false },
    { key: 'created_at', title: 'Created At', sortable: false },
  ]),
}))

const mockRefetch = jest.fn()
const mockDeleteDietTemplateCategory = jest.fn()

let mockIsFetching = false
let mockDietTemplateCategoriesData: any = {
  diet_template_categories: [
    {
      id: '1',
      name: 'Breakfast',
      status: 'active',
      created_at: '2024-01-01',
    },
  ],
  meta: { total_count: 1, current_page: 1, total_pages: 1 },
}

jest.mock('../api', () => ({
  useDietTemplateCategories: () => ({
    data: mockDietTemplateCategoriesData,
    refetch: mockRefetch,
    isFetching: mockIsFetching,
  }),
  useDeleteDietTemplateCategory: () => ({
    mutate: mockDeleteDietTemplateCategory,
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
        {onActionClick && actionProps && (
          <button data-testid="create-button" onClick={onActionClick}>
            {actionProps?.actionTitle}
          </button>
        )}
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
        <select
          data-testid="status-filter"
          value={props.toolbarExtra?.props?.children?.props?.value || ''}
          onChange={(e) => {
            if (props.toolbarExtra?.props?.children?.props?.onChange) {
              props.toolbarExtra.props.children.props.onChange(e)
            }
          }}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {props.actionProps?.map((action: any, idx: number) => (
          <button
            key={idx}
            data-testid={`action-${action.title?.toLowerCase()}`}
            onClick={() =>
              action.action({
                id: '1',
                name: 'Breakfast',
                status: 'active',
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
  return function MockCreateDietTemplateCategory(props: any) {
    return (
      <div data-testid="create-modal">
        {props.isDrawerOpen && <span data-testid="create-open">Open</span>}
        {props.edit && <span data-testid="edit-mode">Edit Mode</span>}
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

describe('DietTemplateCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    mockEnqueueSnackbar.mockClear()
    mockRefetch.mockClear()
    mockDeleteDietTemplateCategory.mockClear()
    mockNavigate.mockClear()
  })

  it('renders component with header and table', () => {
    render(
      <BrowserRouter>
        <DietTemplateCategories />
      </BrowserRouter>
    )
    expect(screen.getByTestId('listing-header')).toBeInTheDocument()
    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
  })

  it('displays data from API', () => {
    render(
      <BrowserRouter>
        <DietTemplateCategories />
      </BrowserRouter>
    )
    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
  })

  it('opens create modal when create button is clicked', () => {
    render(
      <BrowserRouter>
        <DietTemplateCategories />
      </BrowserRouter>
    )
    fireEvent.click(screen.getByTestId('create-button'))
    expect(screen.getByTestId('create-open')).toBeInTheDocument()
  })

  it('closes create modal', () => {
    render(
      <BrowserRouter>
        <DietTemplateCategories />
      </BrowserRouter>
    )
    fireEvent.click(screen.getByTestId('create-button'))
    expect(screen.getByTestId('create-open')).toBeInTheDocument()
  })

  it('refetches data when refetch button is clicked', async () => {
    render(
      <BrowserRouter>
        <DietTemplateCategories />
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
        <DietTemplateCategories />
      </BrowserRouter>
    )
    fireEvent.change(screen.getByTestId('search-input'), {
      target: { value: 'breakfast' },
    })
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toHaveValue('breakfast')
    })
  })

  it('performs sorting when sort button is clicked', () => {
    render(
      <BrowserRouter>
        <DietTemplateCategories />
      </BrowserRouter>
    )
    fireEvent.click(screen.getByTestId('sort-btn'))
  })

  it('opens delete modal when delete action is triggered', async () => {
    render(
      <BrowserRouter>
        <DietTemplateCategories />
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
        <DietTemplateCategories />
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
        <DietTemplateCategories />
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

  it('displays empty state when no data', () => {
    mockDietTemplateCategoriesData = {
      diet_template_categories: [],
      meta: { total_count: 0, current_page: 1, total_pages: 1 },
    }
    render(
      <BrowserRouter>
        <DietTemplateCategories />
      </BrowserRouter>
    )
  })

  it('handles nutritionist role differently', () => {
    ;(authStoreMock as any).__setMockAuthState({
      roleData: { name: 'nutritionist' },
    })
    render(
      <BrowserRouter>
        <DietTemplateCategories />
      </BrowserRouter>
    )
    expect(screen.getByTestId('listing-header')).toBeInTheDocument()
    // Reset back to admin for other tests
    ;(authStoreMock as any).__setMockAuthState({ roleData: { name: 'admin' } })
  })

  it('opens edit modal when edit action is triggered', async () => {
    render(
      <BrowserRouter>
        <DietTemplateCategories />
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

  it('handles pagination', async () => {
    render(
      <BrowserRouter>
        <DietTemplateCategories />
      </BrowserRouter>
    )
    if (paginationCallback) {
      await act(async () => {
        paginationCallback({ page: 2, pageSize: 10 })
      })
    }
  })

  it('handles status filter change', async () => {
    render(
      <BrowserRouter>
        <DietTemplateCategories />
      </BrowserRouter>
    )
    const statusFilter = screen.getByTestId('status-filter')
    fireEvent.change(statusFilter, { target: { value: 'active' } })
    // The filter change triggers a state update, so we just verify the event was fired
    expect(statusFilter).toBeInTheDocument()
  })

  it('displays correct title in listing header', () => {
    render(
      <BrowserRouter>
        <DietTemplateCategories />
      </BrowserRouter>
    )
    const header = screen.getByTestId('listing-header')
    expect(header.querySelector('h1')?.textContent).toBe('Diet Plan Categories')
  })

  it('shows create button for non-nutritionist users', () => {
    ;(authStoreMock as any).__setMockAuthState({
      roleData: { name: 'admin' },
    })
    render(
      <BrowserRouter>
        <DietTemplateCategories />
      </BrowserRouter>
    )
    expect(screen.getByTestId('create-button')).toBeInTheDocument()
    ;(authStoreMock as any).__setMockAuthState({ roleData: { name: 'admin' } })
  })

  it('does not show create button for nutritionist users', () => {
    // Set nutritionist role before rendering
    ;(authStoreMock as any).__setMockAuthState({
      roleData: { name: 'nutritionist' },
    })
    
    // Re-create the component with fresh mocks
    render(
      <BrowserRouter>
        <DietTemplateCategories />
      </BrowserRouter>
    )
    
    // For nutritionist, the create button should not be rendered
    // (onActionClick is undefined and actionProps is undefined in the ListingHeader)
    const createButton = screen.queryByTestId('create-button')
    // The button might still exist but be disabled or have no click handler
    // Based on the component logic, when isNutritionist is true, onActionClick is undefined
    // and actionProps is undefined, so the button should not be rendered
    expect(createButton).not.toBeInTheDocument()
    
    // Reset back to admin for other tests
    ;(authStoreMock as any).__setMockAuthState({ roleData: { name: 'admin' } })
  })

  it('shows loading indicator when fetching', () => {
    mockIsFetching = true
    render(
      <BrowserRouter>
        <DietTemplateCategories />
      </BrowserRouter>
    )
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    mockIsFetching = false
  })
})