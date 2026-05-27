import React from 'react'
import { render, screen, act, fireEvent, within, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import MeditationPlanIndex from '../index'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
}))

let mockRoleName = 'admin'
jest.mock('../../../../../store/authStore', () => ({
  useAuthStore: (selector: any) =>
    selector({ roleData: { name: mockRoleName } }),
}))

jest.mock('../../../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: jest.fn() }),
}))

jest.mock('../../../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>,
}))

const mockUseMeditationList = jest.fn()
jest.mock('../../../../Meditation/api', () => ({
  useMeditationList: (...args: any[]) => mockUseMeditationList(...args),
}))

const mockAssignAsync = jest.fn()
jest.mock('../api', () => ({
  useAssignMeditations: () => ({ mutateAsync: mockAssignAsync }),
}))

jest.mock('../../../../../components/common/drawer', () => {
  return function MockDrawer(props: any) {
    if (!props.open) return null
    return (
      <div data-testid="drawer">
        <div data-testid="drawer-title">{props.title}</div>
        <div data-testid="drawer-body">{props.children}</div>
        {props.handleSubmit && !props.hideSubmit ? (
          <button
            data-testid="drawer-submit"
            disabled={!!props.disableSubmit}
            onClick={props.handleSubmit}
          >
            Submit
          </button>
        ) : null}
      </div>
    )
  }
})

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  )

describe('MeditationPlanIndex', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRoleName = 'admin'
    mockUseMeditationList.mockReturnValue({
      data: { meditations: [] },
      isFetching: false,
      refetch: jest.fn(),
    })
    mockAssignAsync.mockResolvedValue({ message: 'ok' } as any)
  })

  it('registers assign CTA for admin', () => {
    const register = jest.fn()
    renderWithProviders(
      <MeditationPlanIndex planName="Meditations" registerAssignCTA={register} />
    )
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ visible: true, handler: expect.any(Function) })
    )
  })

  it('does not register CTA for nutritionist', () => {
    mockRoleName = 'nutritionist'
    const register = jest.fn()
    renderWithProviders(
      <MeditationPlanIndex planName="Meditations" registerAssignCTA={register} />
    )
    // when nutritionist, component sets CTA to null
    expect(register).toHaveBeenCalledWith(null)
  })

  it('handler opens assign drawer', async () => {
    const register = jest.fn()
    renderWithProviders(
      <MeditationPlanIndex planName="Meditations" registerAssignCTA={register} />
    )
    const config = register.mock.calls.find((c) => c[0]?.handler)?.[0]
    expect(config?.handler).toBeInstanceOf(Function)

    await act(async () => {
      config.handler()
    })

    expect(screen.getByTestId('drawer-title')).toHaveTextContent(
      'Assign Meditation'
    )
  })

  it('selects all, proceeds to review, and submits assignment', async () => {
    mockUseMeditationList.mockReturnValue({
      data: {
        meditations: [
          {
            id: 11,
            name: 'alpha meditation',
            video_url: 'https://youtu.be/abc',
          },
          {
            id: 12,
            title: 'beta meditation',
            video_url: 'https://youtube.com/watch?v=def',
          },
        ],
      },
      isFetching: false,
      refetch: jest.fn(),
    })

    const register = jest.fn()
    renderWithProviders(
      <MeditationPlanIndex planName="Meditations" registerAssignCTA={register} />
    )
    const config = register.mock.calls.find((c) => c[0]?.handler)?.[0]

    await act(async () => {
      config.handler()
    })

    expect(screen.getByTestId('drawer-title')).toHaveTextContent(
      'Assign Meditation'
    )

    const assignDrawer = screen.getByTestId('drawer')
    const assignBody = within(assignDrawer).getByTestId('drawer-body')
    await act(async () => {
      fireEvent.click(within(assignBody).getByText('Select All'))
    })

    await act(async () => {
      fireEvent.click(within(assignDrawer).getByTestId('drawer-submit'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('drawer-title')).toHaveTextContent(
        'Review & Order Meditations'
      )
    })

    const reviewDrawer = screen.getByTestId('drawer')
    await act(async () => {
      fireEvent.click(within(reviewDrawer).getByTestId('drawer-submit'))
    })

    expect(mockAssignAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: '1',
        payload: {
          meditations: [
            { meditation_id: 11, sequence_number: 1 },
            { meditation_id: 12, sequence_number: 2 },
          ],
        },
      })
    )
  })
})
