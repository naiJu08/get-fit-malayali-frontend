import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SubscriptionBodyCompositionTab from '../Details/BodyCompositionTab'

const mockUseBodyCompositions = jest.fn()

jest.mock('../../AdminUser/api', () => ({
  useBodyCompositions: (params: any) => mockUseBodyCompositions(params),
}))

jest.mock('../../../components/common/icons', () => {
  const MockIcons = ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  )

  return MockIcons
})

const subscription = {
  id: 99,
  user_id: 42,
}

const composition = {
  id: 1,
  recorded_at: '2026-05-21T08:00:00Z',
  fat_percentage: 22,
  muscle_mass: 31,
  hydration: 58,
  bone_mass: 3.2,
}

const originalConsoleError = console.error

describe('SubscriptionBodyCompositionTab', () => {
  beforeAll(() => {
    console.error = jest.fn((...args) => {
      const message = args[0]?.toString() || ''
      if (message.includes('ReactDOMTestUtils.act')) return
      ;(originalConsoleError as any)(...args)
    })
  })

  afterAll(() => {
    console.error = originalConsoleError
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls useBodyCompositions with subscription params and shows loading state', () => {
    mockUseBodyCompositions.mockReturnValue({
      data: undefined,
      isFetching: true,
    })

    render(<SubscriptionBodyCompositionTab subscription={subscription} />)

    expect(mockUseBodyCompositions).toHaveBeenCalledWith({
      user_id: 42,
      subscription_id: 99,
      page: 1,
      per_page: 10,
    })
    expect(screen.getByText('Loading body composition...')).toBeInTheDocument()
  })

  it('renders empty state when there are no body composition records', () => {
    mockUseBodyCompositions.mockReturnValue({
      data: { items: [], total_pages: 1 },
      isFetching: false,
    })

    render(<SubscriptionBodyCompositionTab subscription={subscription} />)

    expect(screen.getByTestId('icon-no-data-icon')).toBeInTheDocument()
    expect(screen.getByText('No body composition to display')).toBeInTheDocument()
  })

  it('renders date and all available body composition metrics', async () => {
    mockUseBodyCompositions.mockReturnValue({
      data: { items: [composition], total_pages: 1 },
      isFetching: false,
    })

    render(<SubscriptionBodyCompositionTab subscription={subscription} />)

    await waitFor(() => {
      expect(screen.getByText('2026')).toBeInTheDocument()
      expect(screen.getByText('May')).toBeInTheDocument()
      expect(screen.getByText('21')).toBeInTheDocument()
    })

    expect(screen.getByText('Fat %')).toBeInTheDocument()
    expect(screen.getByText('22%')).toBeInTheDocument()
    expect(screen.getByText('Muscle Mass')).toBeInTheDocument()
    expect(screen.getByText('31 kg')).toBeInTheDocument()
    expect(screen.getByText('Hydration')).toBeInTheDocument()
    expect(screen.getByText('58%')).toBeInTheDocument()
    expect(screen.getByText('Bone Mass')).toBeInTheDocument()
    expect(screen.getByText('3.2 kg')).toBeInTheDocument()
  })

  it('hides metric cards when values are null or undefined', async () => {
    mockUseBodyCompositions.mockReturnValue({
      data: {
        items: [
          {
            id: 2,
            recorded_at: null,
            fat_percentage: null,
            muscle_mass: undefined,
            hydration: null,
            bone_mass: undefined,
          },
        ],
        total_pages: 1,
      },
      isFetching: false,
    })

    render(<SubscriptionBodyCompositionTab subscription={subscription} />)

    await waitFor(() => {
      expect(screen.queryByText('No body composition to display')).not.toBeInTheDocument()
    })

    expect(screen.queryByText('Fat %')).not.toBeInTheDocument()
    expect(screen.queryByText('Muscle Mass')).not.toBeInTheDocument()
    expect(screen.queryByText('Hydration')).not.toBeInTheDocument()
    expect(screen.queryByText('Bone Mass')).not.toBeInTheDocument()
  })

  it('loads the next page and appends only new records', async () => {
    const firstPage = {
      data: { items: [composition], total_pages: 2 },
      isFetching: false,
    }
    const secondPage = {
      data: {
        items: [
          composition,
          {
            id: 3,
            recorded_at: '2026-05-22T08:00:00Z',
            fat_percentage: 21,
            muscle_mass: 32,
          },
        ],
        total_pages: 2,
      },
      isFetching: false,
    }

    mockUseBodyCompositions.mockImplementation((params: any) => {
      if (params.page === 2) {
        return secondPage
      }

      return firstPage
    })

    render(<SubscriptionBodyCompositionTab subscription={subscription} />)

    expect(await screen.findByText('22%')).toBeInTheDocument()
    fireEvent.click(screen.getByText('View more'))

    await waitFor(() => {
      expect(screen.getByText('21%')).toBeInTheDocument()
      expect(screen.queryByText('View more')).not.toBeInTheDocument()
    })
    expect(screen.getAllByText('22%')).toHaveLength(1)
    expect(mockUseBodyCompositions).toHaveBeenLastCalledWith({
      user_id: 42,
      subscription_id: 99,
      page: 2,
      per_page: 10,
    })
  })

  it('disables the view more button while fetching the next page', async () => {
    mockUseBodyCompositions.mockReturnValue({
      data: { items: [composition], total_pages: 2 },
      isFetching: true,
    })

    render(<SubscriptionBodyCompositionTab subscription={subscription} />)

    await waitFor(() =>
      expect(screen.getByText('Loading more...')).toBeDisabled()
    )
  })
})
