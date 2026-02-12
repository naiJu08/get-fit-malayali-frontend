import moment from 'moment'
import { useMemo } from 'react'
import Icons from '../../../components/common/icons'
import { useUserReminders } from '../api'

const deriveReminderMoment = (reminder: any) => {
  const candidates = [
    reminder?.date,
    reminder?.reminder_date,
    reminder?.schedule_date,
    reminder?.scheduled_for,
    reminder?.start_date,
    reminder?.end_date,
    reminder?.created_at,
    reminder?.updated_at,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    const parsed = moment(candidate)
    if (parsed.isValid()) {
      return parsed
    }
  }

  return null
}

const REMINDER_COPY: Record<string, { label: string; icon: string }> = {
  water: {
    label: 'Hydration Breaks',
    icon: 'water-bottle-icon',
  },
  workout: {
    label: 'Workout',
    icon: 'exercise-icon',
  },
  sleep: {
    label: 'Sleep',
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

type ReminderWithMoment = {
  reminder: any
  scheduleMoment: moment.Moment | null
  timestamp: number
}

type ReminderGroup = {
  dateKey: string
  timestamp: number
  scheduleMoment: moment.Moment | null
  reminders: ReminderWithMoment[]
}

type ReminderGroupAccumulator = Record<
  string,
  {
    timestamp: number
    scheduleMoment: moment.Moment | null
    reminders: ReminderWithMoment[]
  }
>

type ReminderSettingsProps = {
  userId?: string | number
}

const ReminderSettings = ({ userId }: ReminderSettingsProps) => {
  const missingUserId = !userId
  const { data, isLoading, error } = useUserReminders({ userId })

  const reminders: any[] = !missingUserId ? (data?.items ?? []) : []

  const reminderGroups = useMemo(() => {
    if (reminders.length === 0) return []

    const grouped = reminders.reduce(
      (acc: ReminderGroupAccumulator, reminder: any) => {
        const scheduleMoment = deriveReminderMoment(reminder)
        const timestamp = scheduleMoment ? scheduleMoment.valueOf() : 0
        const dateKey = scheduleMoment
          ? scheduleMoment.clone().startOf('day').format('YYYY-MM-DD')
          : 'unscheduled'

        if (!acc[dateKey]) {
          acc[dateKey] = {
            timestamp,
            scheduleMoment,
            reminders: [] as {
              reminder: any
              scheduleMoment: moment.Moment | null
              timestamp: number
            }[],
          }
        }

        acc[dateKey].reminders.push({ reminder, scheduleMoment, timestamp })

        if (timestamp > acc[dateKey].timestamp) {
          acc[dateKey].timestamp = timestamp
          acc[dateKey].scheduleMoment = scheduleMoment
        }
        return acc
      },
      {} as ReminderGroupAccumulator
    )

    const groups: ReminderGroup[] = Object.entries(grouped).map(
      ([dateKey, payload]) => ({
        dateKey,
        timestamp: payload.timestamp,
        scheduleMoment: payload.scheduleMoment,
        reminders: payload.reminders,
      })
    )

    return groups.sort((a, b) => b.timestamp - a.timestamp)
  }, [reminders])

  const summary = useMemo(() => {
    const total = reminders.length
    const active = reminders.filter((r: any) => r?.active).length
    const types = Array.from(
      new Set(reminders.map((r: any) => r?.reminder_type || 'unknown'))
    )
    return { total, active, types }
  }, [reminders])

  return (
    <div className="flex flex-col gap-1">
      {missingUserId && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Select a user to view their reminders.
        </div>
      )}

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

      {!isLoading && reminderGroups.length > 0 && (
        <div className="flex flex-col gap-6">
          {reminderGroups.map((group: ReminderGroup) => (
            <div key={group.dateKey} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg mt-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Schedule Date
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {group.scheduleMoment
                      ? group.scheduleMoment.format('dddd, MMM DD, YYYY')
                      : 'Unscheduled'}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {group.reminders.length}{' '}
                  {group.reminders.length === 1 ? 'Reminder' : 'Reminders'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {group.reminders.map(({ reminder }: ReminderWithMoment) => {
                  const typeKey = String(
                    reminder?.reminder_type || ''
                  ).toLowerCase()
                  const meta = REMINDER_COPY[typeKey] ?? {
                    label: capitalize(reminder?.reminder_type) || 'Reminder',
                    hint: 'User configured reminder',
                    icon: 'notification-icon',
                  }
                  const isWorkoutReminder = typeKey === 'workout'
                  const isSleepReminder = typeKey === 'sleep'
                  const isActive = Boolean(reminder?.active)
                  const showInterval = reminder?.interval_minutes

                  const detailRows: {
                    key: string
                    label: string
                    value: string
                  }[] = []

                  if (!isWorkoutReminder) {
                    detailRows.push({
                      key: 'wake',
                      label: 'Wake Up',
                      value: formatTime(reminder?.start_time),
                    })
                  }

                  if (!isSleepReminder && !isWorkoutReminder) {
                    detailRows.push({
                      key: 'interval',
                      label: 'Interval',
                      value: showInterval
                        ? `${reminder.interval_minutes} mins`
                        : '--',
                    })
                    detailRows.push({
                      key: 'end',
                      label: 'End',
                      value: formatTime(reminder?.end_time),
                    })
                  }

                  return (
                    <div
                      key={reminder?.id}
                      className="relative flex h-full min-h-[310px] flex-col gap-1 rounded-2xl border border-gray-100 bg-disabledText p-6 shadow-sm transition-shadow duration-150 hover:shadow-md"
                    >
                      {/* STATUS — TOP RIGHT */}
                      <span
                        className={`absolute right-3 top-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isActive ? 'Active' : 'Paused'}
                      </span>

                      {/* ICON */}
                      <div className="flex justify-center pt-16">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-700 shadow">
                          <Icons name={meta.icon} />
                        </span>
                      </div>

                      {/* TYPE */}
                      <div className="mt-10 flex items-center justify-center gap-2">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Type:
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {meta.label}
                        </p>
                      </div>

                      {/* TIME */}
                      {!isWorkoutReminder && (
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Wake Up:
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatTime(reminder?.start_time)}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-2">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {!isSleepReminder ? 'Time:' : 'Bed Time:'}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatTime(reminder?.time_of_day)}
                        </p>
                      </div>

                      {!isSleepReminder && !isWorkoutReminder && (
                        <>
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              Interval
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              {showInterval
                                ? `${reminder.interval_minutes} mins`
                                : '--'}
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              End
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              {showInterval
                                ? `${reminder.end_time} mins`
                                : '--'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReminderSettings
