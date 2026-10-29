import React, { FC, useEffect, useRef, useState, useCallback } from 'react'
import { WorkoutExerciseItem, ExerciseProgress } from './types'
import {
  getBreakSeconds,
  isExerciseCompleted,
  isYouTubeUrl,
  openYouTube,
  saveExerciseProgress,
  sendWorkoutActionToBackend,
  getExerciseThumbnail,
  getInitialResumeTime,
  getInitialRep,
} from './utils'
import { useSnackbarManager } from '../../../../components/common/snackbar'

interface WorkoutVideoModalProps {
  isOpen: boolean
  onClose: () => void
  flatExercises: WorkoutExerciseItem[]
  initialExerciseIndex: number
  userId?: string | number
  subscriptionId?: string | number
  actionDate: string
  localProgressMap: Record<string, ExerciseProgress>
  onProgressUpdated: (updatedMap: Record<string, ExerciseProgress>) => void
  onWorkoutCompleted?: () => void
  isWorkout?: boolean
}

export const WorkoutVideoModal: FC<WorkoutVideoModalProps> = ({
  isOpen,
  onClose,
  flatExercises,
  initialExerciseIndex,
  userId,
  subscriptionId,
  actionDate,
  localProgressMap,
  onProgressUpdated,
  onWorkoutCompleted,
  isWorkout = false,
}) => {
  const { enqueueSnackbar } = useSnackbarManager()
  const [currentIndex, setCurrentIndex] = useState<number>(initialExerciseIndex)
  const [currentRep, setCurrentRep] = useState<number>(1)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [volume, setVolume] = useState<number>(1)
  const [isMuted, setIsMuted] = useState<boolean>(false)

  // Break state
  const [isBreakActive, setIsBreakActive] = useState<boolean>(false)
  const [breakRemaining, setBreakRemaining] = useState<number>(0)
  const [breakTotal, setBreakTotal] = useState<number>(10)

  // Workout completion state
  const [isWorkoutComplete, setIsWorkoutComplete] = useState<boolean>(false)

  // Video element ref
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastSavedTimeRef = useRef<number>(0)
  const lastSentPctRef = useRef<number>(0)

  const currentExercise = flatExercises[currentIndex] as
    | WorkoutExerciseItem
    | undefined
  const totalReps =
    currentExercise?.reps && Number(currentExercise.reps) > 0
      ? Number(currentExercise.reps)
      : 1

  // Synchronize index when initialExerciseIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialExerciseIndex)
      setIsBreakActive(false)
      setIsWorkoutComplete(false)
      setIsPlaying(false)
      setCurrentTime(0)
      setCurrentRep(1)
    }
  }, [isOpen, initialExerciseIndex])

  // Current progress for this exercise
  const currentProgress = currentExercise
    ? localProgressMap[String(currentExercise.id)]
    : undefined

  // Save current progress locally
  const saveCurrentLocalProgress = useCallback(
    (params?: {
      syncParent?: boolean
      overrides?: Partial<ExerciseProgress>
    }) => {
      if (!currentExercise) return
      const cur = videoRef.current ? videoRef.current.currentTime : currentTime
      const rawDur = videoRef.current?.duration
      const dur =
        Number.isFinite(rawDur) && (rawDur ?? 0) > 0 ? (rawDur ?? 0) : duration
      const pct = dur > 0 ? (cur / dur) * 100 : 0
      const isFinished = pct >= 98

      // While replaying or playing, persist current position unless finished
      const savedTime = isFinished ? 0 : cur

      const updated = saveExerciseProgress(
        userId,
        actionDate,
        currentExercise.id,
        {
          currentTime: savedTime,
          duration: dur,
          watchedPercentage: isFinished
            ? 100
            : Math.max(
                Math.round(pct),
                currentProgress?.watchedPercentage || 0
              ),
          repeatCount: currentRep,
          completed: isFinished || currentProgress?.completed || false,
          ...params?.overrides,
        }
      )

      // Only notify parent when explicitly requested (pause, modal close, or completion)
      // to avoid continuous re-render cascades while the video is playing every second
      if (params?.syncParent !== false) {
        onProgressUpdated(updated)
      }
    },
    [
      currentExercise,
      currentTime,
      duration,
      currentRep,
      currentProgress,
      userId,
      actionDate,
      onProgressUpdated,
    ]
  )

  // Report in-progress watched percentage to backend if > 10% and < 100%
  const sendPartialProgressToBackend = useCallback(() => {
    if (!currentExercise) return
    const cur = videoRef.current ? videoRef.current.currentTime : currentTime
    const dur = videoRef.current ? videoRef.current.duration : duration
    const pct = dur > 0 ? (cur / dur) * 100 : 0

    if (pct > 10 && pct < 100 && Math.abs(pct - lastSentPctRef.current) >= 2) {
      lastSentPctRef.current = pct
      sendWorkoutActionToBackend({
        exercise: currentExercise.rawExercise || currentExercise,
        status: 'in_progress',
        videoWatchPercentage: Math.round(pct),
        repeatCount: currentRep,
        actionDate,
        userId,
        subscriptionId,
      })
    }
  }, [
    currentExercise,
    currentTime,
    duration,
    currentRep,
    actionDate,
    userId,
    subscriptionId,
  ])

  // Mark exercise complete on backend and locally
  const markExerciseComplete = useCallback(
    async (ex: WorkoutExerciseItem) => {
      const dur = videoRef.current ? videoRef.current.duration : duration
      const updated = saveExerciseProgress(userId, actionDate, ex.id, {
        currentTime: 0,
        duration: dur,
        watchedPercentage: 100,
        repeatCount: 1,
        completed: true,
        completedAt: new Date().toISOString(),
      })
      onProgressUpdated(updated)

      await sendWorkoutActionToBackend({
        exercise: ex.rawExercise || ex,
        status: 'completed',
        videoWatchPercentage: 100,
        repeatCount: ex.reps && Number(ex.reps) > 0 ? Number(ex.reps) : 1,
        actionDate,
        userId,
        subscriptionId,
      })
    },
    [userId, actionDate, onProgressUpdated, subscriptionId, duration]
  )

  // Trigger break countdown or finish workout
  const proceedAfterExerciseCompletion = useCallback(() => {
    if (!currentExercise) return
    const nextIdx = currentIndex + 1
    if (nextIdx < flatExercises.length) {
      // Break countdown
      const breakSec = getBreakSeconds(currentExercise.intensity, isWorkout)
      setBreakTotal(breakSec)
      setBreakRemaining(breakSec)
      setIsBreakActive(true)
    } else {
      // End of workout
      setIsWorkoutComplete(true)
      if (onWorkoutCompleted) {
        onWorkoutCompleted()
      }
    }
  }, [
    currentIndex,
    flatExercises.length,
    currentExercise,
    isWorkout,
    onWorkoutCompleted,
  ])

  // Transition to next exercise after break
  const startNextExercise = useCallback(() => {
    setIsBreakActive(false)
    const nextIdx = currentIndex + 1
    if (nextIdx >= flatExercises.length) {
      setIsWorkoutComplete(true)
      return
    }

    const nextExercise = flatExercises[nextIdx]
    setCurrentIndex(nextIdx)
    setCurrentRep(1)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)

    // If next exercise is a YouTube video: open directly in external app/tab
    if (isYouTubeUrl(nextExercise.videoUrl)) {
      if (nextExercise.videoUrl) {
        const opened = openYouTube(nextExercise.videoUrl)
        if (opened) {
          markExerciseComplete(nextExercise)
          enqueueSnackbar(
            `Opened "${nextExercise.workoutName}" in YouTube. Marked as completed.`,
            { variant: 'success' }
          )
        } else {
          enqueueSnackbar('Could not open YouTube', { variant: 'error' })
        }
      }
    }
  }, [currentIndex, flatExercises, markExerciseComplete, enqueueSnackbar])

  // Handle YouTube URL when current exercise loads
  useEffect(() => {
    if (!isOpen || !currentExercise) return

    if (isYouTubeUrl(currentExercise.videoUrl)) {
      if (currentExercise.videoUrl) {
        const opened = openYouTube(currentExercise.videoUrl)
        if (opened) {
          markExerciseComplete(currentExercise)
          enqueueSnackbar(
            `Opened "${currentExercise.workoutName}" in YouTube. Marked as completed.`,
            { variant: 'success' }
          )
        } else {
          enqueueSnackbar('Could not open YouTube', { variant: 'error' })
        }
      }
    } else {
      // Normal video: initialize repetition count
      const saved = localProgressMap[String(currentExercise.id)]
      const initialRep = getInitialRep(currentExercise, saved)
      setCurrentRep(initialRep)
      setCurrentTime(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isOpen])

  // Break Countdown Timer
  useEffect(() => {
    if (!isBreakActive) return

    if (breakRemaining <= 0) {
      startNextExercise()
      return
    }

    const timer = setInterval(() => {
      setBreakRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          startNextExercise()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isBreakActive, breakRemaining, startNextExercise])

  // Native video time update & repetition loop
  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const cur = videoRef.current.currentTime
    const rawDur = videoRef.current.duration
    const dur = Number.isFinite(rawDur) && rawDur > 0 ? rawDur : duration
    setCurrentTime(cur)

    // Save locally every 1 second without triggering parent re-render cascade
    const now = Date.now()
    if (now - lastSavedTimeRef.current >= 1000) {
      lastSavedTimeRef.current = now
      saveCurrentLocalProgress({ syncParent: false })
    }

    // 98% watched completion check: only valid if we have a valid duration > 1s
    if (Number.isFinite(dur) && dur > 1 && cur >= dur * 0.98) {
      handleRepetitionOrCompletion()
    }
  }

  // Handle video ended or reached >= 98%
  const handleRepetitionOrCompletion = () => {
    if (!currentExercise) return

    if (currentRep < totalReps) {
      // Next repetition
      const nextRep = currentRep + 1
      setCurrentRep(nextRep)
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play().catch((err) => {
          console.debug('Autoplay repetition error:', err)
        })
      }
      saveCurrentLocalProgress({
        overrides: {
          currentTime: 0,
          watchedPercentage: 0,
          repeatCount: nextRep,
          completed: false,
        },
      })
      enqueueSnackbar(`Repetition ${nextRep} of ${totalReps}`, {
        variant: 'info',
      })
    } else {
      // Completed all repetitions!
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
      setIsPlaying(false)
      setCurrentTime(0)
      setCurrentRep(1)
      markExerciseComplete(currentExercise)
      proceedAfterExerciseCompletion()
    }
  }

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.debug('Play error:', err)
        })
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
      // Pausing saves local progress
      saveCurrentLocalProgress()
    }
  }

  // Scrubber change
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = val
      setCurrentTime(val)
      saveCurrentLocalProgress({ overrides: { currentTime: val } })
    }
  }

  // Visibility and background changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause()
          setIsPlaying(false)
        }
        saveCurrentLocalProgress()
        sendPartialProgressToBackend()
      }
    }

    const handleBeforeUnload = () => {
      saveCurrentLocalProgress()
      sendPartialProgressToBackend()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [saveCurrentLocalProgress, sendPartialProgressToBackend])

  // Save on close
  const handleModalClose = () => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause()
    }
    saveCurrentLocalProgress()
    sendPartialProgressToBackend()
    onClose()
  }

  // Check if Next/Skip is allowed (only once completed or >= 98% watched)
  const isCurrentCompleted = currentExercise
    ? isExerciseCompleted(currentExercise.action, currentProgress)
    : false
  const watchedPct = duration > 0 ? (currentTime / duration) * 100 : 0
  const canSkipOrNext = isCurrentCompleted || watchedPct >= 98

  // Handle Next/Skip click
  const handleNextClick = () => {
    if (!canSkipOrNext) return
    if (currentExercise && !isCurrentCompleted) {
      markExerciseComplete(currentExercise)
    }
    proceedAfterExerciseCompletion()
  }

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (!isOpen || !currentExercise) return null

  const isYt = isYouTubeUrl(currentExercise.videoUrl)
  const nextExercise = flatExercises[currentIndex + 1]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 ring-2 ring-emerald-400/20" />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold truncate leading-tight">
                {currentExercise.workoutName}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Exercise {currentIndex + 1} of {flatExercises.length}
                {currentExercise.catName ? ` · ${currentExercise.catName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Repetitions Badge */}
            {totalReps > 1 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                <span>
                  🔁 Rep {currentRep}/{totalReps}
                </span>
              </span>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={handleModalClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
              title="Close Player"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Video / Break / Completion Viewport */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {/* 1. Workout Completion Screen */}
          {isWorkoutComplete ? (
            <div className="flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-emerald-500/10">
                🏆
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
                Workout Completed!
              </h2>
              {/* <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-5 leading-relaxed">
                Outstanding work! You have finished all {flatExercises.length} scheduled exercises for today.
              </p> */}
              <button
                type="button"
                onClick={handleModalClose}
                className="px-6 py-2.5 rounded-xl bg-primaryGreen text-white font-semibold text-sm hover:opacity-90 shadow-md hover:shadow-lg transition-all"
              >
                Done
              </button>
            </div>
          ) : isBreakActive ? (
            /* 2. Break Countdown Screen */
            <div className="flex flex-col items-center justify-center p-6 text-center animate-fadeIn w-full max-w-md">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-teal-300 mb-1">
                Rest & Recover
              </span>
              <h4 className="text-lg font-bold text-white mb-3">Break Time</h4>

              {/* Big Circular Countdown */}
              <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeDasharray={251.2}
                    strokeDashoffset={
                      251.2 - (251.2 * breakRemaining) / (breakTotal || 10)
                    }
                    className="text-primaryGreen transition-all duration-1000 ease-linear"
                    fill="transparent"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-3xl font-extrabold text-white font-mono">
                  {breakRemaining}
                </span>
              </div>

              {/* Next Exercise Preview */}
              {nextExercise &&
                (() => {
                  const nextThumb = getExerciseThumbnail(
                    nextExercise.thumbnailUrl,
                    nextExercise.videoUrl
                  )
                  return (
                    <div className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 flex items-center gap-3 mb-4 text-left">
                      <div className="w-14 h-10 rounded-md overflow-hidden bg-slate-900 shrink-0">
                        {nextThumb ? (
                          <img
                            src={nextThumb}
                            alt={nextExercise.workoutName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm">
                            🏋️
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Up Next
                        </span>
                        <p className="text-xs font-semibold text-white truncate">
                          {nextExercise.workoutName}
                        </p>
                        {nextExercise.reps && (
                          <span className="text-[10px] text-slate-300">
                            {nextExercise.reps} reps
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })()}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startNextExercise}
                  className="px-4 py-1.5 rounded-lg bg-primaryGreen text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Skip Break →
                </button>
              </div>
            </div>
          ) : isYt ? (
            /* 3. YouTube Notice */
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center text-2xl mb-3">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
              </div>
              <h4 className="text-base font-semibold mb-1">
                YouTube Video Opened
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mb-4">
                This exercise opened in your external YouTube app/tab and is
                marked as complete.
              </p>
              <div className="flex items-center gap-2">
                {currentExercise.videoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentExercise.videoUrl) {
                        openYouTube(currentExercise.videoUrl)
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                  >
                    Reopen YouTube
                  </button>
                )}
                <button
                  type="button"
                  onClick={proceedAfterExerciseCompletion}
                  className="px-3.5 py-1.5 rounded-lg bg-primaryGreen text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Proceed to Next →
                </button>
              </div>
            </div>
          ) : (
            /* 4. Native In-App Video Player */
            <>
              {currentExercise.videoUrl ? (
                <video
                  key={currentExercise.id}
                  ref={videoRef}
                  src={currentExercise.videoUrl}
                  playsInline
                  autoPlay
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      const dur = videoRef.current.duration
                      if (Number.isFinite(dur) && dur > 0) {
                        setDuration(dur)
                      }
                      const saved = localProgressMap[String(currentExercise.id)]
                      const resumeTime = getInitialResumeTime(
                        currentExercise,
                        saved,
                        dur
                      )
                      videoRef.current.currentTime = resumeTime
                      setCurrentTime(resumeTime)
                      videoRef.current.play().catch((err) => {
                        console.debug('Autoplay on metadata error:', err)
                        setIsPlaying(false)
                      })
                    }
                  }}
                  onEnded={handleRepetitionOrCompletion}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={togglePlay}
                />
              ) : (
                <div className="text-slate-400 text-xs">
                  No playable video URL for this exercise.
                </div>
              )}

              {/* Center Play/Pause button on pause */}
              {!isPlaying && currentExercise.videoUrl && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
                  title="Play"
                >
                  <svg
                    className="w-7 h-7 fill-current ml-1"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4 4l12 6-12 6V4z" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

        {/* Video Control Bar (only for native video when not in break or completion screen) */}
        {!isWorkoutComplete && !isBreakActive && !isYt && (
          <div className="px-4 py-3 bg-slate-800/95 border-t border-slate-700/80 flex flex-col gap-2">
            {/* Scrubber Progress Bar */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-300 min-w-9 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primaryGreen"
              />
              <span className="text-[11px] font-mono text-slate-400 min-w-9">
                {formatTime(duration)}
              </span>
            </div>

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Play / Pause Button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-white transition-colors"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 fill-current ml-0.5"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4l12 6-12 6V4z" />
                    </svg>
                  )}
                </button>

                {/* Volume Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      const nextMute = !isMuted
                      videoRef.current.muted = nextMute
                      setIsMuted(nextMute)
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>

                {/* Volume Slider */}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setVolume(val)
                    if (videoRef.current) {
                      videoRef.current.volume = val
                      videoRef.current.muted = val === 0
                      setIsMuted(val === 0)
                    }
                  }}
                  className="w-14 sm:w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primaryGreen"
                  title="Volume"
                />

                {/* Repetition Indicator */}
                {totalReps > 1 && (
                  <span className="text-[11px] text-slate-300 font-medium">
                    Repetition {currentRep} of {totalReps}
                  </span>
                )}
              </div>

              {/* Next / Skip Control Button */}
              <button
                type="button"
                onClick={handleNextClick}
                disabled={!canSkipOrNext}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  canSkipOrNext
                    ? 'bg-primaryGreen text-white hover:opacity-90 shadow-xs cursor-pointer'
                    : 'bg-slate-700/60 text-slate-500 cursor-not-allowed opacity-60'
                }`}
                title={
                  canSkipOrNext
                    ? 'Proceed to next'
                    : 'Available once current video is 98% watched or completed'
                }
              >
                <span>
                  {currentIndex + 1 < flatExercises.length ? 'Next' : 'Finish'}
                </span>
                {!canSkipOrNext && <span className="text-[10px]">🔒</span>}
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
