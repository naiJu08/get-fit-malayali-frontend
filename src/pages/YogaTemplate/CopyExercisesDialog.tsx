import { useEffect, useMemo, useState } from 'react'
import { DialogModal } from '../../components/common'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import {
  copyYogaTemplateExercises,
  getSubscriptionCopyYogaTargetDays,
} from './api'

export type CopyTargetType = 'same_template' | 'other_template' | 'client'

type Props = {
  open: boolean
  onClose: () => void
  sourceTemplateId: string | number
  sourceDays: any[]
  selectedSourceDayIds: Array<string | number>
  targetType: CopyTargetType
  onSuccess?: () => void
}

const targetLabels = {
  same_template: 'Copy to Same Template',
  other_template: 'Copy to Other Template',
  client: 'Copy to Client',
}

export default function CopyExercisesDialog({
  open,
  onClose,
  sourceTemplateId,
  sourceDays,
  selectedSourceDayIds,
  targetType,
  onSuccess,
}: Props) {
  const [targets, setTargets] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([])
  const [selectedParentId, setSelectedParentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedClientTarget, setSelectedClientTarget] = useState<any>(null)
  const { enqueueSnackbar } = useSnackbarManager()

  const sourceCount = selectedSourceDayIds.length
  const filteredTargets = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return targets
    return targets.filter((item) =>
      String(item?.title || item?.name || item?.user_name || '')
        .toLowerCase()
        .includes(query)
    )
  }, [search, targets])

  useEffect(() => {
    if (!open) return
    setSelectedTargetIds([])
    setSelectedParentId('')
    setParents([])
    setError('')
    setSearch('')
    setSelectedClientTarget(null)
    if (targetType === 'same_template') {
      setTargets(sourceDays)
      return
    }
    if (targetType === 'other_template') {
      setLoading(true)
      getData(`${apiUrl.YOGA_TEMPLATES}?page=1&per_page=100`)
        .then((response: any) => {
          const items = (response?.yoga_templates || []).filter(
            (template: any) => String(template.id) !== String(sourceTemplateId)
          )
          setParents(items)
          setTargets(items)
        })
        .catch(() => setError('Failed to load yoga templates'))
        .finally(() => setLoading(false))
      return
    }
    setLoading(true)
    getData(`${apiUrl.SUBSCRIPTIONS}?page=1&per_page=100`)
      .then((response: any) => {
        const items = (response?.subscriptions || response?.items || []).filter(
          (item: any) =>
            ['active', 'paused'].includes(String(item?.status)) &&
            item?.end_date >= new Date().toISOString().slice(0, 10)
        )
        setParents(items)
        setTargets(items)
      })
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoading(false))
  }, [open, targetType, sourceDays, selectedSourceDayIds, sourceTemplateId])

  useEffect(() => {
    if (!selectedParentId || targetType === 'same_template') return
    setLoading(true)
    setTargets([])
    setSelectedTargetIds([])
    setError('')
    const loadTarget =
      targetType === 'other_template'
        ? getData(
            `${apiUrl.YOGA_TEMPLATES}/${selectedParentId}?page=1&per_page=100`
          )
        : getSubscriptionCopyYogaTargetDays(selectedParentId, sourceTemplateId)
    loadTarget
      .then((response: any) => {
        const days =
          targetType === 'other_template'
            ? (response?.yoga_template ?? response)?.days || []
            : response?.copy_target?.days || []
        setTargets(
          Array.isArray(days) ? days.filter((day: any) => day?.id != null) : []
        )
        if (targetType === 'client')
          setSelectedClientTarget(response?.copy_target || null)
        setSelectedTargetIds([])
      })
      .catch(() => {
        setTargets([])
        setSelectedTargetIds([])
        setError('Failed to load target days')
      })
      .finally(() => setLoading(false))
  }, [selectedParentId, targetType])

  const parentOptions = targetType === 'same_template' ? [] : parents
  const dayOptions =
    targetType === 'same_template' || selectedParentId
      ? filteredTargets.filter((day: any) => day?.id != null)
      : []
  const canSubmit =
    selectedTargetIds.length >= sourceCount &&
    selectedTargetIds.length > 0 &&
    !loading
  const clientTargetSummary =
    selectedClientTarget?.target_kind === 'legacy_plan'
      ? 'Legacy plan yoga days'
      : selectedClientTarget?.target_kind === 'unassigned'
        ? 'No yoga template assigned'
        : `Yoga assignment: ${selectedClientTarget?.assignment_start_date || '—'} – ${selectedClientTarget?.assignment_end_date || '—'}`

  const toggleTarget = (id: any) => {
    const key = String(id)
    setSelectedTargetIds((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    )
  }

  const submit = async () => {
    if (!canSubmit) {
      setError(
        `Select at least ${sourceCount} target days to copy ${sourceCount} source day${sourceCount === 1 ? '' : 's'}.`
      )
      return
    }
    try {
      setLoading(true)
      const response: any = await copyYogaTemplateExercises(
        String(selectedSourceDayIds[0]),
        {
          source_day_ids: selectedSourceDayIds,
          target_day_ids: selectedTargetIds,
          target_type: targetType,
          ...(targetType === 'other_template'
            ? { target_template_id: selectedParentId }
            : {}),
          ...(targetType === 'client'
            ? {
                target_subscription_id: selectedParentId,
                target_kind: selectedClientTarget?.target_kind,
              }
            : {}),
        }
      )
      enqueueSnackbar(
        response?.message ||
          `${targetLabels[targetType]} completed successfully.`,
        { variant: 'success' }
      )
      onSuccess?.()
      onClose()
    } catch (e: any) {
      setError(
        e?.response?.data?.errors?.join(', ') || 'Failed to copy exercises'
      )
    } finally {
      setLoading(false)
    }
  }

  const selectionValid =
    selectedTargetIds.length >= sourceCount && selectedTargetIds.length > 0
  const selectionMessage = selectionValid
    ? `${selectedTargetIds.length} target ${selectedTargetIds.length === 1 ? 'day' : 'days'} ready to copy`
    : `${selectedTargetIds.length} selected / minimum ${sourceCount} required`

  return (
    <DialogModal
      isOpen={open}
      onClose={onClose}
      title={targetLabels[targetType]}
      actionLabel="Copy Exercises"
      actionLoader={loading}
      actionDisabled={!canSubmit}
      onSubmit={submit}
      secondaryAction={onClose}
      secondaryActionLabel="Cancel"
      small={false}
      className="w-[94vw] max-w-[920px]"
      body={
        <div className="space-y-5">
          <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Copy yoga exercises
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Choose where the selected source days should be copied.
                </p>
              </div>
              <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
                {sourceCount} source {sourceCount === 1 ? 'day' : 'days'}{' '}
                selected
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="flex items-center gap-2 text-blue-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                1
              </span>
              Choose destination
            </span>
            <span className="h-px flex-1 bg-gray-200" />
            <span
              className={`flex items-center gap-2 ${selectedParentId || targetType === 'same_template' ? 'text-blue-700' : 'text-gray-400'}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${selectedParentId || targetType === 'same_template' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
              >
                2
              </span>
              Select target days
            </span>
          </div>

          {targetType !== 'same_template' && !selectedParentId && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pl-10 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder={
                    targetType === 'client'
                      ? 'Search clients by name'
                      : 'Search yoga templates by name'
                  }
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <span className="absolute left-3 top-3.5 text-gray-400">⌕</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {targetType === 'client'
                    ? 'Select a subscription'
                    : 'Select a destination template'}
                </span>
                <span>
                  {
                    parentOptions.filter((item) =>
                      String(item?.name || item?.user_name || '')
                        .toLowerCase()
                        .includes(search.toLowerCase())
                    ).length
                  }{' '}
                  available
                </span>
              </div>
              <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto p-1 md:grid-cols-2">
                {loading && (
                  <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
                    Loading destinations...
                  </div>
                )}
                {!loading &&
                  parentOptions.filter((item) =>
                    String(item?.name || item?.user_name || '')
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  ).length === 0 && (
                    <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
                      No destinations found.
                    </div>
                  )}
                {parentOptions
                  .filter((item) =>
                    String(item?.name || item?.user_name || '')
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  )
                  .map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="group rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-400 hover:shadow-md"
                      onClick={() => {
                        setTargets([])
                        setSelectedTargetIds([])
                        setError('')
                        setSelectedParentId(String(item.id))
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {item.name || item.user_name}
                          </p>
                          {targetType === 'client' ? (
                            <p className="mt-1 text-xs text-gray-500">
                              Subscription dates: {item.start_date} –{' '}
                              {item.end_date}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-gray-500">
                              {item.description || 'Yoga template'}
                            </p>
                          )}
                          {targetType !== 'client' && (
                            <div className="mt-2 flex gap-3 text-[11px] text-gray-500">
                              <span>{item.duration_days || 0} days</span>
                              <span>{item.days_count || 0} generated days</span>
                            </div>
                          )}
                        </div>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                          →
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {targetType !== 'same_template' && selectedParentId && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Destination selected
                </p>
                <p className="truncate text-sm font-semibold text-gray-900">
                  {selectedClientTarget?.user_name ||
                    parents.find(
                      (item) => String(item.id) === String(selectedParentId)
                    )?.name ||
                    parents.find(
                      (item) => String(item.id) === String(selectedParentId)
                    )?.user_name}
                </p>
                {targetType === 'client' && selectedClientTarget && (
                  <p className="mt-1 text-xs text-gray-500">
                    Subscription: {selectedClientTarget.subscription_start_date}{' '}
                    – {selectedClientTarget.subscription_end_date} ·{' '}
                    {clientTargetSummary}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-blue-400 hover:text-blue-700"
                onClick={() => {
                  setSelectedParentId('')
                  setSelectedClientTarget(null)
                  setTargets([])
                  setSelectedTargetIds([])
                }}
              >
                Change selection
              </button>
            </div>
          )}

          {(targetType === 'same_template' || selectedParentId) && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Select target days
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Source exercises will replace the exercises in each selected
                    target day.
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selectionValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}
                >
                  {selectionMessage}
                </span>
              </div>
              {loading && (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
                  Loading target days...
                </div>
              )}
              {!loading && dayOptions.length > 0 && (
                <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto rounded-xl bg-gray-50 p-2 pr-1 md:grid-cols-2">
                  {dayOptions.map((day) => {
                    const isSourceDay =
                      targetType === 'same_template' &&
                      selectedSourceDayIds.map(String).includes(String(day.id))
                    const checked = selectedTargetIds.includes(String(day.id))
                    return (
                      <label
                        key={day.id}
                        className={`group flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 py-3 transition ${isSourceDay ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400' : checked ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'}`}
                      >
                        <input
                          type="checkbox"
                          disabled={isSourceDay}
                          checked={checked}
                          onChange={() => toggleTarget(day.id)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            {day.title || `Day ${day.day_number}`}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            Day {day.day_number}
                            {day.target_date ? ` · ${day.target_date}` : ''}
                            {isSourceDay ? ' · Source day' : ''}
                          </span>
                        </span>
                        {checked && <span className="text-blue-600">✓</span>}
                      </label>
                    )
                  })}
                </div>
              )}
              {!loading && dayOptions.length === 0 && (
                <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 p-5 text-center text-sm text-amber-700">
                  No target days available for this destination.
                </div>
              )}
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${selectionValid ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{
                    width: `${Math.min(100, sourceCount ? (selectedTargetIds.length / sourceCount) * 100 : 0)}%`,
                  }}
                />
              </div>
              {!selectionValid && (
                <p className="text-xs font-medium text-rose-600">
                  Select at least {sourceCount} target{' '}
                  {sourceCount === 1 ? 'day' : 'days'} to continue.
                </p>
              )}
              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {error}
                </div>
              )}
            </div>
          )}

          {!selectedParentId && targetType !== 'same_template' && error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}
        </div>
      }
    />
  )
}
