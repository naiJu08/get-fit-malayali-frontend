import { useMemo } from 'react'
import Icons from '../../../components/common/icons'
import { useUserReminders } from '../api'

interface ReminderSettingsProps {
  userId?: string | number
}

const REMINDER_COPY: Record<
  string,
  { label: string; hint: string; icon: string }
> = {
  water: {
    label: 'Hydration Breaks',
    hint: 'Keeps the user sipping through the day',
    icon: 'water-bottle-icon',
  },
  workout: {
    label: 'Workout Alarm',
    hint: 'Nudges the user to move and train',
    icon: 'exercise-icon',
  },
  sleep: {
    label: 'Sleep Wind-down',
    hint: 'Guides the user into a calm bedtime routine',
    icon: 'sleep-time-icon',
  },
}

const formatTime = (value?: string | null) => {
  if (!value) return '--'
  const [hourStr, minuteStr] = value.split(':')
  const hour = Number(hourStr)
  if (Number.isNaN(hour)) return value
  const minute = Number(minuteStr)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const normalizedHour = ((hour + 11) % 12) + 1
  return `${String(normalizedHour).padStart(2, '0')}:${String(minute).padStart(
    2,
    '0'
  )} ${suffix}`
}

const capitalize = (val?: string | null) => {
  if (!val) return ''
  return val.charAt(0).toUpperCase() + val.slice(1)
}

const ReminderSettings = ({ userId }: ReminderSettingsProps) => {
  const { data, isLoading, error } = useUserReminders({ user_id: userId })

  const reminders = data?.items ?? []

  const summary = useMemo(() => {
    const total = reminders.length
    const active = reminders.filter((r: any) => r?.active).length
    const types = Array.from(
      new Set(reminders.map((r: any) => r?.reminder_type || 'unknown'))
    )
    return { total, active, types }
  }, [reminders])

  if (!userId) {
    return (
      <div className="rounded-xl border bg-white p-6 text-sm text-gray-500">
        User details not available.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-100 bg-gradient-to-r from-slate-900 to-slate-700 p-5 text-white shadow-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-white/60">Total reminders</p>
          <p className="text-3xl font-semibold">{summary.total}</p>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-500">
          Loading reminders...
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Failed to load reminders. Please refresh.
        </div>
      )}

      {!isLoading && !error && reminders.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No reminders configured for this user yet.
        </div>
      )}

      {!isLoading && reminders.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {reminders.map((reminder: any) => {
            const typeKey = String(reminder?.reminder_type || '').toLowerCase()
            const meta = REMINDER_COPY[typeKey] ?? {
              label: capitalize(reminder?.reminder_type) || 'Reminder',
              hint: 'User configured reminder',
              icon: 'notification-icon',
            }
            const isActive = Boolean(reminder?.active)
            const showInterval = reminder?.interval_minutes
            return (
              <div
                key={reminder?.id}
                className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <span className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br text-blue-700">
                      <Icons name={meta.icon} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {meta.label}
                      </p>
                      <p className="text-xs text-gray-500">{meta.hint}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isActive ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Time of day
                    </p>
                    <p className="text-base font-semibold text-gray-800">
                      {formatTime(reminder?.time_of_day)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Interval
                    </p>
                    <p className="text-base font-semibold text-gray-800">
                      {showInterval
                        ? `${reminder.interval_minutes} mins`
                        : '--'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Start
                    </p>
                    <p className="text-base font-semibold text-gray-800">
                      {formatTime(reminder?.start_time)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      End
                    </p>
                    <p className="text-base font-semibold text-gray-800">
                      {formatTime(reminder?.end_time)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ReminderSettings
