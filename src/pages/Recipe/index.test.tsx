import { act } from 'react'
import { render } from '@testing-library/react'
import Recipe from './index'

const mockNavigate = jest.fn()
const mockLocation = { pathname: '/recipe' }
const mockUseAdminUserFilterStore = jest.fn()
const mockUseRecipes = jest.fn()
const mockGetRecipeColumns = jest.fn()
const mockListingHeaderProps = jest.fn()
const mockSmartTableProps = jest.fn()
const mockCreateRecipeProps = jest.fn()
let mockListingHeaderLastProps: any = null

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}))

jest.mock('../../layout/store', () => ({
  checkPermissions: jest.fn(() => true),
}))

jest.mock('../../store/filterSore/adminUserStore', () => ({
  useAdminUserFilterStore: () => mockUseAdminUserFilterStore(),
}))

jest.mock('./api', () => ({
  useRecipes: (params: any) => mockUseRecipes(params),
}))

jest.mock('./columns', () => ({
  getRecipeColumns: (...args: any[]) => mockGetRecipeColumns(...args),
}))

jest.mock('../../components/common/ListingTiles', () => ({
  __esModule: true,
  default: (props: any) => {
    mockListingHeaderProps(props)
    mockListingHeaderLastProps = props
    return null
  },
}))

jest.mock('../../components/common/table/SmartTable', () => ({
  __esModule: true,
  default: (props: any) => {
    mockSmartTableProps(props)
    return null
  },
}))

jest.mock('./create', () => ({
  __esModule: true,
  default: (props: any) => {
    mockCreateRecipeProps(props)
    return null
  },
}))

jest.mock('../../utilities/calcHeight', () => ({
  calcWindowHeight: jest.fn(() => 500),
}))

describe('Recipe page', () => {
  const defaultStore = {
    pageParams: {
      page: 1,
      per_page: 10,
      search: '',
      ordering: undefined,
      sortColumn: undefined,
      sortType: undefined,
    },
    setPageParams: jest.fn(),
  }

  const mockRecipesPayload = {
    data: {
      recipes: [
        {
          id: 1,
          name: 'Veg Salad',
          meal_category: 'Lunch',
          serving_unit: '1 bowl',
        },
      ],
      meta: {
        total_count: 1,
        current_page: 1,
        per_page: 10,
        total_pages: 1,
      },
    },
    isFetching: false,
  }

  const renderComponent = () => render(<Recipe />)

  beforeEach(() => {
    jest.clearAllMocks()
    mockListingHeaderLastProps = null
    mockUseAdminUserFilterStore.mockReturnValue({ ...defaultStore })
    mockUseRecipes.mockReturnValue({ ...mockRecipesPayload })
    mockGetRecipeColumns.mockReturnValue([
      { title: 'Name', field: 'name', customCell: false, isVisible: true },
    ])
  })

  it('renders listing header and passes recipe data to SmartTable', () => {
    renderComponent()

    expect(mockUseRecipes).toHaveBeenCalledWith({
      page: 1,
      per_page: 10,
      search: '',
      ordering: undefined,
    })

    expect(mockSmartTableProps).toHaveBeenCalled()
    const smartTableProps = mockSmartTableProps.mock.calls[0][0]

    expect(smartTableProps.data).toEqual(mockRecipesPayload.data.recipes)
    expect(smartTableProps.paginationProps).toEqual(
      expect.objectContaining({
        total: 1,
        currentPage: 1,
        rowsPerPage: 10,
      })
    )
  })

  it('opens the create drawer when the header action is triggered', () => {
    renderComponent()

    act(() => {
      mockListingHeaderLastProps?.onActionClick?.()
    })

    const lastCall =
      mockCreateRecipeProps.mock.calls[
        mockCreateRecipeProps.mock.calls.length - 1
      ]

    expect(lastCall?.[0]).toEqual(
      expect.objectContaining({ isDrawerOpen: true })
    )
  })
})
