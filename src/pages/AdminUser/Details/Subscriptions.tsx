import moment from 'moment'
import { useMemo, useState } from 'react'
import InfoBox from '../../../components/app/alertBox/infoBox'
import Button from '../../../components/common/buttons/Button'
import { AutoComplete } from 'qbs-core'
import { DialogModal } from '../../../components/common'
import Icons from '../../../components/common/icons'
import { usePlans } from '../../Plans/api'
import { createSubscription, getAdminDetails } from '../api'
import { useAuthStore } from '../../../store/authStore'
import { useSnackbarManager } from '../../../components/common/snackbar'

export default function Subscriptions({
  id,
  user,
  loading,
  error,
  onRefresh,
}: {
  id: string
  user: any
  loading: boolean
  error: string
  onRefresh: (data?: any) => void
}) {
  const plans = user?.interested_plans || []
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())

  const subscribedPlan = user?.subscribed_plan
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [subForm, setSubForm] = useState<{
    start_date: string
    end_date: string
    status: number | ''
    notes: string
    plan_id: number | ''
  }>({ start_date: '', end_date: '', status: 0, notes: '', plan_id: '' })
  const [submitting, setSubmitting] = useState(false)
  const [selectedPlanOption, setSelectedPlanOption] = useState<any>(null)
  const { data: plansList } = usePlans({ page: 1, per_page: 100 } as any)
  const allPlans: any[] = (plansList?.plans || plansList?.items || []) as any[]
  const { enqueueSnackbar } = useSnackbarManager()

  const computeEndDate = (start: string, days?: number) => {
    if (!start || !days || isNaN(days as any)) return ''
    const d = moment(start, 'YYYY-MM-DD', true)
    if (!d.isValid()) return ''
    const end = d.clone().add((days as number) - 1, 'days')
    return end.format('YYYY-MM-DD')
  }

  const handleSubFormChange = (
    name: 'start_date' | 'end_date' | 'status' | 'notes' | 'plan_id',
    value: any
  ) => {
    if (name === 'start_date') {
      const plan = allPlans?.find?.(
        (p: any) => String(p?.id) === String(subForm.plan_id)
      )
      const computed = computeEndDate(value, plan?.duration_days)
      setSubForm((prev) => ({
        ...prev,
        start_date: value,
        end_date: computed || prev.end_date,
      }))
      return
    }
    setSubForm((prev) => ({ ...prev, [name]: value }))
  }

  const canSubmit = useMemo(() => {
    return (
      !!user?.id &&
      typeof subForm.plan_id === 'number' &&
      subForm.plan_id > 0 &&
      !!subForm.start_date &&
      !!subForm.end_date &&
      (subForm.status === 0 || subForm.status === 1 || subForm.status === 2)
    )
  }, [user?.id, subForm])

  const openSubscriptionDrawer = () => {
    setSelectedPlanOption(null)
    setSubForm({
      start_date: '',
      end_date: '',
      status: 0,
      notes: '',
      plan_id: '',
    })
    setDrawerOpen(true)
  }
  const closeSubscriptionDrawer = () => setDrawerOpen(false)

  const handleSubmitSubscription = async () => {
    if (!canSubmit) return
    try {
      setSubmitting(true)
      const payload: any = {
        subscription: {
          user_id: user?.id,
          plan_id: subForm.plan_id,
          start_date: subForm.start_date,
          end_date: subForm.end_date,
          status: 0,
        },
      }
      if (subForm.notes && String(subForm.notes).trim() !== '') {
        payload.subscription.notes = subForm.notes
      }
      await createSubscription(payload)
      try {
        const fresh = await getAdminDetails(String(id))
        onRefresh(fresh)
      } catch {}
      enqueueSnackbar('Subscription created successfully', {
        variant: 'success',
      })
      setSelectedPlanOption(null)
      setDrawerOpen(false)
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {loading && (
        <div className="p-6">
          <InfoBox content="Loading interested plans..." />
        </div>
      )}
      {error && !loading && (
        <div className="p-6">
          <InfoBox content={error} />
        </div>
      )}
      {!loading && !error && (
        <div className="flex flex-col gap-4">
          {loginRole !== 'nutritionist' && !subscribedPlan && (
            <div className="flex justify-end">
              <Button
                className="primaryButton"
                label="Add Subscription"
                onClick={() => openSubscriptionDrawer()}
              />
            </div>
          )}
          <div
            className={`relative border rounded-lg p-4 pt-6 ${subscribedPlan ? 'mt-4' : ''}`}
          >
            <div className="absolute -top-3 left-3 px-2 z-10 bg-mainBgColor">
              <span className="text-lg font-medium text-gray-700">
                {subscribedPlan ? 'Subscribed Plan' : 'Interested Plans'}
              </span>
            </div>
            {subscribedPlan ? (
              <div className="grid grid-cols-1 gap-4">
                <div className="border rounded-lg p-3 bg-white">
                  <div className="text-sm font-medium mb-1">
                    {safeStr(subscribedPlan?.name)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Category: {safeStr(subscribedPlan?.category)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.isArray(plans) && plans.length > 0 ? (
                  plans.map((p: any) => (
                    <div key={p?.id} className="border rounded-lg p-3 bg-white">
                      <div className="text-sm font-medium mb-1">
                        {safeStr(p?.name)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Category: {safeStr(p?.category)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 min-h-[60vh] flex flex-col items-center justify-center text-gray-500">
                    <Icons name="no-data-icon" />
                    <div className="mt-3 text-sm">No interested plans</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <DialogModal
        isOpen={drawerOpen}
        onClose={() => closeSubscriptionDrawer()}
        title="Add Subscription"
        onSubmit={handleSubmitSubscription}
        actionLabel="Save"
        actionLoader={submitting}
        small={false}
        body={
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Plans <span className="text-red-500">*</span>
              </label>
              <AutoComplete
                name="plan_id"
                type="custom_select"
                desc="name"
                descId="id"
                data={allPlans}
                placeholder="Select a plan"
                value={selectedPlanOption?.name ?? ''}
                onChange={(opt: any) => {
                  setSelectedPlanOption(opt)
                  const pid =
                    typeof opt?.id === 'number'
                      ? opt.id
                      : parseInt(opt?.id, 10) || ''
                  handleSubFormChange('plan_id', pid)
                  setSubForm((prev) => ({
                    ...prev,
                    start_date: '',
                    end_date: '',
                  }))
                }}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 text-xs"
                value={subForm.start_date}
                onChange={(e) =>
                  handleSubFormChange('start_date', e.target.value)
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 text-xs"
                value={subForm.end_date}
                onChange={(e) =>
                  handleSubFormChange('end_date', e.target.value)
                }
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Notes (optional)
              </label>
              <textarea
                className="w-full border rounded px-3 py-2 text-xs"
                rows={3}
                value={subForm.notes}
                onChange={(e) => handleSubFormChange('notes', e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            {!canSubmit && (
              <div className="text-xs text-red-500">
                Please fill all required fields.
              </div>
            )}
          </div>
        }
      />
    </>
  )
}

function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
