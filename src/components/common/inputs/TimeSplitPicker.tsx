import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FieldErrors } from 'react-hook-form'

import Icons from '../icons'

type Props = {
  label?: string
  onChange: (data: { value: string; name: string }) => void
  value?: string
  disabled?: boolean
  required?: boolean
  errors?: FieldErrors
  name: string
}

const pad2 = (n: number) => String(n).padStart(2, '0')

type ClockFaceProps = {
  options: string[]
  value?: string
  onSelect: (value: string) => void
  ariaLabel: string
}

const ClockFace = ({ options, value, onSelect, ariaLabel }: ClockFaceProps) => {
  const size = 128
  const center = size / 2
  const radius = 48
  const btn = 24

  return (
    <div
      role="dialog"
      aria-label={ariaLabel}
      className="w-[172px] h-[172px] overflow-hidden rounded-xl border border-formBorder bg-white shadow-popupShadow p-3"
    >
      <div className="relative mx-auto w-[128px] h-[128px]">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#F8FAFC] to-white border border-gray-200" />
        <div className="absolute inset-0 rounded-full ring-1 ring-gray-100" />
        <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#60A5FA]" />
        {options.map((opt, idx) => {
          const angle = (idx / options.length) * Math.PI * 2 - Math.PI / 2
          const x = center + radius * Math.cos(angle) - btn / 2
          const y = center + radius * Math.sin(angle) - btn / 2
          const selected = String(value ?? '').padStart(2, '0') === opt
          return (
            <button
              key={opt}
              type="button"
              className={`absolute flex items-center justify-center rounded-full text-sm font-semibold transition ${
                selected
                  ? 'bg-[#60A5FA] text-white shadow'
                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-200'
              }`}
              style={{ left: `${x}px`, top: `${y}px`, width: btn, height: btn }}
              onClick={() => onSelect(opt)}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const isValidHour = (value: string) => {
  if (!value) return false
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 && n <= 12
}

const isValidMinute = (value: string) => {
  if (!value) return false
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 && n <= 59
}

const parseValueToParts = (value?: string) => {
  if (!value) return { hour: '', minute: '', period: 'AM' as const }

  const [hRaw = '', mRaw = ''] = value.split(':')
  const hour24 = Number(hRaw)
  const minute = Number(mRaw)

  if (
    !Number.isFinite(hour24) ||
    hour24 < 0 ||
    hour24 > 23 ||
    !Number.isFinite(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    return { hour: '', minute: '', period: 'AM' as const }
  }

  const period = hour24 >= 12 ? ('PM' as const) : ('AM' as const)
  const hour12 = hour24 % 12 || 12

  return { hour: String(hour12), minute: pad2(minute), period }
}

const build24HourValue = (hour: string, minute: string, period: 'AM' | 'PM') => {
  const hourNum = Number(hour)
  const minuteNum = Number(minute)

  if (
    !Number.isFinite(hourNum) ||
    hourNum < 1 ||
    hourNum > 12 ||
    !Number.isFinite(minuteNum) ||
    minuteNum < 0 ||
    minuteNum > 59
  ) {
    return ''
  }

  let hour24 = hourNum % 12
  if (period === 'PM') hour24 += 12

  return `${pad2(hour24)}:${pad2(minuteNum)}:00`
}

const TimeSplitPicker = (props: Props) => {
  const {
    label,
    errors,
    onChange,
    value,
    disabled,
    required,
    name,
  } = props

  const initialParts = useMemo(() => parseValueToParts(value), [value])
  const [hour, setHour] = useState(initialParts.hour)
  const [minute, setMinute] = useState(initialParts.minute)
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialParts.period)
  const [hourOpen, setHourOpen] = useState(false)
  const [minuteOpen, setMinuteOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hourButtonRef = useRef<HTMLButtonElement | null>(null)
  const minuteButtonRef = useRef<HTMLButtonElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(
    null
  )

  useEffect(() => {
    const next = parseValueToParts(value)
    setHour(next.hour)
    setMinute(next.minute)
    setPeriod(next.period)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    if (!hourOpen && !minuteOpen) return
    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (containerRef.current?.contains(target)) return
      if (popupRef.current?.contains(target)) return
      setHourOpen(false)
      setMinuteOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [hourOpen, minuteOpen])

  useEffect(() => {
    const isOpen = hourOpen || minuteOpen
    if (!isOpen) {
      setPopupPos(null)
      return
    }

    const anchor =
      (hourOpen ? hourButtonRef.current : null) ??
      (minuteOpen ? minuteButtonRef.current : null)

    if (!anchor) return

    const compute = () => {
      const rect = anchor.getBoundingClientRect()
      const margin = 8
      // Rough size for the small clock popup (including padding)
      const popupW = 112
      const popupH = 112

      let left = rect.left
      left = Math.max(margin, Math.min(left, window.innerWidth - popupW - margin))

      // Prefer below the icon; if not enough space, show above.
      const belowTop = rect.bottom + margin
      const aboveTop = rect.top - popupH - margin
      const canShowBelow = belowTop + popupH <= window.innerHeight - margin
      const top = canShowBelow ? belowTop : Math.max(margin, aboveTop)

      setPopupPos({ top, left })
    }

    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [hourOpen, minuteOpen])

  const emitChange = (nextHour: string, nextMinute: string, nextPeriod: 'AM' | 'PM') => {
    const nextValue = build24HourValue(nextHour, nextMinute, nextPeriod)
    onChange({ value: nextValue, name })
  }

  const emitIfValid = (
    nextHour: string,
    nextMinute: string,
    nextPeriod: 'AM' | 'PM'
  ) => {
    if (!isValidHour(nextHour) || !isValidMinute(nextMinute)) return
    emitChange(nextHour, nextMinute, nextPeriod)
  }

  const getErrors = (err: any) => {
    let errMsg = ''
    if (err?.message) errMsg = err.message
    return errMsg
  }

  const hourOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1)),
    []
  )
  const minuteOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => pad2(i * 5)).filter(
        (v) => Number(v) <= 55
      ),
    []
  )

  return (
    <div className="flex flex-col" ref={containerRef}>
      {label && (
        <label className="labels label-text">
          {label}
          {required ? <span className="text-error"> *</span> : <></>}
        </label>
      )}

      <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 items-end">
        <div className="relative">
          <input
            disabled={disabled}
            inputMode="numeric"
            placeholder="HH"
            value={hour}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '')
              const nextRaw = digits.slice(-2)
              if (nextRaw === '') {
                setHour('')
                onChange({ value: '', name })
                return
              }
              const nextNum = Number(nextRaw)
              if (!Number.isFinite(nextNum) || nextNum < 1 || nextNum > 12) return
              setHour(nextRaw)
              emitIfValid(nextRaw, minute, period)
            }}
            onBlur={() => emitIfValid(hour, minute, period)}
            className={`w-full textfield pr-10 ${errors?.[name] ? 'textfield-error' : ''}`}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#757575]"
            disabled={disabled}
            ref={hourButtonRef}
            onClick={() => {
              setMinuteOpen(false)
              setHourOpen((v) => !v)
            }}
            aria-label="Pick hour"
          >
            <Icons name="clock-icon" className="w-4 h-4 fill-[#757575]" />
          </button>
        </div>

        <div className="relative">
          <input
            disabled={disabled}
            inputMode="numeric"
            placeholder="MM"
            value={minute}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '')
              const nextRaw = digits.slice(-2)
              if (nextRaw === '') {
                setMinute('')
                onChange({ value: '', name })
                return
              }
              const nextNum = Number(nextRaw)
              if (!Number.isFinite(nextNum) || nextNum < 0 || nextNum > 59) return
              setMinute(nextRaw)
              emitIfValid(hour, nextRaw, period)
            }}
            onBlur={() => {
              if (minute.length === 1) {
                const padded = minute.padStart(2, '0')
                setMinute(padded)
                emitIfValid(hour, padded, period)
                return
              }
              emitIfValid(hour, minute, period)
            }}
            className={`w-full textfield pr-10 ${errors?.[name] ? 'textfield-error' : ''}`}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#757575]"
            disabled={disabled}
            ref={minuteButtonRef}
            onClick={() => {
              setHourOpen(false)
              setMinuteOpen((v) => !v)
            }}
            aria-label="Pick minute"
          >
            <Icons name="clock-icon" className="w-4 h-4 fill-[#757575]" />
          </button>
        </div>

        <div className="relative">
          <select
            disabled={disabled}
            value={period}
            onChange={(e) => {
              const next = (e.target.value || 'AM') as 'AM' | 'PM'
              setPeriod(next)
              emitIfValid(hour, minute, next)
            }}
            className={`w-full textfield pr-10 ${errors?.[name] ? 'textfield-error' : ''}`}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757575] pointer-events-none">
            <Icons name="clock-icon" className="w-4 h-4 fill-[#757575]" />
          </span>
        </div>
      </div>

      {(hourOpen || minuteOpen) &&
        !disabled &&
        popupPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popupRef}
            style={{
              position: 'fixed',
              top: popupPos.top,
              left: popupPos.left,
              zIndex: 9999,
            }}
          >
            {hourOpen ? (
              <ClockFace
                ariaLabel="Hour picker"
                options={hourOptions.map((h) => h)}
                value={hour}
                onSelect={(opt) => {
                  setHourOpen(false)
                  setHour(opt)
                  emitIfValid(opt, minute, period)
                }}
              />
            ) : (
              <ClockFace
                ariaLabel="Minute picker"
                options={minuteOptions}
                value={minute}
                onSelect={(opt) => {
                  setMinuteOpen(false)
                  setMinute(opt)
                  emitIfValid(hour, opt, period)
                }}
              />
            )}
          </div>,
          document.body
        )}

      {errors && errors[name] && (
        <div className="text-error text-error-label mt-[1px]">
          {getErrors(errors[name])}
        </div>
      )}
    </div>
  )
}

export default TimeSplitPicker
