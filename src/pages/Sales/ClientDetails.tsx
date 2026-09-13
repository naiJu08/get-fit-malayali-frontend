import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

import FormBuilder from '../../components/app/formBuilder'
import InfoBox from '../../components/app/alertBox/infoBox'
import Button from '../../components/common/buttons/Button'
import Icons from '../../components/common/icons'
import PriceBadge from '../../components/common/PriceBadge'
import { DialogModal, TabContainer } from '../../components/common'
import Tab from '../../components/common/tab/Tab'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import {
  assignSalesClientStaff,
  createSalesPlanProposal,
  updateSalesPlanProposal,
  useSalesClient,
  useSalesPackages,
} from './api'

const roleLabels: Record<string, string> = {
  nutritionist: 'Nutritionist',
  physiotherapist: 'Physiotherapist',
  yogist: 'Yogist',
}

interface ServiceRoleConfig {
  key: string
  title: string
  tagline: string
  icon: string
  gradientBg: string
  borderColor: string
  borderHover: string
  iconBg: string
  iconColor: string
  avatarBg: string
  assignBtnClass: string
}

const serviceRoleConfigs: Record<string, ServiceRoleConfig> = {
  nutritionist: {
    key: 'nutritionist',
    title: 'Nutritionist',
    tagline: 'Diet & Nutrition Planning',
    icon: 'meal-icon',
    gradientBg: 'from-emerald-500/[0.08] via-emerald-500/[0.02] to-white',
    borderColor: 'border-emerald-200/90',
    borderHover:
      'hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10',
    iconBg: 'bg-emerald-100 ring-4 ring-emerald-500/15',
    iconColor: 'text-emerald-700',
    avatarBg: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    assignBtnClass:
      'bg-emerald-600 border border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700 shadow-sm shadow-emerald-600/25',
  },
  physiotherapist: {
    key: 'physiotherapist',
    title: 'Physiotherapist',
    tagline: 'Physical Health & Rehab',
    icon: 'workout',
    gradientBg: 'from-sky-500/[0.08] via-sky-500/[0.02] to-white',
    borderColor: 'border-sky-200/90',
    borderHover: 'hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10',
    iconBg: 'bg-sky-100 ring-4 ring-sky-500/15',
    iconColor: 'text-sky-700',
    avatarBg: 'bg-sky-100 text-sky-800 border border-sky-200',
    assignBtnClass:
      'bg-sky-600 border border-sky-600 text-white hover:bg-sky-700 hover:border-sky-700 shadow-sm shadow-sky-600/25',
  },
  yogist: {
    key: 'yogist',
    title: 'Yogist',
    tagline: 'Yoga & Mindful Wellness',
    icon: 'yoga-icon',
    gradientBg: 'from-purple-500/[0.08] via-purple-500/[0.02] to-white',
    borderColor: 'border-purple-200/90',
    borderHover:
      'hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10',
    iconBg: 'bg-purple-100 ring-4 ring-purple-500/15',
    iconColor: 'text-purple-700',
    avatarBg: 'bg-purple-100 text-purple-800 border border-purple-200',
    assignBtnClass:
      'bg-purple-600 border border-purple-600 text-white hover:bg-purple-700 hover:border-purple-700 shadow-sm shadow-purple-600/25',
  },
}

const getInitials = (name?: string) => {
  if (!name) return 'ST'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const formatDate = (value: any) =>
  value ? moment(value).format('DD-MM-YYYY') : '--'

const accountStatusColor = (value: any) => {
  switch (String(value || '').toLowerCase()) {
    case 'active':
      return 'border-green-200 bg-green-50 text-[#0fc8cd]'
    case 'pending':
    case 'inactive':
      return 'border-yellow-200 bg-yellow-50 text-yellow-700'
    case 'suspended':
    case 'blocked':
      return 'border-red-200 bg-red-50 text-red-700'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700'
  }
}

const statusLabel = (value: any) =>
  String(value || '--')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const safeStr = (v: any) => {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}

const capitalizeWord = (v: any) => {
  const s = safeStr(v)
  if (s === '--') return s
  return s
    .toLowerCase()
    .replace(/\b([a-z])/gi, (letter) => letter.toUpperCase())
}

const mapGender = (g: any) => {
  if (g === 0 || g === '0') return 'Male'
  if (g === 1 || g === '1') return 'Female'
  if (g === 2 || g === '2') return 'Other'
  return capitalizeWord(g)
}

const formatAge = (dob: any) => {
  if (!dob) return '--'
  const m = moment(dob)
  return m.isValid() ? `${moment().diff(m, 'years')} years` : '--'
}

const computeBMI = (weight: any, height: any) => {
  const w = parseFloat(weight)
  const h = parseFloat(height)
  if (!w || !h || h <= 0) return '--'
  const heightInMeters = h / 100
  return (w / (heightInMeters * heightInMeters)).toFixed(1)
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="border border-formBorder/80 rounded-lg p-3.5 bg-white shadow-2xs hover:border-formBorder transition">
      <div className="text-xs text-secondary mb-1 font-medium">{label}</div>
      <div className="text-sm font-semibold text-primaryText break-words">
        {safeStr(value)}
      </div>
    </div>
  )
}

const apiDate = (value: any) => {
  if (!value) return ''
  return value instanceof Date
    ? moment(value).format('YYYY-MM-DD')
    : moment(value).format('YYYY-MM-DD')
}

const paymentModeOptions = [
  { value: 'upi', label: 'UPI (GPay / PhonePe / Paytm / QR)' },
  { value: 'bank_transfer', label: 'Bank Transfer (NEFT / RTGS / IMPS)' },
  { value: 'card', label: 'Credit / Debit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
]

const getPaymentModeBadge = (mode?: string) => {
  const m = (mode || '').toLowerCase()
  switch (m) {
    case 'upi':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          UPI
        </span>
      )
    case 'bank_transfer':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Bank Transfer
        </span>
      )
    case 'card':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          Card
        </span>
      )
    case 'cash':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Cash
        </span>
      )
    case 'cheque':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Cheque
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
          {m ? m.toUpperCase() : 'Other'}
        </span>
      )
  }
}

const clientTabs = [
  { id: 'client_information', label: 'Client information' },
  { id: 'packages', label: 'Packages' },
  { id: 'assignments', label: 'Assignments' },
]

export default function SalesClientDetails() {
  const navigate = useNavigate()
  const location = useLocation()
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isSuperAdmin = loginRole === 'superadmin'
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { enqueueSnackbar } = useSnackbarManager()
  const { data, isLoading, refetch } = useSalesClient(id)

  const tabFromUrl = searchParams.get('tab')
  const validTabs = useMemo(
    () => ['client_information', 'packages', 'assignments'],
    []
  )
  const [activeTab, setActiveTab] = useState(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      return tabFromUrl
    }
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('sales-client-tab-' + id)
      if (stored && validTabs.includes(stored)) {
        return stored
      }
    }
    return 'client_information'
  })

  useEffect(() => {
    if (
      tabFromUrl &&
      validTabs.includes(tabFromUrl) &&
      tabFromUrl !== activeTab
    ) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl, validTabs, activeTab])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', tabId)
        return next
      },
      { replace: true }
    )
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sales-client-tab-' + id, tabId)
    }
  }
  const [pkgSearch, setPkgSearch] = useState('')
  const [pkgPage, setPkgPage] = useState(1)
  const pkgPageSize = 4
  const { data: packagesData, isFetching: packagesLoading } = useSalesPackages({
    page: pkgPage,
    per_page: pkgPageSize,
    search: pkgSearch,
  })
  const client = data?.client
  const activeProposal = client?.plan_proposals?.[0] || null
  const packages = useMemo(
    () => packagesData?.packages || [],
    [packagesData?.packages]
  )
  const pkgMeta = packagesData?.meta || {}
  const pkgTotalPages = pkgMeta.total_pages || 1
  const [proposalModal, setProposalModal] = useState(false)
  const [editingProposal, setEditingProposal] = useState<any>(null)
  const [proposalStep, setProposalStep] = useState(1)
  const [assignmentRole, setAssignmentRole] = useState('')
  const [expandedHistoryRole, setExpandedHistoryRole] = useState<string | null>(
    null
  )
  const [proposalLoading, setProposalLoading] = useState(false)
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const proposalMethods = useForm<any>({
    defaultValues: {
      plan_name: '',
      plan_id: '',
      start_date: '',
      notes: '',
      amount: '',
      payment_date: moment().format('YYYY-MM-DD'),
      payment_mode: 'upi',
      transaction_id: '',
      payment_notes: '',
    },
  })
  const assignmentMethods = useForm<any>({
    defaultValues: { staff_name: '', staff_user_id: '', notes: '', reason: '' },
  })
  const [staffSearch, setStaffSearch] = useState('')
  const [staffPage, setStaffPage] = useState(1)
  const selectedPlanId = proposalMethods.watch('plan_id')
  const anticipatedStart = proposalMethods.watch('start_date')
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<any>(null)
  const selectedPlan = selectedPlanId
    ? packages.find(
        (plan: any) => String(plan.id) === String(selectedPlanId)
      ) || selectedPlanDetails
    : null
  const visiblePackages = packages
  const anticipatedEnd =
    selectedPlan?.duration_days && anticipatedStart
      ? moment(anticipatedStart).add(
          Number(selectedPlan.duration_days) - 1,
          'days'
        )
      : null

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      enqueueSnackbar('File size exceeds 10MB limit.', { variant: 'error' })
      return
    }

    setReceiptFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setReceiptPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setReceiptPreview(null)
    }
  }

  const removeReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const selectedStaffId = assignmentMethods.watch('staff_user_id')
  const activeStaff = useMemo(() => {
    const term = staffSearch.trim().toLowerCase()
    const staff = client?.assignable_staff?.[assignmentRole] || []
    return staff.filter(
      (member: any) =>
        !term ||
        [member.name, member.email].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(term)
        )
    )
  }, [assignmentRole, client?.assignable_staff, staffSearch])
  const staffPageSize = 6
  const staffTotalPages = Math.max(
    1,
    Math.ceil(activeStaff.length / staffPageSize)
  )
  const visibleStaff = activeStaff.slice(
    (staffPage - 1) * staffPageSize,
    staffPage * staffPageSize
  )

  const openProposalModal = (proposal?: any) => {
    const targetProposal = proposal || activeProposal || null
    setEditingProposal(targetProposal)
    const existingPayment = targetProposal?.payment
    const planFees =
      targetProposal?.plan?.fees ??
      targetProposal?.plan?.discounted_sale_price ??
      0
    proposalMethods.reset({
      plan_name: targetProposal?.plan?.name || '',
      plan_id: targetProposal?.plan?.id ? String(targetProposal.plan.id) : '',
      start_date: targetProposal?.start_date || '',
      notes: targetProposal?.notes || '',
      amount: String(planFees),
      payment_date: existingPayment?.payment_date
        ? moment(existingPayment.payment_date).format('YYYY-MM-DD')
        : moment().format('YYYY-MM-DD'),
      payment_mode: existingPayment?.payment_mode || 'upi',
      transaction_id: existingPayment?.transaction_id || '',
      payment_notes: existingPayment?.notes || '',
    })
    setReceiptFile(null)
    setReceiptPreview(null)
    setSelectedPlanDetails(targetProposal?.plan || null)
    setProposalStep(1)
    setPkgSearch('')
    setPkgPage(1)
    setProposalModal(true)
  }

  const openAssignmentModal = (role: string) => {
    const current = client?.assignments?.find(
      (assignment: any) => assignment.role === role
    )
    assignmentMethods.reset({
      staff_name: current?.staff_name || '',
      staff_user_id: current?.staff_user_id || '',
      notes: current?.notes || '',
      reason: '',
    })
    setStaffSearch('')
    setStaffPage(1)
    setAssignmentRole(role)
  }

  const saveProposal = async () => {
    const values = proposalMethods.getValues()
    if (!values.plan_id) {
      enqueueSnackbar('Select a package plan.', { variant: 'error' })
      return
    }
    if (!values.start_date) {
      enqueueSnackbar('Select an anticipated start date.', { variant: 'error' })
      return
    }
    if (
      values.payment_date &&
      moment(values.payment_date).isAfter(moment(), 'day')
    ) {
      enqueueSnackbar('Payment date cannot be in the future.', {
        variant: 'error',
      })
      return
    }
    try {
      setProposalLoading(true)
      const formData = new FormData()
      formData.append('plan_id', String(values.plan_id))
      formData.append('start_date', apiDate(values.start_date))
      if (values.notes) formData.append('notes', values.notes)

      // Payment details - strictly match selected package fee
      const planAmount =
        selectedPlan?.fees ?? selectedPlan?.discounted_sale_price ?? 0
      formData.append('amount', String(planAmount))
      formData.append(
        'payment_date',
        apiDate(values.payment_date) || moment().format('YYYY-MM-DD')
      )
      formData.append('payment_mode', values.payment_mode || 'upi')
      if (values.transaction_id)
        formData.append('transaction_id', values.transaction_id)
      if (values.payment_notes)
        formData.append('payment_notes', values.payment_notes)
      if (receiptFile) formData.append('receipt', receiptFile)

      if (editingProposal) {
        await updateSalesPlanProposal(id, editingProposal.id, formData)
      } else {
        await createSalesPlanProposal(id, formData)
      }
      enqueueSnackbar(
        editingProposal
          ? 'Package proposal and payment updated successfully.'
          : 'Package proposal and payment recorded successfully.',
        { variant: 'success' }
      )
      setProposalModal(false)
      setEditingProposal(null)
      setReceiptFile(null)
      setReceiptPreview(null)
      await refetch()
    } catch (error: any) {
      enqueueSnackbar(
        getApiErrorMessage(error) || 'Unable to save proposed package.',
        { variant: 'error' }
      )
    } finally {
      setProposalLoading(false)
    }
  }

  const saveAssignment = async () => {
    const values = assignmentMethods.getValues()
    if (!assignmentRole || !values.staff_user_id) {
      enqueueSnackbar('Select a staff member.', { variant: 'error' })
      return
    }
    const current = client?.assignments?.find(
      (item: any) => item.role === assignmentRole
    )
    const isReassign = Boolean(
      current && String(current.staff_user_id) !== String(values.staff_user_id)
    )
    if (isReassign && !values.reason?.trim()) {
      enqueueSnackbar(
        'Please provide a reason for reassigning this staff member.',
        { variant: 'error' }
      )
      return
    }
    try {
      setAssignmentLoading(true)
      await assignSalesClientStaff(id, {
        role: assignmentRole,
        staff_user_id: values.staff_user_id,
        notes: values.notes || '',
        reason: values.reason || '',
      })
      enqueueSnackbar(
        `${roleLabels[assignmentRole]} ${isReassign ? 'reassigned' : 'assigned'} successfully.`,
        {
          variant: 'success',
        }
      )
      setAssignmentRole('')
      await refetch()
    } catch (error: any) {
      enqueueSnackbar(
        getApiErrorMessage(error) || 'Unable to assign staff member.',
        { variant: 'error' }
      )
    } finally {
      setAssignmentLoading(false)
    }
  }

  if (isLoading) return <InfoBox content="Loading client details..." />
  if (!client) return <InfoBox content="Client not found." />

  return (
    <div className="p-4 space-y-4">
      {/* Client Header */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(
                  isSuperAdmin && (location.state as any)?.from
                    ? (location.state as any).from
                    : '/sales/clients'
                )
              }
              className="rounded-lg hover:bg-gray-100 transition"
              aria-label="Back to clients"
            >
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {client.name || 'Client #' + id}
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span
              className={
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ' +
                accountStatusColor(client.status)
              }
            >
              {statusLabel(client.status)}
            </span>
            <span
              className={
                'rounded-full px-3 py-1 text-xs font-medium ' +
                (client.profile_completed
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700')
              }
            >
              {client.profile_completed
                ? 'Profile completed'
                : 'Profile not completed'}
            </span>
          </div>
        </div>
      </div>

      {!client.profile_completed && client.profile_completion_url && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-700">
            The client must complete the public registration link before service
            planning begins.
          </p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(client.profile_completion_url)
              enqueueSnackbar('Profile completion link copied', {
                variant: 'success',
              })
            }}
            // className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 active:scale-95"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg shadow-md shadow-blue-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Icons name="external-link" className="h-3.5 w-3.5" />
            Copy profile link
          </button>
        </div>
      )}

      <TabContainer
        data={clientTabs}
        activeTab={activeTab}
        onClick={(tab) => handleTabChange(String(tab.id))}
      >
        <Tab id="client_information">
          <section className="rounded-xl border border-formBorder bg-white p-5 shadow-xs">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-formBorder pb-3">
              <div>
                <h2 className="text-base font-bold text-primaryText">
                  Client information
                </h2>
                <p className="mt-0.5 text-xs text-secondary">
                  Personal, physical, and lifestyle profile details submitted by
                  the client.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Email" value={client.email} />
              <DetailItem label="Phone" value={client.phone} />
              <DetailItem
                label="Gender"
                value={mapGender(client.profile?.gender)}
              />
              <DetailItem
                label="Date of Birth"
                value={formatDate(client.profile?.date_of_birth)}
              />
              <DetailItem
                label="Age"
                value={formatAge(client.profile?.date_of_birth)}
              />
              <DetailItem
                label="Height (cm)"
                value={
                  client.profile?.height ? `${client.profile.height} cm` : '--'
                }
              />
              <DetailItem
                label="Weight (kg)"
                value={
                  client.profile?.weight ? `${client.profile.weight} kg` : '--'
                }
              />
              <DetailItem
                label="BMI"
                value={
                  client.profile?.bmi ||
                  computeBMI(client.profile?.weight, client.profile?.height)
                }
              />
              <DetailItem
                label="Lifestyle"
                value={capitalizeWord(client.profile?.lifestyle)}
              />
              <DetailItem
                label="Goal"
                value={capitalizeWord(client.profile?.goal)}
              />
              <DetailItem
                label="Food Preferences"
                value={capitalizeWord(client.profile?.food_preferences)}
              />
              <DetailItem
                label="Medical Conditions"
                value={capitalizeWord(client.profile?.medical_conditions)}
              />
              <DetailItem
                label="Food Allergies"
                value={capitalizeWord(client.profile?.food_allergies)}
              />
              <DetailItem
                label="Country"
                value={capitalizeWord(client.profile?.country)}
              />
              <DetailItem
                label="State"
                value={capitalizeWord(client.profile?.state)}
              />
              <DetailItem
                label="Language"
                value={capitalizeWord(client.profile?.language)}
              />
              <DetailItem
                label="Work Schedule"
                value={capitalizeWord(client.profile?.work_schedule)}
              />
              <DetailItem
                label="Occupation"
                value={capitalizeWord(client.profile?.occupation)}
              />
              <DetailItem
                label="Profile Status"
                value={client.profile_completed ? 'Completed' : 'Not completed'}
              />
              <DetailItem
                label="Account Status"
                value={statusLabel(client.status)}
              />
            </div>
          </section>
        </Tab>

        <Tab id="packages">
          <section className="rounded-lg border border-formBorder bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-formBorder pb-3">
              <div>
                <h2 className="font-semibold text-primaryText">
                  Proposed package
                </h2>
                <p className="mt-1 text-xs text-secondary">
                  Propose an active package plan and record payment transaction
                  details. Only 1 package can be proposed at a time.
                </p>
              </div>
              {activeProposal ? (
                <Button
                  label="Change package"
                  icon="edit"
                  outlined
                  onClick={() => openProposalModal(activeProposal)}
                  disabled={!client.profile_completed}
                />
              ) : (
                <Button
                  label="Add proposed package"
                  icon="plus"
                  onClick={() => openProposalModal()}
                  disabled={!client.profile_completed}
                />
              )}
            </div>
            {activeProposal ? (
              <div className="w-full rounded-xl border border-formBorder bg-gradient-to-br from-white via-cardWrapperBg/20 to-cardWrapperBg/50 p-5 shadow-xs transition-all hover:border-primaryGreen/30 hover:shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-formBorder bg-white p-1 flex items-center justify-center shadow-xs">
                      {activeProposal.plan?.thumbnail_url ? (
                        <img
                          src={activeProposal.plan.thumbnail_url}
                          alt={activeProposal.plan.name || ''}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-lg bg-cardWrapperBg text-primaryGreen">
                          <Icons name="package" className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-primaryText">
                          {activeProposal.plan?.name || 'Unnamed Package'}
                        </h3>
                        {activeProposal.status && (
                          <span
                            className={
                              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
                              (activeProposal.status === 'accepted'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : activeProposal.status === 'proposed'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-cardWrapperBg text-secondary border border-formBorder')
                            }
                          >
                            {statusLabel(activeProposal.status)}
                          </span>
                        )}
                        {activeProposal.plan?.category && (
                          <span className="shrink-0 rounded-full border border-formBorder bg-white px-2.5 py-0.5 text-xs font-medium text-secondary">
                            {activeProposal.plan.category}
                          </span>
                        )}
                        {activeProposal.plan?.duration_days && (
                          <span className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                            {activeProposal.plan.duration_days} days
                          </span>
                        )}
                      </div>
                      {activeProposal.plan?.description && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-secondary leading-relaxed">
                          {activeProposal.plan.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* <div className="flex shrink-0 items-center gap-2">
                <Button
                  label="Change package"
                  icon="edit"
                  outlined
                  onClick={() => openProposalModal(activeProposal)}
                  disabled={!client.profile_completed}
                />
              </div> */}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-formBorder/70 pt-4 sm:grid-cols-4">
                  <div className="rounded-lg border border-formBorder/60 bg-white p-3">
                    <div className="text-[11px] font-medium text-secondary uppercase tracking-wider">
                      Package Fees
                    </div>
                    <div className="mt-1 text-base font-bold text-primaryText">
                      {activeProposal.plan?.fees !== undefined &&
                      activeProposal.plan?.fees !== null
                        ? `₹${activeProposal.plan.fees}`
                        : '--'}
                      {activeProposal.plan?.actual_price &&
                        Number(activeProposal.plan.actual_price) >
                          Number(activeProposal.plan.fees) && (
                          <span className="ml-1.5 text-xs font-normal text-gray-400 line-through">
                            ₹{activeProposal.plan.actual_price}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-formBorder/60 bg-white p-3">
                    <div className="text-[11px] font-medium text-secondary uppercase tracking-wider">
                      Anticipated Start
                    </div>
                    <div className="mt-1 text-sm font-semibold text-primaryText flex items-center gap-1.5">
                      <Icons
                        name="calendar"
                        className="h-3.5 w-3.5 text-secondary"
                      />
                      {formatDate(activeProposal.start_date)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-formBorder/60 bg-white p-3">
                    <div className="text-[11px] font-medium text-secondary uppercase tracking-wider">
                      Anticipated End
                    </div>
                    <div className="mt-1 text-sm font-semibold text-primaryText flex items-center gap-1.5">
                      <Icons
                        name="calendar"
                        className="h-3.5 w-3.5 text-secondary"
                      />
                      {formatDate(activeProposal.end_date)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-formBorder/60 bg-white p-3">
                    <div className="text-[11px] font-medium text-secondary uppercase tracking-wider">
                      Proposed By
                    </div>
                    <div className="mt-1 text-sm font-semibold text-primaryText truncate">
                      {activeProposal.created_by?.name || '--'}
                    </div>
                  </div>
                </div>

                {activeProposal.notes && (
                  <div className="mt-3.5 rounded-lg border border-amber-200/60 bg-amber-50/40 p-3 text-xs text-amber-900">
                    <span className="font-semibold text-amber-800">
                      Notes:{' '}
                    </span>
                    <span className="whitespace-pre-wrap">
                      {activeProposal.notes}
                    </span>
                  </div>
                )}

                {/* Recorded Payment Details Section */}
                {activeProposal.payment && (
                  <div className="mt-4 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/50 via-teal-50/20 to-white p-4 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                            Recorded Payment Details
                          </h4>
                          <span className="text-[11px] text-emerald-700">
                            Payment proof and transaction details recorded for
                            this package
                          </span>
                        </div>
                      </div>
                      <div>
                        {getPaymentModeBadge(
                          activeProposal.payment.payment_mode
                        )}
                      </div>
                    </div>

                    <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                      <div className="rounded-lg bg-white p-2.5 border border-emerald-100/80 shadow-xs">
                        <div className="text-[10px] font-medium text-secondary uppercase tracking-wider">
                          Amount Paid
                        </div>
                        <div className="mt-1 text-sm font-bold text-emerald-700">
                          ₹
                          {Number(
                            activeProposal.payment.amount || 0
                          ).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-2.5 border border-emerald-100/80 shadow-xs">
                        <div className="text-[10px] font-medium text-secondary uppercase tracking-wider">
                          Payment Date
                        </div>
                        <div className="mt-1 font-semibold text-primaryText">
                          {formatDate(activeProposal.payment.payment_date)}
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-2.5 border border-emerald-100/80 shadow-xs">
                        <div className="text-[10px] font-medium text-secondary uppercase tracking-wider">
                          Transaction / Ref ID
                        </div>
                        <div
                          className="mt-1 font-mono text-[11px] font-semibold text-gray-800 truncate"
                          title={activeProposal.payment.transaction_id || '--'}
                        >
                          {activeProposal.payment.transaction_id || '--'}
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-2.5 border border-emerald-100/80 shadow-xs">
                        <div className="text-[10px] font-medium text-secondary uppercase tracking-wider">
                          Payment Proof
                        </div>
                        <div className="mt-1">
                          {activeProposal.payment.receipt_url ? (
                            <a
                              href={activeProposal.payment.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                              title={
                                activeProposal.payment.receipt_filename ||
                                'View Receipt'
                              }
                            >
                              <svg
                                className="h-3.5 w-3.5 text-emerald-600 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                />
                              </svg>
                              <span>View Proof</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">
                              No receipt attached
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {activeProposal.payment.notes && (
                      <div className="mt-3 border-t border-dashed border-emerald-200/60 pt-2 text-xs text-emerald-900">
                        <span className="font-semibold text-emerald-800">
                          Payment note:{' '}
                        </span>
                        <span className="italic">
                          {activeProposal.payment.notes}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-formBorder py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cardWrapperBg text-secondary">
                  <Icons name="package" className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-primaryText">
                  No proposed package yet
                </h3>
                <p className="mt-1 max-w-sm text-xs text-secondary">
                  Assign a package plan to set expected duration, pricing, and
                  services for this client.
                </p>
                <div className="mt-4">
                  <Button
                    label="Add proposed package"
                    icon="plus"
                    onClick={() => openProposalModal()}
                    disabled={!client.profile_completed}
                  />
                </div>
              </div>
            )}
          </section>
        </Tab>

        <Tab id="assignments">
          <section className="rounded-xl border border-formBorder bg-white p-5 shadow-xs">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-formBorder pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icons name="assign-team" className="h-4 w-4" />
                  </span>
                  <h2 className="text-base font-bold text-primaryText">
                    Service team assignments
                  </h2>
                </div>
                <p className="mt-1 text-xs text-secondary">
                  Assign one active team member for each service role.
                </p>
              </div>
              <span className="rounded-full border border-formBorder bg-cardWrapperBg px-3 py-1 text-xs font-medium text-secondary">
                {client.assignments?.length || 0} of{' '}
                {Object.keys(serviceRoleConfigs).length} roles assigned
              </span>
            </div>

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
              {Object.entries(serviceRoleConfigs).map(([role, config]) => {
                const assignment = client.assignments?.find(
                  (item: any) => item.role === role
                )
                const isAccepted = Boolean(
                  assignment?.accepted_at ||
                    (assignment?.workflow_status &&
                      assignment.workflow_status !== 'pending')
                )

                return (
                  <div
                    key={role}
                    className={`flex flex-col h-fit rounded-xl border bg-gradient-to-b ${config.gradientBg} p-5 transition-all duration-200 ${config.borderColor} ${config.borderHover}`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-3 border-b border-formBorder/70 pb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${config.iconBg} ${config.iconColor}`}
                          >
                            <Icons
                              name={config.icon}
                              className="flex items-center justify-center"
                            />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-primaryText">
                              {config.title}
                            </h3>
                            <p className="mt-0.5 text-[11px] text-secondary leading-tight">
                              {config.tagline}
                            </p>
                          </div>
                        </div>

                        {assignment ? (
                          <div className="shrink-0">
                            {isAccepted ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                                <svg
                                  className="h-3.5 w-3.5 text-emerald-600 shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                {assignment.workflow_status ===
                                'package_confirmed'
                                  ? 'Package Confirmed'
                                  : assignment.workflow_status ===
                                      'assessment_completed'
                                    ? 'Assessment Done'
                                    : 'Accepted'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                                </span>
                                Pending Acceptance
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-gray-200 bg-white/90 px-3 py-1 text-xs font-medium text-gray-500 shadow-sm shrink-0">
                            Not assigned
                          </span>
                        )}
                      </div>

                      {/* Card Content */}
                      {assignment ? (
                        <div className="mt-4 space-y-3">
                          {/* Assigned Person Profile Card */}
                          <div className="rounded-lg border border-formBorder/80 bg-white p-3.5 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold text-xs tracking-wider shadow-sm ${config.avatarBg}`}
                              >
                                {getInitials(assignment.staff_name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-bold text-primaryText">
                                  {assignment.staff_name || 'Assigned Staff'}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-secondary">
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="capitalize">
                                    Active {config.title}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Contact details */}
                            {(assignment.staff_email ||
                              assignment.staff_phone) && (
                              <div className="mt-2.5 space-y-1.5 border-t border-dashed border-formBorder/70 pt-2 text-xs text-secondary">
                                {assignment.staff_email && (
                                  <div className="flex items-center gap-2 truncate">
                                    <svg
                                      className="h-3.5 w-3.5 text-secondary shrink-0"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={1.75}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <span className="truncate">
                                      {assignment.staff_email}
                                    </span>
                                  </div>
                                )}
                                {assignment.staff_phone && (
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="h-3.5 w-3.5 text-secondary shrink-0"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={1.75}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                      />
                                    </svg>
                                    <span>{assignment.staff_phone}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Assignment Timeline Details */}
                          <div className="space-y-2 rounded-lg border border-formBorder/60 bg-white/80 p-3.5 text-xs shadow-sm">
                            <div className="flex items-center justify-between gap-2 text-secondary">
                              <span className="flex items-center gap-1.5">
                                <svg
                                  className="h-3.5 w-3.5 text-secondary shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1.75}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Assigned on:
                              </span>
                              <span className="font-semibold text-primaryText">
                                {formatDate(assignment.assigned_at)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 text-secondary">
                              <span>Acceptance:</span>
                              {isAccepted ? (
                                <span className="font-semibold text-emerald-700">
                                  {assignment.accepted_at
                                    ? `Accepted on ${formatDate(assignment.accepted_at)}`
                                    : 'Accepted'}
                                </span>
                              ) : (
                                <span className="font-semibold text-amber-700">
                                  Awaiting acceptance
                                </span>
                              )}
                            </div>

                            {assignment.notes && (
                              <div className="border-t border-dashed border-formBorder/60 pt-2 text-secondary">
                                <span className="font-semibold text-primaryText">
                                  Note:{' '}
                                </span>
                                <span className="italic">
                                  {assignment.notes}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Unassigned State Body */
                        <div className="my-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-formBorder/90 bg-white/70 py-8 px-4 text-center">
                          <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100/90 text-gray-400 shadow-sm">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.75}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                              />
                            </svg>
                          </div>
                          <div className="text-xs font-bold text-primaryText">
                            No {config.title} assigned
                          </div>
                          <div className="mt-1 text-[11px] text-secondary max-w-[210px] leading-relaxed">
                            Assign an active team member to provide dedicated{' '}
                            {config.title.toLowerCase()} service for this
                            client.
                          </div>
                        </div>
                      )}
                      {/* Assignment History Tracking */}
                      {(() => {
                        const roleHistories = (
                          client?.assignment_histories || []
                        ).filter((h: any) => h.service_role === role)
                        if (!roleHistories.length) return null
                        const isExpanded = expandedHistoryRole === role
                        return (
                          <div className="mt-3.5 border-t border-formBorder/70 pt-3">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedHistoryRole(isExpanded ? null : role)
                              }
                              className="flex w-full items-center justify-between rounded-lg bg-white/90 hover:bg-white border border-formBorder/80 px-3 py-2 text-xs font-semibold text-primaryText transition shadow-2xs"
                            >
                              <span className="flex items-center gap-1.5">
                                <svg
                                  className="h-3.5 w-3.5 text-secondary shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span>
                                  Assignment Tracking ({roleHistories.length})
                                </span>
                              </span>
                              <svg
                                className={`h-3.5 w-3.5 text-secondary transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>

                            {isExpanded && (
                              <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                                {roleHistories.map(
                                  (hist: any, index: number) => {
                                    const isCurrent =
                                      index === 0 && !hist.unassigned_at
                                    return (
                                      <div
                                        key={hist.id || index}
                                        className={`rounded-lg border p-2.5 text-xs transition ${
                                          isCurrent
                                            ? 'border-emerald-200 bg-emerald-50/40'
                                            : 'border-formBorder/80 bg-white/95'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-1.5">
                                          <div className="flex items-center gap-1.5 font-bold text-primaryText truncate">
                                            <span
                                              className={`h-2 w-2 rounded-full shrink-0 ${
                                                isCurrent
                                                  ? 'bg-emerald-500'
                                                  : 'bg-gray-400'
                                              }`}
                                            />
                                            <span className="truncate">
                                              {hist.staff_name || 'Staff User'}
                                            </span>
                                          </div>
                                          <span
                                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                              isCurrent
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : hist.action === 'reassigned'
                                                  ? 'bg-amber-100 text-amber-800'
                                                  : hist.action === 'unassigned'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}
                                          >
                                            {isCurrent
                                              ? 'Current'
                                              : hist.action}
                                          </span>
                                        </div>

                                        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-secondary">
                                          <span>
                                            <strong>Assigned:</strong>{' '}
                                            {formatDate(hist.assigned_at)}
                                          </span>
                                          {hist.unassigned_at ? (
                                            <span>
                                              <strong>Changed:</strong>{' '}
                                              {formatDate(hist.unassigned_at)}
                                            </span>
                                          ) : (
                                            <span className="text-emerald-700 font-semibold">
                                              Present
                                            </span>
                                          )}
                                          {hist.assigned_by_name && (
                                            <span>
                                              <strong>By:</strong>{' '}
                                              {hist.assigned_by_name}
                                            </span>
                                          )}
                                        </div>

                                        {hist.reason &&
                                          hist.action !== 'assigned' &&
                                          hist.reason.trim().toLowerCase() !==
                                            'initial assignment' && (
                                            <div className="mt-1.5 rounded border border-amber-200/90 bg-amber-50/90 p-1.5 text-[11px] text-amber-950">
                                              <span className="font-bold text-amber-900">
                                                Reason for change:{' '}
                                              </span>
                                              <span>{hist.reason}</span>
                                            </div>
                                          )}

                                        {hist.notes && (
                                          <div className="mt-1 text-[10px] text-secondary italic">
                                            Note: {hist.notes}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>

                    {/* Card Action Button */}
                    {assignment ? (
                      <button
                        type="button"
                        onClick={() => openAssignmentModal(role)}
                        disabled={!client.profile_completed}
                        className="group mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-formBorder bg-white py-2.5 px-3.5 text-xs font-semibold text-primaryText shadow-sm transition-all duration-150 hover:border-primary hover:bg-primary/5 hover:text-primary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-secondary transition-colors group-hover:text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                        <span>Change assignment</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openAssignmentModal(role)}
                        disabled={!client.profile_completed}
                        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 px-3.5 text-xs font-semibold shadow-sm transition-all duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${config.assignBtnClass}`}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span>Assign {config.title}</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </Tab>
      </TabContainer>

      <DialogModal
        isOpen={proposalModal}
        onClose={() => {
          setProposalModal(false)
          setEditingProposal(null)
          setSelectedPlanDetails(null)
          setReceiptFile(null)
          setReceiptPreview(null)
          setProposalStep(1)
        }}
        title={
          proposalStep === 1
            ? editingProposal
              ? 'Change proposed package'
              : 'Select package to propose'
            : proposalStep === 2
              ? 'Proposal schedule & notes'
              : 'Record payment details'
        }
        subTitle={
          proposalStep === 1
            ? 'Select an active package plan for the client.'
            : proposalStep === 2
              ? 'Set the anticipated start date and optional notes.'
              : 'Record payment transaction details and upload receipt proof.'
        }
        actionBody={
          <div className="flex flex-row gap-2.5 w-full justify-end pt-3 border-t border-formBorder">
            <Button
              label={
                proposalStep === 3
                  ? 'Back to Schedule'
                  : proposalStep === 2
                    ? 'Back to Packages'
                    : 'Cancel'
              }
              onClick={() => {
                if (proposalStep === 3) {
                  setProposalStep(2)
                } else if (proposalStep === 2) {
                  setProposalStep(1)
                } else {
                  setProposalModal(false)
                  setEditingProposal(null)
                  setReceiptFile(null)
                  setReceiptPreview(null)
                  setProposalStep(1)
                }
              }}
              outlined
            />
            <Button
              isLoading={proposalLoading}
              label={
                proposalStep === 1
                  ? 'Continue to Schedule'
                  : proposalStep === 2
                    ? 'Continue to Payment'
                    : editingProposal
                      ? 'Update Proposal & Payment'
                      : 'Save Proposal & Payment'
              }
              onClick={() => {
                if (proposalStep === 1) {
                  const planId = proposalMethods.getValues('plan_id')
                  if (!planId) {
                    enqueueSnackbar('Please select a package plan.', {
                      variant: 'error',
                    })
                    return
                  }
                  const currentPlan =
                    packages.find(
                      (plan: any) => String(plan.id) === String(planId)
                    ) || selectedPlanDetails
                  const defaultAmt =
                    currentPlan?.fees ?? currentPlan?.discounted_sale_price ?? 0
                  proposalMethods.setValue('amount', String(defaultAmt))
                  setProposalStep(2)
                } else if (proposalStep === 2) {
                  const startDate = proposalMethods.getValues('start_date')
                  if (!startDate) {
                    enqueueSnackbar(
                      'Please select an anticipated start date.',
                      {
                        variant: 'error',
                      }
                    )
                    return
                  }
                  setProposalStep(3)
                } else {
                  saveProposal()
                }
              }}
              primary
            />
          </div>
        }
        small={false}
        className="w-full max-w-4xl min-h-[600px]"
        body={
          <div>
            {/* 3-Step Wizard Indicator */}
            <div className="mb-5 flex items-center justify-between border-b border-formBorder/70 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ' +
                    (proposalStep === 1
                      ? 'bg-primaryGreen text-white shadow-xs'
                      : 'bg-primaryGreen/20 text-primaryGreen')
                  }
                >
                  1
                </span>
                <span
                  className={
                    'text-xs font-semibold ' +
                    (proposalStep === 1
                      ? 'text-primaryText font-bold'
                      : 'text-secondary')
                  }
                >
                  Package Plan
                </span>
              </div>
              <div
                className={
                  'h-0.5 w-10 sm:w-16 transition-colors ' +
                  (proposalStep >= 2 ? 'bg-primaryGreen' : 'bg-formBorder')
                }
              />
              <div className="flex items-center gap-2">
                <span
                  className={
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ' +
                    (proposalStep === 2
                      ? 'bg-primaryGreen text-white shadow-xs'
                      : proposalStep > 2
                        ? 'bg-primaryGreen/20 text-primaryGreen'
                        : 'bg-gray-100 text-gray-500')
                  }
                >
                  2
                </span>
                <span
                  className={
                    'text-xs font-semibold ' +
                    (proposalStep === 2
                      ? 'text-primaryText font-bold'
                      : 'text-secondary')
                  }
                >
                  Schedule
                </span>
              </div>
              <div
                className={
                  'h-0.5 w-10 sm:w-16 transition-colors ' +
                  (proposalStep === 3 ? 'bg-primaryGreen' : 'bg-formBorder')
                }
              />
              <div className="flex items-center gap-2">
                <span
                  className={
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ' +
                    (proposalStep === 3
                      ? 'bg-primaryGreen text-white shadow-xs'
                      : 'bg-gray-100 text-gray-500')
                  }
                >
                  3
                </span>
                <span
                  className={
                    'text-xs font-semibold ' +
                    (proposalStep === 3
                      ? 'text-primaryText font-bold'
                      : 'text-secondary')
                  }
                >
                  Payment
                </span>
              </div>
            </div>

            {proposalStep === 1 ? (
              <div>
                <div className="relative mb-4">
                  <Icons
                    name="search"
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={pkgSearch}
                    onChange={(e) => {
                      setPkgSearch(e.target.value)
                      setPkgPage(1)
                    }}
                    placeholder="Search packages by name, category, or price..."
                    className="w-full rounded-lg border border-formBorder bg-cardWrapperBg py-2.5 pl-10 pr-4 text-sm text-primaryText placeholder-gray-400 outline-none focus:border-primaryGreen focus:bg-white focus:ring-2 focus:ring-primaryGreen/20 transition"
                  />
                </div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-primaryText">
                    {pkgMeta.total_count || packages.length} package
                    {(pkgMeta.total_count || packages.length) === 1
                      ? ''
                      : 's'}{' '}
                    found
                  </span>
                  {packagesLoading && (
                    <span className="text-xs text-secondary">Loading...</span>
                  )}
                </div>
                <div className="space-y-2.5">
                  {visiblePackages.map((pkg: any) => {
                    const isSelected = String(selectedPlanId) === String(pkg.id)
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => {
                          proposalMethods.setValue('plan_id', String(pkg.id), {
                            shouldValidate: true,
                          })
                          proposalMethods.setValue('plan_name', pkg.name || '')
                          const pkgFees =
                            pkg.fees ?? pkg.discounted_sale_price ?? 0
                          proposalMethods.setValue('amount', String(pkgFees))
                          setSelectedPlanDetails(pkg)
                        }}
                        className={
                          'relative w-full rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md ' +
                          (isSelected
                            ? 'border-primaryGreen shadow-md'
                            : 'border-formBorder bg-white hover:border-primaryGreen/40 hover:bg-cardWrapperBg')
                        }
                        style={
                          isSelected
                            ? {
                                background:
                                  'linear-gradient(135deg, #e6fbfc 0%, #f0fffe 50%, #e0f7fa 100%)',
                              }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={
                              'w-12 h-12 shrink-0 rounded-xl overflow-hidden transition-colors flex items-center justify-center ' +
                              (isSelected
                                ? 'bg-primaryGreen text-white shadow-sm'
                                : 'bg-cardWrapperBg text-primaryGreen')
                            }
                          >
                            {pkg.thumbnail_url ? (
                              <img
                                src={pkg.thumbnail_url}
                                alt={pkg.name || ''}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Icons name="package" className="h-6 w-6" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  'truncate text-sm font-semibold ' +
                                  (isSelected
                                    ? 'text-primaryGreen'
                                    : 'text-primaryText')
                                }
                              >
                                {pkg.name || 'Unnamed'}
                              </span>
                              {pkg.category && (
                                <span
                                  className={
                                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ' +
                                    (isSelected
                                      ? 'bg-primaryGreen/15 text-primaryGreen'
                                      : 'bg-cardWrapperBg text-secondary')
                                  }
                                >
                                  {pkg.category}
                                </span>
                              )}
                            </div>
                            {pkg.description && (
                              <p className="mt-0.5 line-clamp-1 text-xs text-secondary">
                                {pkg.description}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            {pkg.duration_days && (
                              <span
                                className={
                                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ' +
                                  (isSelected
                                    ? 'bg-primaryGreen/10 text-primaryGreen'
                                    : 'bg-cardWrapperBg text-gray-500')
                                }
                              >
                                <svg
                                  className="h-3.5 w-3.5 shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>{pkg.duration_days} days</span>
                              </span>
                            )}
                            <PriceBadge
                              actualPrice={pkg.actual_price}
                              discountedPrice={pkg.discounted_sale_price}
                              fees={pkg.fees}
                              price={pkg.price}
                              amount={pkg.amount}
                              variant={isSelected ? 'selected' : 'default'}
                            />
                          </div>
                          {isSelected && (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primaryGreen shadow-sm">
                              <svg
                                className="h-4 w-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                  {!packagesLoading && packages.length === 0 && (
                    <div className="rounded-lg border border-dashed border-formBorder p-8 text-center text-sm text-secondary">
                      {pkgSearch
                        ? 'No packages match your search.'
                        : 'No active packages available.'}
                    </div>
                  )}
                </div>
                {pkgTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t border-formBorder pt-3">
                    <span className="text-xs text-secondary">
                      Page {Math.min(pkgPage, pkgTotalPages)} of {pkgTotalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={pkgPage <= 1}
                        onClick={() => setPkgPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg border border-formBorder px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={pkgPage >= pkgTotalPages}
                        onClick={() =>
                          setPkgPage((p) => Math.min(pkgTotalPages, p + 1))
                        }
                        className="rounded-lg border border-formBorder px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : proposalStep === 2 ? (
              <div className="space-y-4">
                {selectedPlan && (
                  <div className="rounded-lg border border-formBorder bg-cardWrapperBg p-4">
                    <div className="text-xs text-secondary">
                      Selected package
                    </div>
                    <div className="mt-1 text-sm font-medium text-primaryText">
                      {selectedPlan.name}
                      {selectedPlan.category
                        ? ` — ${selectedPlan.category}`
                        : ''}
                      {selectedPlan.duration_days
                        ? ` — ${selectedPlan.duration_days} days`
                        : ''}
                    </div>
                    {(selectedPlan.discounted_sale_price ||
                      selectedPlan.fees ||
                      selectedPlan.price ||
                      selectedPlan.amount) && (
                      <div className="mt-2">
                        <PriceBadge
                          actualPrice={selectedPlan.actual_price}
                          discountedPrice={selectedPlan.discounted_sale_price}
                          fees={selectedPlan.fees}
                          price={selectedPlan.price}
                          amount={selectedPlan.amount}
                          variant="selected"
                          size="md"
                        />
                      </div>
                    )}
                  </div>
                )}
                <FormProvider {...proposalMethods}>
                  <FormBuilder
                    data={[
                      {
                        name: 'start_date',
                        id: 'start_date',
                        label: 'Anticipated start date',
                        type: 'date',
                        required: true,
                        minDate: new Date(),
                      },
                      {
                        name: 'notes',
                        id: 'notes',
                        label: 'Notes',
                        type: 'textarea',
                        rows: 4,
                        maxLength: 500,
                        fullWidth: true,
                        placeholder:
                          'Optional notes for this proposed assignment',
                      },
                    ]}
                    edit
                    spacing
                    fromPopup
                  />
                </FormProvider>
                {anticipatedEnd && (
                  <div className="rounded-lg border border-formBorder bg-cardWrapperBg p-4">
                    <div className="text-xs text-secondary">
                      Automatically calculated end date
                    </div>
                    <div className="mt-1 text-sm font-medium text-primaryText">
                      {anticipatedEnd.format('DD-MM-YYYY')} (
                      {selectedPlan.duration_days} days)
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Step 3: Payment Details & Receipt Upload */
              <div className="space-y-4">
                {/* Package & Schedule Summary Banner */}
                <div className="rounded-xl border border-primaryGreen/30 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                        Selected Package & Schedule
                      </div>
                      <div className="mt-0.5 text-sm font-bold text-gray-900">
                        {selectedPlan?.name || 'Selected Package'}
                        {selectedPlan?.duration_days &&
                          ` (${selectedPlan.duration_days} days)`}
                      </div>
                      <div className="mt-1 text-xs text-emerald-900 flex items-center gap-2">
                        <span>
                          Start:{' '}
                          <strong>
                            {anticipatedStart
                              ? moment(anticipatedStart).format('DD-MM-YYYY')
                              : '--'}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          End:{' '}
                          <strong>
                            {anticipatedEnd
                              ? anticipatedEnd.format('DD-MM-YYYY')
                              : '--'}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider">
                        Package Fees
                      </div>
                      <div className="text-lg font-extrabold text-emerald-700">
                        ₹
                        {selectedPlan?.fees ??
                          selectedPlan?.discounted_sale_price ??
                          '--'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Fields Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Amount (Non-editable, locked to selected package fee) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-primaryText">
                        Amount Received (₹){' '}
                        <span className="text-red-500">*</span>
                      </label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-600">
                        ₹
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={
                          selectedPlan?.fees !== undefined &&
                          selectedPlan?.fees !== null
                            ? String(selectedPlan.fees)
                            : selectedPlan?.discounted_sale_price !==
                                  undefined &&
                                selectedPlan?.discounted_sale_price !== null
                              ? String(selectedPlan.discounted_sale_price)
                              : proposalMethods.watch('amount') || '0'
                        }
                        className="w-full rounded-lg border border-formBorder bg-gray-100/90 py-2.5 pl-8 pr-10 text-sm font-bold text-gray-800 cursor-not-allowed outline-none select-none transition"
                      />
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        title="Fixed to selected package fee"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-secondary">
                      Prefilled and locked to the selected package fee.
                    </p>
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-xs font-semibold text-primaryText mb-1.5">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      max={moment().format('YYYY-MM-DD')}
                      value={proposalMethods.watch('payment_date')}
                      onChange={(e) =>
                        proposalMethods.setValue('payment_date', e.target.value)
                      }
                      className="w-full rounded-lg border border-formBorder bg-white py-2.5 px-3 text-sm text-primaryText outline-none focus:border-primaryGreen focus:ring-2 focus:ring-primaryGreen/20 transition"
                    />
                    <p className="mt-1 text-[11px] text-secondary">
                      Date when the transaction took place.
                    </p>
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className="block text-xs font-semibold text-primaryText mb-1.5">
                      Payment Mode <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={proposalMethods.watch('payment_mode')}
                      onChange={(e) =>
                        proposalMethods.setValue('payment_mode', e.target.value)
                      }
                      className="w-full rounded-lg border border-formBorder bg-white py-2.5 px-3 text-sm font-medium text-primaryText outline-none focus:border-primaryGreen focus:ring-2 focus:ring-primaryGreen/20 transition"
                    >
                      {paymentModeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-secondary">
                      Mode through which the payment was received.
                    </p>
                  </div>

                  {/* Transaction ID */}
                  <div>
                    <label className="block text-xs font-semibold text-primaryText mb-1.5">
                      Transaction / Reference ID
                    </label>
                    <input
                      type="text"
                      value={proposalMethods.watch('transaction_id')}
                      onChange={(e) =>
                        proposalMethods.setValue(
                          'transaction_id',
                          e.target.value
                        )
                      }
                      placeholder="e.g. UPI Ref / UTR / Cheque No."
                      className="w-full rounded-lg border border-formBorder bg-white py-2.5 px-3 text-sm text-primaryText outline-none focus:border-primaryGreen focus:ring-2 focus:ring-primaryGreen/20 transition"
                    />
                    <p className="mt-1 text-[11px] text-secondary">
                      Reference number for audit & reconciliation.
                    </p>
                  </div>
                </div>

                {/* Receipt Upload */}
                <div>
                  <label className="block text-xs font-semibold text-primaryText mb-1.5">
                    Payment Receipt / Proof of Payment
                  </label>

                  {/* Existing receipt note if editing */}
                  {editingProposal?.payment?.receipt_url && !receiptFile && (
                    <div className="mb-2.5 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-900">
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 text-emerald-600 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          Current attached proof:{' '}
                          <strong>
                            {editingProposal.payment.receipt_filename ||
                              'receipt'}
                          </strong>
                        </span>
                      </div>
                      <a
                        href={editingProposal.payment.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
                      >
                        View receipt
                      </a>
                    </div>
                  )}

                  {/* Dropzone */}
                  <div className="rounded-xl border-2 border-dashed border-formBorder bg-cardWrapperBg/40 p-4 transition hover:border-primaryGreen/50">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={handleReceiptChange}
                      className="hidden"
                      id="receipt-file-upload"
                    />

                    {receiptFile ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {receiptPreview ? (
                            <img
                              src={receiptPreview}
                              alt="Receipt Preview"
                              className="h-12 w-12 rounded-lg object-cover border border-formBorder shrink-0"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                              <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-primaryText">
                              {receiptFile.name}
                            </div>
                            <div className="text-xs text-secondary">
                              {(receiptFile.size / 1024).toFixed(1)} KB • Ready
                              to upload
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeReceipt}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="receipt-file-upload"
                        className="flex flex-col items-center justify-center cursor-pointer text-center py-2"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primaryGreen/10 text-primaryGreen mb-2">
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-primaryText">
                          Click to upload payment receipt or screenshot
                        </span>
                        <span className="mt-1 text-[11px] text-secondary">
                          Supports PNG, JPG, WEBP or PDF up to 10MB
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Payment Notes */}
                <div>
                  <label className="block text-xs font-semibold text-primaryText mb-1.5">
                    Payment Notes / Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={proposalMethods.watch('payment_notes')}
                    onChange={(e) =>
                      proposalMethods.setValue('payment_notes', e.target.value)
                    }
                    placeholder="Optional notes regarding the transaction, bank branch, or payment confirmation..."
                    className="w-full rounded-lg border border-formBorder bg-white p-3 text-sm text-primaryText outline-none focus:border-primaryGreen focus:ring-2 focus:ring-primaryGreen/20 transition resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        }
      />
      {(() => {
        const currentAssignmentForModal = assignmentRole
          ? client?.assignments?.find(
              (item: any) => item.role === assignmentRole
            )
          : null

        return (
          <DialogModal
            isOpen={Boolean(assignmentRole)}
            onClose={() => setAssignmentRole('')}
            title={
              currentAssignmentForModal
                ? `Change ${roleLabels[assignmentRole] || 'Staff'} Assignment`
                : `Assign ${roleLabels[assignmentRole] || 'staff member'}`
            }
            subTitle={
              currentAssignmentForModal
                ? 'Select a new active team member and record the reason for changing assignment.'
                : 'Select an active team member for this client.'
            }
            actionLabel={
              currentAssignmentForModal
                ? 'Confirm Reassignment'
                : 'Save assignment'
            }
            actionLoader={assignmentLoading}
            onSubmit={saveAssignment}
            secondaryAction={() => setAssignmentRole('')}
            secondaryActionLabel="Cancel"
            small={false}
            className="w-full max-w-4xl"
            body={
              <div className="space-y-4">
                {currentAssignmentForModal && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">
                        {getInitials(currentAssignmentForModal.staff_name)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-950">
                          Currently Assigned:{' '}
                          {currentAssignmentForModal.staff_name}
                        </div>
                        <div className="text-[11px] text-amber-700">
                          Assigned on{' '}
                          {formatDate(currentAssignmentForModal.assigned_at)} •{' '}
                          {currentAssignmentForModal.workflow_status ===
                          'pending'
                            ? 'Pending Acceptance'
                            : 'Accepted'}
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Active Assignee
                    </span>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-primaryText">
                    Select an active{' '}
                    {roleLabels[assignmentRole] || 'staff member'}
                  </label>
                  <input
                    type="search"
                    value={staffSearch}
                    onChange={(event) => {
                      setStaffSearch(event.target.value)
                      setStaffPage(1)
                    }}
                    placeholder="Search by name or email"
                    className="w-full rounded-lg border border-formBorder px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {visibleStaff.length ? (
                    visibleStaff.map((staff: any) => (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => {
                          assignmentMethods.setValue(
                            'staff_user_id',
                            staff.id,
                            {
                              shouldValidate: true,
                            }
                          )
                          assignmentMethods.setValue(
                            'staff_name',
                            staff.name || ''
                          )
                        }}
                        className={
                          'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ' +
                          (String(selectedStaffId) === String(staff.id)
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-formBorder bg-white hover:border-primary/60 hover:bg-cardWrapperBg')
                        }
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primaryAlt font-semibold text-primary">
                          {String(staff.name || '?')
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-primaryText">
                            {staff.name || 'Unnamed staff'}
                          </span>
                          <span className="block truncate text-xs text-secondary">
                            {staff.email || 'Active team member'}
                          </span>
                        </span>
                        {String(selectedStaffId) === String(staff.id) && (
                          <Icons name="check-circle" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-formBorder p-6 text-center text-sm text-secondary">
                      No active team members match your search.
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-formBorder pt-3 text-sm">
                  <span className="text-secondary">
                    {activeStaff.length} active member
                    {activeStaff.length === 1 ? '' : 's'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={staffPage <= 1}
                      onClick={() =>
                        setStaffPage((page) => Math.max(1, page - 1))
                      }
                      className="rounded border border-formBorder px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-secondary">
                      Page {Math.min(staffPage, staffTotalPages)} of{' '}
                      {staffTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={staffPage >= staffTotalPages}
                      onClick={() =>
                        setStaffPage((page) =>
                          Math.min(staffTotalPages, page + 1)
                        )
                      }
                      className="rounded border border-formBorder px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
                <FormProvider {...assignmentMethods}>
                  <FormBuilder
                    data={[
                      ...(currentAssignmentForModal
                        ? [
                            {
                              name: 'reason',
                              label: 'Reason for Reassignment / Change *',
                              type: 'text',
                              required: true,
                              fullWidth: true,
                              placeholder:
                                'e.g. Client requested schedule change / staff unavailable / specialist request',
                            },
                          ]
                        : []),
                      {
                        name: 'notes',
                        label: 'Notes',
                        type: 'textarea',
                        rows: 4,
                        maxLength: 500,
                        fullWidth: true,
                        placeholder: 'Optional notes for this assignment',
                      },
                    ]}
                    edit
                    spacing
                  />
                </FormProvider>
              </div>
            }
          />
        )
      })()}
    </div>
  )
}
