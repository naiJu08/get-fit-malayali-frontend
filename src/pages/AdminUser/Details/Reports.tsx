import { useState } from 'react'
import { useSubscriptionReport } from '../api'
import Button from '../../../components/common/buttons/Button'

export default function Reports({
  user,
  subscriptionId,
}: {
  user: any
  subscriptionId?: string | number | null
}) {
  const [shouldGenerate, setShouldGenerate] = useState(false)

  const { data, isFetching, error } = useSubscriptionReport(subscriptionId, {
    enabled: !!subscriptionId && shouldGenerate,
  })

  const report = (data as any)?.subscription_report

  if (!subscriptionId) {
    return (
      <div className="p-6 text-sm text-gray-600">
        No active subscription to show report for.
      </div>
    )
  }

  if (!shouldGenerate) {
    return (
      <div className="flex flex-col gap-3 items-end justify-center text-sm text-gray-600">
        {/* <div>Click the button below to generate the subscription report.</div> */}
        <Button
          className="primaryButton"
          label="Generate Report"
          onClick={() => setShouldGenerate(true)}
        />
      </div>
    )
  }

  if (isFetching) {
    return (
      <div className="p-6 text-sm text-gray-600">
        Loading subscription report...
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="p-10 min-h-[40vh] flex flex-col items-center justify-center text-gray-500 text-sm">
        {(error as any)?.response?.data?.message || 'No report data available'}
      </div>
    )
  }

  const { subscription, plan, user: reportUser } = report
  const workout = report.workout_summary || {}
  const yoga = report.yoga_summary || {}
  const meditation = report.meditation_summary || {}
  const vitals = report.vitals || {}
  const weightBmi = report.weight_and_bmi || {}

  return (
    <div className="flex flex-col gap-4">
      {/* Header card */}
      <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-xs uppercase text-gray-500 mb-1">
              Subscription
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {plan?.name || 'Plan'}
            </div>
            <div className="text-sm text-gray-600">{plan?.category}</div>
          </div>
          <div className="text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-700">User :</span>{' '}
              {reportUser?.name || user?.name}
            </div>
            <div>
              <span className="font-medium text-gray-700">Duration :</span>{' '}
              {subscription?.start_date} to {subscription?.end_date}
            </div>
            <div>
              <span className="font-medium text-gray-700">Status :</span>{' '}
              {subscription?.status}
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase text-gray-700">
            Workout Summary
          </div>
          <div className="text-sm text-gray-700">
            Days with activity: {workout.total_days_with_activity ?? 0}
          </div>
          <div className="text-sm text-gray-700">
            Completed: {workout.total_completed_count ?? 0}
          </div>
          <div className="text-sm text-gray-700">
            Pending: {workout.total_pending_count ?? 0}
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase text-gray-700">
            Yoga Summary
          </div>
          <div className="text-sm text-gray-700">
            Days with activity: {yoga.total_days_with_activity ?? 0}
          </div>
          <div className="text-sm text-gray-700">
            Completed: {yoga.total_completed_count ?? 0}
          </div>
          <div className="text-sm text-gray-700">
            Pending: {yoga.total_pending_count ?? 0}
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase text-gray-700">
            Meditation Summary
          </div>
          <div className="text-sm text-gray-700">
            Sessions: {meditation.total_sessions ?? 0}
          </div>
          <div className="text-sm text-gray-700">
            Completed: {meditation.completed_count ?? 0}
          </div>
          <div className="text-sm text-gray-700">
            Missed: {meditation.missed_count ?? 0}
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase text-gray-700">
            Vitals
          </div>
          <div className="text-sm text-gray-700">
            Entries: {vitals.entries_count ?? 0}
          </div>
          <div className="text-sm text-gray-700">
            Avg heart rate: {vitals.avg_heart_rate ?? '—'}
          </div>
          <div className="text-sm text-gray-700">
            Avg sugar level: {vitals.avg_sugar_level ?? '—'}
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase text-gray-700">
            Weight & BMI
          </div>
          <div className="text-sm text-gray-700">
            Start weight: {weightBmi.start_weight ?? '—'}
          </div>
          <div className="text-sm text-gray-700">
            End weight: {weightBmi.end_weight ?? '—'}
          </div>
          <div className="text-sm text-gray-700">
            Weight change: {weightBmi.weight_delta ?? '—'}
          </div>
          <div className="text-sm text-gray-700">
            Avg BMI: {weightBmi.avg_bmi ?? '—'}
          </div>
        </div>
      </div>

      {report.overall_analysis && (
        <div className="border rounded-xl bg-white shadow-sm p-4">
          <div className="text-xs font-semibold uppercase text-gray-700 mb-1">
            Overall Analysis
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-line">
            {report.overall_analysis}
          </div>
        </div>
      )}
    </div>
  )
}
