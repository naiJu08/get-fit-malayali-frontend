import { useEffect, useMemo, useState } from 'react'
import { DialogModal } from '../../components/common'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import {
  copyWorkoutTemplateExercises,
  getSubscriptionCopyWorkoutTargetDays,
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
      getData(`${apiUrl.WORKOUT_TEMPLATES}?page=1&per_page=100`)
        .then((response: any) => {
          const items = (response?.workout_templates || []).filter(
            (template: any) => String(template.id) !== String(sourceTemplateId)
          )
          setParents(items)
          setTargets(items)
        })
        .catch(() => setError('Failed to load workout templates'))
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
            `${apiUrl.WORKOUT_TEMPLATES}/${selectedParentId}?page=1&per_page=100`
          )
        : getSubscriptionCopyWorkoutTargetDays(
            selectedParentId,
            sourceTemplateId
          )
    loadTarget
      .then((response: any) => {
        const days =
          targetType === 'other_template'
            ? (response?.workout_template ?? response)?.days || []
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
      ? 'Legacy plan workout days'
      : selectedClientTarget?.target_kind === 'unassigned'
        ? 'No workout template assigned'
        : `Workout assignment: ${selectedClientTarget?.assignment_start_date || '—'} – ${selectedClientTarget?.assignment_end_date || '—'}`

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
      const response: any = await copyWorkoutTemplateExercises(
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
      className="w-[92vw] max-w-[900px]"
      body={
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Copying {sourceCount} source day{sourceCount === 1 ? '' : 's'}.
            Select at least {sourceCount} target day
            {sourceCount === 1 ? '' : 's'}.
          </p>
          {targetType !== 'same_template' && !selectedParentId && (
            <div className="space-y-2">
              <input
                className="w-full border rounded-lg p-3 text-sm"
                placeholder={
                  targetType === 'client'
                    ? 'Search clients'
                    : 'Search workout templates'
                }
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <div className="max-h-64 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                {loading && (
                  <div className="text-sm text-gray-500">Loading...</div>
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
                      className="text-left border rounded-lg p-3 hover:border-primaryGreen"
                      onClick={() => {
                        setTargets([])
                        setSelectedTargetIds([])
                        setError('')
                        setSelectedParentId(String(item.id))
                      }}
                    >
                      <div className="font-medium">
                        {item.name || item.user_name}
                      </div>
                      {targetType === 'client' && (
                        <div className="text-xs text-gray-500">
                          {item.start_date} – {item.end_date}
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}
          {targetType !== 'same_template' && selectedParentId && (
            <div className="space-y-1">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => {
                  setSelectedParentId('')
                  setSelectedClientTarget(null)
                  setTargets([])
                  setSelectedTargetIds([])
                }}
              >
                Change selection
              </button>
              {targetType === 'client' && selectedClientTarget && (
                <div className="text-xs text-gray-500">
                  Subscription: {selectedClientTarget.subscription_start_date} –{' '}
                  {selectedClientTarget.subscription_end_date} ·{' '}
                  {clientTargetSummary}
                </div>
              )}
            </div>
          )}
          {dayOptions.length > 0 && (
            <div className="space-y-2">
              <div className="font-semibold text-sm">Select target days</div>
              <div className="max-h-72 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                {dayOptions.map((day) => {
                  const isSourceDay =
                    targetType === 'same_template' &&
                    selectedSourceDayIds.map(String).includes(String(day.id))
                  return (
                    <label
                      key={day.id}
                      className={`flex items-center gap-3 border rounded-lg p-3 ${isSourceDay ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        disabled={isSourceDay}
                        checked={selectedTargetIds.includes(String(day.id))}
                        onChange={() => toggleTarget(day.id)}
                      />
                      <span>
                        {day.title || `Day ${day.day_number}`}
                        {day.target_date && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({day.target_date})
                          </span>
                        )}
                        {isSourceDay && (
                          <span className="ml-2 text-xs">(source day)</span>
                        )}
                      </span>
                    </label>
                  )
                })}
              </div>
              <div
                className={`text-xs ${selectedTargetIds.length >= sourceCount ? 'text-gray-500' : 'text-red-600'}`}
              >
                {selectedTargetIds.length} selected / minimum {sourceCount}{' '}
                required
              </div>
            </div>
          )}
          {!loading &&
            targetType !== 'same_template' &&
            selectedParentId &&
            dayOptions.length === 0 && (
              <div className="text-sm text-gray-500">
                No target days available.
              </div>
            )}
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      }
    />
  )
}
