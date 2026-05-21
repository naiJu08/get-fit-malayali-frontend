import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'
import {
  useRecipes,
  createRecipe,
  useCreateRecipe,
  updateRecipe,
  useUpdateRecipe,
  deleteRecipe,
  useDeleteRecipe,
  getRecipeDetails,
} from '../api'
import {
  getData,
  postData,
  updateData,
  deleteData,
} from '../../../apis/api.helpers'

jest.mock('../../../apis/api.helpers')
jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    RECIPES: 'recipes',
  },
}))

const mockEnqueueSnackbar = jest.fn()
jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

jest.mock('../../../utilities/parsers', () => ({
  parseQueryParams: (params: Record<string, any> = {}) => {
    const entries = Object.entries(params).filter(
      ([, value]) => value !== '' && value !== undefined && value !== null
    )
    if (!entries.length) return ''
    return `?${entries
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
      )
      .join('&')}`
  },
  getErrorMessage: (error: any): string => {
    if (!error) return 'An unexpected error occurred'
    if (typeof error === 'string') return error
    if (error?.message) return String(error.message)
    return String(error)
  },
}))

const originalConsoleError = console.error

beforeAll(() => {
  console.error = jest.fn((...args) => {
    const message = args[0]?.toString() || ''
    if (
      message.includes('Fetch failed') ||
      message.includes('Create failed') ||
      message.includes('Update failed') ||
      message.includes('Delete failed')
    ) {
      return
    }
    originalConsoleError(...args)
  })
})

afterAll(() => {
  console.error = originalConsoleError
})

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: console.error,
    },
  })

const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient()
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  )
}

describe('Recipe API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── useRecipes ─────────────────────────────────────────────────────────

  describe('useRecipes', () => {
    it('should fetch recipes list successfully', async () => {
      const mockData = {
        recipes: [{ id: '1', name: 'Chicken Curry' }],
        meta: { total: 1 },
      }
      ;(getData as jest.Mock).mockResolvedValue(mockData)

      const { result } = renderHook(
        () => useRecipes({ page: 1, per_page: 10 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockData)
      expect(getData).toHaveBeenCalledWith('recipes?page=1&per_page=10')
    })

    it('should handle fetch error', async () => {
      ;(getData as jest.Mock).mockRejectedValue(new Error('Fetch failed'))

      const { result } = renderHook(
        () => useRecipes({ page: 1, per_page: 10 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })

    it('should include search parameter in URL', async () => {
      ;(getData as jest.Mock).mockResolvedValue({ recipes: [], meta: {} })

      const { result } = renderHook(
        () => useRecipes({ page: 1, per_page: 10, search: 'chicken' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(getData).toHaveBeenCalledWith(
        'recipes?page=1&per_page=10&search=chicken'
      )
    })

    it('should include ordering parameter in URL', async () => {
      ;(getData as jest.Mock).mockResolvedValue({ recipes: [], meta: {} })

      const { result } = renderHook(
        () => useRecipes({ page: 1, per_page: 10, ordering: '-name' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(getData).toHaveBeenCalledWith(
        'recipes?page=1&per_page=10&ordering=-name'
      )
    })

    it('should include category filter in URL', async () => {
      ;(getData as jest.Mock).mockResolvedValue({ recipes: [], meta: {} })

      const { result } = renderHook(
        () => useRecipes({ page: 1, per_page: 10, category: 'Lunch' } as any),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(getData).toHaveBeenCalledWith(
        'recipes?page=1&per_page=10&category=Lunch'
      )
    })
  })

  // ── Recipe helpers ─────────────────────────────────────────────────────

  describe('recipe helpers', () => {
    it('should fetch recipe details successfully', async () => {
      const mockData = { recipe: { id: '1', name: 'Chicken Curry' } }
      ;(getData as jest.Mock).mockResolvedValue(mockData)

      const result = await getRecipeDetails('1')

      expect(getData).toHaveBeenCalledWith('recipes/1')
      expect(result).toEqual(mockData)
    })

    it('should create recipe successfully', async () => {
      const payload = { name: 'New Recipe', meal_category: 'Lunch' }
      ;(postData as jest.Mock).mockResolvedValue({ id: '1', ...payload })

      const result = await createRecipe(payload)

      expect(postData).toHaveBeenCalledWith('recipes', payload)
      expect(result).toEqual({ id: '1', ...payload })
    })

    it('should update recipe successfully', async () => {
      const payload = { name: 'Updated Recipe' }
      ;(updateData as jest.Mock).mockResolvedValue({ id: '1', ...payload })

      const result = await updateRecipe('1', payload)

      expect(updateData).toHaveBeenCalledWith('recipes/1', payload)
      expect(result).toEqual({ id: '1', ...payload })
    })

    it('should delete recipe successfully', async () => {
      ;(deleteData as jest.Mock).mockResolvedValue({ success: true })

      const result = await deleteRecipe('1')

      expect(deleteData).toHaveBeenCalledWith('recipes/1')
      expect(result).toEqual({ success: true })
    })
  })

  // ── useCreateRecipe ────────────────────────────────────────────────────

  describe('useCreateRecipe', () => {
    it('should handle successful recipe creation', async () => {
      const mockData = { id: '1', name: 'New Recipe' }
      ;(postData as jest.Mock).mockResolvedValue(mockData)

      const { result } = renderHook(() => useCreateRecipe(), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({ name: 'New Recipe' })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Recipe created successfully',
        { variant: 'success' }
      )
    })

    it('should show errors array message on creation error', async () => {
      ;(postData as jest.Mock).mockRejectedValue({
        response: { data: { errors: ['Name is required'] } },
      })

      const { result } = renderHook(() => useCreateRecipe(), { wrapper })

      await act(async () => {
        await expect(
          result.current.mutateAsync({ name: '' })
        ).rejects.toEqual({
          response: { data: { errors: ['Name is required'] } },
        })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Name is required', {
        variant: 'error',
      })
    })

    it('should show message field on creation error', async () => {
      ;(postData as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Recipe already exists' } },
      })

      const { result } = renderHook(() => useCreateRecipe(), { wrapper })

      await act(async () => {
        await expect(
          result.current.mutateAsync({ name: 'Duplicate' })
        ).rejects.toEqual({
          response: { data: { message: 'Recipe already exists' } },
        })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Recipe already exists',
        { variant: 'error' }
      )
    })

    it('should show fallback creation error message', async () => {
      ;(postData as jest.Mock).mockRejectedValue({
        response: { data: {} },
      })

      const { result } = renderHook(() => useCreateRecipe(), { wrapper })

      await act(async () => {
        await expect(
          result.current.mutateAsync({ name: 'Test' })
        ).rejects.toEqual({
          response: { data: {} },
        })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'An unexpected error occurred',
        { variant: 'error' }
      )
    })

    it('should show error.message fallback when no response data', async () => {
      ;(postData as jest.Mock).mockRejectedValue({
        message: 'Network error',
      })

      const { result } = renderHook(() => useCreateRecipe(), { wrapper })

      await act(async () => {
        await expect(
          result.current.mutateAsync({ name: 'Test' })
        ).rejects.toEqual({
          message: 'Network error',
        })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Network error', {
        variant: 'error',
      })
    })
  })

  // ── useUpdateRecipe ────────────────────────────────────────────────────

  describe('useUpdateRecipe', () => {
    it('should handle successful recipe update', async () => {
      const mockData = { id: '1', name: 'Updated Recipe' }
      ;(updateData as jest.Mock).mockResolvedValue(mockData)

      const { result } = renderHook(() => useUpdateRecipe(), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({
          id: '1',
          payload: { name: 'Updated Recipe' },
        })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Recipe updated successfully',
        { variant: 'success' }
      )
    })

    it('should show errors array message on update error', async () => {
      ;(updateData as jest.Mock).mockRejectedValue({
        response: { data: { errors: ['Name cannot be empty'] } },
      })

      const { result } = renderHook(() => useUpdateRecipe(), { wrapper })

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            id: '1',
            payload: { name: '' },
          })
        ).rejects.toEqual({
          response: { data: { errors: ['Name cannot be empty'] } },
        })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Name cannot be empty',
        { variant: 'error' }
      )
    })

    it('should show message field on update error', async () => {
      ;(updateData as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Recipe not found' } },
      })

      const { result } = renderHook(() => useUpdateRecipe(), { wrapper })

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            id: '999',
            payload: { name: 'Test' },
          })
        ).rejects.toEqual({
          response: { data: { message: 'Recipe not found' } },
        })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Recipe not found', {
        variant: 'error',
      })
    })

    it('should show fallback update error message', async () => {
      ;(updateData as jest.Mock).mockRejectedValue({
        response: { data: {} },
      })

      const { result } = renderHook(() => useUpdateRecipe(), { wrapper })

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            id: '1',
            payload: { name: 'Test' },
          })
        ).rejects.toEqual({
          response: { data: {} },
        })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'An unexpected error occurred',
        { variant: 'error' }
      )
    })
  })

  // ── useDeleteRecipe ────────────────────────────────────────────────────

  describe('useDeleteRecipe', () => {
    it('should handle successful recipe deletion', async () => {
      ;(deleteData as jest.Mock).mockResolvedValue({ success: true })

      const { result } = renderHook(() => useDeleteRecipe(), { wrapper })

      await act(async () => {
        await result.current.mutateAsync('1')
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Recipe deleted successfully',
        { variant: 'success' }
      )
    })

    it('should show errors array message on deletion error', async () => {
      ;(deleteData as jest.Mock).mockRejectedValue({
        response: { data: { errors: ['Recipe has active assignments'] } },
      })

      const { result } = renderHook(() => useDeleteRecipe(), { wrapper })

      await act(async () => {
        await expect(result.current.mutateAsync('1')).rejects.toEqual({
          response: { data: { errors: ['Recipe has active assignments'] } },
        })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Recipe has active assignments',
        { variant: 'error' }
      )
    })

    it('should show message field on deletion error', async () => {
      ;(deleteData as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Recipe not found' } },
      })

      const { result } = renderHook(() => useDeleteRecipe(), { wrapper })

      await act(async () => {
        await expect(result.current.mutateAsync('999')).rejects.toEqual({
          response: { data: { message: 'Recipe not found' } },
        })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Recipe not found', {
        variant: 'error',
      })
    })

    it('should show fallback deletion error message', async () => {
      ;(deleteData as jest.Mock).mockRejectedValue({
        response: { data: {} },
      })

      const { result } = renderHook(() => useDeleteRecipe(), { wrapper })

      await act(async () => {
        await expect(result.current.mutateAsync('1')).rejects.toEqual({
          response: { data: {} },
        })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'An unexpected error occurred',
        { variant: 'error' }
      )
    })
  })
})
