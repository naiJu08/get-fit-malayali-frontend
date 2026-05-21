import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SubscriptionDetailsMain from '../Details'

const mockNavigate = jest.fn()
let mockId: string | undefined = '20'
let mockPathname = '/subscriptions/20'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: mockId }),
  useLocation: () => ({ pathname: mockPathname }),
}))

const mockGetSubscriptionDetails = jest.fn()

jest.mock('../api', () => ({
  getSubscriptionDetails: (...args: any[]) => mockGetSubscriptionDetails(...args),
}))

jest.mock('../../../components/app/alertBox/infoBox', () => {
  const MockInfoBox = ({ content }: { content: string }) => (
    <div data-testid="info-box">{content}</div>
  )

  return MockInfoBox
})

jest.mock('../../../components/common/icons', () => {
  const MockIcons = ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  )

  return MockIcons
})

jest.mock('../../../components/common/tab', () => ({
  Tab: ({ id, children }: any) => (
    <section data-testid={`tab-panel-${id}`}>{children}</section>
  ),
  TabContainer: ({ data, activeTab, onClick, children }: any) => (
    <div data-testid="tab-container" data-active-tab={activeTab}>
      <nav>
        {data.map((item: any) => (
          <button
            key={item.id}
            type="button"
            data-testid={`tab-button-${item.id}`}
            onClick={() => onClick?.(item)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {children}
    </div>
  ),
}))

jest.mock('../Details/SubscriptionsTab', () => {
  const MockSubscriptionsTab = ({ subscription }: any) => (
    <div data-testid="subscriptions-tab">
      subscriptions {subscription?.id}
    </div>
  )

  return MockSubscriptionsTab
})

jest.mock('../Details/BodyMeasurementsTab', () => {
  const MockBodyMeasurementsTab = ({ subscription }: any) => (
    <div data-testid="body-tab">body {subscription?.id}</div>
  )

  return MockBodyMeasurementsTab
})

jest.mock('../Details/VitalsTab', () => {
  const MockVitalsTab = ({ subscription }: any) => (
    <div data-testid="vitals-tab">vitals {subscription?.id}</div>
  )

  return MockVitalsTab
})

jest.mock('../Details/AdditionalInfoTab', () => {
  const MockAdditionalInfoTab = ({ subscription }: any) => (
    <div data-testid="additional-info-tab">additional {subscription?.id}</div>
  )

  return MockAdditionalInfoTab
})

jest.mock('../../AdminUser/Details/ReminderSettings', () => {
  const MockReminderSettings = ({ userId }: any) => (
    <div data-testid="reminders-tab">reminders {userId}</div>
  )

  return MockReminderSettings
})

jest.mock('../../AdminUser/Details/DietHistory', () => {
  const MockDietHistory = ({ subscriptionId }: any) => (
    <div data-testid="diet-history-tab">diet history {subscriptionId}</div>
  )

  return MockDietHistory
})

jest.mock('../../AdminUser/Details/Reports', () => {
  const MockReports = ({ user, subscriptionId }: any) => (
    <div data-testid="reports-tab">
      reports {user?.id} {user?.name} {subscriptionId}
    </div>
  )

  return MockReports
})

const subscription = {
  id: 20,
  user_id: 10,
  user_name: 'Anna Client',
  plan_id: 5,
  plan_name: 'Premium Plan',
  status: 'active',
  start_date: '2026-05-01',
  end_date: '2026-05-31',
  days_remaining: 45,
  plan_details: {
    category: 'Weight Loss',
    duration_days: 30,
    description: 'Structured plan',
  },
  freeze_details: {
    reason: 'Travel',
    start_date: '2026-05-10',
    end_date: '2026-05-12',
    updated_at: '2026-05-09',
    days: ['2026-05-10', '2026-05-11'],
    total_days: 2,
  },
}

describe('SubscriptionDetailsMain', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockId = '20'
    mockPathname = '/subscriptions/20'
    mockGetSubscriptionDetails.mockResolvedValue({ subscription })
  })

  it('shows loading state while details are being fetched', () => {
    mockGetSubscriptionDetails.mockImplementation(() => new Promise(() => {}))

    render(<SubscriptionDetailsMain />)

    expect(screen.getByTestId('info-box')).toHaveTextContent(
      'Loading subscription details...'
    )
  })

  it('shows API error messages and fallback error message', async () => {
    mockGetSubscriptionDetails.mockRejectedValueOnce({
      response: { data: { error: { message: 'Subscription failed' } } },
    })

    const { unmount } = render(<SubscriptionDetailsMain />)

    await waitFor(() => {
      expect(screen.getByTestId('info-box')).toHaveTextContent(
        'Subscription failed'
      )
    })

    unmount()
    mockGetSubscriptionDetails.mockRejectedValueOnce(new Error('No response'))
    render(<SubscriptionDetailsMain />)

    await waitFor(() => {
      expect(screen.getByTestId('info-box')).toHaveTextContent(
        'Failed to load details'
      )
    })
  })

  it('shows no details when route id is missing', async () => {
    mockId = undefined
    mockPathname = '/subscriptions'

    render(<SubscriptionDetailsMain />)

    await waitFor(() => {
      expect(screen.getByTestId('info-box')).toHaveTextContent(
        'No details found.'
      )
    })
    expect(mockGetSubscriptionDetails).not.toHaveBeenCalled()
  })

  it('renders details, status, dates, plan fields, and freeze metadata', async () => {
    render(<SubscriptionDetailsMain />)

    await waitFor(() => {
      expect(screen.getByText('Subscription Details')).toBeInTheDocument()
    })

    expect(mockGetSubscriptionDetails).toHaveBeenCalledWith('20')
    expect(screen.getAllByText('Premium Plan').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('For Anna Client')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    expect(screen.getByText('45 days remaining')).toBeInTheDocument()
    expect(screen.getByText('Anna Client')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('May 1, 2026')).toBeInTheDocument()
    expect(screen.getByText('May 31, 2026')).toBeInTheDocument()
    expect(screen.getByText('Weight Loss')).toBeInTheDocument()
    expect(screen.getByText('30 days')).toBeInTheDocument()
    expect(screen.getByText('Structured plan')).toBeInTheDocument()
    expect(screen.getByText('Frozen Details')).toBeInTheDocument()
    expect(screen.getByText('Travel')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('10-05-2026, 11-05-2026')).toBeInTheDocument()
  })

  it('navigates back to subscription listing', async () => {
    render(<SubscriptionDetailsMain />)

    await waitFor(() => {
      expect(screen.getByLabelText('Back')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Back'))
    expect(mockNavigate).toHaveBeenCalledWith('/subscriptions')
  })

  it('navigates when tab buttons are clicked', async () => {
    render(<SubscriptionDetailsMain />)

    await waitFor(() => {
      expect(screen.getByTestId('tab-button-subscriptions')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('tab-button-subscriptions'))
    expect(mockNavigate).toHaveBeenCalledWith('/subscriptions/20/subscriptions')

    fireEvent.click(screen.getByTestId('tab-button-details'))
    expect(mockNavigate).toHaveBeenCalledWith('/subscriptions/20')
  })

  it.each([
    ['/subscriptions/20/subscriptions', 'subscriptions-tab', 'subscriptions 20'],
    ['/subscriptions/20/body', 'body-tab', 'body 20'],
    ['/subscriptions/20/vitals', 'vitals-tab', 'vitals 20'],
    [
      '/subscriptions/20/additional-information',
      'additional-info-tab',
      'additional 20',
    ],
    ['/subscriptions/20/reminders', 'reminders-tab', 'reminders 10'],
    ['/subscriptions/20/diet-history', 'diet-history-tab', 'diet history 20'],
    ['/subscriptions/20/reports', 'reports-tab', 'reports 10 Anna Client 20'],
  ])('renders active child tab for %s', async (path, testId, text) => {
    mockPathname = path

    render(<SubscriptionDetailsMain />)

    await waitFor(() => {
      expect(screen.getByTestId(testId)).toHaveTextContent(text)
    })
  })

  it('normalizes alternate response shapes and fallback display values', async () => {
    mockGetSubscriptionDetails.mockResolvedValueOnce({
      data: {
        id: 30,
        user_id: null,
        user_name: '',
        plan_id: null,
        plan_name: '',
        status: 'expired',
        start_date: '',
        end_date: '',
        days_remaining: 0,
        freeze_reason: 'Flat freeze reason',
        freeze_start: '2026-06-01',
        freeze_end: '2026-06-02',
        freeze_updated_at: '2026-05-30',
        frozen_days: ['2026-06-01'],
        total_frozen_days: 1,
      },
    })

    render(<SubscriptionDetailsMain />)

    await waitFor(() => {
      expect(screen.getByText('Unnamed Plan')).toBeInTheDocument()
    })

    expect(screen.getByText('No user assigned')).toBeInTheDocument()
    expect(screen.getByText('EXPIRED')).toBeInTheDocument()
    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.getByText('No description available')).toBeInTheDocument()
    expect(screen.getByText('Flat freeze reason')).toBeInTheDocument()
    expect(screen.getByText('01-06-2026')).toBeInTheDocument()
  })

  it('falls back to details tab for unknown URL tab segment', async () => {
    mockPathname = '/subscriptions/20/not-a-tab'

    render(<SubscriptionDetailsMain />)

    await waitFor(() => {
      expect(screen.getByTestId('tab-container')).toHaveAttribute(
        'data-active-tab',
        'details'
      )
    })
  })
})
