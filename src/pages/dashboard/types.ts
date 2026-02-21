export type DashboardResponse = {
  timeframe?: {
    start_date?: string
    end_date?: string
  }
  users?: {
    total?: number
    by_role?: Record<string, number>
    new_in_range?: number
    active?: number
    suspended?: number
    deactivated?: number
  }
  subscriptions?: {
    total?: number
    by_status?: Record<string, number>
    new_in_range?: number
    active_now?: number
    expired_now?: number
    paused_now?: number
    subscribers_by_plan?: {
      plan_id?: number
      plan_name?: string
      subscribers?: number
    }[]
    revenue?: {
      active_total_fees?: string
      created_in_range_total_fees?: string
    }
    user_specific_content?: {
      workout_subscriptions?: number
      yoga_subscriptions?: number
      meditation_subscriptions?: number
    }
  }
  plans?: {
    total?: number
    active?: number
    by_category?: Record<string, number>
    new_in_range?: number
  }
  workouts?: {
    total?: number
    with_video?: number
    new_in_range?: number
    average_rating_overall?: number
    by_intensity?: Record<string, number>
  }
  recipes?: {
    total?: number
    new_in_range?: number
  }
  feedbacks?: {
    total?: number
    new_in_range?: number
    by_rating?: Record<string, number>
    for_workouts?: number
    for_plans?: number
    for_recipes?: number
  }
  notifications?: {
    total?: number
    new_in_range?: number
    unread?: number
    delivered?: number
    scheduled_future?: number
    by_type?: Record<string, number>
  }
  activity?: {
    progress_logs?: number
    body_measurements?: number
    workout_exercise_completions?: number
    diet_plan_completions?: number
    workout_plan_progresses?: number
  }
  freezes?: {
    total?: number
    new_in_range?: number
    active_now?: number
    active_subscriptions_with_freeze_now?: number
  }
  interests?: {
    total?: number
    new_in_range?: number
    by_plan?: Record<string, number>
  }
  body_measurements?: {
    total_records?: number
    records_in_range?: number
    unique_users_measured?: number
    avg_measurements_per_user?: number
    weight_analytics?: {
      total_records?: number
      avg_weight?: string
      min_weight?: string
      max_weight?: string
      weight_changes?: {
        lost_weight?: number
        gained_weight?: number
        maintained?: number
      }
    }
    bmi_analytics?: {
      total_records?: number
      avg_bmi?: string
      categories?: {
        underweight?: number
        normal?: number
        overweight?: number
        obese?: number
      }
    }
    other_measurements?: {
      chest_avg?: string
      waist_avg?: string
      hip_avg?: string
      arm_avg?: string
      thigh_avg?: string
    }
  }
  vitals?: {
    total_records?: number
    records_in_range?: number
    unique_users?: number
    heart_rate_analytics?: {
      avg?: string
      min?: number
      max?: number
      normal_percentage?: number
    }
    sugar_analytics?: {
      avg?: string
      min?: string
      max?: string
      normal_percentage?: number
    }
    sleep_analytics?: {
      avg_hours?: string
      adequate_percentage?: number
    }
    water_analytics?: {
      avg_intake?: string
      adequate_percentage?: number
    }
    steps_analytics?: {
      avg_steps?: string
      max_steps?: number
    }
  }
  meditations?: {
    total_meditations?: number
    new_in_range?: number
    total_completions?: number
    completions_in_range?: number
    unique_users?: number
    completion_rate?: number
    avg_duration?: string
    top_performing?: {
      id?: number
      title?: string
      duration_minutes?: string
      completion_count?: number
    }[]
    user_specific_meditations?: number
  }
  yoga?: {
    total_yoga_exercises?: number
    new_in_range?: number
    total_completions?: number
    completions_in_range?: number
    unique_users?: number
    avg_duration?: string
    intensity_breakdown?: Record<string, number>
    completion_by_intensity?: { intensity?: string; completions?: number }[]
    user_specific_yoga?: number
  }
  diet?: {
    total_meals?: number
    new_in_range?: number
    total_completions?: number
    completions_in_range?: number
    unique_users?: number
    calorie_analytics?: {
      total_consumed?: number
      avg_per_completion?: number
    }
    top_categories?: string[]
    meal_timing_analytics?: Record<string, number>
    mandatory_vs_optional?: Record<string, number>
  }
  engagement?: {
    daily_active_users?: {
      total?: number
      meditation?: number
      workout?: number
    }
    user_streaks?: {
      meditation?: {
        max_streak?: number
        avg_streak?: number
        users_with_streaks?: number
      }
      workout?: {
        max_streak?: number
        avg_streak?: number
        users_with_streaks?: number
      }
    }
    engagement_by_day?: {
      date?: string
      active_users?: number
      completions?: number
    }[]
    most_active_users?: {
      id?: number
      name?: string
      activity_score?: number
    }[]
  }
  completion_analytics?: {
    workout_completion_rates?: {
      total_assigned?: number
      total_completed?: number
      completion_percentage?: number
      skipped_percentage?: number
      missed_percentage?: number
    }
    meditation_completion_rates?: {
      total_assigned?: number
      total_completed?: number
      completion_percentage?: number
      skipped_percentage?: number
      missed_percentage?: number
    }
    diet_completion_rates?: {
      total_assigned?: number
      total_completed?: number
      completion_percentage?: number
      skipped_percentage?: number
      missed_percentage?: number
    }
    weekly_completion_trends?: Record<string, { completion_rate?: number }>
    completion_by_time_of_day?: {
      morning?: number
      afternoon?: number
      evening?: number
      night?: number
    }
  }
  health_analytics?: {
    weight_trends?: {
      improving?: number
      declining?: number
      stable?: number
    }
    vitals_trends?: {
      heart_rate?: { trend?: string; change?: number }
      blood_sugar?: { trend?: string; change?: number }
      sleep?: { trend?: string; change?: number }
      water_intake?: { trend?: string; change?: number }
    }
    health_score_distribution?: {
      excellent?: number
      good?: number
      fair?: number
      poor?: number
    }
    users_at_risk?: {
      id?: number
      name?: string
      risk_factors?: string[]
      risk_score?: number
    }[]
    improvement_metrics?: {
      users_improved?: number
      avg_improvement_percentage?: number
      most_improved_area?: string
    }
  }
  user_behavior?: {
    user_activity_patterns?: {
      most_active_day?: string
      least_active_day?: string
      peak_activity_hour?: number
      avg_sessions_per_user?: number
    }
    preferred_workout_times?: {
      morning?: number
      afternoon?: number
      evening?: number
    }
    preferred_meditation_times?: {
      morning?: number
      afternoon?: number
      evening?: number
    }
    content_preferences?: {
      preferred_intensity?: string
      preferred_duration?: string
      preferred_categories?: string[]
    }
    drop_off_points?: {
      week_2_dropoff?: number
      month_1_dropoff?: number
      common_dropoff_reasons?: string[]
    }
    re_engagement_patterns?: {
      re_engaged_users?: number
      avg_days_to_re_engage?: number
      successful_re_engagement_rate?: number
    }
  }
  content_performance?: {
    workout_performance?: {
      top_performing_categories?: string[]
      avg_completion_time?: number
      user_satisfaction?: number
    }
    meditation_performance?: {
      top_performing_durations?: string[]
      avg_session_completion?: number
      user_satisfaction?: number
    }
    diet_plan_performance?: {
      most_adhered_categories?: string[]
      avg_calorie_adherence?: number
      user_satisfaction?: number
    }
    content_effectiveness?: {
      highly_effective?: number
      moderately_effective?: number
      needs_improvement?: number
    }
    underperforming_content?: {
      id?: number
      title?: string
      completion_rate?: number
      issue?: string
    }[]
    user_feedback_correlation?: {
      high_feedback_high_completion?: number
      high_feedback_low_completion?: number
      low_feedback_high_completion?: number
      low_feedback_low_completion?: number
    }
  }
}
