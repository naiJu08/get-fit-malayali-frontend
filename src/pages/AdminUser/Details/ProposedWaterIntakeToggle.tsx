import React, { useState, useEffect, useRef } from 'react'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { updateUserWaterIntake } from '../api'

interface ProposedWaterIntakeToggleProps {
  userId: string | number
  initialCount?: number | null
  onUpdate?: (newCount: number | null) => void
  disabled?: boolean
}

export default function ProposedWaterIntakeToggle({
  userId,
  initialCount,
  onUpdate,
  disabled = false,
}: ProposedWaterIntakeToggleProps) {
  const { enqueueSnackbar } = useSnackbarManager()
  const [isActive, setIsActive] = useState<boolean>(
    Boolean(initialCount && initialCount > 0)
  )
  const [count, setCount] = useState<string>(
    initialCount ? String(initialCount) : ''
  )
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync with prop changes if updated externally
  useEffect(() => {
    if (initialCount && initialCount > 0) {
      setIsActive(true)
      setCount(String(initialCount))
    } else if (
      initialCount === null ||
      initialCount === undefined ||
      initialCount === 0
    ) {
      setIsActive(false)
      setCount('')
    }
  }, [initialCount])

  const handleToggle = async () => {
    if (disabled || isSubmitting) return

    if (!isActive) {
      // Trying to activate: validate count
      const numCount = parseFloat(count)
      if (isNaN(numCount) || numCount <= 0 || numCount > 999) {
        enqueueSnackbar('Please enter a valid count of glasses (1-999)', {
          variant: 'error',
        })
        inputRef.current?.focus()
        return
      }

      setIsSubmitting(true)
      try {
        await updateUserWaterIntake(userId, numCount)
        setIsActive(true)
        onUpdate?.(numCount)
        enqueueSnackbar(
          `Proposed water intake set to ${numCount} glasses and activated!`,
          { variant: 'success' }
        )
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.errors?.join(', ') ||
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to update proposed water intake'
        enqueueSnackbar(errorMsg, { variant: 'error' })
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Trying to deactivate / unlock for edit
      setIsSubmitting(true)
      try {
        await updateUserWaterIntake(userId, null)
        setIsActive(false)
        onUpdate?.(null)
        enqueueSnackbar('Proposed water intake deactivated', {
          variant: 'info',
        })
        setTimeout(() => inputRef.current?.focus(), 150)
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.errors?.join(', ') ||
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to deactivate proposed water intake'
        enqueueSnackbar(errorMsg, { variant: 'error' })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <div
      className={`group relative inline-flex items-center h-9 w-[205px] rounded-full border transition-all duration-500 ease-out select-none shadow-xs overflow-hidden ${
        isActive
          ? 'bg-gradient-to-r from-sky-500/10 via-blue-500/15 to-cyan-400/20 border-sky-400/70 shadow-[0_2px_12px_rgba(56,189,248,0.25)]'
          : 'bg-white/85 hover:bg-white border-sky-200/80 hover:border-sky-300 shadow-slate-100'
      } backdrop-blur-md`}
      title={
        isActive
          ? 'Water intake activated! Click the water glass icon to deactivate or edit.'
          : 'Enter count of glasses and click the water glass icon to activate.'
      }
    >
      {/* Background glass decorative water reflection */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
          isActive
            ? 'opacity-100 bg-gradient-to-r from-sky-400/10 via-blue-400/15 to-transparent'
            : 'opacity-0'
        }`}
      />

      {/* Left Area: When active, shows the active glasses count & status */}
      <div
        className={`absolute left-3 right-9 flex items-center transition-all duration-400 ${
          isActive
            ? 'opacity-100 translate-x-0 cursor-pointer'
            : 'opacity-0 -translate-x-3 pointer-events-none'
        }`}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-[13px] font-bold text-sky-900 tracking-tight">
            {count || '0'}
          </span>
          <span className="text-[11px] font-medium text-sky-700">
            {Number(count) === 1 ? 'Glass' : 'Glasses'}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/20 text-sky-800 uppercase tracking-wider ml-0.5">
            Active
          </span>
        </div>
      </div>

      {/* Right Area: When inactive, shows the text input for glass count */}
      <div
        className={`absolute left-9 right-2 flex items-center transition-all duration-400 ${
          !isActive
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-3 pointer-events-none'
        }`}
      >
        <div className="flex items-center w-full gap-1">
          <input
            ref={inputRef}
            type="number"
            min="1"
            max="999"
            maxLength={3}
            step="1"
            disabled={disabled || isSubmitting}
            value={count}
            onChange={(e) => {
              const val = e.target.value
              if (val.length > 3) return
              if (Number(val) > 999) return
              setCount(val)
            }}
            onInput={(e: React.FormEvent<HTMLInputElement>) => {
              const target = e.currentTarget
              if (target.value.length > 3) {
                target.value = target.value.slice(0, 3)
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Glass count..."
            className="w-full text-xs font-semibold text-slate-700 bg-transparent placeholder-slate-400 focus:outline-none focus:ring-0 border-none p-0 tracking-tight"
          />
          <span className="text-[10px] font-medium text-slate-400 shrink-0">
            gl
          </span>
        </div>
      </div>

      {/* The Animated Sliding Glass Icon (Toggle Thumb) */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || isSubmitting}
        className={`absolute top-1 z-10 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isActive
            ? 'left-[calc(100%-32px)] bg-gradient-to-tr from-sky-500 via-blue-500 to-cyan-400 text-white shadow-[0_2px_10px_rgba(14,165,233,0.45)] ring-2 ring-sky-300/40'
            : 'left-1 bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200/90 hover:scale-105 active:scale-95'
        } disabled:opacity-60 cursor-pointer`}
        aria-label={
          isActive ? 'Deactivate water intake' : 'Activate water intake'
        }
      >
        {isSubmitting ? (
          <svg
            className="w-3.5 h-3.5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : isActive ? (
          /* FILLED & ACTIVATED WATER GLASS */
          <svg
            className="w-4 h-4 transition-transform duration-300"
            viewBox="0 0 24 24"
            fill="none"
          >
            {/* Glass Rim */}
            <line
              x1="5"
              y1="4"
              x2="19"
              y2="4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Glass Body */}
            <path
              d="M6 4.5 L7.8 19.2 A1.5 1.5 0 0 0 9.3 20.5 L14.7 20.5 A1.5 1.5 0 0 0 16.2 19.2 L18 4.5 Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Water Fill with Wave Effect */}
            <path
              d="M6.8 9.5 Q9 8 11.5 9.5 T16.2 9 L15.6 19.2 A1 1 0 0 1 14.6 20.1 L9.4 20.1 A1 1 0 0 1 8.4 19.2 Z"
              fill="currentColor"
              opacity="0.95"
            />
            {/* Water Surface Glimmer */}
            <ellipse
              cx="11.5"
              cy="9.4"
              rx="4.2"
              ry="0.8"
              fill="#ffffff"
              opacity="0.75"
            />
            {/* Air Bubble */}
            <circle cx="10" cy="14" r="0.9" fill="#ffffff" opacity="0.8" />
            <circle cx="13" cy="16.5" r="0.6" fill="#ffffff" opacity="0.7" />
          </svg>
        ) : (
          /* BLANK / EMPTY WATER GLASS */
          <svg
            className="w-4 h-4 transition-transform duration-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Rim */}
            <line x1="5" y1="4" x2="19" y2="4" strokeWidth="2" />
            {/* Transparent Body */}
            <path d="M6 4.5 L7.8 19.2 A1.5 1.5 0 0 0 9.3 20.5 L14.7 20.5 A1.5 1.5 0 0 0 16.2 19.2 L18 4.5 Z" />
            {/* Subtle empty glass guide line */}
            <path
              d="M7.5 12 h9"
              strokeDasharray="1.5 2"
              strokeWidth="1"
              opacity="0.35"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
