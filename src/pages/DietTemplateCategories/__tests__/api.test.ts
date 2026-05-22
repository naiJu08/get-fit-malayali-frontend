import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'

import {
  useDietTemplateCategories,
  createDietTemplateCategory,
  updateDietTemplateCategory,
  deleteDietTemplateCategory,
  useCreateDietTemplateCategory,
  useUpdateDietTemplateCategory,
  useDeleteDietTemplateCategory,
} from '../api'

import {
  getData,
  postData,
  deleteData,
  updateData,
} from '../../../apis/api.helpers'

jest.mock('../../../apis/api.helpers')
jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    TEMPLATE_CATEGORIES: '/diet_template_categories',
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
      ([, v]) => v !== '' && v !== undefined && v !== null
    )
    if (!entries.length) return ''
    const qs = entries
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
      )
      .join('&')
    return `?${qs}`
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
  console.error = jest.fn((...args: any[]) => {
    const first = args[0]
    const msg = typeof first === 'string' ? first : ''
    if (msg.includes('ReactDOMTestUtils.act')) return
    if (first && typeof first === 'object' && 'response' in first) return
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
  })

const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient()
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  )
}

describe('DietTemplateCategory API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches diet template categories list via useDietTemplateCategories', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({
      diet_template_categories: [],
      meta: { total_pages: 1 },
    } as any)

    const { result } = renderHook(
      () =>
        useDietTemplateCategories({
          page: 1,
          per_page: 10,
          search: '',
          ordering: '',
        } as any),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockGetData).toHaveBeenCalledWith(
      '/diet_template_categories?page=1&per_page=10'
    )
  })

  it('calls createDietTemplateCategory', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({} as any)

    const payload = {
      diet_template_category: {
        name: 'Breakfast',
        status: 'active',
      },
    }

    await createDietTemplateCategory(payload)
    expect(mockPost).toHaveBeenCalledWith('/diet_template_categories', payload)
  })

  it('calls updateDietTemplateCategory', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({} as any)

    const payload = {
      diet_template_category: {
        name: 'Updated Category',
        status: 'inactive',
      },
    }

    await updateDietTemplateCategory('1', payload)
    expect(mockUpdate).toHaveBeenCalledWith('/diet_template_categories/1', payload)
  })

  it('calls deleteDietTemplateCategory', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockResolvedValue({} as any)

    await deleteDietTemplateCategory('1')
    expect(mockDelete).toHaveBeenCalledWith('/diet_template_categories/1')
  })

  it('useCreateDietTemplateCategory shows success message on successful creation', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({
      message: 'Diet plan category created successfully',
    } as any)

    const { result } = renderHook(() => useCreateDietTemplateCategory(), {
      wrapper,
    })

    await act(async () => {
      result.current.mutate({
        diet_template_category: {
          name: 'New Category',
          status: 'active',
        },
      })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Diet plan category created successfully',
        { variant: 'success' }
      )
    })
  })

  it('useCreateDietTemplateCategory shows error message on failure', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockRejectedValue({
      response: { data: { message: 'Creation failed' } },
    })

    const { result } = renderHook(() => useCreateDietTemplateCategory(), {
      wrapper,
    })

    await act(async () => {
      result.current.mutate({
        diet_template_category: {
          name: 'Test',
          status: 'active',
        },
      })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Creation failed', {
        variant: 'error',
      })
    })
  })

  it('useUpdateDietTemplateCategory shows success message on successful update', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({
      message: 'Diet plan category updated successfully',
    } as any)

    const { result } = renderHook(() => useUpdateDietTemplateCategory(), {
      wrapper,
    })

    await act(async () => {
      result.current.mutate({
        id: '1',
        payload: {
          diet_template_category: {
            name: 'Updated',
            status: 'active',
          },
        },
      })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Diet plan category updated successfully',
        { variant: 'success' }
      )
    })
  })

  it('useUpdateDietTemplateCategory shows error message on failure', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockRejectedValue({
      response: { data: { message: 'Update failed' } },
    })

    const { result } = renderHook(() => useUpdateDietTemplateCategory(), {
      wrapper,
    })

    await act(async () => {
      result.current.mutate({
        id: '1',
        payload: {
          diet_template_category: {
            name: 'Updated',
            status: 'active',
          },
        },
      })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Update failed', {
        variant: 'error',
      })
    })
  })

  it('useDeleteDietTemplateCategory shows success message', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockResolvedValue({
      message: 'Diet plan category deleted successfully',
    } as any)

    const { result } = renderHook(() => useDeleteDietTemplateCategory(), {
      wrapper,
    })

    await act(async () => {
      result.current.mutate('1')
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Diet plan category deleted successfully',
        { variant: 'success' }
      )
    })
  })

  it('useDeleteDietTemplateCategory shows error message on failure', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockRejectedValue({
      response: { data: { message: 'Delete failed' } },
    })

    const { result } = renderHook(() => useDeleteDietTemplateCategory(), {
      wrapper,
    })

    await act(async () => {
      result.current.mutate('1')
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Delete failed', {
        variant: 'error',
      })
    })
  })

  it('useDietTemplateCategories handles search params correctly', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({
      diet_template_categories: [],
      meta: { total_pages: 1 },
    } as any)

    const { result } = renderHook(
      () =>
        useDietTemplateCategories({
          page: 2,
          per_page: 20,
          search: 'breakfast',
          ordering: 'name_asc',
          status: 'active',
        } as any),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockGetData).toHaveBeenCalledWith(
      '/diet_template_categories?page=2&per_page=20&search=breakfast&ordering=name_asc&status=active'
    )
  })

  it('useDietTemplateCategories invalidates query on mutation success', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({
      message: 'Diet plan category created successfully',
    } as any)

    const queryClient = createTestQueryClient()
    const queryWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      )
    }

    const { result } = renderHook(() => useCreateDietTemplateCategory(), {
      wrapper: queryWrapper,
    })

    await act(async () => {
      result.current.mutate({
        diet_template_category: {
          name: 'Test Category',
          status: 'active',
        },
      })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Diet plan category created successfully',
        { variant: 'success' }
      )
    })
  })
})