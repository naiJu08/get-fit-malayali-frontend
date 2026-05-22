import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'

import {
  useTemplateList,
  getTemplateDetails,
  createTemplate,
  useCreateTemplate,
  deleteTemplate,
  useDeleteTemplate,
  duplicateTemplate,
//   useDietTemplateCategories,
} from '../api'

import {
  getData,
  postData,
  deleteData,
  postFormData,
} from '../../../apis/api.helpers'

jest.mock('../../../apis/api.helpers')
jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    DIET_TEMPLATE: '/diet_templates',
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

describe('DietTemplate API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches diet template list via useTemplateList', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({
      diet_plan_templates: [],
      meta: { total_pages: 1, total_count: 0, current_page: 1 },
    } as any)

    const { result } = renderHook(
      () =>
        useTemplateList({
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
      '/diet_templates?page=1&per_page=10'
    )
  })

  it('calls getTemplateDetails with id', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({ diet_plan_template: {} } as any)

    await getTemplateDetails('123')
    expect(mockGetData).toHaveBeenCalledWith('/diet_templates/123')
  })

  it('calls createTemplate with payload', async () => {
    const mockPost = postFormData as jest.MockedFunction<typeof postFormData>
    mockPost.mockResolvedValue({ data: {} } as any)

    const payload = new FormData()
    payload.append('name', 'Test Template')
    payload.append('description', 'Test Description')

    await createTemplate(payload)
    expect(mockPost).toHaveBeenCalledWith('/diet_templates', payload)
  })

  it('calls deleteTemplate with id', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockResolvedValue({} as any)

    await deleteTemplate('1')
    expect(mockDelete).toHaveBeenCalledWith('/diet_templates/1')
  })

  it('calls duplicateTemplate with id', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({ data: { message: 'Duplicated' } } as any)

    await duplicateTemplate('1')
    expect(mockPost).toHaveBeenCalledWith('/diet_templates/1/duplicate', {})
  })

  it('useCreateTemplate shows success message on successful creation', async () => {
    const mockPost = postFormData as jest.MockedFunction<typeof postFormData>
    mockPost.mockResolvedValue({
      data: { message: 'Template created successfully' },
    } as any)

    const mockHandler = jest.fn()
    const { result } = renderHook(() => useCreateTemplate(mockHandler), {
      wrapper,
    })

    const payload = new FormData()
    payload.append('name', 'Test Template')
    payload.append('description', 'Test Description')

    await act(async () => {
      await result.current.mutateAsync(payload as any)
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Template created successfully',
        {
          variant: 'success',
        }
      )
    })
  })

  it('useCreateTemplate shows error message on failure', async () => {
    const mockPost = postFormData as jest.MockedFunction<typeof postFormData>
    mockPost.mockRejectedValue({
      response: { data: { error: 'Creation failed' } },
    })

    const mockHandler = jest.fn()
    const { result } = renderHook(() => useCreateTemplate(mockHandler), {
      wrapper,
    })

    const payload = new FormData()
    payload.append('name', 'Test Template')

    await act(async () => {
      try {
        await result.current.mutateAsync(payload as any)
      } catch {
        // ignore
      }
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        {
          variant: 'error',
        }
      )
    })
  })

  it('useDeleteTemplate shows success message on successful deletion', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockResolvedValue({
      message: 'Template deleted successfully',
    } as any)

    const mockHandler = jest.fn()
    const { result } = renderHook(() => useDeleteTemplate(mockHandler), {
      wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync('1' as any)
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Template deleted successfully',
        {
          variant: 'success',
        }
      )
    })
  })

  it('useDeleteTemplate shows error message on failure', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockRejectedValue({
      response: { data: { detail: 'Deletion failed' } },
    })

    const mockHandler = jest.fn()
    const { result } = renderHook(() => useDeleteTemplate(mockHandler), {
      wrapper,
    })

    await act(async () => {
      try {
        await result.current.mutateAsync('1' as any)
      } catch {
        // ignore
      }
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        {
          variant: 'error',
        }
      )
    })
  })
})
