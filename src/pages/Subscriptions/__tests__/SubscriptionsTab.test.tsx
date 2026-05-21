import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SubscriptionUserSubscriptionsTab from '../Details/SubscriptionsTab'

const mockGetSubscriptionPlanOverview = jest.fn()
const mockGetSubscriptionPlanDay = jest.fn()
const mockUpdateUserMealTimingMutate = jest.fn()
const mockEnqueueSnackbar = jest.fn()

jest.mock('../api', () => ({
  getSubscriptionPlanOverview: (...args: any[]) =>
    mockGetSubscriptionPlanOverview(...args),
  getSubscriptionPlanDay: (...args: any[]) => mockGetSubscriptionPlanDay(...args),
}))

jest.mock('../../AdminUser/api', () => ({
  useUpdateUserMealTiming: (onSuccess: () => Promise<void> | void) => ({
    mutate: (payload: any) => {
      mockUpdateUserMealTimingMutate(payload)
      onSuccess?.()
    },
    isLoading: false,
  }),
}))

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

jest.mock('../../../components/app/alertBox/infoBox', () => {
  const MockInfoBox = ({ content }: { content: string }) => (
    <div data-testid="info-box">{content}</div>
  )

  return MockInfoBox
})

jest.mock('../../../components/common', () => ({
  DialogModal: ({
    isOpen,
    title,
    body,
    onSubmit,
    secondaryAction,
    actionLabel,
  }: any) =>
    isOpen ? (
      <section data-testid="dialog-modal">
        <h2>{title}</h2>
        <div>{body}</div>
        <button type="button" onClick={onSubmit}>
          {actionLabel || 'Submit'}
        </button>
        <button type="button" onClick={secondaryAction}>
          Cancel
        </button>
      </section>
    ) : null,
}))

jest.mock('../../../components/common/tab', () => ({
  Tab: ({ children, id }: any) => (
    <div data-testid={`tab-panel-${id}`}>{children}</div>
  ),
  TabContainer: ({ data, activeTab, onClick, children }: any) => (
    <div data-testid="tab-container" data-active-tab={activeTab}>
      <div>
        {data.map((item: any) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onClick?.(item)}
            data-testid={`tab-button-${item.id}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  ),
}))

jest.mock('../../../components/common/drawer', () => {
  const MockDrawer = ({ open, title, children, handleClose }: any) =>
    open ? (
      <aside data-testid="custom-drawer">
        <div data-testid="drawer-title">{title}</div>
        <button type="button" onClick={handleClose}>
          Close drawer
        </button>
        {children}
      </aside>
    ) : null

  return MockDrawer
})

jest.mock('../../../components/common/inputs/TimeSplitPicker', () => {
  const MockTimeSplitPicker = ({ label, name, value, onChange }: any) => (
    <label>
      {label}
      <input
        aria-label={label}
        name={name}
        value={value || ''}
        onChange={(event) =>
          onChange({ name, value: event.currentTarget.value })
        }
      />
    </label>
  )

  return MockTimeSplitPicker
})

jest.mock('../../../components/common/icons', () => {
  const MockIcons = ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  )

  return MockIcons
})

const subscription = {
  id: 20,
  user_id: 10,
}

const overview = {
  subscription: {
    id: 20,
    plan_id: 5,
    plan_name: 'Premium Plan',
    plan_category: 'Weight Loss',
    start_date: '2026-05-01',
    end_date: '2026-05-31',
    status: 'active',
  },
  days: [
    {
      date: '2026-05-01',
      status: 'completed',
      diet_summary: { total_items: 5 },
      workout_summary: { total_exercises: 1 },
      yoga_summary: { total_exercises: 1 },
      meditation_summary: { total_items: 1 },
    },
    {
      date: '2026-05-02',
      status: 'upcoming',
      freeze: { reason: 'Travel' },
      diet_summary: { total_items: 1 },
    },
  ],
}

const dayDetail = {
  date: '2026-05-01',
  day_number: 1,
  total_proposed_calories: 1800,
  total_consumed_calories: 420,
  subscription: {
    diet_plan_template_id: 77,
    diet_plan_template_name: 'weight loss template',
  },
  diet_plans: [
    {
      id: 11,
      sequence_number: 1,
      meal_time: 'breakfast',
      meal_time_time: '08:30 AM',
      meal_name: 'morning meal',
      notes: 'Eat slowly',
      calories: 300,
      item_statuses: {
        completed_item_ids: [1],
        not_taken_mandatory_item_ids: [2],
      },
      items: [
        {
          id: 1,
          meal_name: 'oats bowl',
          requirement: 'mandatory',
          quantity: 1,
          serving_unit: 'bowl',
          serving_quantity: 2,
          actions: {
            status: 'completed',
            consumed_calories: 220,
          },
        },
        {
          id: 2,
          meal_name: 'fruit salad',
          requirement: 'optional',
          quantity: 1,
          serving_unit: 'cup',
          actions: {
            status: 'missed',
          },
        },
      ],
      other_consumed_items: [
        {
          id: 99,
          meal_name: 'extra nuts',
          meal_time: 'breakfast',
          consumed_quantity: 1,
          serving_unit: 'small cup',
          consumed_calories: 200,
        },
      ],
    },
  ],
  workout_plan: {
    title: 'Strength Day',
    description: 'Upper body',
    exercises: [
      {
        id: 1,
        workout_name: 'push ups',
        reps: 10,
        sets: 3,
        duration_minutes: 5,
        video_url: 'https://example.com/workout',
        actions: {
          status: 'completed',
          duration_seconds: 120,
          repeat_count: 2,
          video_watch_percentage: 80,
          notes: 'Good pace',
        },
      },
    ],
  },
  yoga_plan: {
    title: 'Morning Yoga',
    exercises: [
      {
        id: 2,
        yoga_name: 'sun salutation',
        duration_minutes: 10,
        actions: { status: 'in_progress', duration_seconds: 60 },
      },
    ],
  },
  meditation_plan: {
    title: 'Calm Mind',
    items: [
      {
        id: 3,
        meditation_name: 'breathing practice',
        duration_minutes: 8,
        actions: { status: 'today', duration_seconds: 100 },
      },
    ],
  },
}

describe('SubscriptionUserSubscriptionsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSubscriptionPlanOverview.mockResolvedValue(overview)
    mockGetSubscriptionPlanDay.mockResolvedValue(dayDetail)
  })

  it('shows fallback when subscription data is missing', () => {
    render(<SubscriptionUserSubscriptionsTab subscription={null} />)

    expect(screen.getByTestId('info-box')).toHaveTextContent(
      'No subscription data available.'
    )
    expect(mockGetSubscriptionPlanOverview).not.toHaveBeenCalled()
  })

  it('shows loading and renders overview calendar after API resolves', async () => {
    render(<SubscriptionUserSubscriptionsTab subscription={subscription} />)

    expect(screen.getByTestId('info-box')).toHaveTextContent(
      'Loading subscription overview...'
    )

    await waitFor(() => {
      expect(screen.getByText('Premium Plan')).toBeInTheDocument()
    })

    expect(mockGetSubscriptionPlanOverview).toHaveBeenCalledWith(10, 20)
    expect(screen.getByText('Category: Weight Loss')).toBeInTheDocument()
    expect(screen.getByText('May 2026')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View plan details/i })).toHaveAttribute(
      'href',
      '/plans/5'
    )
  })

  it('shows API error messages', async () => {
    mockGetSubscriptionPlanOverview.mockRejectedValueOnce({
      response: { data: { error: { message: 'Overview failed' } } },
    })

    render(<SubscriptionUserSubscriptionsTab subscription={subscription} />)

    await waitFor(() => {
      expect(screen.getByTestId('info-box')).toHaveTextContent(
        'Overview failed'
      )
    })
  })

  it('shows no overview when subscription ids are missing', () => {
    render(
      <SubscriptionUserSubscriptionsTab
        subscription={{ id: undefined, user_id: 10 }}
      />
    )

    expect(screen.getByTestId('info-box')).toHaveTextContent(
      'No overview available for this subscription.'
    )
    expect(mockGetSubscriptionPlanOverview).not.toHaveBeenCalled()
  })

  it('shows no calendar data when start or end dates are missing', async () => {
    mockGetSubscriptionPlanOverview.mockResolvedValueOnce({
      subscription: {
        id: 20,
        plan_name: 'Date Missing Plan',
        plan_category: '',
      },
      days: [],
    })

    render(<SubscriptionUserSubscriptionsTab subscription={subscription} />)

    await waitFor(() => {
      expect(screen.getByText('Date Missing Plan')).toBeInTheDocument()
    })
    expect(screen.getByText('Category: —')).toBeInTheDocument()
    expect(screen.getByText('No calendar data')).toBeInTheDocument()
  })

  it('opens day details drawer from a calendar day and renders all plan sections', async () => {
    render(<SubscriptionUserSubscriptionsTab subscription={subscription} />)

    await waitFor(() => expect(screen.getByText('Premium Plan')).toBeInTheDocument())

    fireEvent.click(screen.getAllByText('Diet')[0])

    await waitFor(() => {
      expect(mockGetSubscriptionPlanDay).toHaveBeenCalledWith(
        '10',
        '20',
        '2026-05-01'
      )
      expect(screen.getByTestId('custom-drawer')).toBeInTheDocument()
    })

    expect(screen.getByText('Plan Day 1 - May 1, 2026')).toBeInTheDocument()
    expect(screen.getByText('Weight Loss Template')).toBeInTheDocument()
    expect(screen.getByText('breakfast - 08:30 AM')).toBeInTheDocument()
    expect(screen.getByText('Morning Meal')).toBeInTheDocument()
    expect(screen.getByText(/1 missed/)).toBeInTheDocument()
    expect(screen.getByText('Oats Bowl')).toBeInTheDocument()
    expect(screen.getByText('Fruit Salad')).toBeInTheDocument()
    expect(screen.getByText('Other Items Consumed')).toBeInTheDocument()
    expect(screen.getByText('Extra Nuts')).toBeInTheDocument()
    expect(screen.getByText('Strength Day')).toBeInTheDocument()
    expect(screen.getByText('Push Ups')).toBeInTheDocument()
    expect(screen.getByText('Morning Yoga')).toBeInTheDocument()
    expect(screen.getByText('Sun Salutation')).toBeInTheDocument()
    expect(screen.getByText('Calm Mind')).toBeInTheDocument()
    expect(screen.getByText('Breathing Practice')).toBeInTheDocument()
  })

  it('opens calendar day details for a frozen day cell', async () => {
    render(<SubscriptionUserSubscriptionsTab subscription={subscription} />)

    await waitFor(() => expect(screen.getByText('Premium Plan')).toBeInTheDocument())

    fireEvent.click(screen.getByText('2'))

    await waitFor(() => {
      expect(mockGetSubscriptionPlanDay).toHaveBeenCalledWith(
        '10',
        '20',
        '2026-05-02'
      )
      expect(screen.getByTestId('custom-drawer')).toBeInTheDocument()
    })
  })

  it('updates meal timing with normalized payload and refreshes the selected day', async () => {
    render(<SubscriptionUserSubscriptionsTab subscription={subscription} />)

    await waitFor(() => expect(screen.getByText('Premium Plan')).toBeInTheDocument())
    fireEvent.click(screen.getAllByText('Diet')[0])
    await waitFor(() => expect(screen.getByLabelText('Edit meal time')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('Edit meal time'))
    expect(screen.getByText('Edit Meal Timing')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Time'), {
      target: { value: '09:15:00' },
    })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(mockUpdateUserMealTimingMutate).toHaveBeenCalledWith({
        userId: 10,
        payload: {
          user_meal_timing: {
            meal_time: 'BREAKFAST',
            time: '09:15 AM',
            diet_plan_template_id: 77,
            subscription_id: 20,
            sequence_number: 1,
          },
        },
      })
    })
    expect(mockGetSubscriptionPlanDay).toHaveBeenCalledTimes(2)
  })

  it('shows missing template error when saving meal timing without template id', async () => {
    mockGetSubscriptionPlanDay.mockResolvedValueOnce({
      ...dayDetail,
      subscription: {},
      diet_plan_template_id: null,
    })

    render(<SubscriptionUserSubscriptionsTab subscription={subscription} />)

    await waitFor(() => expect(screen.getByText('Premium Plan')).toBeInTheDocument())
    fireEvent.click(screen.getAllByText('Diet')[0])
    await waitFor(() => expect(screen.getByLabelText('Edit meal time')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('Edit meal time'))
    fireEvent.change(screen.getByLabelText('Time'), {
      target: { value: '09:15:00' },
    })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Missing required details: diet_plan_template_id',
        { variant: 'error' }
      )
    })
    expect(mockUpdateUserMealTimingMutate).not.toHaveBeenCalled()
  })
})
