import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Reports from '../Details/Reports'

const mockUseSubscriptionReport = jest.fn()
const mockUseRecipes = jest.fn()
const mockGetRecipeDetails = jest.fn()
const flushPdfWork = () => new Promise((resolve) => setTimeout(resolve, 25))

jest.mock('../../../components/common', () => ({
  DialogModal: ({
    isOpen,
    title,
    body,
    actionBody,
    onClose,
  }: any) =>
    isOpen ? (
      <div>
        <div>{title}</div>
        <div>{body}</div>
        <div>{actionBody}</div>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}))

jest.mock('../api', () => ({
  useSubscriptionReport: (...args: any[]) => mockUseSubscriptionReport(...args),
}))

jest.mock('../../Recipe/api', () => ({
  getRecipeDetails: (...args: any[]) => mockGetRecipeDetails(...args),
  useRecipes: (...args: any[]) => mockUseRecipes(...args),
}))

const fullReportData = {
  subscription_report: {
    plan: { name: 'Test Plan', category: 'Weight Loss' },
    user: { name: 'Test User' },
    subscription: {
      start_date: '2026-01-01',
      end_date: '2026-03-01',
      status: 'active',
    },
    overall_analysis: {
      summary: 'Good progress',
      performance_score: 85,
      performance_grade: 'Excellent',
      highlights: ['Great diet adherence'],
      areas_for_improvement: ['More water'],
      coach_note: 'Keep it up',
    },
    diet_summary: {
      calorie_adherence_percentage: 80,
      total_items_assigned: 30,
      total_items_completed: 25,
      total_calories_assigned: 2000,
      total_calories_consumed: 1800,
      total_items_completed_outside: 3,
      total_calories_consumed_outside: 400,
      mandatory_items_analysis: { assigned: 10, consumed: 8 },
      meal_timing_analysis: {
        Breakfast: { items_consumed: 3, calories_consumed: 400 },
        Lunch: { items_consumed: 5, calories_consumed: 600 },
      },
      category_consumption: {
        Protein: { items_consumed: 5, calories_consumed: 500 },
      },
      hints: {
        calorie_adherence: { label: 'Cal', description: 'Desc' },
        total_items_assigned: { label: 'Items' },
        items_completed: { label: 'Completed' },
        items_completed_outside: { label: 'Outside' },
        calories_consumed_outside: { label: 'Out Cal' },
        mandatory_items: { label: 'Mandatory' },
        meal_timing: { label: 'Meal timing', description: 'Meal timing info' },
        food_categories: { label: 'Food categories', description: 'Food info' },
      },
    },
    weight_and_bmi: {
      start_weight: 80,
      end_weight: 75,
      weight_delta: -5,
      start_bmi: 26,
      end_bmi: 24.5,
      bmi_delta: -1.5,
    },
    body_measurements: {
      change: {
        chest_delta: -2,
        waist_delta: -3,
        hip_delta: -1,
        arm_delta: 0.5,
        thigh_delta: -1.5,
      },
    },
    vitals: {
      avg_sleep_hours: 7,
      adequate_sleep_percentage: 80,
      avg_water_intake: 8,
      adequate_water_intake_percentage: 75,
      avg_steps: 8000,
      hints: {
        sleep: { label: 'Sleep', description: 'Sleep info' },
        water_intake: { label: 'Water' },
        steps: { label: 'Steps' },
      },
    },
    workout_summary: {
      total_assigned_days: 20,
      total_completed_days: 15,
      total_fully_skipped_days: 2,
      total_upcoming_days: 3,
      adherence_percentage: 75,
      total_exercises_assigned: 60,
      total_exercises_completed: 45,
      avg_video_watch_percentage: 85,
      hints: {
        adherence: { label: 'Adv' },
        completion_rate: { label: 'CR' },
        completed_days: { label: 'CD' },
        exercises_completed: { label: 'EC' },
        video_engagement: { label: 'VE' },
      },
    },
    yoga_summary: {
      total_assigned_days: 10,
      total_completed_days: 8,
      total_fully_skipped_days: 1,
      total_upcoming_days: 1,
      adherence_percentage: 80,
      total_exercises_assigned: 30,
      total_exercises_completed: 24,
    },
    meditation_summary: {
      total_assigned_days: 10,
      total_completed_days: 9,
      total_fully_skipped_days: 0,
      total_upcoming_days: 1,
      completion_rate: 90,
      total_sessions_completed: 9,
      total_exercises_assigned: 10,
    },
    daily_breakdown: [
      {
        date: '2026-01-01',
        day_number: 1,
        is_frozen: false,
        diet: { assigned: 5, completed: 4, assigned_completion: 4 },
        workout: { assigned: 3, completed: 2, assigned_completion: 2 },
        yoga: { assigned: 2, completed: 2 },
        meditation: { assigned: 1, completed: 1 },
      },
    ],
    detailed_diet_log: [
      {
        day_number: 1,
        date: '2026-01-01',
        meal_slots: [
          {
            meal_time: 'Breakfast',
            assigned_items: [
              {
                meal_name: 'Oats',
                consumed: true,
                status: 'completed',
                requirement: 'mandatory',
              },
            ],
            outside_consumed_items: [],
          },
        ],
      },
    ],
  },
}

describe('Reports Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0)
      return 0
    }
    mockUseSubscriptionReport.mockReturnValue({
      data: null,
      isFetching: false,
      error: null,
    })
    mockUseRecipes.mockReturnValue({
      data: {
        recipes: [{ id: 1, name: 'Paneer Bowl', meal_category: 'Dinner' }],
        meta: { current_page: 1, total_count: 1, total_pages: 1 },
      },
      isFetching: false,
    })
    mockGetRecipeDetails.mockResolvedValue({
      recipe: {
        id: 1,
        name: 'Paneer Bowl',
        description: 'Protein rich dinner',
        preparation_notes: 'Serve warm',
        meal_category: 'Dinner',
        serving_unit: 'bowl',
        nutrition: { calories: 250, protein: 20, carbs: 12, fat: 8, fiber: 4 },
        ingredients: [{ id: 1, name: 'Paneer', quantity: 100, unit: 'g' }],
      },
    })
  })

  it('shows empty message when no subscription is available', () => {
    render(<Reports user={{ id: 1, name: 'Test User' }} />)
    expect(
      screen.getByText('No active subscription to show report for.')
    ).toBeInTheDocument()
  })

  it('renders loading and error states', () => {
    mockUseSubscriptionReport.mockReturnValue({
      data: null,
      isFetching: true,
      error: null,
    })
    const { rerender } = render(<Reports user={{ id: 1 }} subscriptionId="1" />)
    expect(screen.getByText('Loading subscription report...')).toBeInTheDocument()

    mockUseSubscriptionReport.mockReturnValue({
      data: null,
      isFetching: false,
      error: { response: { data: { message: 'Report unavailable' } } },
    })
    rerender(<Reports user={{ id: 1 }} subscriptionId="1" />)
    expect(screen.getByText('Report unavailable')).toBeInTheDocument()
  })

  it('renders the report and downloads it without recipes', async () => {
    mockUseSubscriptionReport.mockReturnValue({
      data: fullReportData,
      isFetching: false,
      error: null,
    })

    render(<Reports user={{ id: 1 }} subscriptionId="1" />)

    expect(screen.getByText('Download PDF')).toBeInTheDocument()
    expect(screen.getByText('Overall Analysis')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Download PDF'))
    expect(screen.getByText('Include Recipes?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Download without recipes'))

    await waitFor(() => {
      expect(screen.queryByText('Include Recipes?')).not.toBeInTheDocument()
    })
    await flushPdfWork()
  })

  it('allows selecting recipes before downloading the pdf', async () => {
    mockUseSubscriptionReport.mockReturnValue({
      data: fullReportData,
      isFetching: false,
      error: null,
    })

    render(<Reports user={{ id: 1 }} subscriptionId="1" />)

    fireEvent.click(screen.getByText('Download PDF'))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByText('Download with recipes'))

    await waitFor(() => {
      expect(mockGetRecipeDetails).toHaveBeenCalledWith('1')
      expect(screen.queryByText('Include Recipes?')).not.toBeInTheDocument()
    })
    await flushPdfWork()
  })

  it('filters recipes, changes paging controls, and closes the picker', () => {
    mockUseSubscriptionReport.mockReturnValue({
      data: fullReportData,
      isFetching: false,
      error: null,
    })
    mockUseRecipes.mockReturnValue({
      data: {
        recipes: [{ id: 1, name: 'Paneer Bowl', meal_category: 'Dinner' }],
        meta: { current_page: 1, total_count: 25, total_pages: 3 },
      },
      isFetching: false,
    })

    render(<Reports user={{ id: 1 }} subscriptionId="1" />)

    fireEvent.click(screen.getByText('Download PDF'))
    fireEvent.change(screen.getByPlaceholderText('Search recipes'), {
      target: { value: 'paneer' },
    })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '20' } })
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Clear'))
    fireEvent.click(screen.getByText('Close'))

    expect(screen.queryByText('Include Recipes?')).not.toBeInTheDocument()
  })

  it('shows recipe loading and empty states', () => {
    mockUseSubscriptionReport.mockReturnValue({
      data: fullReportData,
      isFetching: false,
      error: null,
    })
    mockUseRecipes.mockReturnValue({
      data: { recipes: [], meta: { current_page: 1, total_count: 0 } },
      isFetching: true,
    })

    const { rerender } = render(<Reports user={{ id: 1 }} subscriptionId="1" />)
    fireEvent.click(screen.getByText('Download PDF'))
    expect(screen.getByText('Loading recipes…')).toBeInTheDocument()

    mockUseRecipes.mockReturnValue({
      data: { recipes: [], meta: { current_page: 1, total_count: 0 } },
      isFetching: false,
    })
    rerender(<Reports user={{ id: 1 }} subscriptionId="1" />)
    expect(screen.getByText('No recipes found.')).toBeInTheDocument()
  })
})
