import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'

import { editMyProfile, changePassword, updateProfileAttachment } from '../api'

import { getData, updateData, updateFromData } from '../../../apis/api.helpers'

jest.mock('../../../apis/api.helpers')

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
})
