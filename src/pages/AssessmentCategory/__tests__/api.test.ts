import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'

import {
  useAssessmentCategories,
  getAssessmentCategoryDetails,
  createAssessmentCategory,
  updateAssessmentCategory,
  deleteAssessmentCategory,
  useCreateAssessmentCategory,
  useUpdateAssessmentCategory,
  useDeleteAssessmentCategory,
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
    ASSESSSMENT_CATEGORY: '/assessment_categories',
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

describe('AssessmentCategory API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches assessment categories list via useAssessmentCategories', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({
      assessment_categories: [],
      meta: { total_pages: 1 },
    } as any)

    const { result } = renderHook(
      () =>
        useAssessmentCategories({
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
      '/assessment_categories?page=1&per_page=10'
    )
  })

  it('calls getAssessmentCategoryDetails', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({} as any)
    await getAssessmentCategoryDetails('123')
    expect(mockGetData).toHaveBeenCalledWith('/assessment_categories/123')
  })

  it('calls createAssessmentCategory', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({} as any)

    const payload = {
      name: 'Health Assessment',
      description: 'Test description',
      status: 'active',
      assessment_questions: [{ question_text: 'Question 1' }],
    }

    await createAssessmentCategory(payload)
    expect(mockPost).toHaveBeenCalledWith('/assessment_categories', payload)
  })

  it('calls updateAssessmentCategory', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({} as any)

    const payload = {
      name: 'Updated Assessment',
      description: 'Updated description',
    }

    await updateAssessmentCategory('1', payload)
    expect(mockUpdate).toHaveBeenCalledWith('/assessment_categories/1', payload)
  })

  it('calls deleteAssessmentCategory', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockResolvedValue({} as any)

    await deleteAssessmentCategory('1')
    expect(mockDelete).toHaveBeenCalledWith('/assessment_categories/1')
  })

  it('useCreateAssessmentCategory shows success message on successful creation', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({
      message: 'Assessment category created successfully',
    } as any)

    const { result } = renderHook(() => useCreateAssessmentCategory(), {
      wrapper,
    })

    await act(async () => {
      result.current.mutate({
        name: 'New Category',
        status: 'active',
        assessment_questions: [{ question_text: 'Q1' }],
      })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Assessment category created successfully',
        { variant: 'success' }
      )
    })
  })

  it('useCreateAssessmentCategory shows error message on failure', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockRejectedValue({
      response: { data: { message: 'Creation failed' } },
    })

    const { result } = renderHook(() => useCreateAssessmentCategory(), {
      wrapper,
    })

    await act(async () => {
      result.current.mutate({
        name: 'Test',
        status: 'active',
        assessment_questions: [{ question_text: 'Q1' }],
      })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Creation failed', {
        variant: 'error',
      })
    })
  })

  it('useUpdateAssessmentCategory shows success message on successful update', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({
      message: 'Assessment category updated successfully',
    } as any)

    const { result } = renderHook(() => useUpdateAssessmentCategory(), {
      wrapper,
    })

    await act(async () => {
      result.current.mutate({
        id: '1',
        payload: { name: 'Updated', status: 'active' },
      })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Assessment category updated successfully',
        { variant: 'success' }
      )
    })
  })

  it('useDeleteAssessmentCategory shows success message', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockResolvedValue({
      message: 'Assessment category deleted successfully',
    } as any)

    const { result } = renderHook(() => useDeleteAssessmentCategory(), {
      wrapper,
    })

    await act(async () => {
      result.current.mutate('1')
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Assessment category deleted successfully',
        { variant: 'success' }
      )
    })
  })
})
