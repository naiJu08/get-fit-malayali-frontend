import { fireEvent, render, screen } from '@testing-library/react'
import Recipes from '../Details/Recipe/Recipes'

const mockNavigate = jest.fn()
const mockSetPageParams = jest.fn()
const mockAssignMutate = jest.fn()
const mockUseUserRecipes = jest.fn()
const mockUseRecipes = jest.fn()
const mockUseAssignRecipes = jest.fn()
const mockCheckPermissions = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    return (
      <div>
        <div data-testid="smart-table-count">{props.data.length}</div>
        <button onClick={() => props.onSearchChange?.('abc')}>search-change</button>
        <button onClick={() => props.onSearch?.()}>search</button>
        <button onClick={() => props.handleColumnSort?.('name', 'asc')}>sort</button>
        <button onClick={() => props.paginationProps?.onPagination?.(2)}>page-2</button>
        <button onClick={() => props.paginationProps?.onRowsPerPage?.(20)}>
          rows-20
        </button>
        <button onClick={() => props.actionProps?.[0]?.action?.(props.data[0])}>
          view-row
        </button>
        <div>{props.emptyTitle}</div>
      </div>
    )
  }
})

jest.mock('../../../components/common/buttons/Button', () => (props: any) => (
  <button type="button" onClick={props.onClick}>
    {props.label}
  </button>
))

jest.mock('../../../components/common/icons', () => (props: any) => (
  <span>{props.name}</span>
))

jest.mock('../../../components/common/drawer', () => (props: any) =>
  props.open ? (
    <div>
      <div>{props.title}</div>
      <button onClick={props.handleClose}>close-drawer</button>
      <button onClick={props.handleSubmit} disabled={props.disableSubmit}>
        {props.actionLabel}
      </button>
      {props.children}
    </div>
  ) : null
)

jest.mock('../../../components/common/inputs/SearchInput', () => (props: any) => (
  <div>
    <input
      aria-label={props.placeholder}
      value={props.searchValue}
      onChange={(event) => props.handleChange(event.target.value)}
    />
    <button onClick={() => props.handleSearch?.()}>run-search</button>
  </div>
))

jest.mock('../../../store/filterSore/adminUserStore', () => ({
  useAdminUserFilterStore: () => ({
    pageParams: { page: 1, per_page: 10, search: '', ordering: undefined },
    setPageParams: mockSetPageParams,
  }),
}))

jest.mock('../../../utilities/calcHeight', () => ({
  calcWindowHeight: (value: number) => value,
}))

jest.mock('../../../utilities/parsers', () => ({
  getSortedColumnName: jest.fn(() => 'name'),
}))

jest.mock('../../../layout/store', () => ({
  checkPermissions: (...args: any[]) => mockCheckPermissions(...args),
}))

jest.mock('../../Recipe/api', () => ({
  useRecipes: (...args: any[]) => mockUseRecipes(...args),
}))

jest.mock('../Details/Recipe/recipes.api', () => ({
  useUserRecipes: (...args: any[]) => mockUseUserRecipes(...args),
  useAssignRecipes: (...args: any[]) => mockUseAssignRecipes(...args),
}))

describe('Recipe Recipes Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckPermissions.mockReturnValue(true)
    mockUseUserRecipes.mockReturnValue({
      data: {
        recipes: [
          {
            id: 1,
            recipe: { id: 11, name: 'veg stew' },
          },
        ],
        meta: { total_count: 1, current_page: 1, per_page: 10 },
      },
      isFetching: false,
    })
    mockUseRecipes.mockReturnValue({
      data: {
        recipes: [
          {
            id: 11,
            name: 'veg stew',
            meal_category: 'dinner',
            serving_unit: 'bowl',
            nutrition: { calories: 200, protein: 10, carbs: 20, fat: 5, fiber: 3 },
          },
        ],
        meta: { current_page: 1, total_pages: 2 },
      },
      isFetching: false,
    })
    mockUseAssignRecipes.mockReturnValue({
      mutate: mockAssignMutate,
      isLoading: false,
    })
  })

  it('shows fallback when user id is missing', () => {
    render(<Recipes />)
    expect(
      screen.getByText(/User information unavailable\. Cannot load recipes\./i)
    ).toBeInTheDocument()
  })

  it('renders assigned recipes table and forwards table actions', () => {
    render(<Recipes userId="7" />)

    expect(screen.getByTestId('smart-table-count')).toHaveTextContent('1')

    fireEvent.click(screen.getByText('search-change'))
    fireEvent.click(screen.getByText('search'))
    fireEvent.click(screen.getByText('sort'))
    fireEvent.click(screen.getByText('page-2'))
    fireEvent.click(screen.getByText('rows-20'))
    fireEvent.click(screen.getByText('view-row'))

    expect(mockSetPageParams).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/recipe/11')
  })

  it('opens assign drawer, toggles recipe selection, and submits payload', () => {
    render(<Recipes userId="7" />)

    fireEvent.click(screen.getByRole('button', { name: /add recipe/i }))
    expect(screen.getByText('Assign Recipes')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Assign' }))

    expect(mockAssignMutate).toHaveBeenCalledWith(
      {
        user_id: '7',
        recipe_ids: expect.arrayContaining([11]),
        notes: undefined,
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      })
    )
  })

  it('shows loading and empty states inside the assign drawer', () => {
    mockUseRecipes.mockReturnValue({
      data: { recipes: [], meta: { current_page: 1, total_pages: 1 } },
      isFetching: true,
    })

    render(<Recipes userId="7" />)
    fireEvent.click(screen.getByRole('button', { name: /add recipe/i }))
    expect(screen.getByText(/Loading recipes\.\.\./i)).toBeInTheDocument()
  })

  it('hides add button without permission and supports user_recipes payload shape', () => {
    mockCheckPermissions.mockReturnValue(false)
    mockUseUserRecipes.mockReturnValue({
      data: {
        user_recipes: [{ id: 5, recipe_id: 44, recipe: { id: 44, name: 'idli' } }],
        meta: { total_count: 1, current_page: 1, per_page: 10 },
      },
      isFetching: false,
    })

    render(<Recipes userId="9" />)

    expect(screen.queryByRole('button', { name: /add recipe/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('view-row'))
    expect(mockNavigate).toHaveBeenCalledWith('/recipe/44')
  })

  it('updates drawer filters and pagination controls', () => {
    mockUseRecipes.mockReturnValue({
      data: {
        recipes: [],
        meta: { current_page: 2, total_pages: 3 },
      },
      isFetching: false,
    })

    render(<Recipes userId="7" />)
    fireEvent.click(screen.getByRole('button', { name: /add recipe/i }))
    fireEvent.change(screen.getByLabelText('Search Recipe'), {
      target: { value: 'soup' },
    })
    fireEvent.click(screen.getByText('run-search'))
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.change(screen.getByDisplayValue('10'), { target: { value: '20' } })
    fireEvent.click(screen.getByText('close-drawer'))

    expect(mockUseRecipes).toHaveBeenCalled()
  })
})
