import api, {
  assignRecipesToUser,
  useAssignRecipes,
  useUserRecipes,
} from '../Details/Recipe/recipes.api'

const mockGetData = jest.fn()
const mockPostData = jest.fn()
const mockUseQuery = jest.fn()
const mockUseMutation = jest.fn()
const mockUseQueryClient = jest.fn()
const mockEnqueueSnackbar = jest.fn()
const mockInvalidateQueries = jest.fn()

jest.mock('../../../apis/api.helpers', () => ({
  getData: (...args: any[]) => mockGetData(...args),
  postData: (...args: any[]) => mockPostData(...args),
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: (...args: any[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}))

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

describe('Recipe recipes.api', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    })
  })

  it('exports the expected api surface', () => {
    expect(api).toMatchObject({
      useUserRecipes,
      useAssignRecipes,
      assignRecipesToUser,
    })
  })

  it('builds the user recipes query with enabled=false when user id is missing', async () => {
    mockUseQuery.mockReturnValue({ data: null, isFetching: false })

    const params = { page: 2, per_page: 5, search: 'paneer' }
    const result = useUserRecipes(undefined, params)

    expect(result).toEqual({ data: null, isFetching: false })
    expect(mockUseQuery).toHaveBeenCalledWith(
      ['user_recipes', undefined, params],
      expect.any(Function),
      {
        enabled: false,
        staleTime: 5 * 60 * 1000,
      }
    )

    const queryFn = mockUseQuery.mock.calls[0][1]
    mockGetData.mockResolvedValue({ items: [] })
    await expect(queryFn()).resolves.toEqual({ items: [] })
    expect(mockGetData).toHaveBeenCalledWith(
      '/user_recipes?page=2&per_page=5&search=paneer'
    )
  })

  it('builds the user recipes query with enabled=true when user id exists', async () => {
    mockUseQuery.mockReturnValue({ data: { recipes: [] }, isFetching: false })

    const params = { page: 1, per_page: 10 }
    useUserRecipes('42', params)

    expect(mockUseQuery).toHaveBeenCalledWith(
      ['user_recipes', '42', params],
      expect.any(Function),
      {
        enabled: true,
        staleTime: 5 * 60 * 1000,
      }
    )

    const queryFn = mockUseQuery.mock.calls[0][1]
    mockGetData.mockResolvedValue({ recipes: [{ id: 1 }] })
    await expect(queryFn()).resolves.toEqual({ recipes: [{ id: 1 }] })
    expect(mockGetData).toHaveBeenCalledWith(
      '/user_recipes?page=1&per_page=10&user_id=42'
    )
  })

  it('posts recipe assignment payloads directly', async () => {
    const payload = {
      user_id: '88',
      recipe_ids: ['1', '2'],
      notes: 'Attach these',
    }
    mockPostData.mockResolvedValue({ message: 'ok' })

    await expect(assignRecipesToUser(payload)).resolves.toEqual({
      message: 'ok',
    })
    expect(mockPostData).toHaveBeenCalledWith('/user_recipes', payload)
  })

  it('configures assignment mutation success handling', () => {
    mockUseMutation.mockImplementation((_fn: any, options: any) => options)

    const mutationOptions = useAssignRecipes()

    mutationOptions.onSuccess()

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Recipes assigned successfully',
      { variant: 'success' }
    )
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['user_recipes'],
    })
  })

  it('configures assignment mutation error handling with api message fallback', () => {
    mockUseMutation.mockImplementation((_fn: any, options: any) => options)

    const mutationOptions = useAssignRecipes()

    mutationOptions.onError({
      response: { data: { message: 'Recipe assign failed' } },
    })
    mutationOptions.onError({})

    expect(mockEnqueueSnackbar).toHaveBeenNthCalledWith(1, 'Recipe assign failed', {
      variant: 'error',
    })
    expect(mockEnqueueSnackbar).toHaveBeenNthCalledWith(
      2,
      'Failed to assign recipes',
      {
        variant: 'error',
      }
    )
  })
})
