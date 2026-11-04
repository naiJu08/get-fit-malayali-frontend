import React, { FC, useState } from 'react'
import { getExerciseThumbnail, isYouTubeUrl } from './utils'

interface ExerciseThumbnailProps {
  thumbnailUrl?: string | null
  videoUrl?: string | null
  title: string
  durationText?: string | number | null
  isLocked: boolean
  lockReason?: string
  isCompleted: boolean
  onPlay: () => void
  onLockedClick?: (reason: string) => void
  className?: string
}

export const ExerciseThumbnail: FC<ExerciseThumbnailProps> = ({
  thumbnailUrl,
  videoUrl,
  title,
  durationText,
  isLocked,
  lockReason,
  isCompleted,
  onPlay,
  onLockedClick,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false)
  const resolvedThumbnail = !imageError
    ? getExerciseThumbnail(thumbnailUrl, videoUrl)
    : null
  const isYt = isYouTubeUrl(videoUrl)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLocked) {
      if (onLockedClick) {
        onLockedClick(lockReason || 'This exercise video is currently locked.')
      }
      return
    }
    onPlay()
  }

  return (
    <div
      onClick={handleClick}
      title={
        isLocked
          ? lockReason
          : isCompleted
            ? `Replay: ${title}`
            : `Play: ${title}`
      }
      className={`relative w-24 h-16 sm:w-28 sm:h-[4.5rem] rounded-lg overflow-hidden shrink-0 select-none transition-all duration-200 border ${
        isLocked
          ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-80'
          : isCompleted
            ? 'border-emerald-300 hover:border-emerald-400 hover:shadow-md cursor-pointer'
            : 'border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
      } group ${className}`}
    >
      {/* Background Media / Poster */}
      {resolvedThumbnail ? (
        <img
          src={resolvedThumbnail}
          alt={title}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            !isLocked ? 'group-hover:scale-105' : 'grayscale-[30%]'
          }`}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-1 text-center">
          <div className="text-white/40 text-lg mb-0.5">🏋️‍♂️</div>
          <span className="text-[9px] font-medium text-slate-300 truncate max-w-full px-1">
            {isYt ? 'YouTube' : 'Exercise'}
          </span>
        </div>
      )}

      {/* YouTube Tag Overlay */}
      {isYt && (
        <div className="absolute top-1 left-1 z-10">
          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-red-600/90 text-[8px] font-bold text-white shadow-xs">
            <svg className="w-2 h-2 fill-current" viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
            <span>YT</span>
          </span>
        </div>
      )}

      {/* Completed Checkmark Pill (Top-Right) */}
      {isCompleted && !isLocked && (
        <div className="absolute top-1 right-1 z-10">
          <span
            className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs ring-1 ring-white"
            title="Completed"
          >
            ✓
          </span>
        </div>
      )}

      {/* Duration Badge (Bottom-Right) */}
      {durationText && (
        <div className="absolute bottom-1 right-1 z-10">
          <span className="px-1 py-0.2 rounded bg-black/75 backdrop-blur-xs text-[8.5px] font-mono text-white/95 leading-none shadow-xs">
            {typeof durationText === 'number'
              ? `${durationText}m`
              : durationText.endsWith('m') || durationText.includes(':')
                ? durationText
                : `${durationText}m`}
          </span>
        </div>
      )}

      {/* Center Interactive Overlay */}
      {isLocked ? (
        <div className="absolute inset-0 z-20 bg-black/55 backdrop-blur-[0.5px] flex flex-col items-center justify-center text-white/90">
          <svg
            className="w-5 h-5 fill-current text-white/90 drop-shadow-sm mb-0.5"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-[8px] font-semibold tracking-wide text-white/80 uppercase">
            Locked
          </span>
        </div>
      ) : isCompleted ? (
        <div className="absolute inset-0 z-20 bg-black/20 group-hover:bg-black/45 transition-colors flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-white/95 text-emerald-600 flex items-center justify-center shadow-md opacity-85 group-hover:opacity-100 group-hover:scale-110 transition-all">
            <svg
              className="w-3.5 h-3.5 fill-current ml-0.5"
              viewBox="0 0 20 20"
            >
              <path d="M4 4l12 6-12 6V4z" />
            </svg>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-20 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-white/95 text-blue-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <svg
              className="w-3.5 h-3.5 fill-current ml-0.5"
              viewBox="0 0 20 20"
            >
              <path d="M4 4l12 6-12 6V4z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
