import { useEffect, useMemo, useState } from 'react'
import { DialogModal } from '../../components/common'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getData, postData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { getSubscriptionCopyDietTargetDays } from './api'

export type DietCopyTargetType = 'same_template' | 'other_template' | 'client'

type Props = {
  open: boolean
  onClose: () => void
  sourceTemplateId: string | number
  sourceDays: any[]
  sourceDayNumbers: Array<string | number>
  sourceMealIds?: Array<string | number>
  targetType: DietCopyTargetType
  onSuccess?: () => void | Promise<void>
}

const targetLabels = {
  same_template: 'Copy to Same Template',
  other_template: 'Copy to Other Template',
  client: 'Copy to Client',
}

const makeDays = (template: any) => {
  if (Array.isArray(template?.days) && template.days.length > 0) {
    return template.days.map((day: any) => ({
      ...day,
      id: day.day_number ?? day.id,
      day_number: day.day_number ?? day.id,
      title: `Day ${day.day_number ?? day.id}`,
    }))
  }
  return Array.from(
    { length: Number(template?.duration_days || 0) },
    (_, index) => ({
      id: index + 1,
      day_number: index + 1,
      title: `Day ${index + 1}`,
    })
  )
}

export default function CopyMealsDialog({
  open,
  onClose,
  sourceTemplateId,
  sourceDays,
  sourceDayNumbers,
  sourceMealIds = [],
  targetType,
  onSuccess,
}: Props) {
  const [targets, setTargets] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])
  const [selectedTargetDays, setSelectedTargetDays] = useState<string[]>([])
  const [selectedParentId, setSelectedParentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedClientTarget, setSelectedClientTarget] = useState<any>(null)
  const [replaceExisting, setReplaceExisting] = useState(true)
  const { enqueueSnackbar } = useSnackbarManager()

  const sourceCount = sourceDayNumbers.length

  const filteredTargets = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return targets
    return targets.filter((item) =>
      String(
        item?.title || item?.day_name || item?.name || item?.user_name || ''
      )
        .toLowerCase()
        .includes(query)
    )
  }, [search, targets])

  useEffect(() => {
    if (!open) return
    setSelectedTargetDays([])
    setSelectedParentId('')
    setParents([])
    setError('')
    setSearch('')
    setSelectedClientTarget(null)
    setReplaceExisting(true)

    if (targetType === 'same_template') {
      if (sourceDays.length > 1) {
        setTargets(sourceDays)
      } else {
        setLoading(true)
        getData(
          `${apiUrl.DIET_TEMPLATE}/${sourceTemplateId}?page=1&per_page=100`
        )
          .then((response: any) => {
            const tmpl = response?.diet_plan_template ?? response
            setTargets(makeDays(tmpl))
          })
          .catch(() => setError('Failed to load diet template days'))
          .finally(() => setLoading(false))
      }
      return
    }

    if (targetType === 'other_template') {
      setLoading(true)
      getData(`${apiUrl.DIET_TEMPLATE}?page=1&per_page=100`)
        .then((response: any) => {
          const items = (
            response?.diet_plan_templates ||
            response?.items ||
            []
          ).filter(
            (template: any) => String(template.id) !== String(sourceTemplateId)
          )
          setParents(items)
          setTargets([])
        })
        .catch(() => setError('Failed to load diet templates'))
        .finally(() => setLoading(false))
      return
    }

    setLoading(true)
    getData(`${apiUrl.SUBSCRIPTIONS}?page=1&per_page=100`)
      .then((response: any) => {
        const todayStr = new Date().toISOString().slice(0, 10)
        const items = (response?.subscriptions || response?.items || []).filter(
          (item: any) =>
            ['active', 'paused'].includes(String(item?.status)) &&
            item?.end_date >= todayStr
        )
        setParents(items)
        setTargets([])
      })
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoading(false))
  }, [open, targetType, sourceDays, sourceDayNumbers, sourceTemplateId])

  useEffect(() => {
    if (!selectedParentId || targetType === 'same_template') return
    setLoading(true)
    setTargets([])
    setSelectedTargetDays([])
    setError('')

    const loadTarget =
      targetType === 'other_template'
        ? getData(
            `${apiUrl.DIET_TEMPLATE}/${selectedParentId}?page=1&per_page=100`
          )
        : getSubscriptionCopyDietTargetDays(selectedParentId, sourceTemplateId)

    loadTarget
      .then((response: any) => {
        const tmpl = response?.diet_plan_template ?? response
        const days =
          targetType === 'other_template'
            ? makeDays(tmpl)
            : response?.copy_target?.days || []
        setTargets(
          Array.isArray(days) ? days.filter((day: any) => day != null) : []
        )
        if (targetType === 'client') {
          setSelectedClientTarget(response?.copy_target || null)
        }
        setSelectedTargetDays([])
      })
      .catch((e: any) => {
        setTargets([])
        setSelectedTargetDays([])
        setError(
          e?.response?.data?.errors?.join(', ') || 'Failed to load target days'
        )
      })
      .finally(() => setLoading(false))
  }, [selectedParentId, targetType, sourceTemplateId])

  useEffect(() => {
    if (targetType !== 'client' || !replaceExisting) return
    setSelectedTargetDays((current) =>
      current.filter(
        (id) =>
          !targets.find(
            (day) =>
              String(day.day_number ?? day.id) === String(id) &&
              day.replace_blocked
          )
      )
    )
  }, [replaceExisting, targetType, targets])

  const parentOptions = targetType === 'same_template' ? [] : parents
  const dayOptions =
    targetType === 'same_template' || selectedParentId
      ? filteredTargets.filter(
          (day: any) =>
            (day?.id != null || day?.day_number != null) &&
            (!day?.target_date ||
              day.target_date >= new Date().toISOString().slice(0, 10))
        )
      : []

  const canSubmit =
    selectedTargetDays.length >= sourceCount &&
    selectedTargetDays.length > 0 &&
    !loading

  const clientTargetSummary =
    selectedClientTarget?.target_kind === 'legacy_plan'
      ? 'Legacy plan diet days'
      : selectedClientTarget?.target_kind === 'unassigned'
        ? 'No diet template assigned'
        : `Diet assignment: ${selectedClientTarget?.assignment_start_date || '—'} – ${selectedClientTarget?.assignment_end_date || '—'}`

  const toggleTarget = (id: any) => {
    const key = String(id)
    setSelectedTargetDays((current) =>
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
      const response: any = await postData(
        `${apiUrl.DIET_TEMPLATE}/${sourceTemplateId}/copy_meals`,
        {
          source_day_numbers: sourceDayNumbers,
          source_meal_ids: sourceMealIds,
          target_type: targetType,
          target_day_numbers: selectedTargetDays,
          replace_existing: replaceExisting,
          ...(targetType === 'other_template'
            ? { target_template_id: selectedParentId }
            : {}),
          ...(targetType === 'client'
            ? { target_subscription_id: selectedParentId }
            : {}),
        }
      )
      enqueueSnackbar(
        response?.message ||
          `${targetLabels[targetType]} completed successfully.`,
        { variant: 'success' }
      )
      await onSuccess?.()
      onClose()
    } catch (e: any) {
      const message =
        e?.response?.data?.errors?.join(', ') || 'Failed to copy meals'
      enqueueSnackbar(message, { variant: 'error' })
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const selectionValid =
    selectedTargetDays.length >= sourceCount && selectedTargetDays.length > 0

  const selectionMessage = selectionValid
    ? `${selectedTargetDays.length} target ${selectedTargetDays.length === 1 ? 'day' : 'days'} ready to copy`
    : `${selectedTargetDays.length} selected / minimum ${sourceCount} required`

  return (
    <DialogModal
      isOpen={open}
      onClose={onClose}
      title={targetLabels[targetType]}
      actionLabel="Copy Meals"
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
                  Copy diet meals
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Choose where the selected source days should be copied.
                </p>
              </div>
              <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
                {sourceCount} source {sourceCount === 1 ? 'day' : 'days'}{' '}
                selected
                {sourceMealIds.length ? ` (${sourceMealIds.length} meals)` : ''}
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
                      : 'Search diet templates by name'
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
                        setSelectedTargetDays([])
                        setError('')
                        setSelectedParentId(String(item.id))
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {item.name || item.user_name}
                              {item.plan_name ? ` - ${item.plan_name}` : ''}
                            </p>
                            {targetType === 'client' && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                  item.start_date <=
                                  new Date().toISOString().slice(0, 10)
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {item.start_date <=
                                new Date().toISOString().slice(0, 10)
                                  ? 'Active'
                                  : 'Upcoming'}
                              </span>
                            )}
                          </div>
                          {targetType === 'client' ? (
                            <p className="mt-1 text-xs text-gray-500">
                              Subscription dates: {item.start_date} –{' '}
                              {item.end_date}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-gray-500">
                              {item.description || 'Diet template'}
                            </p>
                          )}
                          {targetType !== 'client' && (
                            <div className="mt-2 flex gap-3 text-[11px] text-gray-500">
                              <span>{item.duration_days || 0} days</span>
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
                  setSelectedTargetDays([])
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
                    Choose how copied meals should be handled in the selected
                    target days.
                  </p>
                </div>
                <button
                  type="button"
                  aria-pressed={replaceExisting}
                  aria-label={
                    replaceExisting
                      ? 'Replace existing meals'
                      : 'Append to existing meals'
                  }
                  onClick={() => setReplaceExisting((value) => !value)}
                  className={
                    'inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 ' +
                    (replaceExisting
                      ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50')
                  }
                >
                  <span>
                    {replaceExisting
                      ? 'Replace existing meals'
                      : 'Append to existing meals'}
                  </span>
                  <span
                    className={
                      'relative h-5 w-9 shrink-0 rounded-full transition-colors ' +
                      (replaceExisting ? 'bg-white/30' : 'bg-gray-200')
                    }
                  >
                    <span
                      className={
                        'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ' +
                        (replaceExisting ? 'translate-x-4' : 'translate-x-0')
                      }
                    />
                  </span>
                </button>
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
                    const dayKey = String(day.day_number ?? day.id)
                    const isSourceDay =
                      targetType === 'same_template' &&
                      sourceDayNumbers.map(String).includes(dayKey)
                    const replaceBlocked =
                      targetType === 'client' &&
                      replaceExisting &&
                      day?.replace_blocked
                    const checked = selectedTargetDays.includes(dayKey)
                    return (
                      <label
                        key={day.id ?? day.day_number}
                        className={`group flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 py-3 transition ${isSourceDay || replaceBlocked ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400' : checked ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'}`}
                      >
                        <input
                          type="checkbox"
                          disabled={isSourceDay || replaceBlocked}
                          checked={checked}
                          onChange={() => toggleTarget(dayKey)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            Day {day.day_number ?? day.id}
                            {day.meals_count != null
                              ? ` (${day.meals_count} meals)`
                              : ''}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            Day {day.day_number ?? day.id}
                            {day.target_date ? ` · ${day.target_date}` : ''}
                            {isSourceDay ? ' · Source day' : ''}
                            {replaceBlocked
                              ? ' · Today has started; append only'
                              : ''}
                          </span>
                        </span>
                        {checked && (
                          <span className="text-blue-600 font-bold">✓</span>
                        )}
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
                    width: `${Math.min(100, sourceCount ? (selectedTargetDays.length / sourceCount) * 100 : 0)}%`,
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
