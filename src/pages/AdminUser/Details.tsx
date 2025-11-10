import moment from 'moment'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import {
  getAdminDetails,
  useAssignedClients,
  createAssignedClient,
  deleteAssignedClient,
} from './api'
import { useAdminUser } from './api'
import Button from '../../components/common/buttons/Button'
import { createSubscription } from './api'
import { usePlans } from '../Plans/api'
import { AutoComplete } from 'qbs-core'
import { DialogModal } from '../../components/common'
import { QbsTable } from 'qbs-react-grid'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { useAuthStore } from '../../store/authStore'

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'details' | 'plans' | 'clients'>(
    'details'
  )

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await getAdminDetails(String(id))
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.response?.data?.message || 'Failed to load user')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    if (id) run()
    return () => {
      mounted = false
    }
  }, [id])

  const user = data?.user || data || {}
  const plans = user?.interested_plans || data?.interested_plans || []
  const subscribedPlan = user?.subscribed_plan
  const isNutritionist = (() => {
    const r = user?.role
    if (r === 2 || r === '2') return true
    const s = String(r || '').toLowerCase()
    return s === 'nutritionist'
  })()

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
  const computeEndDate = (start: string, days?: number) => {
    if (!start || !days || isNaN(days as any)) return ''
    const d = moment(start, 'YYYY-MM-DD', true)
    if (!d.isValid()) return ''
    const end = d.clone().add((days as number) - 1, 'days')
    return end.format('YYYY-MM-DD')
  }

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
  const closeSubscriptionDrawer = () => {
    setDrawerOpen(false)
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
  const canSubmit =
    !!user?.id &&
    typeof subForm.plan_id === 'number' &&
    subForm.plan_id > 0 &&
    !!subForm.start_date &&
    !!subForm.end_date &&
    (subForm.status === 0 || subForm.status === 1 || subForm.status === 2)

  const handleSubmitSubscription = async () => {
    if (!canSubmit) return
    try {
      setSubmitting(true)
      const payload = {
        subscription: {
          user_id: user?.id,
          plan_id: subForm.plan_id,
          start_date: subForm.start_date,
          end_date: subForm.end_date,
          status: 0,
        },
      }
      // Omit notes if it's empty to keep it optional
      if (subForm.notes && String(subForm.notes).trim() !== '') {
        ;(payload.subscription as any).notes = subForm.notes
      }
      await createSubscription(payload)
      // Refetch user details so UI reflects subscribed_plan
      try {
        const fresh = await getAdminDetails(String(id))
        setData(fresh)
      } catch {}
      setSelectedPlanOption(null)
      setDrawerOpen(false)
    } catch (e) {
      // no-op; could show error UI if needed
    } finally {
      setSubmitting(false)
    }
  }

  // Keep previously selected tab; Nutritionist has its own second tab (clients)

  // Assigned Clients (Nutritionist)
  const [clientsPage, setClientsPage] = useState(1)
  const [clientsPageSize, setClientsPageSize] = useState(10)
  const {
    data: assignedData,
    isFetching: clientsLoading,
    refetch: refetchAssigned,
  } = useAssignedClients({
    admin_id: loginRole === 'nutritionist' ? undefined : user?.id,
    page: clientsPage,
    per_page: clientsPageSize,
  } as any)
  const assignedClients = assignedData?.items || []

  const clientColumns: any[] = [
    {
      title: 'Client Name',
      field: 'user_name',
      customCell: true,
      renderCell: (row: any) => ({
        cell: row?.user_name,
        toolTip: row?.user_name,
      }),
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Assigned At',
      field: 'assigned_at',
      customCell: true,
      renderCell: (row: any) => ({
        cell: row?.assigned_at
          ? moment(row.assigned_at).format('YYYY-MM-DD HH:mm')
          : '',
        toolTip: row?.assigned_at,
      }),
      sortable: false,
      resizable: true,
      isVisible: true,
    },
  ]

  // Assign Client modal state
  const [assignOpen, setAssignOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [unassigning, setUnassigning] = useState(false)
  // Clear selected client when the Assign modal is closed (and ensure fresh state on open)
  useEffect(() => {
    if (!assignOpen) {
      setSelectedClient(null)
    }
  }, [assignOpen])
  // Load users for select options
  const { data: usersList, isFetching: usersLoading } = useAdminUser({
    page: 1,
    per_page: 100,
    search: '',
  } as any)
  const userOptions = (usersList?.items || []).filter((u: any) => {
    const r = String(u?.role || '').toLowerCase()
    return r === 'user' || r === '3'
  })

  const handleAssignClient = async () => {
    if (!user?.id || !selectedClient?.id) return
    try {
      setAssigning(true)
      await createAssignedClient({
        admin_id: user.id,
        user_id: selectedClient.id,
      })
      setAssignOpen(false)
      setSelectedClient(null)
      // refresh assigned clients list
      try {
        await refetchAssigned()
      } catch {}
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassignClient = async (row: any) => {
    if (!row?.id) return
    try {
      setUnassigning(true)
      await deleteAssignedClient(row.id)
      await refetchAssigned()
    } finally {
      setUnassigning(false)
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/users')} aria-label="Back">
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">User Details</h1>
        </div>
      </div>

      <div className="mb-4 border-b border-gray-200">
        <nav className="flex gap-2" aria-label="Tabs">
          <button
            className={`px-3 py-2 text-sm font-medium rounded-t border-b-2 ${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          {isNutritionist && loginRole !== 'nutritionist' ? (
            <button
              className={`px-3 py-2 text-sm font-medium rounded-t border-b-2 ${
                activeTab === 'clients'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('clients')}
            >
              Clients
            </button>
          ) : (
            <button
              className={`px-3 py-2 text-sm font-medium rounded-t border-b-2 ${
                activeTab === 'plans'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('plans')}
            >
              Subscriptions
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'details' && (
        <>
          {loading && (
            <div className="p-6">
              <InfoBox content="Loading user details..." />
            </div>
          )}
          {error && !loading && (
            <div className="p-6">
              <InfoBox content={error} />
            </div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Name" value={user?.name} />
              <DetailItem label="Email" value={user?.email || user?.username} />
              <DetailItem label="Phone" value={user?.phone} />
              <DetailItem label="Role" value={mapRole(user?.role)} />
              <DetailItem label="Gender" value={mapGender(user?.gender)} />
              <DetailItem
                label="Date of Birth"
                value={formatDate(user?.date_of_birth)}
              />
              {!isNutritionist && (
                <>
                  <DetailItem
                    label="Height (cm)"
                    value={safeStr(user?.height)}
                  />
                  <DetailItem
                    label="Weight (kg)"
                    value={safeStr(user?.weight)}
                  />
                  <DetailItem label="Lifestyle" value={user?.lifestyle} />
                  <DetailItem label="Goal" value={user?.goal} />
                  <DetailItem
                    label="Food Preferences"
                    value={user?.food_preferences}
                  />
                  <DetailItem
                    label="Medical Conditions"
                    value={user?.medical_conditions}
                  />
                  <DetailItem label="Ethnicity" value={user?.ethnicity} />
                </>
              )}
              <DetailItem label="Status" value={mapStatus(user?.status)} />
            </div>
          )}
        </>
      )}

      {isNutritionist && activeTab === 'clients' && (
        <>
          <div className="">
            <div className="flex justify-end mb-3">
              <Button
                className="primaryButton"
                label="Assign Client"
                onClick={() => {
                  setSelectedClient(null)
                  setAssignOpen(true)
                }}
              />
            </div>
            <QbsTable
              data={assignedClients}
              dataRowKey="id"
              toolbar={false}
              search={false}
              isLoading={clientsLoading || unassigning}
              height={
                assignedClients?.length === 0
                  ? calcWindowHeight(218)
                  : calcWindowHeight(300)
              }
              emptyTitle="No clients to display"
              emptySubTitle={''}
              columns={clientColumns}
              pagination={true}
              actionProps={[
                {
                  icon: <Icons name="delete" />,
                  title: 'Unassign',
                  toolTip: 'Unassign Client',
                  action: (row: any) => handleUnassignClient(row),
                },
              ]}
              paginationProps={{
                onPagination: (page: number) => setClientsPage(page),
                total: assignedData?.total ?? 0,
                currentPage: assignedData?.current_page ?? clientsPage,
                rowsPerPage: Number(clientsPageSize),
                onRowsPerPage: (n: number | string) =>
                  setClientsPageSize(Number(n)),
                dropOptions: [10, 20, 30, 50, 100],
              }}
            />
          </div>
        </>
      )}

      {!isNutritionist && activeTab === 'plans' && (
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
              {!subscribedPlan && (
                <div className="flex justify-end">
                  <Button
                    className="primaryButton"
                    label="Add Subscription"
                    onClick={() => openSubscriptionDrawer()}
                  />
                </div>
              )}
              <div className="relative border rounded-lg p-4 pt-6">
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
                        <div
                          key={p?.id}
                          className="border rounded-lg p-3 bg-white"
                        >
                          <div className="text-sm font-medium mb-1">
                            {safeStr(p?.name)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Category: {safeStr(p?.category)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 col-span-full">
                        <InfoBox content="No interested plans" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
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
                  const id =
                    typeof opt?.id === 'number'
                      ? opt.id
                      : parseInt(opt?.id, 10) || ''
                  // Set plan and clear date fields on plan change
                  handleSubFormChange('plan_id', id)
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
      {/* Assign Client Modal */}
      <DialogModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Client"
        onSubmit={handleAssignClient}
        actionLabel="Assign"
        actionLoader={assigning}
        secondaryAction={() => setAssignOpen(false)}
        secondaryActionLabel="Cancel"
        small={false}
        body={
          <div className="min-h-[200px] flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Select User <span className="text-red-500">*</span>
              </label>
              <AutoComplete
                name="assign_user_id"
                type="custom_select"
                desc="name"
                descId="id"
                data={userOptions}
                placeholder={
                  usersLoading ? 'Loading users...' : 'Select a user'
                }
                value={selectedClient?.name ?? ''}
                onChange={(opt: any) => setSelectedClient(opt)}
                required
              />
            </div>
          </div>
        }
      />
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">{safeStr(value)}</div>
    </div>
  )
}

function capitalizeWord(v: any) {
  const s = safeStr(v)
  if (s === '--') return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}
function mapGender(g: any) {
  if (g === 0 || g === '0') return 'Male'
  if (g === 1 || g === '1') return 'Female'
  if (g === 2 || g === '2') return 'Other'
  return capitalizeWord(g)
}
function mapRole(g: any) {
  if (g === 1 || g === '1') return 'Admin'
  if (g === 2 || g === '2') return 'Nutritionist'
  if (g === 3 || g === '3') return 'User'
  const s = String(g || '').toLowerCase()
  if (s === 'superadmin' || s === 'super admin') return 'Super Admin'
  return capitalizeWord(g)
}
function mapStatus(s: any) {
  if (s === 0 || s === '0') return 'Active'
  if (s === 1 || s === '1') return 'Suspended'
  return capitalizeWord(s)
}
function formatDate(d: any) {
  if (!d) return '--'
  const m = moment(d)
  return m.isValid() ? m.format('YYYY-MM-DD') : String(d)
}
function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
