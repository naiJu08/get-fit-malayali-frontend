import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'
import {
  useYogaList,
  deleteYoga,
  getYogaDetails,
  useCreateYoga,
  useUpdateYoga,
  deActivateAdmin,
  deleteAdmin,
  freezeUser,
  unfreezeUser,
  getRoles,
  updatePassword,
  sendAdminInvitation,
  createYoga,
  updateYoga,
} from '../api'
import {
  getData,
  deleteData,
  postFormData,
  updateFromData,
  postData,
} from '../../../apis/api.helpers'
import apiUrl from '../../../apis/api.url'

// Mock the API helpers
jest.mock('../../../apis/api.helpers')
jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    YOGA: '/yoga',
    YOGA_DETAILS: '/yoga/:id',
    ADMIN_USER: '/admin-users',
  },
}))

// Mock snackbar manager
const mockEnqueueSnackbar = jest.fn()
jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

// Mock parsers
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
    if (Array.isArray(error) && error.length > 0) {
      const first = error[0]
      if (first?.ctx?.error) {
        if (Array.isArray(first.ctx.error)) return first.ctx.error.join(', ')
        return String(first.ctx.error)
      }
      if (first?.msg) {
        if (Array.isArray(first.msg)) return first.msg.join(', ')
        return String(first.msg)
      }
      return String(first)
    }
    if (error?.message) return String(error.message)
    return String(error)
  },
  getSortedColumnName: jest.fn((col: string, dir: string) => `${col}_${dir}`),
}))

// Suppress console.error for expected errors in tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Suppress specific expected error messages from TanStack Query
    const message = args[0]?.toString() || ''
    if (
      message.includes('API Error') ||
      message.includes('Network Error') ||
      message.includes('Yoga not found') ||
      message.includes('Failed to delete yoga') ||
      message.includes('Internal Server Error')
    ) {
      return
    }
    originalConsoleError(...args)
  })
})

afterAll(() => {
  console.error = originalConsoleError
})

const createTestQueryClient = () => {
  return new QueryClient({
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
}

const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient()
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  )
}

describe('Yoga API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useYogaList', () => {
    it('should fetch yoga list successfully', async () => {
      const mockData = { items: [{ id: '1', name: 'Test Yoga' }], total: 1 }
      ;(getData as jest.Mock).mockResolvedValue(mockData)

      const { result } = renderHook(
        () => useYogaList({ page: 1, page_size: 10 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual(mockData)
      })

      expect(getData).toHaveBeenCalledWith('/yoga?page=1&page_size=10')
    })

    it('should handle fetch error', async () => {
      const mockError = new Error('Fetch failed')
      ;(getData as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(
        () => useYogaList({ page: 1, page_size: 10 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('getYogaDetails', () => {
    it('should fetch yoga details successfully', async () => {
      const mockData = { id: '1', name: 'Test Yoga', description: 'Test Description' }
      ;(getData as jest.Mock).mockResolvedValue(mockData)

      const result = await getYogaDetails('1')

      expect(getData).toHaveBeenCalledWith('/yoga/1')
      expect(result).toEqual(mockData)
    })

    it('should handle get details error', async () => {
      const mockError = new Error('Details fetch failed')
      ;(getData as jest.Mock).mockRejectedValue(mockError)

      await expect(getYogaDetails('1')).rejects.toThrow('Details fetch failed')
    })
  })

  describe('deleteYoga', () => {
    it('should delete yoga successfully', async () => {
      const mockData = { success: true }
      ;(deleteData as jest.Mock).mockResolvedValue(mockData)

      const result = await deleteYoga('1')

      expect(deleteData).toHaveBeenCalledWith('/yoga/1')
      expect(result).toEqual(mockData)
    })

    it('should handle delete error', async () => {
      const mockError = new Error('Delete failed')
      ;(deleteData as jest.Mock).mockRejectedValue(mockError)

      await expect(deleteYoga('1')).rejects.toThrow('Delete failed')
    })
  })

  describe('createYoga', () => {
    it('should create yoga successfully', async () => {
      const mockData = { id: '1', name: 'New Yoga' }
      const formData = new FormData()
      formData.append('name', 'New Yoga')
      ;(postFormData as jest.Mock).mockResolvedValue(mockData)

      const result = await createYoga(formData)

      expect(postFormData).toHaveBeenCalledWith('/yoga', formData)
      expect(result).toEqual(mockData)
    })

    it('should handle create error', async () => {
      const mockError = new Error('Create failed')
      ;(postFormData as jest.Mock).mockRejectedValue(mockError)

      await expect(createYoga(new FormData())).rejects.toThrow('Create failed')
    })
  })

  describe('updateYoga', () => {
    it('should update yoga successfully', async () => {
      const mockData = { id: '1', name: 'Updated Yoga' }
      const updateData = { name: 'Updated Yoga' }
      ;(updateFromData as jest.Mock).mockResolvedValue(mockData)

      const result = await updateYoga({ id: '1', data: updateData })

      expect(updateFromData).toHaveBeenCalledWith('/yoga/1', updateData)
      expect(result).toEqual(mockData)
    })

    it('should handle update error', async () => {
      const mockError = new Error('Update failed')
      ;(updateFromData as jest.Mock).mockRejectedValue(mockError)

      await expect(updateYoga({ id: '1', data: {} })).rejects.toThrow('Update failed')
    })
  })

  describe('useCreateYoga', () => {
    it('should handle successful yoga creation', async () => {
      const mockData = { id: '1', name: 'New Yoga' }
      const mockHandleSubmission = jest.fn()
      ;(postFormData as jest.Mock).mockResolvedValue({ data: mockData })

      const { result } = renderHook(
        () => useCreateYoga(mockHandleSubmission),
        { wrapper }
      )

      await act(async () => {
        await result.current.mutateAsync(new FormData())
      })

      expect(postFormData).toHaveBeenCalledWith('/yoga', expect.any(FormData))
      expect(mockHandleSubmission).toHaveBeenCalledWith(mockData)
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Yoga created successfully', {
        variant: 'success',
      })
    })

    it('should handle creation error with errors array', async () => {
      const mockError = {
        response: {
          data: {
            errors: ['Name has already been taken', 'Description is required'],
          },
        },
      }
      const mockHandleSubmission = jest.fn()
      ;(postFormData as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(
        () => useCreateYoga(mockHandleSubmission),
        { wrapper }
      )

      try {
        await act(async () => {
          await result.current.mutateAsync(new FormData())
        })
      } catch (error) {
        // Expected to throw
      }

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Name has already been taken, Description is required',
        { variant: 'error' }
      )
      expect(mockHandleSubmission).not.toHaveBeenCalled()
    })

    it('should handle creation error with error field', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Validation failed',
          },
        },
      }
      const mockHandleSubmission = jest.fn()
      ;(postFormData as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(
        () => useCreateYoga(mockHandleSubmission),
        { wrapper }
      )

      try {
        await act(async () => {
          await result.current.mutateAsync(new FormData())
        })
      } catch (error) {
        // Expected to throw
      }

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Validation failed', {
        variant: 'error',
      })
    })

    it('should handle creation error with detail field', async () => {
      const mockError = {
        response: {
          data: {
            detail: 'Server error occurred',
          },
        },
      }
      const mockHandleSubmission = jest.fn()
      ;(postFormData as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(
        () => useCreateYoga(mockHandleSubmission),
        { wrapper }
      )

      try {
        await act(async () => {
          await result.current.mutateAsync(new FormData())
        })
      } catch (error) {
        // Expected to throw
      }

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Server error occurred', {
        variant: 'error',
      })
    })
  })

  describe('useUpdateYoga', () => {
    it('should handle successful yoga update', async () => {
      const mockData = { id: '1', name: 'Updated Yoga' }
      const mockHandleSubmission = jest.fn()
      ;(updateFromData as jest.Mock).mockResolvedValue({ data: mockData })

      const { result } = renderHook(
        () => useUpdateYoga(mockHandleSubmission),
        { wrapper }
      )

      await act(async () => {
        await result.current.mutateAsync({ id: '1', data: { name: 'Updated Yoga' } })
      })

      expect(updateFromData).toHaveBeenCalledWith('/yoga/1', { name: 'Updated Yoga' })
      expect(mockHandleSubmission).toHaveBeenCalledWith(mockData)
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Yoga updated successfully', {
        variant: 'success',
      })
    })

    it('should handle update error with detail field', async () => {
      const mockError = {
        response: {
          data: {
            detail: 'Update validation failed',
          },
        },
      }
      const mockHandleSubmission = jest.fn()
      ;(updateFromData as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(
        () => useUpdateYoga(mockHandleSubmission),
        { wrapper }
      )

      try {
        await act(async () => {
          await result.current.mutateAsync({ id: '1', data: {} })
        })
      } catch (error) {
        // Expected to throw
      }

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Update validation failed', {
        variant: 'error',
      })
    })

    it('should handle update error with message field', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Update failed',
          },
        },
      }
      const mockHandleSubmission = jest.fn()
      ;(updateFromData as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(
        () => useUpdateYoga(mockHandleSubmission),
        { wrapper }
      )

      try {
        await act(async () => {
          await result.current.mutateAsync({ id: '1', data: {} })
        })
      } catch (error) {
        // Expected to throw
      }

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Update failed', {
        variant: 'error',
      })
    })
  })

  describe('Admin User Functions', () => {
    it('should deactivate admin successfully', async () => {
      const mockData = { success: true }
      ;(updateFromData as jest.Mock).mockResolvedValue(mockData)

      const result = await deActivateAdmin('1')

      expect(updateFromData).toHaveBeenCalledWith('/admin-users/1/status', {})
      expect(result).toEqual(mockData)
    })

    it('should delete admin successfully', async () => {
      const mockData = { success: true }
      ;(deleteData as jest.Mock).mockResolvedValue(mockData)

      const result = await deleteAdmin('1')

      expect(deleteData).toHaveBeenCalledWith('/admin-users/1')
      expect(result).toEqual(mockData)
    })

    it('should freeze user successfully', async () => {
      const mockData = { success: true }
      const payload = { reason: 'Test', start_date: '2023-01-01', end_date: '2023-12-31' }
      ;(postData as jest.Mock).mockResolvedValue(mockData)

      const result = await freezeUser('1', payload)

      expect(postData).toHaveBeenCalledWith('/admin-users/1/freeze', payload)
      expect(result).toEqual(mockData)
    })

    it('should unfreeze user successfully', async () => {
      const mockData = { success: true }
      ;(postData as jest.Mock).mockResolvedValue(mockData)

      const result = await unfreezeUser('1')

      expect(postData).toHaveBeenCalledWith('/admin-users/1/unfreeze', {})
      expect(result).toEqual(mockData)
    })

    it('should get roles successfully', async () => {
      const result = await getRoles()

      expect(result).toEqual({ items: [], total: 0 })
    })

    it('should update password successfully', async () => {
      const mockData = { success: true }
      ;(updateFromData as jest.Mock).mockResolvedValue(mockData)

      const result = await updatePassword('1', 'newPassword')

      expect(updateFromData).toHaveBeenCalledWith('/admin-users/1/change_password', 'newPassword')
      expect(result).toEqual(mockData)
    })

    it('should send admin invitation successfully', async () => {
      const mockData = { success: true }
      ;(postData as jest.Mock).mockResolvedValue(mockData)

      const result = await sendAdminInvitation('1')

      expect(postData).toHaveBeenCalledWith('/admin-users/1/invite', {})
      expect(result).toEqual(mockData)
    })
  })
})
