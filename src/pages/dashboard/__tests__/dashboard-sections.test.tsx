import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  KPIBanner,
  EngagementChart,
  SubsStatusCard,
  UserRoleCard,
  PlanPopularityCard,
  WorkoutIntensityCard,
  CompletionCard,
  HealthCard,
  VitalsCard,
  BodyMeasurementsCard,
  ActiveUsersCard,
  ContentPerformanceCard,
  StreaksCard,
  DietCard,
  FreezesCard,
  PlanCategoriesCard,
  FeedbacksCard,
  ActivityCard,
} from '../dashboard-sections'
import type { DashboardResponse } from '../types'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
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
      { plan_name: 'Yoga Beginners', subscribers: 30 },
    ],
    hints: {
      by_status: 'Breakdown of subs',
      new_this_month: 'New monthly subs',
      user_specific_content: 'Personalized subs',
      revenue: 'Revenue information',
      subscribers_by_plan: 'Popular plans',
    },
  },
  plans: {
    total: 20,
    active: 18,
    inactive: 2,
    yoga_included: 8,
    meditation_included: 6,
    by_category: {
      FatLoss: 10,
      MuscleGain: 8,
      GeneralFitness: 2,
    },
    hints: {
      FatLoss: 'Fat loss category',
    },
  },
  workouts: {
    total: 50,
    with_video: 40,
    user_specific_exercises: 10,
    by_intensity: {
      Beginner: 20,
      Intermediate: 25,
      Advanced: 5,
    },
    hints: {
      total: 'Workouts library',
      by_intensity: 'Workout intensity splits',
      with_video: 'With video workouts',
      user_specific_exercises: 'Personalized workouts',
    },
  },
  notifications: {
    total: 500,
    unread: 50,
    delivered: 400,
    scheduled_future: 50,
    by_type: {
      Reminder: 200,
      Alert: 150,
      Marketing: 150,
    },
    hints: {
      Reminder: 'Reminder notification logs',
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
    hourly_breakdown: [
      { hour: '00:00', active_users: 5, total_completions: 10, hint: '5 active at midnight' },
      { hour: '04:00', active_users: 2, total_completions: 4, hint: '2 active early morning' },
      { hour: '08:00', active_users: 30, total_completions: 50, hint: '30 active morning peak' },
    ],
    hints: {
      window: 'Rolling 24h metrics',
      active_users_total: 'Total unique users active',
    },
  },
  completion_analytics: {
    workout_completions: { completion_rate_percentage: 85.5, completed: 80, skipped: 10, missed: 5 },
    yoga_completions: { completion_rate_percentage: 70.0, completed: 35, skipped: 10, missed: 5 },
    meditation_completions: { completion_rate_percentage: 90.0, completed: 45, skipped: 3, missed: 2 },
    diet_completions: { completion_rate_percentage: 60.0, completed: 60, skipped: 20, missed: 20 },
    completions_by_time_of_day: { morning: 50, afternoon: 30, evening: 40, night: 10 },
    hints: {
      workout_completions: 'Workout stats',
      completions_by_time_of_day: 'Completions by time of day',
    },
  },
  health_analytics: {
    body_measurement_summary: {
      weight: { avg: 72, min: 65, max: 80 },
      bmi: {
        avg: 23.4,
        categories: {
          Normal: 50,
          Overweight: 20,
          Underweight: 5,
        },
      },
    },
    vitals_summary: {
      avg_sleep_hours: 7.2,
      avg_water_intake: 2.8,
      avg_steps: 8500,
    },
    hints: {
      body_measurement_summary: 'Avg measurements',
      vitals_summary: 'Vitals tracking info',
    },
  },
  vitals: {
    unique_users: 45,
    total_records: 320,
    sleep_analytics: { avg_hours: 7.5, adequate_percentage: 80 },
    water_analytics: { avg_intake: 2.5, adequate_percentage: 75 },
    steps_analytics: { avg_steps: 8200 },
    hints: {
      overview: 'Vitals tracked unique users overview',
      sleep: 'Sleep average tracking',
    },
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
    hints: {
      overview: 'Measurements records overview',
      other_measurements: 'Averages measurements splits',
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
    underperforming_content: [
      { title: 'Extreme Cardio 3', completion_rate: 15, issue: 'Too difficult' },
    ],
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
      Lunch: 180,
      Dinner: 170,
    },
    meal_timing_analysis: {
      EarlyMorning: 80,
      Morning: 120,
      Afternoon: 150,
      Evening: 50,
      Night: 100,
    },
    mandatory_vs_optional: {
      mandatory: 400,
      optional: 100,
    },
    hints: {
      total_meals: 'Total meal logs count',
      adherence_rate: 'Diet adherence rating',
      category_consumption: 'Meal categories tracking',
    },
  },
  freezes: {
    total: 12,
    active_now: 3,
    active_subscriptions_with_freeze_now: 3,
    hints: {
      total: 'Freeze counts',
      active_now: 'Currently frozen active subscriptions',
    },
  },
  feedbacks: {
    total: 120,
    by_rating: {
      5: 80,
      4: 25,
      3: 10,
      2: 3,
      1: 2,
    },
    for_workouts: 50,
    for_plans: 45,
    for_recipes: 25,
    hints: {
      total: 'Review summaries details',
      for_workouts: 'Workouts reviews count',
    },
  },
  activity: {
    body_measurements: 400,
    workout_exercise_completions: 1200,
    diet_plan_item_completions: 1500,
    yoga_exercise_completions: 300,
    meditation_completions: 250,
    workout_plan_progresses: 100,
    hints: {
      body_measurements: 'Measurements active checks',
      workout_exercise_completions: 'Workout completion records total',
    },
  },
}

describe('Dashboard Sections Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('KPIBanner renders statistics and navigates correctly', () => {
    render(<KPIBanner data={mockData} />)
    expect(screen.getByText(/Total Clients/i)).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText(/Active Revenue/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/Total Clients/i))
    expect(mockNavigate).toHaveBeenCalledWith('/users')
  })

  it('EngagementChart renders hourly bars and toggles metrics', () => {
    render(<EngagementChart data={mockData} />)
    expect(screen.getByText('Engagement — Last 24 Hours')).toBeInTheDocument()
    expect(screen.getByText('Total Active')).toBeInTheDocument()
    expect(screen.getByText('Workout')).toBeInTheDocument()

    // Toggle to completions tab
    const completionsButton = screen.getByRole('button', { name: 'Completions' })
    fireEvent.click(completionsButton)
    expect(completionsButton).toHaveClass('bg-indigo-600')
  })

  it('SubsStatusCard renders and displays breakdown details', () => {
    render(<SubsStatusCard data={mockData} />)
    expect(screen.getByText('Subscription Status')).toBeInTheDocument()
    expect(screen.getByText('Active Revenue')).toBeInTheDocument()
    expect(screen.getByText('Lifetime Revenue')).toBeInTheDocument()
    expect(screen.getByText('Yoga Subs')).toBeInTheDocument()
  })

  it('UserRoleCard renders donut segments and growth badges', () => {
    render(<UserRoleCard data={mockData} />)
    expect(screen.getByText('Users by Role')).toBeInTheDocument()
    expect(screen.getByText('Account status')).toBeInTheDocument()
  })

  it('PlanPopularityCard renders sub counts for popular plans', () => {
    render(<PlanPopularityCard data={mockData} />)
    expect(screen.getByText('Plan Popularity')).toBeInTheDocument()
    expect(screen.getByText('Ultimate Fat Loss')).toBeInTheDocument()
    expect(screen.getByText('Yoga Beginners')).toBeInTheDocument()
  })

  it('WorkoutIntensityCard renders split levels', () => {
    render(<WorkoutIntensityCard data={mockData} />)
    expect(screen.getByText('Workout Intensity')).toBeInTheDocument()
    expect(screen.getByText('Intermediate')).toBeInTheDocument()
    expect(screen.getByText('Advanced')).toBeInTheDocument()
  })

  it('CompletionCard renders modules progress rings and time breakdown', () => {
    render(<CompletionCard data={mockData} />)
    expect(screen.getByText('Completion Analytics')).toBeInTheDocument()
    expect(screen.getByText('🌅 AM')).toBeInTheDocument()
    expect(screen.getByText('🌙 Night')).toBeInTheDocument()
  })

  it('HealthCard renders bmi/vitals statistics', () => {
    render(<HealthCard data={mockData} />)
    expect(screen.getByText('Health Analytics Overview')).toBeInTheDocument()
    expect(screen.getByText('Avg BMI')).toBeInTheDocument()
    expect(screen.getByText('Avg Weight')).toBeInTheDocument()
    expect(screen.getByText('Normal')).toBeInTheDocument()
  })

  it('VitalsCard renders tracking metrics', () => {
    render(<VitalsCard data={mockData} />)
    expect(screen.getByText('Vitals Tracking')).toBeInTheDocument()
    expect(screen.getByText('Sleep')).toBeInTheDocument()
    expect(screen.getByText('Water')).toBeInTheDocument()
  })

  it('BodyMeasurementsCard renders lost/gained weight ratios', () => {
    render(<BodyMeasurementsCard data={mockData} />)
    expect(screen.getByText('Body Measurements')).toBeInTheDocument()
    expect(screen.getByText('Lost Weight')).toBeInTheDocument()
    expect(screen.getByText('Gained')).toBeInTheDocument()
    expect(screen.getByText('Neck')).toBeInTheDocument()
  })

  it('ActiveUsersCard renders last 24h active status', () => {
    render(<ActiveUsersCard data={mockData} />)
    expect(screen.getByText('Active Users Breakdown')).toBeInTheDocument()
    expect(screen.getByText('active in last 24h')).toBeInTheDocument()
  })

  it('ContentPerformanceCard renders satisfaction rating scales', () => {
    render(<ContentPerformanceCard data={mockData} />)
    expect(screen.getByText('Content Performance')).toBeInTheDocument()
    expect(screen.getByText('Satisfaction Scores')).toBeInTheDocument()
    expect(screen.getByText('Needs work')).toBeInTheDocument()
    expect(screen.getByText('Extreme Cardio 3')).toBeInTheDocument()
  })

  it('StreaksCard renders notification statuses', () => {
    render(<StreaksCard data={mockData} />)
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Unread')).toBeInTheDocument()
    expect(screen.getByText('Delivered')).toBeInTheDocument()
  })

  it('DietCard renders nutrition details', () => {
    render(<DietCard data={mockData} />)
    expect(screen.getByText('Diet & Nutrition')).toBeInTheDocument()
    expect(screen.getByText('Adherence')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText(/Meal Timing/i)).toBeInTheDocument()
  })

  it('FreezesCard renders freeze totals', () => {
    render(<FreezesCard data={mockData} />)
    expect(screen.getByText('Subscription Freezes')).toBeInTheDocument()
    expect(screen.getByText('Total Freezes')).toBeInTheDocument()
    expect(screen.getByText('Active Right Now')).toBeInTheDocument()
  })

  it('PlanCategoriesCard renders active item category splits', () => {
    render(<PlanCategoriesCard data={mockData} />)
    expect(screen.getByText('Plans by Category')).toBeInTheDocument()
    expect(screen.getByText('With Yoga')).toBeInTheDocument()
    expect(screen.getByText('With Meditation')).toBeInTheDocument()
  })

  it('FeedbacksCard renders star charts details', () => {
    render(<FeedbacksCard data={mockData} />)
    expect(screen.getByText('Feedbacks')).toBeInTheDocument()
    expect(screen.getByText('total reviews')).toBeInTheDocument()
    expect(screen.getByText('Workouts')).toBeInTheDocument()
  })

  it('ActivityCard renders actions lists', () => {
    render(<ActivityCard data={mockData} />)
    expect(screen.getByText('Platform Activity')).toBeInTheDocument()
    expect(screen.getByText('Workout Completions')).toBeInTheDocument()
    expect(screen.getByText('Meditation Completions')).toBeInTheDocument()
  })
})
