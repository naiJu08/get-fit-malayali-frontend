import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DashboardView from '../dashboard'
import { useLayoutStore } from '../../../store/layoutStore'
import type { DashboardResponse } from '../types'

const mockSetLayoutType = jest.fn()
jest.mock('../../../store/layoutStore', () => ({
  useLayoutStore: () => ({
    setLayoutType: mockSetLayoutType,
  }),
}))

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}))

const mockData: DashboardResponse = {
  generated_at: '2026-05-26T15:30:00.000Z',
  clients: {
    total: 100,
    active: 80,
    inactive: 20,
    with_active_subscription: 75,
  },
  subscriptions: {
    total: 120,
    active_now: 70,
    paused_now: 10,
    expired_now: 40,
    new_this_month: 15,
    expiring_soon_users: 5,
    user_specific_content: {
      yoga_subscriptions: 30,
      meditation_subscriptions: 25,
      workout_subscriptions: 15,
    },
    revenue: {
      active_subscriptions_total_fees: 150000,
      lifetime_total_fees: 500000,
    },
    subscribers_by_plan: [
      { plan_name: 'Ultimate Fat Loss', subscribers: 50 },
    ],
  },
  plans: {
    total: 20,
    active: 18,
    inactive: 2,
    yoga_included: 8,
    meditation_included: 6,
    by_category: {
      FatLoss: 10,
    },
  },
  workouts: {
    total: 50,
    with_video: 40,
    user_specific_exercises: 10,
    by_intensity: {
      Beginner: 20,
    },
  },
  notifications: {
    total: 500,
    unread: 50,
    delivered: 400,
    scheduled_future: 50,
    by_type: {
      Reminder: 200,
    },
  },
  engagement: {
    summary: {
      active_users_total: 80,
      workout_active_users: 40,
      yoga_active_users: 20,
      meditation_active_users: 10,
      diet_active_users: 30,
    },
    hourly_breakdown: [],
  },
  completion_analytics: {
    workout_completions: { completion_rate_percentage: 85.5, completed: 80, skipped: 10, missed: 5 },
    yoga_completions: { completion_rate_percentage: 70.0, completed: 35, skipped: 10, missed: 5 },
    meditation_completions: { completion_rate_percentage: 90.0, completed: 45, skipped: 3, missed: 2 },
    diet_completions: { completion_rate_percentage: 60.0, completed: 60, skipped: 20, missed: 20 },
    completions_by_time_of_day: { morning: 50, afternoon: 30, evening: 40, night: 10 },
  },
  health_analytics: {
    body_measurement_summary: {
      weight: { avg: 72, min: 65, max: 80 },
      bmi: {
        avg: 23.4,
        categories: {
          Normal: 50,
        },
      },
    },
    vitals_summary: {
      avg_sleep_hours: 7.2,
      avg_water_intake: 2.8,
      avg_steps: 8500,
    },
  },
  vitals: {
    unique_users: 45,
    total_records: 320,
    sleep_analytics: { avg_hours: 7.5, adequate_percentage: 80 },
    water_analytics: { avg_intake: 2.5, adequate_percentage: 75 },
    steps_analytics: { avg_steps: 8200 },
  },
  body_measurements: {
    unique_users_measured: 40,
    total_records: 250,
    weight_analytics: {
      weight_changes: { lost_weight: 25, gained_weight: 10, maintained: 5 },
    },
    other_measurements: {
      chest_avg: 95,
      waist_avg: 82,
      hip_avg: 98,
      arm_avg: 32,
      thigh_avg: 54,
      neck_avg: 38,
    },
  },
  content_performance: {
    workout_performance: { user_satisfaction: 4.5 },
    meditation_performance: { user_satisfaction: 4.2 },
    diet_plan_performance: { user_satisfaction: 4.0 },
    content_effectiveness: {
      highly_effective: 12,
      moderately_effective: 8,
      needs_improvement: 2,
    },
    underperforming_content: [],
  },
  diet: {
    total_meals: 500,
    adherence_rate_percentage: 78.5,
    unique_users: 45,
    completed_count: 380,
    skipped_count: 70,
    missed_count: 50,
    category_consumption: {
      Breakfast: 150,
    },
    meal_timing_analysis: {
      Morning: 120,
    },
    mandatory_vs_optional: {
      mandatory: 400,
      optional: 100,
    },
  },
  freezes: {
    total: 12,
    active_now: 3,
    active_subscriptions_with_freeze_now: 3,
  },
  feedbacks: {
    total: 120,
    by_rating: {
      5: 80,
    },
    for_workouts: 50,
    for_plans: 45,
    for_recipes: 25,
  },
  activity: {
    body_measurements: 400,
    workout_exercise_completions: 1200,
    diet_plan_item_completions: 1500,
    yoga_exercise_completions: 300,
    meditation_completions: 250,
    workout_plan_progresses: 100,
  },
}

describe('DashboardView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets layout type to sideNav on mount', () => {
    render(
      <DashboardView
        data={mockData}
        loading={false}
        error={false}
        onRetry={jest.fn()}
      />
    )
    expect(mockSetLayoutType).toHaveBeenCalledWith('sideNav')
  })

  it('renders loading pulses when loading is true', () => {
    const { container } = render(
      <DashboardView
        data={mockData}
        loading={true}
        error={false}
        onRetry={jest.fn()}
      />
    )
    const pulseItems = container.querySelectorAll('.animate-pulse')
    expect(pulseItems.length).toBeGreaterThan(0)
    expect(screen.queryByText('Fitness Analytics')).not.toBeInTheDocument()
  })

  it('renders error page and triggers onRetry when error is true', () => {
    const handleRetry = jest.fn()
    render(
      <DashboardView
        data={mockData}
        loading={false}
        error={true}
        onRetry={handleRetry}
      />
    )
    expect(screen.getByText('Dashboard unavailable')).toBeInTheDocument()
    
    const retryButton = screen.getByRole('button', { name: /retry/i })
    fireEvent.click(retryButton)
    expect(handleRetry).toHaveBeenCalled()
  })

  it('renders general layout headers and timeframe labels', () => {
    render(
      <DashboardView
        data={mockData}
        loading={false}
        error={false}
        onRetry={jest.fn()}
      />
    )
    expect(screen.getByText('Performance Dashboard')).toBeInTheDocument()
    expect(screen.getByText(/As of/)).toBeInTheDocument()
  })

  it('displays correct time label fallback if generated_at is empty', () => {
    const noGenDateData = { ...mockData, generated_at: undefined }
    render(
      <DashboardView
        data={noGenDateData}
        loading={false}
        error={false}
        onRetry={jest.fn()}
      />
    )
    expect(screen.getByText(/All Time/)).toBeInTheDocument()
  })

  it('switches tabs and displays active tab widgets', () => {
    render(
      <DashboardView
        data={mockData}
        loading={false}
        error={false}
        onRetry={jest.fn()}
      />
    )

    // Initially active tab is Overview
    expect(screen.getByText('Subscription Status')).toBeInTheDocument()
    expect(screen.getByText('Users by Role')).toBeInTheDocument()

    // Switch to Health tab
    fireEvent.click(screen.getByText('❤️ Health & Body'))
    expect(screen.queryByText('Subscription Status')).not.toBeInTheDocument()
    expect(screen.getByText('Health Analytics Overview')).toBeInTheDocument()
    expect(screen.getByText('Body Measurements')).toBeInTheDocument()

    // Switch to Content tab
    fireEvent.click(screen.getByText('🎬 Content & Plans'))
    expect(screen.getByText('Content Performance')).toBeInTheDocument()
    expect(screen.getByText('Diet & Nutrition')).toBeInTheDocument()

    // Switch to Engagement tab
    fireEvent.click(screen.getByText('📈 Engagement'))
    expect(screen.getByText('Completion Analytics')).toBeInTheDocument()

    // Switch to Operations tab
    fireEvent.click(screen.getByText('⚙️ Operations'))
    expect(screen.getByText('Platform Activity')).toBeInTheDocument()
  })
})
