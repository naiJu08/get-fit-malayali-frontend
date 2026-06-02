import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Subscriptions from '../Details/Subscriptions'

const mockUseAuthStore = jest.fn()
const mockEnqueueSnackbar = jest.fn()
const mockUsePlans = jest.fn()
const mockUseWorkoutList = jest.fn()
const mockUseYogaList = jest.fn()
const mockUseMeditationList = jest.fn()
const mockUseQuery = jest.fn()
const mockCreateSubscription = jest.fn()
const mockGetActivePlanOverview = jest.fn()
const mockGetOverviewDetail = jest.fn()
const mockFreezeSubscription = jest.fn()
const mockUnfreezeSubscription = jest.fn()
const mockWorkoutOverridesBulk = jest.fn()
const mockMeditationOverridesBulk = jest.fn()
const mockYogaOverridesBulk = jest.fn()
const mockGetWorkoutPlanSubcategories = jest.fn()
const mockGetData = jest.fn()

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: (...args: any[]) => mockUseQuery(...args),
  }
})

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: any) => mockUseAuthStore(selector),
}))

jest.mock('../../../components/common/snackbar', () => {
  const actual = jest.requireActual('../../../components/common/snackbar')
  return {
    ...actual,
    useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
  }
})

jest.mock('../../Plans/api', () => ({
  usePlans: (...args: any[]) => mockUsePlans(...args),
}))

jest.mock('../../Workout/api', () => ({
  useWorkoutList: (...args: any[]) => mockUseWorkoutList(...args),
}))

jest.mock('../../Yoga/api', () => ({
  useYogaList: (...args: any[]) => mockUseYogaList(...args),
}))

jest.mock('../../Meditation/api', () => ({
  useMeditationList: (...args: any[]) => mockUseMeditationList(...args),
}))

jest.mock('../../Plans/Details/WorkoutPlan/api', () => ({
  getWorkoutPlanSubcategories: (...args: any[]) =>
    mockGetWorkoutPlanSubcategories(...args),
}))

jest.mock('../../../apis/api.helpers', () => ({
  getData: (...args: any[]) => mockGetData(...args),
}))

jest.mock('../api', () => ({
  createSubscription: (...args: any[]) => mockCreateSubscription(...args),
  getActivePlanOverview: (...args: any[]) => mockGetActivePlanOverview(...args),
  getOverviewDetail: (...args: any[]) => mockGetOverviewDetail(...args),
  freezeSubscription: (...args: any[]) => mockFreezeSubscription(...args),
  unfreezeSubscription: (...args: any[]) => mockUnfreezeSubscription(...args),
  workoutOverridesBulk: (...args: any[]) => mockWorkoutOverridesBulk(...args),
  meditationOverridesBulk: (...args: any[]) =>
    mockMeditationOverridesBulk(...args),
  yogaOverridesBulk: (...args: any[]) => mockYogaOverridesBulk(...args),
  getAdminDetails: jest.fn(),
}))

jest.mock('../../../components/app/alertBox/infoBox', () => ({
  __esModule: true,
  default: ({ content }: any) => <div>{content}</div>,
}))

jest.mock('../../../components/common/buttons/Button', () => ({
  __esModule: true,
  default: ({ label, onClick, disabled }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
}))

jest.mock('qbs-core', () => ({
  AutoComplete: ({
    data = [],
    onChange,
    name,
    value,
    isMultiple,
    selectedItems = [],
  }: any) => {
    if (isMultiple) {
      return (
        <button
          type="button"
          data-testid={name}
          onClick={() => onChange?.(selectedItems)}
        >
          multi-select
        </button>
      )
    }

    return (
      <select
        data-testid={name}
        value={value || ''}
        onChange={(event) => {
          const option = data.find(
            (item: any) => String(item?.id ?? item?.value ?? '') === event.target.value
          )
          onChange?.(option)
        }}
      >
        <option value="">select</option>
        {data.map((item: any) => {
          const optionValue = String(item?.id ?? item?.value ?? '')
          const optionLabel = item?.name ?? item?.value ?? item?.label ?? optionValue
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          )
        })}
      </select>
    )
  },
}))

jest.mock('../../../components/common/drawer', () => ({
  __esModule: true,
  default: ({
    open,
    title,
    children,
    handleClose,
    handleSubmit,
    hideSubmit,
    disableSubmit,
    actionLabel = 'Submit',
  }: any) =>
    open ? (
      <div>
        <div>{typeof title === 'string' ? title : 'Drawer'}</div>
        <div>{children}</div>
        {handleClose && (
          <button type="button" onClick={handleClose}>
            Close Drawer
          </button>
        )}
        {!hideSubmit && handleSubmit && (
          <button type="button" onClick={handleSubmit} disabled={disableSubmit}>
            {actionLabel}
          </button>
        )}
      </div>
    ) : null,
}))

jest.mock('../../../components/common', () => ({
  DialogModal: ({
    isOpen,
    title,
    body,
    actionBody,
    onSubmit,
    actionLabel = 'Submit',
    secondaryAction,
    secondaryActionLabel = 'Close',
  }: any) =>
    isOpen ? (
      <div>
        <div>{title}</div>
        <div>{body}</div>
        <div>{actionBody}</div>
        {onSubmit && (
          <button type="button" onClick={onSubmit}>
            {actionLabel}
          </button>
        )}
        {secondaryAction && (
          <button type="button" onClick={secondaryAction}>
            {secondaryActionLabel}
          </button>
        )}
      </div>
    ) : null,
}))

jest.mock('../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: any) => <span>{name}</span>,
}))

jest.mock('../Details/DayDetailTabsSection', () => ({
  __esModule: true,
  default: ({
    onEditWorkoutPlan,
    onEditYogaPlan,
    onEditMeditationPlan,
  }: any) => (
    <div>
      <button type="button" onClick={onEditWorkoutPlan}>
        Edit Workout Plan
      </button>
      <button type="button" onClick={onEditYogaPlan}>
        Edit Yoga Plan
      </button>
      <button type="button" onClick={onEditMeditationPlan}>
        Edit Meditation Plan
      </button>
    </div>
  ),
}))

jest.mock('jspdf', () => {
  class MockJsPdf {
    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    }
    setFontSize = jest.fn()
    setFont = jest.fn()
    splitTextToSize = jest.fn((text: string) => [text])
    text = jest.fn()
    addPage = jest.fn()
    save = jest.fn()
    setDrawColor = jest.fn()
    setFillColor = jest.fn()
    rect = jest.fn()
    line = jest.fn()
    circle = jest.fn()
    triangle = jest.fn()
    setLineWidth = jest.fn()
    setTextColor = jest.fn()
    addImage = jest.fn()
  }

  return { __esModule: true, jsPDF: MockJsPdf, default: MockJsPdf }
})

const baseOverview = {
  subscription: {
    id: 'sub-1',
    plan_id: 'plan-1',
    plan_name: 'Weight Loss',
    plan_category: 'Fat loss',
    start_date: '2026-06-01',
    end_date: '2026-06-30',
    diet_plan_template_id: 10,
    status: 'active',
  },
  days: [
    {
      date: '2026-06-02',
      status: 'today',
      day_number: 1,
      diet_summary: { total_items: 3 },
      workout_summary: { total_exercises: 2 },
      yoga_summary: { total_exercises: 1 },
      meditation_summary: { total_items: 1 },
    },
  ],
}

const baseDayDetail = {
  date: '2026-06-02',
  workout_plan: {
    id: 'wp-1',
    exercises: [
      {
        id: 'w1',
        workout_id: 'w1',
        name: 'Burpees',
        category: {
          id: 'subcat-1',
          name: 'Cardio',
          main_category: { id: 'cat-1', name: 'Fitness' },
        },
      },
    ],
  },
  yoga_plan: {
    id: 'yp-1',
    exercises: [{ id: 'y1', yoga_id: 'y1', name: 'Surya Namaskar' }],
  },
  meditations: [{ id: 'm1', meditation_id: 'm1', title: 'Calm Mind' }],
}

const workoutListResponse = {
  workouts: [
    {
      id: 'w1',
      name: 'Burpees',
      category: {
        id: 'subcat-1',
        name: 'Cardio',
        main_category: { id: 'cat-1', name: 'Fitness' },
      },
      duration_minutes: 10,
      intensity_level: 'High',
    },
  ],
}

const yogaListResponse = {
  yogas: [
    {
      id: 'y1',
      name: 'Surya namaskar',
      duration_minutes: 15,
      intensity_level: 'Medium',
    },
  ],
}

const meditationListResponse = {
  meditations: [
    {
      id: 'm1',
      title: 'Calm Mind',
      duration_minutes: 5,
    },
  ],
  meta: {
    current_page: 1,
    total_pages: 1,
  },
}

describe('Subscriptions Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ roleData: { name: 'admin' } })
    )
    mockUsePlans.mockReturnValue({
      data: {
        plans: [{ id: 1, name: 'Slim Plan', active: true, duration_days: 30 }],
      },
    })
    mockUseWorkoutList.mockReturnValue({
      data: workoutListResponse,
      isLoading: false,
      isFetching: false,
    })
    mockUseYogaList.mockReturnValue({
      data: yogaListResponse,
      isFetching: false,
    })
    mockUseMeditationList.mockReturnValue({
      data: meditationListResponse,
      isFetching: false,
      refetch: jest.fn(),
    })
    mockUseQuery.mockReturnValue({
      data: {
        categories: [
          {
            id: 'cat-1',
            name: 'fitness',
            subcategories: [{ id: 'subcat-1', name: 'cardio' }],
          },
        ],
      },
    })
    mockGetWorkoutPlanSubcategories.mockResolvedValue([
      { id: 'subcat-1', value: 'cardio' },
    ])
    mockGetData.mockResolvedValue([])
    mockGetActivePlanOverview.mockResolvedValue(baseOverview)
    mockGetOverviewDetail.mockResolvedValue(baseDayDetail)
    mockCreateSubscription.mockResolvedValue({ message: 'created' })
    mockFreezeSubscription.mockResolvedValue({ message: 'frozen' })
    mockUnfreezeSubscription.mockResolvedValue({ message: 'unfrozen' })
    mockWorkoutOverridesBulk.mockResolvedValue({ message: 'ok' })
    mockMeditationOverridesBulk.mockResolvedValue({ message: 'ok' })
    mockYogaOverridesBulk.mockResolvedValue({ message: 'ok' })
    Object.defineProperty(window, 'location', {
      value: { reload: jest.fn() },
      writable: true,
    })
  })

  it('renders loading and error states', () => {
    const { rerender } = render(
      <Subscriptions
        id="1"
        user={{ id: 'u1' }}
        loading={true}
        error=""
        onRefresh={jest.fn()}
      />
    )

    expect(screen.getByText('Loading interested plans...')).toBeInTheDocument()

    rerender(
      <Subscriptions
        id="1"
        user={{ id: 'u1' }}
        loading={false}
        error="Failed to load subscriptions"
        onRefresh={jest.fn()}
      />
    )

    expect(
      screen.getByText('Failed to load subscriptions')
    ).toBeInTheDocument()
  })

  it('creates a subscription from the add subscription dialog', async () => {
    render(
      <Subscriptions
        id="1"
        user={{
          id: 'u1',
          interested_plans: [{ id: 1, name: 'Slim Plan', category: 'weight' }],
        }}
        loading={false}
        error=""
        onRefresh={jest.fn()}
      />
    )

    fireEvent.click(screen.getByText('Add Subscription'))
    expect(screen.getAllByText('Add Subscription')).toHaveLength(2)

    fireEvent.change(screen.getByTestId('plan_id'), {
      target: { value: '1' },
    })

    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-06-02' } })
    fireEvent.change(screen.getByPlaceholderText('Optional notes'), {
      target: { value: 'Created from test' },
    })

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(mockCreateSubscription).toHaveBeenCalled()
    })
  })

  it('renders overview, freezes subscription, and drives workout/yoga/meditation assignment flows', async () => {
    const findEnabledButton = (name: string) => {
      const buttons = screen
        .queryAllByRole('button', { name })
        .filter((button) => !button.hasAttribute('disabled'))
      return buttons[buttons.length - 1]
    }

    const clickEnabledButton = (name: string) => {
      const button = findEnabledButton(name)

      if (!button) {
        throw new Error(`Expected an enabled ${name} button`)
      }

      fireEvent.click(button)
    }

    render(
      <Subscriptions
        id="1"
        user={{ id: 'u1', subscribed_plan: { id: 'sub-1' } }}
        loading={false}
        error=""
        onRefresh={jest.fn()}
      />
    )

    expect(await screen.findByText('Update Subscription')).toBeInTheDocument()
    expect(mockGetActivePlanOverview).toHaveBeenCalledWith('u1')
    expect(await screen.findByText('Workout')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Freeze Subscription'))
    fireEvent.change(screen.getByPlaceholderText('Enter reason'), {
      target: { value: 'Pause for travel' },
    })

    const freezeInputs = document.querySelectorAll('input[name="start_date"], input[name="end_date"]')
    fireEvent.change(freezeInputs[0], { target: { value: '2026-06-05' } })
    fireEvent.change(freezeInputs[1], { target: { value: '2026-06-08' } })
    fireEvent.click(screen.getByRole('button', { name: 'Freeze' }))

    await waitFor(() => {
      expect(mockFreezeSubscription).toHaveBeenCalled()
    })

    fireEvent.click(await screen.findByText('Workout'))
    expect(await screen.findByText('Edit Workout Plan')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Edit Workout Plan'))
    if (!findEnabledButton('Next')) {
      fireEvent.click(screen.getByRole('checkbox'))
    }
    clickEnabledButton('Next')
    clickEnabledButton('Confirm')

    await waitFor(() => {
      expect(mockWorkoutOverridesBulk).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByText('Edit Yoga Plan'))
    if (!findEnabledButton('Next')) {
      const yogaCheckboxes = screen.getAllByRole('checkbox')
      fireEvent.click(yogaCheckboxes[yogaCheckboxes.length - 1])
    }
    clickEnabledButton('Next')
    clickEnabledButton('Confirm')

    await waitFor(() => {
      expect(mockYogaOverridesBulk).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByText('Edit Meditation Plan'))
    if (!findEnabledButton('Next')) {
      const meditationCheckboxes = screen.getAllByRole('checkbox')
      fireEvent.click(meditationCheckboxes[meditationCheckboxes.length - 1])
    }
    clickEnabledButton('Next')
    clickEnabledButton('Confirm')

    await waitFor(() => {
      expect(mockMeditationOverridesBulk).toHaveBeenCalled()
    })
  })

  it('downloads the assigned diet template as a PDF', async () => {
    mockGetData.mockResolvedValue({
      diet_plans: [
        {
          day_number: 1,
          sequence_number: 1,
          diet_plan_template_name: 'Balanced plate',
          meal_time: 'Breakfast',
          effective_total_calories: 350,
          items: [
            {
              meal_name: 'Oats',
              requirement: 'mandatory',
              quantity: 1,
              serving_unit: 'bowl',
              per_serving: {
                calories: 350,
                protein: 12,
                carbs: 55,
                fat: 8,
                fiber: 6,
              },
            },
          ],
        },
      ],
    })
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('skip images'))

    render(
      <Subscriptions
        id="1"
        user={{
          id: 'u1',
          name: 'Test Client',
          gender: 'female',
          weight: 65,
          height: 165,
          date_of_birth: '1995-01-01',
          subscribed_plan: { id: 'sub-1' },
        }}
        loading={false}
        error=""
        onRefresh={jest.fn()}
      />
    )

    const downloadButton = await screen.findByRole('button', {
      name: 'Download Diet Template',
    })
    await waitFor(() => {
      expect(downloadButton).toBeEnabled()
    })
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled()
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Diet template PDF downloaded successfully',
        { variant: 'success' }
      )
    })
  })

  it('shows validation errors when subscription form is submitted empty', async () => {
    render(
      <Subscriptions
        id="1"
        user={{ id: 'u1', interested_plans: [] }}
        loading={false}
        error=""
        onRefresh={jest.fn()}
      />
    )

    fireEvent.click(screen.getByText('Add Subscription'))
    fireEvent.click(screen.getByText('Save'))

    expect(mockCreateSubscription).not.toHaveBeenCalled()
    expect(screen.getAllByText('Required')).toHaveLength(3)
  })

  it('disables diet template download when no template is assigned', async () => {
    mockGetActivePlanOverview.mockResolvedValue({
      ...baseOverview,
      subscription: {
        ...baseOverview.subscription,
        diet_plan_template_id: null,
      },
    })

    render(
      <Subscriptions
        id="1"
        user={{ id: 'u1', subscribed_plan: { id: 'sub-1' } }}
        loading={false}
        error=""
        onRefresh={jest.fn()}
      />
    )

    const downloadButton = await screen.findByRole('button', {
      name: 'Download Diet Template',
    })
    expect(downloadButton).toBeDisabled()
  })

  it('unfreezes a subscription when freeze dates are available', async () => {
    const onRefresh = jest.fn()
    mockGetActivePlanOverview.mockResolvedValue({
      ...baseOverview,
      subscription: {
        ...baseOverview.subscription,
        is_frozen: true,
        freeze_dates: ['2026-06-05', '2026-06-06'],
      },
    })

    render(
      <Subscriptions
        id="1"
        user={{ id: 'u1', subscribed_plan: { id: 'sub-1' } }}
        loading={false}
        error=""
        onRefresh={onRefresh}
      />
    )

    fireEvent.click(await screen.findByText('Unfreeze Subscription'))
    fireEvent.click(screen.getByRole('button', { name: 'Unfreeze' }))

    await waitFor(() => {
      expect(mockUnfreezeSubscription).toHaveBeenCalledWith('sub-1', {
        unfreeze_dates: ['2026-06-05', '2026-06-06', '2026-06-01'],
      })
    })
    await waitFor(() =>
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Subscription unfrozen successfully',
        { variant: 'success' }
      )
    )
  })

  it('warns when unfreezing without any available freeze dates', async () => {
    mockGetActivePlanOverview.mockResolvedValue({
      ...baseOverview,
      subscription: {
        ...baseOverview.subscription,
        is_frozen: true,
        start_date: '',
        freeze_dates: [],
      },
    })

    render(
      <Subscriptions
        id="1"
        user={{ id: 'u1', subscribed_plan: { id: 'sub-1' } }}
        loading={false}
        error=""
        onRefresh={jest.fn()}
      />
    )

    fireEvent.click(await screen.findByText('Unfreeze Subscription'))
    fireEvent.click(screen.getByRole('button', { name: 'Unfreeze' }))

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Select at least one date to unfreeze',
      { variant: 'warning' }
    )
  })

  it('shows a missing-subscription-id error in the freeze flow', async () => {
    mockGetActivePlanOverview.mockResolvedValue({
      ...baseOverview,
      subscription: {
        ...baseOverview.subscription,
        id: '',
      },
    })

    render(
      <Subscriptions
        id="1"
        user={{ id: 'u1', subscribed_plan: { id: '' } }}
        loading={false}
        error=""
        onRefresh={jest.fn()}
      />
    )

    fireEvent.click(await screen.findByText('Freeze Subscription'))
    fireEvent.click(screen.getByRole('button', { name: 'Freeze' }))

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Missing subscription id',
      { variant: 'error' }
    )
  })

  it('shows freeze validation warnings and supports clearing freeze dates', async () => {
    render(
      <Subscriptions
        id="1"
        user={{ id: 'u1', subscribed_plan: { id: 'sub-1' } }}
        loading={false}
        error=""
        onRefresh={jest.fn()}
      />
    )

    expect(await screen.findByText('Update Subscription')).toBeInTheDocument()
    fireEvent.click(await screen.findByText('Freeze Subscription'))
    fireEvent.click(screen.getByRole('button', { name: 'Freeze' }))

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Please fill reason, start date and end date',
      { variant: 'warning' }
    )

    fireEvent.change(screen.getByPlaceholderText('Enter reason'), {
      target: { value: 'Pause' },
    })
    const freezeInputs = document.querySelectorAll(
      'input[name="start_date"], input[name="end_date"]'
    )
    fireEvent.change(freezeInputs[0], { target: { value: '2026-06-05' } })
    expect(
      screen.getByRole('button', { name: 'Clear freeze start date' })
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear freeze start date' })
    )

    fireEvent.change(freezeInputs[0], { target: { value: '2026-06-05' } })
    fireEvent.change(freezeInputs[1], { target: { value: '2026-06-06' } })
    expect(
      screen.getByRole('button', { name: 'Clear freeze end date' })
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear freeze end date' })
    )
  })

  it('surfaces API errors when freezing a subscription fails', async () => {
    mockFreezeSubscription.mockRejectedValue({
      response: { data: { message: 'Freeze failed' } },
    })

    render(
      <Subscriptions
        id="1"
        user={{ id: 'u1', subscribed_plan: { id: 'sub-1' } }}
        loading={false}
        error=""
        onRefresh={jest.fn()}
      />
    )

    expect(await screen.findByText('Update Subscription')).toBeInTheDocument()
    fireEvent.click(await screen.findByText('Freeze Subscription'))
    fireEvent.change(screen.getByPlaceholderText('Enter reason'), {
      target: { value: 'Emergency' },
    })
    const freezeInputs = document.querySelectorAll(
      'input[name="start_date"], input[name="end_date"]'
    )
    fireEvent.change(freezeInputs[0], { target: { value: '2026-06-05' } })
    fireEvent.change(freezeInputs[1], { target: { value: '2026-06-06' } })
    fireEvent.click(screen.getByRole('button', { name: 'Freeze' }))

    await waitFor(() =>
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Freeze failed', {
        variant: 'error',
      })
    )
  })

  it('handles invalid subscription dates and clear-date actions in the add drawer', async () => {
    render(
      <Subscriptions
        id="1"
        user={{ id: 'u1', interested_plans: [{ id: 1, name: 'Slim Plan' }] }}
        loading={false}
        error=""
        onRefresh={jest.fn()}
      />
    )

    fireEvent.click(screen.getByText('Add Subscription'))
    fireEvent.change(screen.getByTestId('plan_id'), {
      target: { value: '1' },
    })

    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-06-10' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-06-01' } })
    fireEvent.click(screen.getByText('Save'))

    expect(
      screen.getByText('End date cannot be before start date.')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear start date' }))
    expect((dateInputs[0] as HTMLInputElement).value).toBe('')

    fireEvent.change(dateInputs[0], { target: { value: '2026-06-12' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-06-20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Clear end date' }))
    expect((dateInputs[1] as HTMLInputElement).value).toBe('')
  })

  it('shows no-details feedback when day detail loading fails and supports day navigation', async () => {
    mockGetOverviewDetail
      .mockRejectedValueOnce(new Error('detail failed'))
      .mockResolvedValueOnce({
        ...baseDayDetail,
        date: '2026-06-03',
        day_number: 2,
      })

    render(
      <Subscriptions
        id="1"
        user={{ id: 'u1', subscribed_plan: { id: 'sub-1' } }}
        loading={false}
        error=""
        onRefresh={jest.fn()}
      />
    )

    fireEvent.click(await screen.findByText('Workout'))
    expect(await screen.findByText('No details available.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '3' }))

    await waitFor(() =>
      expect(mockGetOverviewDetail).toHaveBeenLastCalledWith('u1', '2026-06-03')
    )
  })

  it('shows the empty yoga state inside the assignment drawer', async () => {
    mockUseYogaList.mockReturnValue({
      data: { yogas: [] },
      isFetching: false,
    })
    mockUseMeditationList.mockReturnValue({
      data: { meditations: [], meta: { current_page: 1, total_pages: 1 } },
      isFetching: false,
      refetch: jest.fn(),
    })

    render(
      <Subscriptions
        id="1"
        user={{ id: 'u1', subscribed_plan: { id: 'sub-1' } }}
        loading={false}
        error=""
        onRefresh={jest.fn()}
      />
    )

    fireEvent.click(await screen.findByText('Workout'))
    expect(await screen.findByText('Edit Workout Plan')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Edit Yoga Plan'))
    expect(await screen.findByText('No yoga found.')).toBeInTheDocument()
  })

  it('shows the empty meditation state inside the assignment drawer', async () => {
    mockUseMeditationList.mockReturnValue({
      data: { meditations: [], meta: { current_page: 1, total_pages: 1 } },
      isFetching: false,
      refetch: jest.fn(),
    })

    render(
      <Subscriptions
        id="1"
        user={{ id: 'u1', subscribed_plan: { id: 'sub-1' } }}
        loading={false}
        error=""
        onRefresh={jest.fn()}
      />
    )

    fireEvent.click(await screen.findByText('Workout'))
    expect(await screen.findByText('Edit Workout Plan')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Edit Meditation Plan'))
    expect(await screen.findByText('No meditations found.')).toBeInTheDocument()
  })
})
