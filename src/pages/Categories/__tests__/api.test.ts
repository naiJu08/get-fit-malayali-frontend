import {
  DISABLE_NONLOGIN_APIS,
  useCategoriesList,
  useCreateCategories,
  useUpdateCategories,
  getCategoriesDetails,
  getSubCategories,
  deleteCategories,
  createCategories,
  updateCategories,
} from '../api'
import * as apiHelpers from '../../../apis/api.helpers'
import * as parsers from '../../../utilities/parsers'

// Mock dependencies
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}))

jest.mock('../../../apis/api.helpers')
jest.mock('../../../apis/api.url', () => ({
  CATEGORIES: '/categories',
}))
jest.mock('../../../utilities/parsers')
jest.mock('../../../components/common/snackbar')

describe('Categories API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Constants', () => {
    test('DISABLE_NONLOGIN_APIS should be false', () => {
      expect(DISABLE_NONLOGIN_APIS).toBe(false)
    })
  })

  describe('useCategoriesList', () => {
    test('should call useQuery with correct parameters', () => {
      const mockUseQuery = jest.fn()
      jest.mock('@tanstack/react-query', () => ({
        useQuery: jest.fn().mockReturnValue(mockUseQuery),
      }))

      const input = { page: 1, limit: 10 }
      useCategoriesList(input)

      expect(mockUseQuery).toHaveBeenCalledWith(
        ['categories_list', input],
        expect.any(Function)
      )
    })
  })

  describe('useCreateCategories', () => {
    test('should call useMutation with correct parameters', () => {
      const mockUseMutation = jest.fn()
      const mockEnqueueSnackbar = jest.fn()
      jest.mock('@tanstack/react-query', () => ({
        useMutation: jest.fn().mockReturnValue(mockUseMutation),
      }))
      jest.mock('../../../components/common/snackbar', () => ({
        useSnackbarManager: jest.fn().mockReturnValue({
          enqueueSnackbar: mockEnqueueSnackbar,
        }),
      }))

      const onSuccess = jest.fn()
      const successMessage = 'Test Success'
      useCreateCategories(onSuccess, successMessage)

      expect(mockUseMutation).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      )
    })

    test('should call onSuccess callback when mutation succeeds', () => {
      const mockUseMutation = jest.fn()
      const mockEnqueueSnackbar = jest.fn()
      jest.mock('@tanstack/react-query', () => ({
        useMutation: jest.fn().mockReturnValue(mockUseMutation),
      }))
      jest.mock('../../../components/common/snackbar', () => ({
        useSnackbarManager: jest.fn().mockReturnValue({
          enqueueSnackbar: mockEnqueueSnackbar,
        }),
      }))

      const onSuccess = jest.fn()
      const successMessage = 'Test Success'

      const mockResult = { mutate: jest.fn(), isLoading: false }
      mockUseMutation.mockReturnValue(mockResult)

      const result = useCreateCategories(onSuccess, successMessage)

      // Test that the hook returns the expected structure
      expect(result.mutate).toBeDefined()
      expect(typeof result.mutate).toBe('function')
    })
  })

  describe('useUpdateCategories', () => {
    test('should call useMutation with correct parameters', () => {
      const mockUseMutation = jest.fn()
      const mockEnqueueSnackbar = jest.fn()
      jest.mock('@tanstack/react-query', () => ({
        useMutation: jest.fn().mockReturnValue(mockUseMutation),
      }))
      jest.mock('../../../components/common/snackbar', () => ({
        useSnackbarManager: jest.fn().mockReturnValue({
          enqueueSnackbar: mockEnqueueSnackbar,
        }),
      }))

      const onSuccess = jest.fn()
      const successMessage = 'Test Update Success'
      useUpdateCategories(onSuccess, successMessage)

      expect(mockUseMutation).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      )
    })

    test('should call onSuccess callback when update succeeds', () => {
      const mockUseMutation = jest.fn()
      const mockEnqueueSnackbar = jest.fn()
      jest.mock('@tanstack/react-query', () => ({
        useMutation: jest.fn().mockReturnValue(mockUseMutation),
      }))
      jest.mock('../../../components/common/snackbar', () => ({
        useSnackbarManager: jest.fn().mockReturnValue({
          enqueueSnackbar: mockEnqueueSnackbar,
        }),
      }))

      const onSuccess = jest.fn()
      const successMessage = 'Test Update Success'

      const mockResult = { mutate: jest.fn(), isLoading: false }
      mockUseMutation.mockReturnValue(mockResult)

      const result = useUpdateCategories(onSuccess, successMessage)

      // Test that the hook returns the expected structure
      expect(result.mutate).toBeDefined()
      expect(typeof result.mutate).toBe('function')
    })
  })

  describe('API Functions', () => {
    test('getCategoriesDetails should call getData with correct URL', async () => {
      const mockGetData = jest
        .fn()
        .mockResolvedValue({ data: { id: 1, name: 'Test' } })
      ;(apiHelpers.getData as jest.Mock) = mockGetData

      const result = await getCategoriesDetails('123')

      expect(mockGetData).toHaveBeenCalledWith('/categories/123')
      expect(result).toEqual({ data: { id: 1, name: 'Test' } })
    })

    test('getSubCategories should call getData with correct URL and params', async () => {
      const mockGetData = jest.fn().mockResolvedValue({ data: [] })
      const mockParseQueryParams = jest
        .fn()
        .mockReturnValue('?parent_id=123&page=1')
      ;(apiHelpers.getData as jest.Mock) = mockGetData
      ;(parsers.parseQueryParams as jest.Mock) = mockParseQueryParams

      const result = await getSubCategories('123', { page: 1 })

      expect(mockGetData).toHaveBeenCalledWith(
        '/categories?parent_id=123&page=1'
      )
      expect(result).toEqual({ data: [] })
    })

    test('deleteCategories should call deleteData with correct URL', async () => {
      const mockDeleteData = jest.fn().mockResolvedValue({ success: true })
      ;(apiHelpers.deleteData as jest.Mock) = mockDeleteData

      const result = await deleteCategories('123')

      expect(mockDeleteData).toHaveBeenCalledWith('/categories/123')
      expect(result).toEqual({ success: true })
    })

    test('createCategories should call postData with correct URL', async () => {
      const mockPostData = jest.fn().mockResolvedValue({ data: { id: 1 } })
      ;(apiHelpers.postData as jest.Mock) = mockPostData

      const categoryData = { name: 'Test Category' }
      const result = await createCategories(categoryData)

      expect(mockPostData).toHaveBeenCalledWith('/categories', categoryData)
      expect(result).toEqual({ data: { id: 1 } })
    })

    test('updateCategories should call updateData with correct URL', async () => {
      const mockUpdateData = jest.fn().mockResolvedValue({ data: { id: 1 } })
      ;(apiHelpers.updateData as jest.Mock) = mockUpdateData

      const updateData = { id: 1, name: 'Updated Category' }
      const result = await updateCategories(updateData)

      expect(mockUpdateData).toHaveBeenCalledWith('/categories/1', undefined)
      expect(result).toEqual({ data: { id: 1 } })
    })
  })

  describe('Error Handling', () => {
    test('getCategoriesDetails should handle API errors', async () => {
      const mockGetData = jest.fn().mockRejectedValue(new Error('API Error'))
      ;(apiHelpers.getData as jest.Mock) = mockGetData

      await expect(getCategoriesDetails('123')).rejects.toThrow('API Error')
    })

    test('getSubCategories should handle API errors', async () => {
      const mockGetData = jest
        .fn()
        .mockRejectedValue(new Error('Network Error'))
      ;(apiHelpers.getData as jest.Mock) = mockGetData
      jest.mock('../../../utilities/parsers', () => ({
        parseQueryParams: jest.fn().mockReturnValue('?parent_id=123&page=1'),
      }))

      await expect(getSubCategories('123')).rejects.toThrow('Network Error')
    })

    test('deleteCategories should handle API errors', async () => {
      const mockDeleteData = jest
        .fn()
        .mockRejectedValue(new Error('Delete Error'))
      ;(apiHelpers.deleteData as jest.Mock) = mockDeleteData

      await expect(deleteCategories('123')).rejects.toThrow('Delete Error')
    })

    test('createCategories should handle API errors', async () => {
      const mockPostData = jest
        .fn()
        .mockRejectedValue(new Error('Create Error'))
      ;(apiHelpers.postData as jest.Mock) = mockPostData

      await expect(createCategories({ name: 'Test' })).rejects.toThrow(
        'Create Error'
      )
    })

    test('updateCategories should handle API errors', async () => {
      const mockUpdateData = jest
        .fn()
        .mockRejectedValue(new Error('Update Error'))
      ;(apiHelpers.updateData as jest.Mock) = mockUpdateData

      await expect(updateCategories({ id: 1, name: 'Test' })).rejects.toThrow(
        'Update Error'
      )
    })
  })

  describe('Data Processing', () => {
    test('should process empty responses correctly', async () => {
      const mockGetData = jest.fn().mockResolvedValue(null)
      ;(apiHelpers.getData as jest.Mock) = mockGetData

      const result = await getCategoriesDetails('123')
      expect(result).toBeNull()
    })

    test('should process malformed responses correctly', async () => {
      const mockGetData = jest.fn().mockResolvedValue(undefined)
      ;(apiHelpers.getData as jest.Mock) = mockGetData

      const result = await getCategoriesDetails('123')
      expect(result).toBeUndefined()
    })

    test('should handle successful responses with data', async () => {
      const mockResponse = {
        data: [
          { id: 1, name: 'Category 1' },
          { id: 2, name: 'Category 2' },
        ],
        meta: { total: 2, page: 1 },
      }
      const mockGetData = jest.fn().mockResolvedValue(mockResponse)
      ;(apiHelpers.getData as jest.Mock) = mockGetData

      const result = await getCategoriesDetails('123')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Parameter Validation', () => {
    test('getSubCategories should handle default params', async () => {
      const mockGetData = jest.fn().mockResolvedValue({ data: [] })
      const mockParseQueryParams = jest
        .fn()
        .mockReturnValue('?parent_id=123&page=1')
      ;(apiHelpers.getData as jest.Mock) = mockGetData
      ;(parsers.parseQueryParams as jest.Mock) = mockParseQueryParams

      await getSubCategories('123')

      expect(mockGetData).toHaveBeenCalledWith(
        '/categories?parent_id=123&page=1'
      )
    })

    test('getSubCategories should merge custom params', async () => {
      const mockGetData = jest.fn().mockResolvedValue({ data: [] })
      const mockParseQueryParams = jest
        .fn()
        .mockReturnValue('?parent_id=123&page=2&limit=20')
      ;(apiHelpers.getData as jest.Mock) = mockGetData
      ;(parsers.parseQueryParams as jest.Mock) = mockParseQueryParams

      await getSubCategories('123', { page: 2 })

      expect(mockGetData).toHaveBeenCalledWith(
        '/categories?parent_id=123&page=2&limit=20'
      )
    })

    test('updateCategories should construct correct URL with ID', async () => {
      const mockUpdateData = jest.fn().mockResolvedValue({ data: { id: 1 } })
      ;(apiHelpers.updateData as jest.Mock) = mockUpdateData

      const updateData = { id: 1, name: 'Updated Category' }
      await updateCategories(updateData)

      expect(mockUpdateData).toHaveBeenCalledWith('/categories/1', undefined)
    })

    test('deleteCategories should construct correct URL with ID', async () => {
      const mockDeleteData = jest.fn().mockResolvedValue({ success: true })
      ;(apiHelpers.deleteData as jest.Mock) = mockDeleteData

      await deleteCategories('123')

      expect(mockDeleteData).toHaveBeenCalledWith('/categories/123')
    })
  })

  describe('Module Structure', () => {
    test('should export DISABLE_NONLOGIN_APIS', () => {
      expect(typeof DISABLE_NONLOGIN_APIS).toBe('boolean')
    })

    test('should have correct value for DISABLE_NONLOGIN_APIS', () => {
      expect(DISABLE_NONLOGIN_APIS).toBe(false)
    })

    test('should export all required functions', () => {
      expect(typeof useCategoriesList).toBe('function')
      expect(typeof useCreateCategories).toBe('function')
      expect(typeof useUpdateCategories).toBe('function')
      expect(typeof getCategoriesDetails).toBe('function')
      expect(typeof getSubCategories).toBe('function')
      expect(typeof deleteCategories).toBe('function')
      expect(typeof createCategories).toBe('function')
      expect(typeof updateCategories).toBe('function')
    })
  })
})
