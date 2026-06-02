import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import DayDetailTabsSection from '../Details/DayDetailTabsSection'

const mockNavigate = jest.fn()
const mockEnqueueSnackbar = jest.fn()
const mockAssignTemplateMutateAsync = jest.fn(async () => ({}))
const mockUpdateUserMealTimingMutate = jest.fn()
let mockMealTimingSuccess: any = null

jest.mock('../api', () => ({
  assignDietPlanTemplate: jest.fn(),
  useUpdateUserMealTiming: jest.fn(),
}))

const reactQuery = require('@tanstack/react-query')

const dietTemplateApi = require('../../DietTemplate/api')
const dietTemplateCategoriesApi = require('../../DietTemplateCategories/api')

jest.mock('../../../components/common/snackbar', () => {
  const actual = jest.requireActual('../../../components/common/snackbar')
  return {
    ...actual,
    useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
  }
})

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../components/common/icons', () => (props: any) => (
  <span data-testid={`icon-${props?.name ?? 'unknown'}`} />
))

jest.mock('../../../components/common/tab', () => ({
  TabContainer: ({ children, data = [], onClick }: any) => (
    <div>
      {data.map((item: any) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onClick?.(item)}
        >
          {item.label}
        </button>
      ))}
      {children}
    </div>
  ),
  Tab: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('../../../components/common/drawer', () => (props: any) =>
  props?.open ? (
    <div data-testid="drawer">
      <div>{props?.title}</div>
      {props?.children}
      <button
        data-testid="drawer-submit"
        type="button"
        onClick={props?.handleSubmit}
        disabled={props?.disableSubmit}
      >
        {props?.actionLabel ?? 'submit'}
      </button>
      <button type="button" onClick={props?.handleClose}>
        close
      </button>
    </div>
  ) : null
)

jest.mock('../../../components/common', () => ({
  DialogModal: (props: any) =>
    props?.isOpen ? (
      <div data-testid="dialog">
        <div>{props?.title}</div>
        {props?.body}
        <button type="button" onClick={props?.onSubmit}>
          {props?.actionLabel ?? 'submit'}
        </button>
        <button type="button" onClick={props?.secondaryAction}>
          cancel
        </button>
      </div>
    ) : null,
}))

jest.mock('../../../components/common/inputs/TimeSplitPicker', () => (props: any) => (
  <input
    aria-label={props?.label ?? 'Time'}
    value={props?.value ?? ''}
    onChange={(e) => props?.onChange?.({ value: e.target.value })}
  />
))

describe('DayDetailTabsSection', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    const api = jest.requireMock('../api')
    api.useUpdateUserMealTiming.mockReset()
    api.useUpdateUserMealTiming.mockImplementation((callback: any) => {
      mockMealTimingSuccess = callback
      return {
        mutate: mockUpdateUserMealTimingMutate,
        isLoading: false,
      }
    })
    mockNavigate.mockReset()
    mockEnqueueSnackbar.mockReset()
    mockAssignTemplateMutateAsync.mockReset()
    mockAssignTemplateMutateAsync.mockResolvedValue({})
    mockUpdateUserMealTimingMutate.mockReset()
    mockMealTimingSuccess = null
    Object.defineProperty(window, 'location', {
      value: { reload: jest.fn() },
      writable: true,
    })

    jest.spyOn(reactQuery, 'useMutation').mockReturnValue({
      mutateAsync: mockAssignTemplateMutateAsync,
      isLoading: false,
    } as any)

    jest.spyOn(dietTemplateApi, 'useTemplateList').mockReturnValue({
      data: {
        diet_plan_templates: [
          {
            id: 1,
            name: 'starter',
            duration_days: 7,
            total_meals: 5,
            calories: 1800,
          },
        ],
        meta: { total_pages: 1, total_count: 1 },
      },
      isFetching: false,
    } as any)

    jest
      .spyOn(dietTemplateCategoriesApi, 'useDietTemplateCategories')
      .mockReturnValue({
        data: { diet_template_categories: [{ id: 'c1', name: 'Cat' }] },
      } as any)
  })

  it('renders day detail sections, opens template drawer, and triggers assignment', async () => {
    const refreshDayDetail = jest.fn()
    render(
      <DayDetailTabsSection
        dayDetail={{
          date: '2099-01-01',
          status: 'pending',
          total_proposed_calories: 2000,
          total_consumed_calories: 1500,
          subscription: { id: 'sub-1', diet_plan_template_id: null },
          diet_plans: [
            {
              id: 'meal-1',
              sequence_number: 1,
              meal_time: 'Breakfast',
              meal_time_time: '07:00 AM',
              calories: 400,
              items: [{ id: 'it-1', meal_name: 'egg', actions: { status: 'completed', consumed_calories: 100 } }],
              item_statuses: { completed_item_ids: ['it-1'], not_taken_mandatory_item_ids: ['x'] },
            },
          ],
          workout_plan: {
            title: 'Workout',
            exercises: [{ id: 'w1', workout_name: 'push up', actions: { status: 'completed', duration_seconds: 120 } }],
          },
          meditation_plan: { items: [{ id: 'm1', name: 'breathing' }] },
        }}
        dayDetailTab="diet"
        onChangeTab={jest.fn()}
        isNutritionist={false}
        onEditWorkoutPlan={jest.fn()}
        onEditYogaPlan={jest.fn()}
        onEditMeditationPlan={jest.fn()}
        refreshDayDetail={refreshDayDetail}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Assign Template/i }))
    expect(screen.getByTestId('drawer')).toBeInTheDocument()

    // Select template and submit via drawer
    fireEvent.click(screen.getByText(/starter/i))
    fireEvent.click(screen.getByTestId('drawer-submit'))

    expect(mockAssignTemplateMutateAsync).toHaveBeenCalledWith({
      subscriptionId: 'sub-1',
      payload: { diet_plan_template_id: 1 },
    })

    const [, options] = reactQuery.useMutation.mock.calls[0]
    await options.onSuccess()

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Template assigned successfully',
      { variant: 'success' }
    )
    expect(refreshDayDetail).toHaveBeenCalled()
    expect(window.location.reload).toHaveBeenCalledTimes(1)
  })

  it('opens meal time edit modal and shows missing required details error path', async () => {
    render(
      <DayDetailTabsSection
        dayDetail={{
          subscription: { id: '' },
          diet_plans: [
            {
              id: 'meal-1',
              sequence_number: 1,
              meal_time: 'Breakfast',
              meal_time_time: '07:00 AM',
              items: [],
              item_statuses: {},
            },
          ],
        }}
        dayDetailTab="diet"
        onChangeTab={jest.fn()}
        isNutritionist={false}
        onEditWorkoutPlan={jest.fn()}
        onEditYogaPlan={jest.fn()}
        onEditMeditationPlan={jest.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText(/Edit meal time/i))
    expect(screen.getByTestId('dialog')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Time'), {
      target: { value: '08:00:00' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Save/i }))

    await waitFor(() =>
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Missing required details: user_id, subscription_id, diet_plan_template_id',
        { variant: 'error' }
      )
    )
  })

  it('updates meal timing when all required details exist', async () => {
    render(
      <DayDetailTabsSection
        dayDetail={{
          subscription: {
            id: 'sub-22',
            diet_plan_template_id: 101,
          },
          user: { id: 'user-44' },
          diet_plans: [
            {
              id: 'meal-1',
              sequence_number: 2,
              meal_time: 'Breakfast',
              meal_time_time: '07:00 AM',
              items: [],
              item_statuses: {},
            },
          ],
        }}
        dayDetailTab="diet"
        onChangeTab={jest.fn()}
        isNutritionist={false}
        onEditWorkoutPlan={jest.fn()}
        onEditYogaPlan={jest.fn()}
        onEditMeditationPlan={jest.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText(/Edit meal time/i))
    fireEvent.change(screen.getByLabelText('Time'), {
      target: { value: '13:30:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Save/i }))

    await waitFor(() =>
      expect(mockUpdateUserMealTimingMutate).toHaveBeenCalledWith({
        userId: 'user-44',
        payload: {
          user_meal_timing: {
            meal_time: 'BREAKFAST',
            time: '01:30 PM',
            diet_plan_template_id: 101,
            subscription_id: 'sub-22',
            sequence_number: 2,
          },
        },
      })
    )
  })

  it('closes the meal-time dialog after a successful update and logs refresh failures', async () => {
    const refreshDayDetail = jest
      .fn()
      .mockRejectedValue(new Error('refresh failed'))
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <DayDetailTabsSection
        dayDetail={{
          subscription: {
            id: 'sub-22',
            diet_plan_template_id: 101,
          },
          user: { id: 'user-44' },
          diet_plans: [
            {
              id: 'meal-1',
              sequence_number: 2,
              meal_time: 'Breakfast',
              meal_time_time: '07:00 AM',
              items: [],
              item_statuses: {},
            },
          ],
        }}
        dayDetailTab="diet"
        onChangeTab={jest.fn()}
        isNutritionist={false}
        onEditWorkoutPlan={jest.fn()}
        onEditYogaPlan={jest.fn()}
        onEditMeditationPlan={jest.fn()}
        refreshDayDetail={refreshDayDetail}
      />
    )

    fireEvent.click(screen.getByLabelText(/Edit meal time/i))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText(/Edit meal time/i))
    await mockMealTimingSuccess?.()

    await waitFor(() => expect(refreshDayDetail).toHaveBeenCalled())
    expect(errorSpy).toHaveBeenCalled()
  })

  it('navigates to the template details page and falls back from missing yoga data', () => {
    const onChangeTab = jest.fn()

    render(
      <DayDetailTabsSection
        dayDetail={{
          date: '2099-01-01',
          status: 'completed',
          subscription: {
            id: 'sub-1',
            diet_plan_template_id: 77,
            diet_plan_template_name: 'keto plan',
          },
          diet_plans: [],
          workout_plan: { exercises: [] },
        }}
        dayDetailTab="yoga"
        onChangeTab={onChangeTab}
        isNutritionist={false}
        onEditWorkoutPlan={jest.fn()}
        onEditYogaPlan={jest.fn()}
        onEditMeditationPlan={jest.fn()}
      />
    )

    expect(onChangeTab).toHaveBeenCalledWith('diet')
    fireEvent.click(screen.getByRole('button', { name: 'Keto Plan' }))
    expect(mockNavigate).toHaveBeenCalledWith('/diet-template/77')
  })

  it('shows assignment error when subscription information is missing', () => {
    render(
      <DayDetailTabsSection
        dayDetail={{
          date: '2099-01-01',
          subscription: { diet_plan_template_id: null },
          diet_plans: [],
          workout_plan: { exercises: [] },
        }}
        dayDetailTab="diet"
        onChangeTab={jest.fn()}
        isNutritionist={false}
        onEditWorkoutPlan={jest.fn()}
        onEditYogaPlan={jest.fn()}
        onEditMeditationPlan={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Assign Template/i }))
    fireEvent.click(screen.getByText(/starter/i))
    fireEvent.click(screen.getByTestId('drawer-submit'))

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Missing subscription or template information',
      { variant: 'error' }
    )
  })

  it('handles template assignment errors and drawer controls', async () => {
    jest.spyOn(dietTemplateApi, 'useTemplateList').mockReturnValue({
      data: {
        diet_plan_templates: [],
        meta: { total_pages: 1, total_count: 0 },
      },
      isFetching: true,
    } as any)

    render(
      <DayDetailTabsSection
        dayDetail={{
          date: '2099-01-01',
          subscription: { id: 'sub-1', diet_plan_template_id: null },
          diet_plans: [],
          workout_plan: { exercises: [] },
        }}
        dayDetailTab="diet"
        onChangeTab={jest.fn()}
        isNutritionist={false}
        onEditWorkoutPlan={jest.fn()}
        onEditYogaPlan={jest.fn()}
        onEditMeditationPlan={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Assign Template/i }))
    expect(screen.getByText('Loading templates...')).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('Diet Plan Category'), {
      target: { value: 'c1' },
    })
    fireEvent.change(screen.getByDisplayValue('10'), {
      target: { value: '20' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Previous/i }))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByTestId('drawer')).not.toBeInTheDocument()

    const [, options] = reactQuery.useMutation.mock.calls[0]
    options.onError({ response: { data: { detail: 'Template failed' } } })
    options.onError({ response: { data: { errors: [{ field: 'x' }] } } })

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Template failed', {
      variant: 'error',
    })
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Template failed', {
      variant: 'error',
    })
  })

  it('renders detailed workout, yoga, meditation, and extra diet content', () => {
    const onEditWorkoutPlan = jest.fn()
    const onEditYogaPlan = jest.fn()
    const onEditMeditationPlan = jest.fn()
    const onChangeTab = jest.fn()

    render(
      <DayDetailTabsSection
        dayDetail={{
          date: '2099-01-02',
          status: 'pending',
          total_proposed_calories: 2200,
          total_consumed_calories: 1800,
          subscription: {
            id: 'sub-2',
            diet_plan_template_id: 91,
            diet_plan_template_name: 'athlete fuel',
          },
          diet_plans: [
            {
              id: 'meal-9',
              sequence_number: 1,
              meal_time: 'Lunch',
              meal_time_time: '01:00 PM',
              calories: 600,
              items: [
                {
                  id: 'diet-1',
                  meal_name: 'rice bowl',
                  requirement: 'mandatory',
                  quantity: 1,
                  serving_unit: 'plate',
                  serving_quantity: 2,
                  per_serving: {
                    calories: 300,
                    protein: 20,
                    carbs: 40,
                    fat: 10,
                    fiber: 5,
                  },
                  actions: {
                    status: 'completed',
                    consumed_quantity: 1,
                    consumed_calories: 320,
                    consumed_macros: {
                      protein: 22,
                      carbs: 38,
                      fat: 9,
                      fiber: 4,
                    },
                    completed_at: '2026-06-02T08:00:00Z',
                  },
                },
              ],
              other_consumed_items: [
                {
                  id: 'extra-1',
                  meal_name: 'banana',
                  meal_time: 'Snack',
                  consumed_quantity: 1,
                  serving_unit: 'piece',
                  consumed_calories: 100,
                  per_serving: {
                    calories: 100,
                    protein: 1,
                    carbs: 27,
                    fat: 0,
                    fiber: 3,
                  },
                  consumed_macros: {
                    protein: 1,
                    carbs: 27,
                    fat: 0,
                    fiber: 3,
                  },
                  actions: {
                    status: 'in_progress',
                    completed_at: '2026-06-02T09:00:00Z',
                  },
                },
              ],
              item_statuses: { completed_item_ids: ['diet-1'] },
            },
          ],
          workout_plan: {
            title: 'Strength Block',
            description: 'Upper body focus',
            exercises: [
              {
                id: 'work-1',
                workout_name: 'push up',
                reps: 15,
                sets: 3,
                duration_minutes: 12,
                video_url: 'https://example.com/workout',
                actions: {
                  status: 'completed',
                  duration_seconds: 180,
                  video_watch_percentage: 90,
                  notes: 'Felt strong',
                },
              },
            ],
          },
          yoga_plan: {
            title: 'Morning Flow',
            description: 'Gentle mobility',
            exercises: [
              {
                id: 'yoga-1',
                yoga_name: 'sun salutation',
                video_url: 'https://example.com/yoga',
                yoga_duration_minutes: 20,
                actions: {
                  status: 'today',
                  action_date: '2026-06-02',
                  completed_at: '2026-06-02 07:30',
                  duration_seconds: 1200,
                  video_watch_percentage: 80,
                  notes: 'steady pace',
                },
              },
            ],
          },
          meditations: [
            {
              id: 'med-1',
              title: 'focus breath',
              description: 'Breathing reset',
              video_url: 'https://example.com/meditation',
              duration_minutes: 8,
              actions: {
                status: 'failed',
                action_date: '2026-06-02',
                completed_at: '2026-06-02 20:00',
                duration_seconds: 480,
                video_watch_percentage: 45,
                notes: 'Interrupted',
              },
            },
          ],
        }}
        dayDetailTab="diet"
        onChangeTab={onChangeTab}
        isNutritionist={false}
        onEditWorkoutPlan={onEditWorkoutPlan}
        onEditYogaPlan={onEditYogaPlan}
        onEditMeditationPlan={onEditMeditationPlan}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Diet' }))
    fireEvent.click(screen.getByRole('button', { name: 'Workout' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yoga' }))
    fireEvent.click(screen.getByRole('button', { name: 'Meditation' }))

    expect(onChangeTab).toHaveBeenCalledWith('diet')
    expect(onChangeTab).toHaveBeenCalledWith('workout')
    expect(onChangeTab).toHaveBeenCalledWith('yoga')
    expect(onChangeTab).toHaveBeenCalledWith('meditation')

    expect(screen.getByText('Other Items Consumed')).toBeInTheDocument()
    expect(screen.getByText('Strength Block')).toBeInTheDocument()
    expect(screen.getByText('Upper body focus')).toBeInTheDocument()
    expect(screen.getByText('Duration: 12m')).toBeInTheDocument()
    expect(screen.getByText('Morning Flow')).toBeInTheDocument()
    expect(screen.getAllByText(/Watched/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Action date:/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Duration sec:/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Meditation').length).toBeGreaterThan(0)
    expect(screen.getByText('Focus Breath')).toBeInTheDocument()
    expect(screen.getByText('Interrupted')).toBeInTheDocument()

    const updateButtons = screen.getAllByRole('button', { name: /Update/i })
    fireEvent.click(updateButtons[0])
    fireEvent.click(updateButtons[1])
    fireEvent.click(updateButtons[2])

    expect(onEditWorkoutPlan).toHaveBeenCalled()
    expect(onEditYogaPlan).toHaveBeenCalled()
    expect(onEditMeditationPlan).toHaveBeenCalled()
  })
})
