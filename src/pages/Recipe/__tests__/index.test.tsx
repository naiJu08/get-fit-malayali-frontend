import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Recipe from '../index'

// ── Mock react-router-dom ─────────────────────────────────────────────────────
const mockNavigate = jest.fn()
const mockLocationPathname = '/recipe'
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockLocationPathname }),
  }
})

// ── Mock Icons ────────────────────────────────────────────────────────────────
jest.mock('../../../components/common/icons', () => {
  const MockIcons = ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  )
  return MockIcons
})

// ── Mock ListingHeader ────────────────────────────────────────────────────────
jest.mock('../../../components/common/ListingTiles', () => {
  const MockListingHeader = ({
    data,
    onActionClick,
    actionProps,
    checkPermission,
  }: any) => (
    <div data-testid="listing-header">
      <span data-testid="header-title">{data?.title}</span>
      <span data-testid="header-icon">{data?.icon}</span>
      <span data-testid="header-action-title">{actionProps?.actionTitle}</span>
      <span data-testid="header-permission">{String(checkPermission)}</span>
      {onActionClick && (
        <button
          data-testid="create-button"
          onClick={onActionClick}
        >
          Create
        </button>
      )}
    </div>
  )
  return MockListingHeader
})

// ── Mock SmartTable ───────────────────────────────────────────────────────────
jest.mock('../../../components/common/table/SmartTable', () => {
  const MockSmartTable = ({
    data,
    columns,
    toolbar,
    toolbarExtra,
    height,
    search,
    searchPlaceholder,
    isLoading,
    sortType,
    sortColumn,
    handleColumnSort,
    emptyTitle,
    pagination,
    actionProps,
    paginationProps,
    searchValue,
    onSearchChange,
    onSearch,
    columnToggle,
    externalActions,
  }: any) => (
    <div data-testid="smart-table">
      <span data-testid="st-data-count">{data?.length ?? 0}</span>
      <span data-testid="st-columns-count">{columns?.length ?? 0}</span>
      <span data-testid="st-loading">{String(isLoading)}</span>
      <span data-testid="st-toolbar">{String(toolbar)}</span>
      <span data-testid="st-search">{String(search)}</span>
      <span data-testid="st-search-placeholder">{searchPlaceholder}</span>
      <span data-testid="st-search-value">{searchValue}</span>
      <span data-testid="st-sort-type">{sortType}</span>
      <span data-testid="st-sort-column">{sortColumn}</span>
      <span data-testid="st-empty-title">{emptyTitle}</span>
      <span data-testid="st-pagination">{String(pagination)}</span>
      <span data-testid="st-column-toggle">{String(columnToggle)}</span>
      <span data-testid="st-external-actions">{String(externalActions)}</span>
      <span data-testid="st-height">{height}</span>
      <span data-testid="st-total">{paginationProps?.total}</span>
      <span data-testid="st-current-page">{paginationProps?.currentPage}</span>
      <span data-testid="st-rows-per-page">{paginationProps?.rowsPerPage}</span>
      <div data-testid="st-toolbar-extra">{toolbarExtra}</div>
      <div data-testid="st-action-count">{actionProps?.length ?? 0}</div>
      {actionProps?.map((action: any, idx: number) => (
        <div key={idx} data-testid={`action-${idx}`}>
          <span data-testid={`action-title-${idx}`}>{action.title}</span>
          <span data-testid={`action-tooltip-${idx}`}>{action.toolTip}</span>
          <span data-testid={`action-icon-${idx}`}>{action.icon}</span>
          <button
            data-testid={`action-btn-${idx}`}
            onClick={() => action.action({ id: 1, name: 'Test Recipe' })}
          >
            {action.title}
          </button>
        </div>
      ))}
      {handleColumnSort && (
        <button
          data-testid="sort-btn"
          onClick={() => handleColumnSort('name', 'asc')}
        >
          Sort
        </button>
      )}
      {onSearchChange && (
        <input
          data-testid="search-input"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      )}
      {onSearch && (
        <button
          data-testid="search-btn"
          onClick={() => onSearch(searchValue)}
        >
          Search
        </button>
      )}
      {paginationProps?.onPagination && (
        <button
          data-testid="pagination-btn"
          onClick={() => paginationProps.onPagination(2)}
        >
          Page 2
        </button>
      )}
      {paginationProps?.onRowsPerPage && (
        <button
          data-testid="rows-per-page-btn"
          onClick={() => paginationProps.onRowsPerPage(20)}
        >
          Rows 20
        </button>
      )}
    </div>
  )
  return MockSmartTable
})

// ── Mock CreateRecipe ─────────────────────────────────────────────────────────
jest.mock('../create', () => {
  const MockCreateRecipe = ({
    isDrawerOpen,
    handleClose,
    handleRefresh,
    edit,
    rowData,
    formKey,
  }: any) => (
    <div data-testid="create-recipe-drawer">
      <span data-testid="drawer-open">{String(isDrawerOpen)}</span>
      <span data-testid="drawer-edit">{String(edit)}</span>
      <span data-testid="drawer-form-key">{formKey}</span>
      <span data-testid="drawer-row-data">{rowData ? 'present' : 'none'}</span>
      {isDrawerOpen && (
        <>
          <button data-testid="drawer-close-btn" onClick={handleClose}>
            Close
          </button>
          <button data-testid="drawer-refresh-btn" onClick={handleRefresh}>
            Refresh
          </button>
        </>
      )}
    </div>
  )
  return MockCreateRecipe
})

// ── Mock ConfirmDeleteModal ───────────────────────────────────────────────────
jest.mock('../../../components/common/modal/ConfirmDeleteModal', () => {
  const MockConfirmDeleteModal = ({
    isOpen,
    onClose,
    onConfirm,
    loading,
    title,
    subTitle,
    confirmLabel,
    cancelLabel,
  }: any) => (
    <div data-testid="confirm-delete-modal">
      <span data-testid="delete-open">{String(isOpen)}</span>
      <span data-testid="delete-loading">{String(loading)}</span>
      <span data-testid="delete-title">{title}</span>
      <span data-testid="delete-subtitle">{subTitle}</span>
      <span data-testid="delete-confirm-label">{confirmLabel}</span>
      <span data-testid="delete-cancel-label">{cancelLabel}</span>
      {isOpen && (
        <>
          <button data-testid="delete-confirm-btn" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button data-testid="delete-cancel-btn" onClick={onClose}>
            {cancelLabel}
          </button>
        </>
      )}
    </div>
  )
  return MockConfirmDeleteModal
})

// ── Mock APIs ─────────────────────────────────────────────────────────────────
const mockRecipesData = {
  recipes: [
    { id: 1, name: 'Chicken Curry', meal_category: 'Lunch' },
    { id: 2, name: 'Fruit Salad', meal_category: 'Breakfast' },
  ],
  meta: {
    total_count: 2,
    total_pages: 1,
    current_page: 1,
    per_page: 10,
  },
}

const mockUseRecipes = jest.fn()
const mockUseDeleteRecipe = jest.fn()
const mockDeleteMutate = jest.fn()

jest.mock('../api', () => ({
  useRecipes: (...args: any[]) => mockUseRecipes(...args),
  useDeleteRecipe: (...args: any[]) => mockUseDeleteRecipe(...args),
}))

// ── Mock useMealCategories ────────────────────────────────────────────────────
const mockUseMealCategories = jest.fn()
jest.mock('../../Meals/api', () => ({
  useMealCategories: (...args: any[]) => mockUseMealCategories(...args),
}))

// ── Mock store ────────────────────────────────────────────────────────────────
const mockSetPageParams = jest.fn()
const mockPageParams = {
  page: 1,
  per_page: 10,
  search: '',
  ordering: '',
  filters: {},
  sortType: 'asc' as const,
  sortColumn: '',
  filterProps: {},
  page_size: 30,
}

jest.mock('../../../store/filterSore/adminUserStore', () => ({
  useAdminUserFilterStore: (selector?: any) => {
    const state = {
      pageParams: mockPageParams,
      setPageParams: mockSetPageParams,
    }
    return selector ? selector(state) : state
  },
}))

// ── Mock checkPermissions ─────────────────────────────────────────────────────
jest.mock('../../../layout/store', () => ({
  checkPermissions: jest.fn(() => true),
}))

// ── Mock calcHeight ───────────────────────────────────────────────────────────
jest.mock('../../../utilities/calcHeight', () => ({
  calcWindowHeight: (fixed: number) => 600 - fixed,
}))

// ── Mock getSortedColumnName ──────────────────────────────────────────────────
jest.mock('../../../utilities/parsers', () => ({
  getSortedColumnName: jest.fn((col: string, dir: string) =>
    dir === 'desc' ? `-${col}` : col
  ),
}))

// ── Test helpers ──────────────────────────────────────────────────────────────

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderRecipe = () => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/recipe']}>
        <Routes>
          <Route path="/recipe" element={<Recipe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Recipe Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPageParams.page = 1
    mockPageParams.per_page = 10
    mockPageParams.search = ''
    mockPageParams.ordering = ''
    mockPageParams.filters = {}
    mockPageParams.sortType = 'asc'
    mockPageParams.sortColumn = ''

    mockUseRecipes.mockReturnValue({
      data: mockRecipesData,
      isFetching: false,
    })

    mockUseDeleteRecipe.mockReturnValue({
      mutate: mockDeleteMutate,
      isLoading: false,
    })

    mockUseMealCategories.mockReturnValue({
      data: { meal_categories: ['Lunch', 'Breakfast', 'Dinner'] },
      isLoading: false,
    })
  })

  // ── Rendering ──────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the listing header with correct title and icon', () => {
      renderRecipe()
      expect(screen.getByTestId('header-title')).toHaveTextContent('Recipes')
      expect(screen.getByTestId('header-icon')).toHaveTextContent('recipe')
    })

    it('renders the create button in the header', () => {
      renderRecipe()
      expect(screen.getByTestId('create-button')).toBeInTheDocument()
    })

    it('renders SmartTable with correct data count', () => {
      renderRecipe()
      expect(screen.getByTestId('st-data-count')).toHaveTextContent('2')
    })

    it('renders SmartTable with columns', () => {
      renderRecipe()
      // Columns are set via useEffect, so they should be present
      expect(screen.getByTestId('st-columns-count')).toBeInTheDocument()
    })

    it('renders SmartTable with search enabled and correct placeholder', () => {
      renderRecipe()
      expect(screen.getByTestId('st-search')).toHaveTextContent('true')
      expect(screen.getByTestId('st-search-placeholder')).toHaveTextContent(
        'Search Recipe Name'
      )
    })

    it('renders SmartTable with pagination enabled', () => {
      renderRecipe()
      expect(screen.getByTestId('st-pagination')).toHaveTextContent('true')
    })

    it('renders SmartTable with column toggle and external actions', () => {
      renderRecipe()
      expect(screen.getByTestId('st-column-toggle')).toHaveTextContent('true')
      expect(screen.getByTestId('st-external-actions')).toHaveTextContent('true')
    })

    it('renders pagination props correctly', () => {
      renderRecipe()
      expect(screen.getByTestId('st-total')).toHaveTextContent('2')
      expect(screen.getByTestId('st-current-page')).toHaveTextContent('1')
      expect(screen.getByTestId('st-rows-per-page')).toHaveTextContent('10')
    })

    it('renders all 4 action buttons (View, Edit, Duplicate, Delete)', () => {
      renderRecipe()
      expect(screen.getByTestId('st-action-count')).toHaveTextContent('4')
      expect(screen.getByTestId('action-title-0')).toHaveTextContent('View')
      expect(screen.getByTestId('action-title-1')).toHaveTextContent('Edit')
      expect(screen.getByTestId('action-title-2')).toHaveTextContent('Duplicate')
      expect(screen.getByTestId('action-title-3')).toHaveTextContent('Delete')
    })

    it('renders the category filter toolbar', () => {
      renderRecipe()
      expect(screen.getByTestId('st-toolbar-extra')).toBeInTheDocument()
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('All')).toBeInTheDocument()
      expect(screen.getByText('Lunch')).toBeInTheDocument()
      expect(screen.getByText('Breakfast')).toBeInTheDocument()
      expect(screen.getByText('Dinner')).toBeInTheDocument()
    })

    it('renders the CreateRecipe drawer (initially closed)', () => {
      renderRecipe()
      expect(screen.getByTestId('drawer-open')).toHaveTextContent('false')
    })

    it('renders the ConfirmDeleteModal (initially closed)', () => {
      renderRecipe()
      expect(screen.getByTestId('delete-open')).toHaveTextContent('false')
    })
  })

  // ── Loading state ──────────────────────────────────────────────────────

  describe('Loading state', () => {
    it('passes isLoading=true to SmartTable when fetching', () => {
      mockUseRecipes.mockReturnValue({
        data: undefined,
        isFetching: true,
      })
      renderRecipe()
      expect(screen.getByTestId('st-loading')).toHaveTextContent('true')
    })

    it('passes isLoading=false to SmartTable when not fetching', () => {
      renderRecipe()
      expect(screen.getByTestId('st-loading')).toHaveTextContent('false')
    })
  })

  // ── Empty state ─────────────────────────────────────────────────────────

  describe('Empty state', () => {
    it('renders empty title when no data', () => {
      mockUseRecipes.mockReturnValue({
        data: { recipes: [], meta: { total_count: 0, total_pages: 0 } },
        isFetching: false,
      })
      renderRecipe()
      expect(screen.getByTestId('st-empty-title')).toHaveTextContent(
        'No records to display'
      )
    })
  })

  // ── Category filter ─────────────────────────────────────────────────────

  describe('Category filter', () => {
    it('calls setPageParams with category filter when a category is selected', () => {
      renderRecipe()
      const select = screen.getByText('Lunch')
      fireEvent.click(select)
      // The select onChange triggers handleCategoryChange
      const selectElement = screen.getByRole('combobox')
      fireEvent.change(selectElement, { target: { value: 'Lunch' } })
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { category: 'Lunch' },
          page: 1,
        })
      )
    })

    it('calls setPageParams without category filter when "All" is selected', () => {
      // First set a category filter
      mockPageParams.filters = { category: 'Lunch' }
      renderRecipe()
      const selectElement = screen.getByRole('combobox')
      fireEvent.change(selectElement, { target: { value: '' } })
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: {},
          page: 1,
        })
      )
    })

    it('disables the category select when categories are loading', () => {
      mockUseMealCategories.mockReturnValue({
        data: undefined,
        isLoading: true,
      })
      renderRecipe()
      const selectElement = screen.getByRole('combobox')
      expect(selectElement).toBeDisabled()
    })
  })

  // ── Search ──────────────────────────────────────────────────────────────

  describe('Search', () => {
    it('calls setPageParams with search value on search change', () => {
      renderRecipe()
      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'chicken' } })
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'chicken',
          page: 1,
        })
      )
    })

    it('calls setPageParams with search value on search button click', () => {
      renderRecipe()
      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'chicken' } })
      // The onSearch callback is called with the searchValue
      const searchBtn = screen.getByTestId('search-btn')
      fireEvent.click(searchBtn)
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'chicken',
          page: 1,
        })
      )
    })
  })

  // ── Pagination ──────────────────────────────────────────────────────────

  describe('Pagination', () => {
    it('calls setPageParams with new page number on pagination', () => {
      renderRecipe()
      const pageBtn = screen.getByTestId('pagination-btn')
      fireEvent.click(pageBtn)
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      )
    })

    it('calls setPageParams with new rows per page', () => {
      renderRecipe()
      const rowsBtn = screen.getByTestId('rows-per-page-btn')
      fireEvent.click(rowsBtn)
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({ per_page: 20, page: 1 })
      )
    })
  })

  // ── Sorting ─────────────────────────────────────────────────────────────

  describe('Sorting', () => {
    it('calls setPageParams with sort column and direction', () => {
      renderRecipe()
      const sortBtn = screen.getByTestId('sort-btn')
      fireEvent.click(sortBtn)
      // Find the call that has sortColumn set (not the initial render call)
      const sortCalls = mockSetPageParams.mock.calls.filter(
        (call: any[]) => call[0]?.sortColumn === 'name'
      )
      expect(sortCalls.length).toBeGreaterThanOrEqual(1)
      expect(sortCalls[0][0]).toMatchObject({
        sortColumn: 'name',
        sortType: 'asc',
      })
    })
  })

  // ── Create / Edit / Duplicate Drawer ────────────────────────────────────

  describe('Create/Edit/Duplicate Drawer', () => {
    it('opens the create drawer when create button is clicked', () => {
      renderRecipe()
      const createBtn = screen.getByTestId('create-button')
      fireEvent.click(createBtn)
      expect(screen.getByTestId('drawer-open')).toHaveTextContent('true')
      expect(screen.getByTestId('drawer-edit')).toHaveTextContent('false')
      expect(screen.getByTestId('drawer-row-data')).toHaveTextContent('none')
    })

    it('opens the edit drawer with row data when edit action is clicked', () => {
      renderRecipe()
      const editBtn = screen.getByTestId('action-btn-1')
      fireEvent.click(editBtn)
      expect(screen.getByTestId('drawer-open')).toHaveTextContent('true')
      expect(screen.getByTestId('drawer-edit')).toHaveTextContent('true')
      expect(screen.getByTestId('drawer-row-data')).toHaveTextContent('present')
    })

    it('opens the duplicate drawer with row data when duplicate action is clicked', () => {
      renderRecipe()
      const duplicateBtn = screen.getByTestId('action-btn-2')
      fireEvent.click(duplicateBtn)
      expect(screen.getByTestId('drawer-open')).toHaveTextContent('true')
      expect(screen.getByTestId('drawer-edit')).toHaveTextContent('false')
      expect(screen.getByTestId('drawer-row-data')).toHaveTextContent('present')
    })

    it('closes the drawer and resets state when close is clicked', () => {
      renderRecipe()
      // Open the drawer first
      const createBtn = screen.getByTestId('create-button')
      fireEvent.click(createBtn)
      expect(screen.getByTestId('drawer-open')).toHaveTextContent('true')
      // Close it
      const closeBtn = screen.getByTestId('drawer-close-btn')
      fireEvent.click(closeBtn)
      expect(screen.getByTestId('drawer-open')).toHaveTextContent('false')
      expect(screen.getByTestId('drawer-edit')).toHaveTextContent('false')
      expect(screen.getByTestId('drawer-row-data')).toHaveTextContent('none')
    })

    it('calls handleRefresh when refresh is triggered from drawer', () => {
      renderRecipe()
      const createBtn = screen.getByTestId('create-button')
      fireEvent.click(createBtn)
      const refreshBtn = screen.getByTestId('drawer-refresh-btn')
      fireEvent.click(refreshBtn)
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 })
      )
    })

    it('navigates to recipe detail when view action is clicked', () => {
      renderRecipe()
      const viewBtn = screen.getByTestId('action-btn-0')
      fireEvent.click(viewBtn)
      expect(mockNavigate).toHaveBeenCalledWith('/recipe/1')
    })
  })

  // ── Delete Modal ────────────────────────────────────────────────────────

  describe('Delete Modal', () => {
    it('opens the delete modal when delete action is clicked', () => {
      renderRecipe()
      const deleteBtn = screen.getByTestId('action-btn-3')
      fireEvent.click(deleteBtn)
      expect(screen.getByTestId('delete-open')).toHaveTextContent('true')
    })

    it('calls delete mutation on confirm', () => {
      renderRecipe()
      // Open delete modal
      const deleteBtn = screen.getByTestId('action-btn-3')
      fireEvent.click(deleteBtn)
      // Confirm delete
      const confirmBtn = screen.getByTestId('delete-confirm-btn')
      fireEvent.click(confirmBtn)
      expect(mockDeleteMutate).toHaveBeenCalledWith(1, expect.any(Object))
    })

    it('closes the delete modal on cancel', () => {
      renderRecipe()
      // Open delete modal
      const deleteBtn = screen.getByTestId('action-btn-3')
      fireEvent.click(deleteBtn)
      expect(screen.getByTestId('delete-open')).toHaveTextContent('true')
      // Cancel
      const cancelBtn = screen.getByTestId('delete-cancel-btn')
      fireEvent.click(cancelBtn)
      expect(screen.getByTestId('delete-open')).toHaveTextContent('false')
    })

    it('shows loading state on delete modal when mutation is loading', () => {
      mockUseDeleteRecipe.mockReturnValue({
        mutate: mockDeleteMutate,
        isLoading: true,
      })
      renderRecipe()
      const deleteBtn = screen.getByTestId('action-btn-3')
      fireEvent.click(deleteBtn)
      expect(screen.getByTestId('delete-loading')).toHaveTextContent('true')
    })

    it('does not close delete modal when mutation is loading', () => {
      mockUseDeleteRecipe.mockReturnValue({
        mutate: mockDeleteMutate,
        isLoading: true,
      })
      renderRecipe()
      // Open delete modal
      const deleteBtn = screen.getByTestId('action-btn-3')
      fireEvent.click(deleteBtn)
      expect(screen.getByTestId('delete-open')).toHaveTextContent('true')
      // Try to close
      const cancelBtn = screen.getByTestId('delete-cancel-btn')
      fireEvent.click(cancelBtn)
      // Should still be open because isLoading is true
      expect(screen.getByTestId('delete-open')).toHaveTextContent('true')
    })

    it('calls handleRefresh on delete success', () => {
      renderRecipe()
      // Open delete modal
      const deleteBtn = screen.getByTestId('action-btn-3')
      fireEvent.click(deleteBtn)
      // Confirm delete
      const confirmBtn = screen.getByTestId('delete-confirm-btn')
      fireEvent.click(confirmBtn)
      // Simulate the onSuccess callback
      const onSuccessCallback = mockDeleteMutate.mock.calls[0][1].onSuccess
      act(() => {
        onSuccessCallback()
      })
      // Should have called setPageParams to refresh (page: 1)
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 })
      )
      // Modal should be closed
      expect(screen.getByTestId('delete-open')).toHaveTextContent('false')
    })
  })

  // ── Page clamping ───────────────────────────────────────────────────────

  describe('Page clamping', () => {
    it('clamps page to total_pages when current page exceeds total', () => {
      mockPageParams.page = 5
      mockUseRecipes.mockReturnValue({
        data: {
          recipes: [],
          meta: { total_count: 0, total_pages: 3, current_page: 5, per_page: 10 },
        },
        isFetching: false,
      })
      renderRecipe()
      // The useEffect should clamp page to 3
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3 })
      )
    })

    it('clamps page to 1 when current page is less than 1', () => {
      mockPageParams.page = 0
      mockUseRecipes.mockReturnValue({
        data: {
          recipes: [],
          meta: { total_count: 0, total_pages: 3, current_page: 0, per_page: 10 },
        },
        isFetching: false,
      })
      renderRecipe()
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 })
      )
    })

    it('does not clamp page when page is within valid range', () => {
      mockPageParams.page = 2
      mockUseRecipes.mockReturnValue({
        data: {
          recipes: [],
          meta: { total_count: 0, total_pages: 5, current_page: 2, per_page: 10 },
        },
        isFetching: false,
      })
      renderRecipe()
      // Should NOT have been called with page clamping
      // It may have been called for other reasons (like pathname reset)
      // But not for clamping to total_pages
      const clampingCalls = mockSetPageParams.mock.calls.filter(
        (call: any[]) => call[0]?.page === 5
      )
      expect(clampingCalls.length).toBe(0)
    })
  })

  // ── Store reset on path change ──────────────────────────────────────────

  describe('Store reset on path change', () => {
    it('resets page params when location pathname changes', () => {
      renderRecipe()
      expect(mockSetPageParams).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          search: '',
          filters: {},
        })
      )
    })
  })

  // ── Meal categories edge cases ──────────────────────────────────────────

  describe('Meal categories edge cases', () => {
    it('handles null meal categories data', () => {
      mockUseMealCategories.mockReturnValue({
        data: null,
        isLoading: false,
      })
      renderRecipe()
      // Should only show "All" option
      expect(screen.getByText('All')).toBeInTheDocument()
      expect(screen.queryByText('Lunch')).not.toBeInTheDocument()
    })

    it('handles undefined meal categories data', () => {
      mockUseMealCategories.mockReturnValue({
        data: undefined,
        isLoading: false,
      })
      renderRecipe()
      expect(screen.getByText('All')).toBeInTheDocument()
    })

    it('handles meal categories as array of strings directly', () => {
      mockUseMealCategories.mockReturnValue({
        data: ['Lunch', 'Breakfast', 'Dinner'],
        isLoading: false,
      })
      renderRecipe()
      expect(screen.getByText('Lunch')).toBeInTheDocument()
      expect(screen.getByText('Breakfast')).toBeInTheDocument()
      expect(screen.getByText('Dinner')).toBeInTheDocument()
    })

    it('filters out non-string category names', () => {
      mockUseMealCategories.mockReturnValue({
        data: {
          meal_categories: [
            { name: 'Lunch' },
            { name: 'Breakfast' },
            { name: '' },
            null,
            undefined,
            123,
          ],
        },
        isLoading: false,
      })
      renderRecipe()
      expect(screen.getByText('Lunch')).toBeInTheDocument()
      expect(screen.getByText('Breakfast')).toBeInTheDocument()
      // Empty string, null, undefined, and number should be filtered out
      expect(screen.queryByText('123')).not.toBeInTheDocument()
    })
  })

  // ── View action navigation ──────────────────────────────────────────────

  describe('View action', () => {
    it('navigates to recipe detail page on view', () => {
      renderRecipe()
      const viewBtn = screen.getByTestId('action-btn-0')
      fireEvent.click(viewBtn)
      expect(mockNavigate).toHaveBeenCalledWith('/recipe/1')
    })
  })
})
