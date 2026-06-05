import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import Recipes from '../Details/Recipe.tsx/Recipes'

jest.mock('../../Recipe/api', () => ({
  useRecipes: () => ({
    data: { recipes: [], meta: { current_page: 1, total_pages: 1 } },
    isFetching: false,
  }),
}))

jest.mock('../Details/Recipe.tsx/recipes.api', () => ({
  useUserRecipes: () => ({
    data: { recipes: [], meta: { total_count: 0, current_page: 1, per_page: 10 } },
    isFetching: false,
  }),
  useAssignRecipes: () => ({
    mutate: jest.fn(),
    isLoading: false,
  }),
}))

jest.mock('../../../layout/store', () => ({
  checkPermissions: () => false,
}))

jest.mock('../../../store/filterSore/adminUserStore', () => ({
  useAdminUserFilterStore: () => ({
    pageParams: { page: 1, per_page: 10, search: '', ordering: undefined },
    setPageParams: jest.fn(),
  }),
}))

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: jest.fn() }),
}))

describe('Recipes Component', () => {
  it('renders without crashing', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Recipes userId="1" />
        </MemoryRouter>
      </QueryClientProvider>
    )
  })
})
