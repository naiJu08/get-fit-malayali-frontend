// ─── Admin Dashboard API Types ───────────────────────────────────────────────
// Matches GET /api/v1/admin/dashboard exact response shape

export type DashboardResponse = {
  generated_at?: string

  users?: {
    total?: number
    by_role?: {
      superadmin?: number
      admin?: number
      nutritionist?: number
      user?: number
      [k: string]: number | undefined
    }
    by_status?: {
      active?: number
      suspended?: number
      deactivated?: number
      [k: string]: number | undefined
    }
    new_this_month?: number
    hints?: Record<string, string>
  }

  subscriptions?: {
    total?: number
    by_status?: Record<string, number>
    active_now?: number
    expired_now?: number
    expiring_soon_users?: number
    paused_now?: number
    new_this_month?: number
    subscribers_by_plan?: {
      plan_id?: number
      plan_name?: string
      subscribers?: number
    }[]
    revenue?: {
      active_subscriptions_total_fees?: string
      lifetime_total_fees?: string
    }
    user_specific_content?: {
      workout_subscriptions?: number
      yoga_subscriptions?: number
      meditation_subscriptions?: number
    }
    hints?: Record<string, string>
  }

  plans?: {
    total?: number
    active?: number
    inactive?: number
    by_category?: Record<string, number>
    yoga_included?: number
    meditation_included?: number
    hints?: Record<string, string>
  }

  clients?: {
    total?: number
    active?: number
    inactive?: number
    with_active_subscription?: number
  }

  workouts?: {
    total?: number
    with_video?: number
    by_intensity?: Record<string, number>
    user_specific_exercises?: number
    hints?: Record<string, string>
  }

  recipes?: { total?: number; hints?: Record<string, string> }

  feedbacks?: {
    total?: number
    by_rating?: Record<string, number>
    for_workouts?: number
    for_plans?: number
    for_recipes?: number
    hints?: Record<string, string>
  }

  notifications?: {
    total?: number
    unread?: number
    delivered?: number
    scheduled_future?: number
    by_type?: Record<string, number>
    hints?: Record<string, string>
  }

  activity?: {
    progress_logs?: number
    body_measurements?: number
    workout_exercise_completions?: number
    diet_plan_item_completions?: number
    yoga_exercise_completions?: number
    meditation_completions?: number
    workout_plan_progresses?: number
    hints?: Record<string, string>
  }

  freezes?: {
    total?: number
    active_now?: number
    active_subscriptions_with_freeze_now?: number
    hints?: Record<string, string>
  }

  interests?: {
    total?: number
    by_plan?: Record<string, number> | any[]
    hints?: Record<string, string>
  }

  body_measurements?: {
    total_records?: number
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
      neck_avg?: string
    }
    hints?: Record<string, string>
  }

  vitals?: {
    total_records?: number
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
    sleep_analytics?: { avg_hours?: string; adequate_percentage?: number }
    water_analytics?: { avg_intake?: string; adequate_percentage?: number }
    steps_analytics?: { avg_steps?: string; max_steps?: number }
    hints?: Record<string, string>
  }

  meditations?: {
    total_meditations?: number
    avg_duration_minutes?: string
    total_completions?: number
    completed_count?: number
    skipped_count?: number
    missed_count?: number
    unique_users_completing?: number
    completion_rate_percentage?: number
    plan_default_meditations?: number
    with_video?: any
    user_specific_meditations?: number
    top_performing?: {
      id?: number
      title?: string
      duration_minutes?: string
      completion_count?: number
    }[]
    hints?: Record<string, string>
  }

  yoga?: {
    total_yoga_items?: number
    avg_duration_minutes?: string
    total_completions?: number
    completed_count?: number
    skipped_count?: number
    with_video?: any
    missed_count?: number
    unique_users_completing?: number
    completion_rate_percentage?: number
    intensity_breakdown?: Record<string, number>
    completion_by_category?: Record<string, number>
    plan_default_yoga_exercises?: number
    user_specific_yoga_exercises?: number
    hints?: Record<string, string>
  }

  diet?: {
    total_meals?: number
    total_completions?: number
    completed_count?: number
    skipped_count?: number
    missed_count?: number
    unique_users?: number
    adherence_rate_percentage?: number
    calorie_analytics?: { total_consumed?: number; avg_per_completion?: number }
    meal_timing_analysis?: Record<string, number>
    category_consumption?: Record<string, number>
    mandatory_vs_optional?: Record<string, number>
    hints?: Record<string, string>
  }

  engagement?: {
    window?: string
    window_start?: string
    window_end?: string
    summary?: {
      active_users_total?: number
      workout_active_users?: number
      yoga_active_users?: number
      meditation_active_users?: number
      diet_active_users?: number
    }
    hourly_breakdown?: {
      hour?: string
      active_users?: number
      workout_completions?: number
      yoga_completions?: number
      meditation_completions?: number
      diet_completions?: number
      total_completions?: number
      hint?: string
    }[]
    hints?: Record<string, string>
  }

  completion_analytics?: {
    workout_completions?: {
      total?: number
      completed?: number
      skipped?: number
      missed?: number
      completion_rate_percentage?: number
    }
    yoga_completions?: {
      total?: number
      completed?: number
      skipped?: number
      missed?: number
      completion_rate_percentage?: number
    }
    meditation_completions?: {
      total?: number
      completed?: number
      skipped?: number
      missed?: number
      completion_rate_percentage?: number
    }
    diet_completions?: {
      total?: number
      completed?: number
      skipped?: number
      missed?: number
      completion_rate_percentage?: number
    }
    completions_by_time_of_day?: {
      morning?: number
      afternoon?: number
      evening?: number
      night?: number
    }
    hints?: Record<string, string>
  }

  health_analytics?: {
    body_measurement_summary?: {
      weight?: { avg?: string; min?: string; max?: string }
      bmi?: {
        avg?: string
        categories?: {
          underweight?: number
          normal?: number
          overweight?: number
          obese?: number
        }
      }
    }
    vitals_summary?: {
      avg_heart_rate?: string
      avg_sugar_level?: string
      avg_sleep_hours?: string
      avg_water_intake?: string
      avg_steps?: string
    }
    hints?: Record<string, string>
  }

  // Legacy fields kept for backward-compat
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
    drop_off_points?: { week_2_dropoff?: number; month_1_dropoff?: number }
  }
  content_performance?: {
    workout_performance?: {
      top_performing_categories?: string[]
      user_satisfaction?: number
    }
    meditation_performance?: { user_satisfaction?: number }
    diet_plan_performance?: { user_satisfaction?: number }
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
  }
}

export type NutritionistDashboardResponse = {
  generated_at?: string
  date_info?: {
    target_date?: string
    range_days?: number
    range_start?: string
    range_end?: string
  }
  nutritionist?: {
    id?: number | string
    name?: string
    email?: string
    role?: string
  }
  clients?: {
    total?: number
    by_status?: Record<string, number>
    hints?: Record<string, string>
  }
  subscriptions?: {
    active_or_paused?: number
    expiring_soon?: number
    expiring_within_days?: number
    hints?: Record<string, string | number>
  }
  engagement?: {
    totals?: {
      diet_item_completions?: number
      workout_completions?: number
      yoga_completions?: number
      meditation_completions?: number
    }
    hints?: Record<string, string>
  }
  alerts?: {
    expiring_soon?: any[]
    inactive?: any[]
    missing_diet_template_today?: any[]
  }
  feedbacks?: {
    total?: number
    recent?: any[]
  }
}
