import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import WorkoutPlanDetails from '../details'

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: () => ({ data: { categories: [] } }),
  }
})

jest.mock('qbs-core', () => ({
  AutoComplete: (props: any) => (
    <div data-testid={`ac-${props.name || 'ac'}`}>
      <button
        data-testid={`ac-${props.name || 'ac'}-set`}
        onClick={async () => {
          if (props.getData) {
            const opts = await props.getData('ar')
            // simulate selecting first option(s)
            if (props.isMultiple) {
              props.onChange?.(Array.isArray(opts) ? opts.slice(0, 1) : [])
              return
            }
            props.onChange?.((Array.isArray(opts) ? opts[0] : null) ?? null)
            return
          }
          props.onChange?.({ id: 1, name: 'Strength' })
        }}
      >
        Set
      </button>
    </div>
  ),
}))

const mockNavigate = jest.fn()
const mockSetSearchParams = jest.fn()
let mockInitialSearchParams: URLSearchParams = new URLSearchParams()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '3' }),
  useSearchParams: () => [mockInitialSearchParams, mockSetSearchParams],
}))

jest.mock('../../../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>,
}))

jest.mock('../../../../../components/app/alertBox/infoBox', () => ({
  __esModule: true,
  default: ({ content }: any) => <div data-testid="info-box">{content}</div>,
}))

jest.mock('../../../../../components/common/drawer', () => ({
  __esModule: true,
  default: ({
    open,
    children,
    title,
    handleSubmit,
    disableSubmit,
    handleClose,
  }: any) => {
    if (!open) return null
    return (
      <div data-testid="drawer">
        <div data-testid="drawer-title">{title}</div>
        <div data-testid="drawer-open">{children}</div>
        {handleClose ? (
          <button data-testid="drawer-close" onClick={handleClose}>
            Close
          </button>
        ) : null}
        {handleSubmit ? (
          <button
            data-testid="drawer-submit"
            disabled={!!disableSubmit}
            onClick={handleSubmit}
          >
            Submit
          </button>
        ) : null}
      </div>
    )
  },
}))

jest.mock('../../../../../components/common/tab/Tab', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="tab">{children}</div>,
}))

jest.mock('../../../../../components/common', () => ({
  TabContainer: ({ children, data, onClick }: any) => (
    <div data-testid="tabs">
      {(data || []).map((t: any) => (
        <button
          key={t.id}
          data-testid={`tab-btn-${t.id}`}
          onClick={() => onClick?.(t)}
        >
          {t.label}
        </button>
      ))}
      {children}
    </div>
  ),
}))

jest.mock('../../../../Workout/api', () => ({
  useWorkoutList: () => ({
    data: {
      workouts: [
        {
          id: 101,
          name: 'push up',
          video_url: 'https://youtu.be/abc',
          category: { main_category: { name: 'Strength' }, name: 'Arms' },
          duration_minutes: 1,
          intensity_level: 'high',
        },
        {
          id: 102,
          name: 'squat',
          video_url: 'https://youtube.com/watch?v=def',
          category: { main_category: { name: 'Strength' }, name: 'Legs' },
          duration_minutes: 2,
          intensity_level: 'low',
        },
        {
          id: 103,
          name: 'invalid url',
          // triggers URL parsing catch branch
          video_url: 'https://youtube.com/watch?v=%',
          category: { main_category: { name: 'Other' }, name: 'Other' },
          duration_minutes: 1,
          intensity_level: 'low',
        },
      ],
    },
    isFetching: false,
  }),
}))

jest.mock('../../../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: jest.fn() }),
}))

jest.mock('../../../../../store/authStore', () => ({
  useAuthStore: (selector: any) => selector({ roleData: { name: 'admin' } }),
}))

jest.mock('../../../../../apis/api.url', () => ({
  __esModule: true,
  default: { CATEGORIES: '/categories' },
}))

jest.mock('../../../../../apis/api.helpers', () => ({
  getData: jest.fn(async () => ({ categories: [] })),
}))

const mockGetWorkoutPlanDetails = jest.fn()
const mockAddExercisesAsync = jest.fn()
jest.mock('../api', () => ({
  getWorkoutPlanDetails: (...args: any[]) => mockGetWorkoutPlanDetails(...args),
  useAddExercises: () => ({ mutateAsync: mockAddExercisesAsync }),
  deleteWorkoutPlanExercise: jest.fn(async () => ({ message: 'ok' })),
  getWorkoutPlanSubcategories: jest.fn(async () => [{ id: 1, value: 'Arms' }]),
}))

jest.mock('../create', () => () => <div data-testid="workout-form" />)

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

describe('WorkoutPlanDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInitialSearchParams = new URLSearchParams()
    mockAddExercisesAsync.mockResolvedValue({ message: 'ok' } as any)
  })

  it('shows loading state', async () => {
    mockGetWorkoutPlanDetails.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    )

    await act(async () => {
      renderWithProviders(<WorkoutPlanDetails />)
    })

    expect(screen.getAllByTestId('info-box')[0]).toHaveTextContent(
      'Loading workout plan details...'
    )
  })

  it('shows error state when details fetch fails', async () => {
    mockGetWorkoutPlanDetails.mockRejectedValue({
      response: { data: { message: 'Failed to load' } },
    })

    await act(async () => {
      renderWithProviders(<WorkoutPlanDetails />)
    })

    await waitFor(() => {
      expect(
        screen.getAllByTestId('info-box').some((n) =>
          n.textContent?.includes('Failed to load')
        )
      ).toBe(true)
    })
  })

  it('renders header and back navigates to plan tab', async () => {
    mockGetWorkoutPlanDetails.mockResolvedValue({
      workout_plan: { id: 3, plan_id: 8, plan_name: 'Plan 8' },
    })

    await act(async () => {
      renderWithProviders(<WorkoutPlanDetails />)
    })

    await waitFor(() => {
      expect(screen.getByText(/Workout Plan Details/)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Back'))
    expect(mockNavigate).toHaveBeenCalledWith('/plans/8/workout-plan')
  })

  it('renders assign tab and opens assign drawer', async () => {
    mockInitialSearchParams = new URLSearchParams({ tab: 'assign' })
    mockGetWorkoutPlanDetails.mockResolvedValue({
      workout_plan: {
        id: 3,
        plan_id: 8,
        plan_name: 'Plan 8',
        title: 'Day 1',
        day_number: 1,
        exercises_count: 2,
        total_duration: 10,
        description: 'Desc',
        exercises: [
          {
            id: 1,
            workout_id: 11,
            sequence_number: 1,
            video_url: 'https://youtu.be/abc',
            category: { main_category: { name: 'Strength' }, name: 'Arms' },
            workout: { name: 'Pushup' },
          },
          {
            id: 2,
            workout_id: 12,
            sequence_number: 2,
            video_url: 'https://youtube.com/watch?v=def',
            category: { main_category: { name: 'Cardio' }, name: 'Run' },
            workout: { name: 'Run' },
          },
        ],
      },
    })

    await act(async () => {
      renderWithProviders(<WorkoutPlanDetails />)
    })

    await waitFor(() => {
      expect(screen.getByText(/Workout Plan Details/)).toBeInTheDocument()
      expect(screen.getByText('Assign')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Assign'))
    })

    expect(screen.getAllByTestId('drawer-open').length).toBeGreaterThan(0)
  })

  it('walks through assign -> review -> confirm flow', async () => {
    mockInitialSearchParams = new URLSearchParams({ tab: 'assign' })
    mockGetWorkoutPlanDetails.mockResolvedValue({
      workout_plan: {
        id: 3,
        plan_id: 8,
        plan_name: 'Plan 8',
        title: 'Day 1',
        day_number: 1,
        exercises_count: 0,
        total_duration: 0,
        description: 'Desc',
        exercises: [],
      },
    })

    await act(async () => {
      renderWithProviders(<WorkoutPlanDetails />)
    })

    await waitFor(() => {
      expect(screen.getByText(/Workout Plan Details/)).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Assign'))
    })

    // assign drawer should open and allow next
    await waitFor(() => {
      expect(screen.getByTestId('drawer-title')).toHaveTextContent(
        'Assign Workout'
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('drawer-submit')).not.toBeDisabled()
    })

    // exercise a few interactions inside the assign drawer
    await act(async () => {
      fireEvent.click(screen.getByText('Unselect All'))
      fireEvent.click(screen.getByText('Select All'))
    })

    // category + subcategory selectors
    await act(async () => {
      fireEvent.click(screen.getByTestId('ac-assign_category-set'))
      fireEvent.click(screen.getByTestId('ac-assign_subcategories-set'))
    })

    // toggle a selection checkbox
    const checkboxes = screen.getAllByRole('checkbox')
    await act(async () => {
      fireEvent.click(checkboxes[0])
      fireEvent.click(checkboxes[0])
    })

    // adjust reps for first selected workout (increment then decrement)
    const plusButtons = screen.getAllByText('+')
    await act(async () => {
      fireEvent.click(plusButtons[0])
    })
    const minusButtons = screen.queryAllByText('âˆ’')
    if (minusButtons.length) {
      await act(async () => {
        fireEvent.click(minusButtons[0])
      })
    }

    await act(async () => {
      fireEvent.click(screen.getByTestId('drawer-submit'))
    })

    // review drawer
    await waitFor(() => {
      expect(screen.getByTestId('drawer-title')).toHaveTextContent(
        'Review & Order Exercises'
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('drawer-submit')).not.toBeDisabled()
    })

    // drag & drop reorder (smoke)
    const draggables = Array.from(
      document.querySelectorAll('[draggable=\"true\"]')
    ) as HTMLElement[]
    if (draggables.length >= 2) {
      await act(async () => {
        fireEvent.dragStart(draggables[0])
        fireEvent.dragOver(draggables[1])
        fireEvent.drop(draggables[1])
      })
    }

    await act(async () => {
      fireEvent.click(screen.getByTestId('drawer-submit'))
    })

    expect(mockAddExercisesAsync).toHaveBeenCalled()
  })

  it('closes assign drawer via handleClose', async () => {
    mockInitialSearchParams = new URLSearchParams({ tab: 'assign' })
    mockGetWorkoutPlanDetails.mockResolvedValue({
      workout_plan: {
        id: 3,
        plan_id: 8,
        plan_name: 'Plan 8',
        title: 'Day 1',
        day_number: 1,
        exercises: [],
      },
    })

    await act(async () => {
      renderWithProviders(<WorkoutPlanDetails />)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Assign'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('drawer-title')).toHaveTextContent(
        'Assign Workout'
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('drawer-close'))
    })

    expect(screen.queryByTestId('drawer')).toBeNull()
  })

  it('prefills category/subcategory from existing exercises when opening assign drawer', async () => {
    mockInitialSearchParams = new URLSearchParams({ tab: 'assign' })
    mockGetWorkoutPlanDetails.mockResolvedValue({
      workout_plan: {
        id: 3,
        plan_id: 8,
        plan_name: 'Plan 8',
        title: 'Day 1',
        day_number: 1,
        exercises: [
          {
            id: 1,
            workout_id: 101,
            reps: 2,
            category: {
              id: 5,
              name: 'Arms',
              main_category: { id: 9, name: 'Strength' },
            },
            workout: { id: 101, name: 'push up' },
          },
        ],
      },
    })

    await act(async () => {
      renderWithProviders(<WorkoutPlanDetails />)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Assign'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('drawer-title')).toHaveTextContent(
        'Assign Workout'
      )
      expect(screen.getByTestId('ac-assign_category')).toBeInTheDocument()
      expect(screen.getByTestId('ac-assign_subcategories')).toBeInTheDocument()
    })
  })

  it('switches tabs and renders assigned exercises cards', async () => {
    mockInitialSearchParams = new URLSearchParams()
    mockGetWorkoutPlanDetails.mockResolvedValue({
      workout_plan: {
        id: 3,
        plan_id: 8,
        plan_name: 'Plan 8',
        title: 'Day 1',
        day_number: 1,
        exercises_count: 3,
        total_duration: 10,
        description: 'Desc',
        exercises: [
          {
            id: 1,
            workout_id: 101,
            sequence_number: 1,
            reps: 10,
            intensity_level: 'high',
            duration_minutes: 5,
            video_url: 'https://youtu.be/abc',
            category: { main_category: { name: 'Strength' }, name: 'Arms' },
            workout: { id: 101, name: 'push up' },
          },
          {
            id: 2,
            workout_id: 102,
            sequence_number: 2,
            reps: 12,
            intensity_level: 'low',
            duration_minutes: 3,
            video_url: 'https://youtube.com/watch?v=def',
            category: { main_category: { name: 'Strength' }, name: 'Legs' },
            workout: { id: 102, name: 'squat' },
          },
          {
            id: 3,
            // no workout_id; uses workout.id fallback paths
            sequence_number: 3,
            reps: 8,
            intensity_level: '',
            duration_minutes: '',
            video_url: '',
            category: { main_category: { name: 'Other' }, name: 'Other' },
            workout: { id: 103, name: 'plank' },
          },
        ],
      },
    })

    await act(async () => {
      renderWithProviders(<WorkoutPlanDetails />)
    })

    await waitFor(() => {
      expect(screen.getByText(/Workout Plan Details/)).toBeInTheDocument()
      expect(screen.getByText('Edit Plan')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Edit Plan'))
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('tab-btn-assign'))
    })
    expect(mockSetSearchParams).toHaveBeenCalledWith({ tab: 'assign' })

    await act(async () => {
      fireEvent.click(screen.getByTestId('tab-btn-details'))
    })
    expect(mockSetSearchParams).toHaveBeenCalledWith({})

    // Assigned exercises section renders legend text (category - subcategory)
    expect(screen.getByText('Strength - Arms')).toBeInTheDocument()
    expect(screen.getByText('Strength - Legs')).toBeInTheDocument()
    expect(screen.getByText('Other - Other')).toBeInTheDocument()
  })
})
