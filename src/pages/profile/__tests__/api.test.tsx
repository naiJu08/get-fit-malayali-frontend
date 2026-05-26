import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'

import {
  changePassword,
  editMyProfile,
  updateProfileAttachment,
  useAssessor,
  useEditMyProfile,
} from '../api'

import { getData, updateData, updateFromData } from '../../../apis/api.helpers'

jest.mock('../../../apis/api.helpers')

const mockEnqueueSnackbar = jest.fn()
jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Profile API helpers', () => {
  beforeEach(() => jest.clearAllMocks())

  it('editMyProfile calls updateData with MY_PROFILE when domain not Organisation', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({ data: { success: true } } as any)

    await editMyProfile({
      input: { first_name: 'A' },
      domain: { domain: 'Assessor' },
    })

    expect(mockUpdate).toHaveBeenCalled()
  })

  it('editMyProfile uses my-profile path when domain is Organisation', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({ data: { success: true } } as any)

    await editMyProfile({
      input: { name: 'Org' },
      domain: { domain: 'Organisation' },
    })

    expect(mockUpdate).toHaveBeenCalledWith('my-profile', { name: 'Org' })
  })

  it('changePassword calls updateData with change_password', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({ data: {} } as any)

    await changePassword({
      new_password: 'Abcd1234!',
      confirm_password: 'Abcd1234!',
      old_password: 'old',
    })

    expect(mockUpdate).toHaveBeenCalledWith(
      'change_password',
      expect.any(Object)
    )
  })

  it('updateProfileAttachment calls updateFromData', async () => {
    const mockUpdateFrom = updateFromData as jest.MockedFunction<
      typeof updateFromData
    >
    mockUpdateFrom.mockResolvedValue({ data: {} } as any)

    const fd = new FormData()
    fd.append('file', 'dummy' as any)

    await updateProfileAttachment(fd)

    expect(mockUpdateFrom).toHaveBeenCalled()
  })

  it('useAssessor fetches profile for non-Organisation domain', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue({ user: { first_name: 'A' } } as any)

    const input: any = { currentDomain: 'Assessor', page: 1, page_size: 10 }
    const { result } = renderHook(() => useAssessor(input), { wrapper })

    await waitFor(() => {
      expect(result.current.data).toEqual({ user: { first_name: 'A' } })
    })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('profile'))
  })

  it('useAssessor fetches contact data for Organisation domain', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue([{ phone: '999' }] as any)

    const input: any = { currentDomain: 'Organisation', page: 1 }
    const { result } = renderHook(() => useAssessor(input), { wrapper })

    await waitFor(() => {
      expect(result.current.data).toEqual({ phone: '999' })
    })
    expect(mockGet).toHaveBeenCalledWith('contact')
  })

  it('useEditMyProfile triggers success snackbar and submission callback', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({ data: { ok: true } } as any)
    const handleSubmission = jest.fn()

    const { result } = renderHook(() => useEditMyProfile(handleSubmission), {
      wrapper,
    })

    await act(async () => {
      result.current.mutate({ input: { first_name: 'A' }, domain: { domain: 'X' } })
    })

    await waitFor(() => {
      expect(handleSubmission).toHaveBeenCalledWith({ ok: true })
    })
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Profile updated successfully',
      expect.any(Object)
    )
  })

  it('useEditMyProfile triggers error snackbar on failure', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockRejectedValue({
      response: { data: { detail: 'Nope' } },
    } as any)

    const { result } = renderHook(() => useEditMyProfile(jest.fn()), { wrapper })

    await act(async () => {
      result.current.mutate({ input: { first_name: 'A' }, domain: { domain: 'X' } })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalled()
    })
  })
})
