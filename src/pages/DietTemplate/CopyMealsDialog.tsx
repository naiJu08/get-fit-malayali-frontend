import { useEffect, useMemo, useState } from 'react'
import { DialogModal } from '../../components/common'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getData, postData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'

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

const labels = {
  same_template: 'Copy to Same Template',
  other_template: 'Copy to Other Template',
  client: 'Copy to Client',
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
  const [parents, setParents] = useState<any[]>([])
  const [targets, setTargets] = useState<any[]>([])
  const [parentId, setParentId] = useState('')
  const [targetDays, setTargetDays] = useState<string[]>([])
  const [replaceExisting, setReplaceExisting] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const { enqueueSnackbar } = useSnackbarManager()

  const makeDays = (template: any) =>
    Array.from(
      { length: Number(template?.duration_days || 0) },
      (_, index) => ({
        id: index + 1,
        day_number: index + 1,
        title: `Day ${index + 1}`,
      })
    )

  useEffect(() => {
    if (!open) return
    setParentId('')
    setTargetDays([])
    setError('')
    setSearch('')
    setReplaceExisting(true)
    if (targetType === 'same_template') {
      setTargets(sourceDays)
      return
    }
    setLoading(true)
    getData(
      targetType === 'other_template'
        ? `${apiUrl.DIET_TEMPLATE}?page=1&per_page=100`
        : `${apiUrl.SUBSCRIPTIONS}?page=1&per_page=100`
    )
      .then((response: any) => {
        const list =
          targetType === 'other_template'
            ? (response?.diet_plan_templates || []).filter(
                (item: any) => String(item.id) !== String(sourceTemplateId)
              )
            : (response?.subscriptions || []).filter((item: any) =>
                ['active', 'paused'].includes(String(item?.status))
              )
        setParents(list)
        setTargets([])
      })
      .catch(() => setError('Failed to load copy targets'))
      .finally(() => setLoading(false))
  }, [open, targetType, sourceTemplateId, sourceDays])

  useEffect(() => {
    if (!parentId || targetType === 'same_template') return
    setLoading(true)
    setTargets([])
    setTargetDays([])
    const request =
      targetType === 'other_template'
        ? getData(`${apiUrl.DIET_TEMPLATE}/${parentId}`)
        : getData(`${apiUrl.SUBSCRIPTIONS}/${parentId}/copy_diet_target_days`)
    request
      .then((response: any) => {
        setTargets(
          targetType === 'other_template'
            ? makeDays(response?.diet_plan_template || response)
            : response?.copy_target?.days || []
        )
      })
      .catch((e: any) =>
        setError(
          e?.response?.data?.errors?.join(', ') || 'Failed to load target days'
        )
      )
      .finally(() => setLoading(false))
  }, [parentId, targetType])

  const visibleTargets = useMemo(
    () =>
      targets.filter((item) =>
        String(item?.title || item?.day_name || `Day ${item?.day_number}`)
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [targets, search]
  )
  const canSubmit =
    targetDays.length >= sourceDayNumbers.length &&
    sourceDayNumbers.length > 0 &&
    !loading
  const toggle = (id: any) =>
    setTargetDays((current) =>
      current.includes(String(id))
        ? current.filter((value) => value !== String(id))
        : [...current, String(id)]
    )
  const submit = async () => {
    if (!canSubmit) return
    try {
      setLoading(true)
      const response: any = await postData(
        `${apiUrl.DIET_TEMPLATE}/${sourceTemplateId}/copy_meals`,
        {
          source_day_numbers: sourceDayNumbers,
          source_meal_ids: sourceMealIds,
          target_type: targetType,
          target_day_numbers: targetDays,
          replace_existing: replaceExisting,
          ...(targetType === 'other_template'
            ? { target_template_id: parentId }
            : {}),
          ...(targetType === 'client'
            ? { target_subscription_id: parentId }
            : {}),
        }
      )
      enqueueSnackbar(response?.message || 'Meals copied successfully', {
        variant: 'success',
      })
      await onSuccess?.()
      onClose()
    } catch (e: any) {
      const message =
        e?.response?.data?.errors?.join(', ') || 'Failed to copy meals'
      setError(message)
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DialogModal
      isOpen={open}
      onClose={onClose}
      title={labels[targetType]}
      actionLabel="Copy Meals"
      actionLoader={loading}
      actionDisabled={!canSubmit}
      onSubmit={submit}
      secondaryAction={onClose}
      secondaryActionLabel="Cancel"
      small={false}
      className="w-[94vw] max-w-[820px]"
      body={
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 p-4 text-sm">
            <b>{sourceDayNumbers.length}</b> source day
            {sourceDayNumbers.length === 1 ? '' : 's'} selected
            {sourceMealIds.length ? ` (${sourceMealIds.length} meals)` : ''}.
          </div>
          {targetType !== 'same_template' && (
            <select
              className="w-full border rounded-lg p-3"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">
                Select {targetType === 'client' ? 'client' : 'template'}
              </option>
              {parents.map((item) => (
                <option key={item.id} value={item.id}>
                  {targetType === 'client'
                    ? `${item.user_name} - ${item.plan_name}`
                    : item.name}
                </option>
              ))}
            </select>
          )}
          {(targetType === 'same_template' || parentId) && (
            <>
              <input
                className="w-full border rounded-lg p-3"
                placeholder="Search days"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-auto">
                {visibleTargets.map((day) => (
                  <label
                    key={day.id ?? day.day_number}
                    className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={targetDays.includes(
                        String(day.day_number ?? day.id)
                      )}
                      onChange={() => toggle(day.day_number ?? day.id)}
                    />
                    <span>
                      {day.title || day.day_name || `Day ${day.day_number}`}
                      {day.meals_count != null
                        ? ` (${day.meals_count} meals)`
                        : ''}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
            />
            Replace existing meals in target days
          </label>
          <p className="text-xs text-gray-500">
            Select at least {sourceDayNumbers.length} target day
            {sourceDayNumbers.length === 1 ? '' : 's'}. Source days map to
            target days in selection order.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      }
    />
  )
}
