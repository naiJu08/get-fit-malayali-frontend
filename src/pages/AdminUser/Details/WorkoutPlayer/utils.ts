import moment from 'moment'
import axios from 'axios'
import { ExerciseProgress, WorkoutExerciseItem } from './types'
import { useAuthStore } from '../../../../store/authStore'

/**
 * Check if the given date matches the current calendar day.
 */
export const isCurrentDay = (dateStr?: string): boolean => {
  if (!dateStr) return false
  return moment(dateStr).isSame(moment(), 'day')
}

/**
 * Check if the given date is strictly in the past (before today).
 */
export const isPastDay = (dateStr?: string): boolean => {
  if (!dateStr) return false
  return moment(dateStr, 'YYYY-MM-DD').isBefore(moment(), 'day')
}

/**
 * Check if the given date is today or in the future.
 */
export const isTodayOrFuture = (dateStr?: string): boolean => {
  if (!dateStr) return true
  return moment(dateStr, 'YYYY-MM-DD').isSameOrAfter(moment(), 'day')
}

/**
 * Extract YouTube video ID from various standard YouTube URL patterns.
 */
export const getYouTubeVideoId = (url?: string | null): string | null => {
  if (!url) return null
  const regExp =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i
  const match = url.match(regExp)
  return match && match[1] ? match[1] : null
}

/**
 * Check whether a video URL is a YouTube link.
 */
export const isYouTubeUrl = (url?: string | null): boolean => {
  if (!url) return false
  return !!getYouTubeVideoId(url) || /youtube\.com|youtu\.be/i.test(url)
}

/**
 * Retrieve high-quality YouTube thumbnail.
 */
export const getYouTubeThumbnail = (url?: string | null): string | null => {
  const ytId = getYouTubeVideoId(url)
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
  }
  return null
}

/**
 * Resolve the exercise thumbnail: preferred explicitly defined thumbnail_url,
 * then YouTube auto-thumbnail, or null.
 */
export const getExerciseThumbnail = (
  thumbnailUrl?: string | null,
  videoUrl?: string | null
): string | null => {
  if (
    thumbnailUrl &&
    typeof thumbnailUrl === 'string' &&
    thumbnailUrl.trim() !== ''
  ) {
    return thumbnailUrl
  }
  if (videoUrl) {
    const ytThumb = getYouTubeThumbnail(videoUrl)
    if (ytThumb) return ytThumb
  }
  return null
}

/**
 * Break duration before the next exercise based on intensity level:
 * - Low intensity: 10s (5s if isWorkout flag is true)
 * - Moderate intensity: 10s
 * - High intensity: 20s
 */
export const getBreakSeconds = (
  intensity?: string,
  isWorkout = false
): number => {
  const norm = (intensity || '').toLowerCase()
  if (norm === 'high') return 20
  if (norm === 'moderate') return 10
  if (norm === 'low') {
    return isWorkout ? 5 : 10
  }
  return 10
}

/**
 * Storage key for persisting workout progress per user and date.
 */
export const getStorageKey = (
  userId?: string | number,
  date?: string
): string => {
  const d = date || moment().format('YYYY-MM-DD')
  return `gfm_workout_progress_${userId || 'guest'}_${d}`
}

/**
 * Load progress from localStorage.
 */
export const loadLocalProgress = (
  userId?: string | number,
  date?: string
): Record<string, ExerciseProgress> => {
  try {
    const key = getStorageKey(userId, date)
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (err) {
    console.error('Failed to load local workout progress:', err)
    return {}
  }
}

/**
 * Save individual exercise progress to localStorage.
 */
export const saveExerciseProgress = (
  userId: string | number | undefined,
  date: string | undefined,
  exerciseId: string | number,
  progress: Partial<ExerciseProgress>
): Record<string, ExerciseProgress> => {
  try {
    const key = getStorageKey(userId, date)
    const existing = loadLocalProgress(userId, date)
    const prev = existing[String(exerciseId)] || {
      currentTime: 0,
      duration: 0,
      watchedPercentage: 0,
      repeatCount: 1,
      completed: false,
      lastUpdated: Date.now(),
    }

    const updated: ExerciseProgress = {
      ...prev,
      ...progress,
      lastUpdated: Date.now(),
    }

    // Safety: If completed is true or watchedPercentage >= 98, ensure currentTime is reset to 0
    // so whenever the video is opened again, it starts cleanly from the beginning
    if (
      updated.completed ||
      (updated.watchedPercentage != null && updated.watchedPercentage >= 98)
    ) {
      if (
        progress.currentTime === undefined ||
        progress.currentTime >= (updated.duration || 1) * 0.98
      ) {
        updated.currentTime = 0
      }
    }

    existing[String(exerciseId)] = updated
    localStorage.setItem(key, JSON.stringify(existing))
    return existing
  } catch (err) {
    console.error('Failed to save local workout progress:', err)
    return {}
  }
}

/**
 * Completion condition:
 * - Recognized when backend status is completed, backend watch % >= 100,
 *   or locally saved progress is completed (or watched >= 98%).
 * - A missed exercise is NOT treated as completed.
 */
export const isExerciseCompleted = (
  action: any,
  localProgress?: ExerciseProgress
): boolean => {
  const backendStatus = String(action?.status || '').toLowerCase()

  // A missed exercise is never treated as completed
  if (backendStatus === 'missed' || backendStatus === 'failed') {
    return false
  }

  // 1. Backend status completed
  if (backendStatus === 'completed') {
    return true
  }

  // 2. Backend watch % >= 100
  if (
    action?.video_watch_percentage != null &&
    Number(action.video_watch_percentage) >= 100
  ) {
    return true
  }

  // 3. Locally saved progress is completed or watch % >= 98
  if (localProgress) {
    if (localProgress.completed === true) return true
    if (
      localProgress.watchedPercentage != null &&
      localProgress.watchedPercentage >= 98
    ) {
      return true
    }
  }

  return false
}

/**
 * Safely compute the initial playback resume time for an exercise.
 * If the exercise is already completed, was watched >= 98%, or was at the end,
 * it returns 0 (start from beginning) so replay functions normally.
 * If the exercise is in-progress, it resumes from the saved position.
 */
export const getInitialResumeTime = (
  exercise?: WorkoutExerciseItem,
  progress?: ExerciseProgress,
  videoDuration?: number
): number => {
  if (!exercise || !progress) return 0
  const isCompleted = isExerciseCompleted(exercise.action, progress)
  if (isCompleted) return 0

  const savedTime = progress.currentTime || 0
  const totalDuration = videoDuration || progress.duration || 0

  if (savedTime <= 0) return 0
  if ((progress.watchedPercentage || 0) >= 98) return 0
  if (
    totalDuration > 0 &&
    (savedTime >= totalDuration - 1.5 || savedTime / totalDuration >= 0.98)
  ) {
    return 0
  }

  return savedTime
}

/**
 * Compute the initial repetition count for an exercise.
 * Completed exercises start at repetition 1 for replay.
 */
export const getInitialRep = (
  exercise?: WorkoutExerciseItem,
  progress?: ExerciseProgress
): number => {
  if (!exercise || !progress) return 1
  const isCompleted = isExerciseCompleted(exercise.action, progress)
  if (isCompleted) return 1
  return progress.repeatCount && progress.repeatCount > 0
    ? progress.repeatCount
    : 1
}

/**
 * Determine exercise card lock state and message:
 * - Past dates are locked (unless already completed, which remains unlocked for replay).
 * - Current day and future dates are NOT locked by date.
 * - A card with no video_url is locked.
 * - Completed exercises remain unlocked even when replayed.
 */
export const getExerciseLockState = (params: {
  dateStr?: string
  isToday?: boolean
  hasVideoUrl: boolean
  linearIndex?: number
  flatExercises?: WorkoutExerciseItem[]
  localProgressMap?: Record<string, ExerciseProgress>
}): { isLocked: boolean; reason: string } => {
  const { dateStr, hasVideoUrl, linearIndex, flatExercises, localProgressMap } =
    params

  const currentItem =
    flatExercises && linearIndex != null
      ? flatExercises[linearIndex]
      : undefined
  const currentProgress =
    currentItem && localProgressMap
      ? localProgressMap[String(currentItem.id)]
      : undefined

  // Completed exercises remain unlocked even when replayed (even on past dates)
  if (currentItem && isExerciseCompleted(currentItem.action, currentProgress)) {
    return { isLocked: false, reason: '' }
  }

  // Videos cannot be played for past dates (strictly before today).
  // Current day and future dates are unlocked!
  if (dateStr) {
    const isPast = moment(dateStr, 'YYYY-MM-DD').isBefore(moment(), 'day')
    if (isPast) {
      return {
        isLocked: true,
        reason: 'Videos cannot be played for past dates.',
      }
    }
  }

  // A card with no video_url is locked
  if (!hasVideoUrl) {
    return {
      isLocked: true,
      reason: 'No video URL available for this exercise.',
    }
  }

  return { isLocked: false, reason: '' }
}

/**
 * Attempt to open a YouTube video URL in external application / tab.
 * Returns true if the window was successfully opened, false otherwise.
 */
export const openYouTube = (url: string): boolean => {
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
    if (
      !newWindow ||
      newWindow.closed ||
      typeof newWindow.closed === 'undefined'
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Send workout action progress/completion to backend.
 * On completion: receives status: completed, video_watch_percentage: 100, repeat_count, action_date.
 * On background/leave: if watch % > 10 and < 100, sends percentage to backend.
 */
export const sendWorkoutActionToBackend = async (params: {
  exercise: any
  status: 'completed' | 'in_progress'
  videoWatchPercentage: number
  repeatCount: number
  actionDate: string
  userId?: string | number
  subscriptionId?: string | number
}): Promise<void> => {
  const {
    exercise,
    status,
    videoWatchPercentage,
    repeatCount,
    actionDate,
    userId,
    subscriptionId,
  } = params

  const payload: any = {
    status,
    video_watch_percentage: videoWatchPercentage,
    repeat_count: repeatCount,
    action_date: actionDate,
    workout_id: exercise?.workout_id || exercise?.workout?.id || exercise?.id,
    exercise_id: exercise?.id,
  }

  if (subscriptionId) {
    payload.subscription_id = subscriptionId
  }
  if (userId) {
    payload.user_id = userId
  }

  try {
    const token = useAuthStore.getState().token
    const baseUrl =
      process.env.REACT_APP_BASE_URL ||
      'https://api-getfitmalayali.inovace.in/api/v1/'
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`

    const url = subscriptionId
      ? `${cleanBaseUrl}subscriptions/${subscriptionId}/workout_actions`
      : `${cleanBaseUrl}workout_actions`

    await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 5000,
    })
  } catch (err) {
    // Isolated network call fails silently without triggering global serverApi error interceptor
    console.debug(
      'Workout action reporting silently ignored (backend endpoint):',
      err
    )
  }
}
