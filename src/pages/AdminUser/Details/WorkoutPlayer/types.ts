export interface WorkoutExerciseItem {
  id: string | number
  workoutId: string | number
  workoutName: string
  catName?: string
  subName?: string
  videoUrl?: string | null
  thumbnailUrl?: string | null
  reps?: number | null
  sets?: number | null
  durationMin?: string | number | null
  intensity?: string
  exerciseType?: string
  action?: any
  linearIndex: number
  rawExercise?: any
}

export interface ExerciseProgress {
  currentTime: number
  duration: number
  watchedPercentage: number
  repeatCount: number
  completed: boolean
  completedAt?: string
  lastUpdated: number
}

export type WorkoutProgressMap = Record<string, ExerciseProgress>
