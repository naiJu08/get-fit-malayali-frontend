import moment from 'moment'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  useClientPackageCycles,
  confirmClientPackageCycle,
  requestClientRenewal,
} from './api'
import { initiateRefundRequest } from '../Refunds/api'
import SubmitToSuperadminModal from '../Refunds/SubmitToSuperadminModal'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { FormProvider, useForm } from 'react-hook-form'
import FormBuilder from '../../components/app/formBuilder'
import InfoBox from '../../components/app/alertBox/infoBox'
import Button from '../../components/common/buttons/Button'
import Icons from '../../components/common/icons'
import PriceBadge from '../../components/common/PriceBadge'
import { DialogModal } from '../../components/common'
import Tab from '../../components/common/tab/Tab'
import { useSnackbarManager } from '../../components/common/snackbar'
import TextArea from '../../components/common/inputs/TextArea'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import {
  useClientDetail,
  useClientPackages,
  createClientPlanProposal,
  updateClientPlanProposal,
  assignClientStaff,
} from './api'
import AssignSalesModal from '../AdminUser/AssignSalesModal'

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

const capitalizeFirst = (value?: string | null) => {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const formatDate = (value: any) =>
  value ? moment(value).format('DD-MM-YYYY') : '--'

const statusLabel = (value: any) =>
  String(value || '--')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

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

interface ClientPackagesTabProps {
  clientId: string | number
  canManage?: boolean
  apiPrefix?: string
  mode?: 'all' | 'packages' | 'assignments'
  user?: any
  onSalesAssignSuccess?: () => void
  selectedCycleId?: string
  onSelectCycleId?: (id: string) => void
  disableCycleChange?: boolean
}

export default function ClientPackagesTab({
  clientId,
  canManage = false,
  apiPrefix = '/sales/clients',
  mode = 'all',
  user,
  onSalesAssignSuccess,
  selectedCycleId: propSelectedCycleId,
  onSelectCycleId,
  disableCycleChange = false,
}: ClientPackagesTabProps) {
  const id = String(clientId)
  const { enqueueSnackbar } = useSnackbarManager()
  const {
    data,
    isLoading,
    error,
    refetch: refetchClient,
  } = useClientDetail(id, apiPrefix)
  const {
    data: cycleData,
    isLoading: cyclesLoading,
    error: cyclesError,
    refetch: refetchCycles,
  } = useClientPackageCycles(id, apiPrefix)
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [selectedCycleId, setSelectedCycleId] = useState(
    propSelectedCycleId !== undefined
      ? propSelectedCycleId
      : searchParams.get('renewal_request_id')
        ? 'new'
        : ''
  )

  useEffect(() => {
    if (
      propSelectedCycleId !== undefined &&
      propSelectedCycleId !== selectedCycleId
    ) {
      setSelectedCycleId(propSelectedCycleId)
    }
  }, [propSelectedCycleId])

  const handleSelectCycle = (newId: string) => {
    setSelectedCycleId(newId)
    onSelectCycleId?.(newId)
  }
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false)
  const [renewalNotes, setRenewalNotes] = useState('')
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [refundRemarks, setRefundRemarks] = useState('')
  const [refundActionLoading, setRefundActionLoading] = useState(false)
  const [submitToSuperadminRefund, setSubmitToSuperadminRefund] =
    useState<any>(null)
  const [cycleActionLoading, setCycleActionLoading] = useState(false)
  const [salesAssignModalOpen, setSalesAssignModalOpen] = useState(false)
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false)
  const periodDropdownRef = useRef<HTMLDivElement>(null)

  const handleOpenRefund = (cycle: any) => {
    if (!cycle?.subscription_id) return
    const targetRefund = {
      id: cycle.refund_request?.id || null,
      subscription_id: cycle.subscription_id,
      subscription: {
        id: cycle.subscription_id,
        plan_name: cycle.plan?.name,
        start_date: cycle.start_date,
        end_date: cycle.end_date,
      },
      client: client,
      amount:
        cycle.refund_request?.amount ||
        cycle.proposal?.payment?.amount ||
        activeProposal?.payment?.amount ||
        cycle.plan?.fees ||
        cycle.plan?.actual_price ||
        0,
      initiation: cycle.refund_request
        ? {
            initiated_by: cycle.refund_request.initiated_by,
            remarks: cycle.refund_request.assignee_remarks,
          }
        : undefined,
    }
    setSubmitToSuperadminRefund(targetRefund)
  }

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        periodDropdownRef.current &&
        !periodDropdownRef.current.contains(e.target as Node)
      ) {
        setPeriodDropdownOpen(false)
      }
    }
    if (periodDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [periodDropdownOpen])
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isSales = loginRole === 'sales'
  const isNutritionist = loginRole === 'nutritionist'
  const isSuperAdmin = loginRole === 'superadmin' || loginRole === 'admin'
  const isServiceStaff = [
    'nutritionist',
    'physiotherapist',
    'physio',
    'yogist',
    'yoga',
  ].includes(loginRole || '')
  const canViewPaymentDetails = isSuperAdmin || (!isServiceStaff && isSales)
  const canCreateUpcomingPackage = Boolean(
    isSales || isSuperAdmin || (!loginRole && apiPrefix === '/sales/clients')
  )

  const cycles = cycleData?.cycles || []
  const defaultCycle = useMemo(() => {
    return (
      cycles.find((c: any) => c.status === 'active') ||
      cycles.find((c: any) => c.status === 'proposed') ||
      cycles.find(
        (c: any) => c.status !== 'refunded' && c.status !== 'cancelled'
      ) ||
      cycles[0] ||
      null
    )
  }, [cycles])

  const selectedCycle = useMemo(() => {
    if (mode === 'assignments') {
      return (
        cycles.find((c: any) => String(c.id) === String(selectedCycleId)) ||
        defaultCycle
      )
    }
    if (selectedCycleId === 'new' || selectedCycleId === 'legacy') return null
    return (
      cycles.find((c: any) => String(c.id) === String(selectedCycleId)) ||
      defaultCycle
    )
  }, [cycles, selectedCycleId, defaultCycle, mode])

  const isInFinalFiveDays = useMemo(() => {
    if (!selectedCycle?.end_date || selectedCycle?.status !== 'active') {
      return false
    }

    const daysRemaining = moment(selectedCycle.end_date)
      .startOf('day')
      .diff(moment().startOf('day'), 'days')

    return daysRemaining >= 0 && daysRemaining <= 5
  }, [selectedCycle?.end_date, selectedCycle?.status])

  const selectedValue = useMemo(() => {
    if (mode === 'assignments') {
      return selectedCycle ? String(selectedCycle.id) : ''
    }
    if (selectedCycleId === 'new') {
      return canCreateUpcomingPackage
        ? 'new'
        : selectedCycle
          ? String(selectedCycle.id)
          : ''
    }
    if (selectedCycleId === 'legacy') return 'legacy'
    return selectedCycle
      ? String(selectedCycle.id)
      : canCreateUpcomingPackage
        ? 'new'
        : ''
  }, [mode, selectedCycle, selectedCycleId, canCreateUpcomingPackage])

  const canManageStaff =
    canManage && Boolean(selectedCycle?.can_manage_assignments)
  const canEditProposal =
    Boolean(selectedCycle?.can_edit_proposal) ||
    (canManage && selectedValue === 'new' && canCreateUpcomingPackage)
  const refetch = async () => {
    await Promise.all([refetchClient(), refetchCycles()])
    await queryClient.invalidateQueries({
      predicate: (q: any) =>
        [
          'assigned_client_workflow_client',
          'assigned_client_workflow_detail',
          'sales_renewal_requests',
          'client_detail',
          'shared_client_detail',
        ].includes(String(q.queryKey[0])),
    })
  }
  const handleConfirmCycle = async () => {
    if (!selectedCycle) return
    try {
      setCycleActionLoading(true)
      await confirmClientPackageCycle(id, selectedCycle.id, apiPrefix)
      enqueueSnackbar('Package confirmed.', { variant: 'success' })
      setConfirmDialogOpen(false)
      await refetch()
    } catch (err: any) {
      enqueueSnackbar(
        getApiErrorMessage(err) || 'Unable to complete this action.',
        { variant: 'error' }
      )
    } finally {
      setCycleActionLoading(false)
    }
  }

  const runCycleAction = async (action: 'confirm' | 'renew') => {
    if (!selectedCycle) return
    if (action === 'confirm') {
      setConfirmDialogOpen(true)
      return
    }
    try {
      setCycleActionLoading(true)
      await requestClientRenewal(
        id,
        selectedCycle.subscription_id,
        renewalNotes
      )
      enqueueSnackbar('Renewal request sent to Sales.', { variant: 'success' })
      setRenewalDialogOpen(false)
      await refetch()
    } catch (err: any) {
      enqueueSnackbar(
        getApiErrorMessage(err) || 'Unable to complete this action.',
        { variant: 'error' }
      )
    } finally {
      setCycleActionLoading(false)
    }
  }

  const handleInitiateRefund = async () => {
    if (!selectedCycle?.subscription_id) return
    if (!refundRemarks.trim()) {
      enqueueSnackbar('Please provide remarks explaining the refund request.', {
        variant: 'error',
      })
      return
    }

    try {
      setRefundActionLoading(true)
      await initiateRefundRequest(
        selectedCycle.subscription_id,
        refundRemarks.trim()
      )
      enqueueSnackbar(
        'Refund request initiated successfully. Sales will review and submit to Superadmin.',
        { variant: 'success' }
      )
      setRefundDialogOpen(false)
      setRefundRemarks('')
      await refetch()
    } catch (err: any) {
      enqueueSnackbar(
        getApiErrorMessage(err) || 'Failed to initiate refund request.',
        { variant: 'error' }
      )
    } finally {
      setRefundActionLoading(false)
    }
  }
  const [pkgSearch, setPkgSearch] = useState('')
  const [pkgPage, setPkgPage] = useState(1)
  const pkgPageSize = 4
  const { data: packagesData, isFetching: packagesLoading } = useClientPackages(
    id,
    apiPrefix,
    {
      page: pkgPage,
      per_page: pkgPageSize,
      search: pkgSearch,
    }
  )
  const client = data?.client
    ? {
        ...data.client,
        assignments:
          selectedValue === 'legacy'
            ? cycleData?.legacy_assignments || []
            : selectedCycle?.assignments || [],
        assignment_histories:
          selectedValue === 'legacy'
            ? cycleData?.legacy_history || []
            : selectedCycle?.assignment_histories || [],
      }
    : null

  const currentAssignments = useMemo(() => {
    if (selectedCycle) {
      return selectedCycle.assignments || []
    }
    return client?.assignments || []
  }, [selectedCycle, client?.assignments])

  const salesRep = client?.sales_rep || user?.sales_rep || null
  const registrationSource =
    client?.registration_source ||
    user?.registration_source ||
    'self_registered'
  const isLeadConverted =
    registrationSource === 'lead_conversion' ||
    Boolean(client?.lead) ||
    Boolean(user?.lead)
  const leadInfo = client?.lead || user?.lead || null
  const salesAcquiredAt =
    client?.sales_acquired_at ||
    user?.sales_acquired_at ||
    leadInfo?.converted_at ||
    null
  const activeProposal =
    selectedCycle?.proposal ||
    (selectedCycle?.subscription_id
      ? {
          status: selectedCycle.status,
          plan: selectedCycle.plan,
          start_date: selectedCycle.start_date,
          end_date: selectedCycle.end_date,
        }
      : null)
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
  const [proposalHistoryOpen, setProposalHistoryOpen] = useState(false)

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
      change_reason: '',
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

  // Active subscriptions / cycles that the client is currently undergoing
  const activeSubscriptions = useMemo(() => {
    const list: any[] = []

    if (Array.isArray(client?.subscriptions)) {
      client.subscriptions.forEach((sub: any) => {
        const subStatus = sub.status?.toLowerCase()
        if (
          ['active', 'paused'].includes(subStatus) &&
          subStatus !== 'refunded' &&
          subStatus !== 'cancelled' &&
          sub.end_date &&
          moment(sub.end_date).isSameOrAfter(moment(), 'day')
        ) {
          list.push(sub)
        }
      })
    }

    if (Array.isArray(cycles)) {
      cycles.forEach((cycle: any) => {
        const cycleStatus = cycle.status?.toLowerCase()
        if (
          (cycle.subscription_id ||
            cycleStatus === 'active' ||
            cycleStatus === 'paused') &&
          cycleStatus !== 'refunded' &&
          cycleStatus !== 'cancelled' &&
          cycle.end_date &&
          moment(cycle.end_date).isSameOrAfter(moment(), 'day') &&
          !list.some(
            (existing) =>
              existing.id === cycle.subscription_id ||
              existing.end_date === cycle.end_date
          )
        ) {
          list.push({
            id: cycle.subscription_id || cycle.id,
            plan: cycle.plan,
            start_date: cycle.start_date,
            end_date: cycle.end_date,
            status: cycle.status,
          })
        }
      })
    }

    return list
  }, [client?.subscriptions, cycles])

  const latestActiveSubEndDate = useMemo(() => {
    if (!activeSubscriptions.length) return null
    return activeSubscriptions.reduce((latest: string | null, sub: any) => {
      if (!latest) return sub.end_date
      return moment(sub.end_date).isAfter(moment(latest))
        ? sub.end_date
        : latest
    }, null)
  }, [activeSubscriptions])

  const minStartDate = useMemo(() => {
    if (latestActiveSubEndDate) {
      return moment(latestActiveSubEndDate).add(1, 'day').toDate()
    }
    return new Date()
  }, [latestActiveSubEndDate])

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

  const openProposalModal = (proposal?: any, forceNew = false) => {
    if (
      forceNew ||
      (!proposal &&
        (selectedCycle?.status === 'refunded' ||
          selectedCycle?.status === 'cancelled' ||
          !selectedCycle?.can_edit_proposal))
    ) {
      if (!canCreateUpcomingPackage) return
      setSelectedCycleId('new')
      setEditingProposal(null)
      const initialStartDate =
        searchParams.get('start_date') ||
        (latestActiveSubEndDate
          ? moment(latestActiveSubEndDate).add(1, 'day').format('YYYY-MM-DD')
          : moment().format('YYYY-MM-DD'))

      proposalMethods.reset({
        plan_name: '',
        plan_id: '',
        start_date: initialStartDate,
        notes: '',
        amount: '',
        payment_date: moment().format('YYYY-MM-DD'),
        payment_mode: 'upi',
        transaction_id: '',
        payment_notes: '',
      })
      setReceiptFile(null)
      setReceiptPreview(null)
      setSelectedPlanDetails(null)
      setProposalStep(1)
      setPkgSearch('')
      setPkgPage(1)
      setProposalModal(true)
      return
    }

    if (!canEditProposal) return
    const targetProposal =
      proposal || (selectedCycle?.can_edit_proposal ? activeProposal : null)
    setEditingProposal(targetProposal)
    const existingPayment = targetProposal?.payment
    const planFees =
      targetProposal?.plan?.fees ??
      targetProposal?.plan?.discounted_sale_price ??
      0
    const initialStartDate =
      targetProposal?.start_date ||
      searchParams.get('start_date') ||
      (latestActiveSubEndDate
        ? moment(latestActiveSubEndDate).add(1, 'day').format('YYYY-MM-DD')
        : moment().format('YYYY-MM-DD'))

    proposalMethods.reset({
      plan_name: targetProposal?.plan?.name || '',
      plan_id: targetProposal?.plan?.id ? String(targetProposal.plan.id) : '',
      start_date: initialStartDate,
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
    if (!canManageStaff) return
    const current = currentAssignments.find(
      (assignment: any) => assignment.role === role
    )
    assignmentMethods.reset({
      staff_name: '',
      staff_user_id: '',
      notes: current?.notes || '',
      reason: '',
    })
    setStaffSearch('')
    setStaffPage(1)
    setAssignmentRole(role)
  }

  const saveProposal = async () => {
    if (!canEditProposal) return
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
      latestActiveSubEndDate &&
      moment(values.start_date).isSameOrBefore(
        moment(latestActiveSubEndDate),
        'day'
      )
    ) {
      enqueueSnackbar(
        `Anticipated start date must be after the active subscription ends (${formatDate(moment(latestActiveSubEndDate).add(1, 'day'))} or later).`,
        { variant: 'error' }
      )
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
    if (!receiptFile && !editingProposal?.payment?.receipt_url) {
      enqueueSnackbar('Please upload payment receipt or proof of payment.', {
        variant: 'error',
      })
      return
    }
    try {
      setProposalLoading(true)
      const formData = new FormData()
      formData.append('plan_id', String(values.plan_id))
      if (!editingProposal && searchParams.get('renewal_request_id'))
        formData.append(
          'renewal_request_id',
          searchParams.get('renewal_request_id') || ''
        )
      formData.append('start_date', apiDate(values.start_date))
      formData.append('notes', values.notes || '')

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
      formData.append('payment_notes', values.payment_notes || '')
      if (receiptFile) formData.append('receipt', receiptFile)
      if (editingProposal && values.change_reason) {
        formData.append('change_reason', values.change_reason)
      }

      if (editingProposal) {
        await updateClientPlanProposal(
          id,
          editingProposal.id,
          formData,
          apiPrefix
        )
      } else {
        const response = await createClientPlanProposal(id, formData, apiPrefix)
        if (response?.cycle_id) setSelectedCycleId(String(response.cycle_id))
        if (searchParams.has('renewal_request_id')) {
          const nextParams = new URLSearchParams(searchParams)
          nextParams.delete('renewal_request_id')
          nextParams.delete('start_date')
          setSearchParams(nextParams, { replace: true })
        }
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
    if (!canManageStaff) return
    const values = assignmentMethods.getValues()
    if (!assignmentRole || !values.staff_user_id) {
      enqueueSnackbar('Select a staff member.', { variant: 'error' })
      return
    }
    const current = currentAssignments.find(
      (item: any) => item.role === assignmentRole
    )
    if (
      current &&
      String(current.staff_user_id) === String(values.staff_user_id)
    ) {
      enqueueSnackbar(
        `Cannot reassign: ${current.staff_name || 'This staff member'} is already assigned as the ${roleLabels[assignmentRole] || assignmentRole}. Please select a different team member.`,
        { variant: 'error' }
      )
      return
    }
    const alreadyAssignedToPackage = currentAssignments.find(
      (item: any) =>
        String(item.staff_user_id) === String(values.staff_user_id) &&
        item.role !== assignmentRole
    )
    if (alreadyAssignedToPackage) {
      enqueueSnackbar(
        `Cannot assign: ${alreadyAssignedToPackage.staff_name || 'This staff member'} is already assigned to this package as ${roleLabels[alreadyAssignedToPackage.role] || alreadyAssignedToPackage.role}.`,
        { variant: 'error' }
      )
      return
    }
    const isReassign = Boolean(current)
    if (isReassign && !values.reason?.trim()) {
      enqueueSnackbar(
        'Please provide a reason for reassigning this staff member.',
        { variant: 'error' }
      )
      return
    }
    try {
      setAssignmentLoading(true)
      await assignClientStaff(
        id,
        {
          cycle_id: selectedCycle.id,
          role: assignmentRole,
          staff_user_id: values.staff_user_id,
          notes: values.notes || '',
          reason: values.reason || '',
        },
        apiPrefix
      )
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

  if (isLoading || cyclesLoading)
    return <InfoBox content="Loading client details..." />
  if (error || cyclesError)
    return (
      <InfoBox
        content={
          getApiErrorMessage(error || cyclesError) ||
          'Unable to load packages and assignments.'
        }
      />
    )
  if (!client) return <InfoBox content="Client not found." />
  return (
    <div className="space-y-4">
      {/* ── Enhanced Package Period Selector ───────────────────────────────── */}
      <section className="rounded-2xl border border-formBorder bg-gradient-to-b from-white via-cardWrapperBg/20 to-cardWrapperBg/40 p-5 shadow-xs transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-formBorder/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primaryGreen/10 text-primaryGreen ring-4 ring-primaryGreen/10 shadow-xs">
              <Icons name="calendar" className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-primaryText">
                  Package period
                </h2>
                <span className="rounded-full bg-cardWrapperBg px-2.5 py-0.5 text-[11px] font-semibold text-secondary border border-formBorder">
                  {cycles.length} Period{cycles.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-secondary">
                Assignments, proposal changes, and renewals are scoped to
                individual package subscription periods.
              </p>
            </div>
          </div>

          {/* Inline Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {canEditProposal && activeProposal && (
              <button
                type="button"
                onClick={() => openProposalModal(activeProposal)}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-800 shadow-xs hover:bg-sky-100 transition active:scale-[0.98]"
                title="Update or change this proposed package"
              >
                <Icons name="edit" className="h-4 w-4 text-sky-600" />
                Update package
              </button>
            )}

            {selectedCycle?.can_confirm && (
              <button
                type="button"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={cycleActionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-primaryGreen px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-primaryGreen/25 hover:bg-emerald-600 transition active:scale-[0.98] disabled:opacity-50"
                title="Confirm this package and its staff assignments"
              >
                <Icons name="check-mark" className="h-4 w-4" />
                {cycleActionLoading ? 'Confirming...' : 'Confirm package'}
              </button>
            )}

            {selectedCycle?.can_request_renewal &&
              (!isNutritionist || isInFinalFiveDays) && (
                <button
                  type="button"
                  onClick={() => {
                    setRenewalNotes('')
                    setRenewalDialogOpen(true)
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 shadow-xs hover:bg-amber-100 transition active:scale-[0.98]"
                  title="Eligible for renewal during the final 5 days of subscription"
                >
                  <Icons
                    name="notification"
                    className="h-4 w-4 text-amber-600"
                  />
                  Request renewal (final 5 days)
                </button>
              )}

            {selectedCycle?.renewal_request && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-900 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  Renewal:{' '}
                  <strong className="uppercase">
                    {selectedCycle.renewal_request.status}
                  </strong>
                </span>
                {selectedCycle.renewal_request.notes && (
                  <span
                    className="max-w-[160px] truncate text-[11px] font-normal text-amber-800 italic"
                    title={selectedCycle.renewal_request.notes}
                  >
                    &quot;{selectedCycle.renewal_request.notes}&quot;
                  </span>
                )}
              </div>
            )}

            {selectedCycle?.can_request_refund &&
              !selectedCycle?.refund_request && (
                <button
                  type="button"
                  onClick={() => {
                    if (isSales || isSuperAdmin) {
                      handleOpenRefund(selectedCycle)
                    } else {
                      setRefundRemarks('')
                      setRefundDialogOpen(true)
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-900 shadow-xs hover:bg-rose-100 transition active:scale-[0.98]"
                  title={
                    isSales || isSuperAdmin
                      ? 'Submit refund request to Superadmin'
                      : 'Initiate refund request for this package'
                  }
                >
                  <Icons
                    name="notification"
                    className="h-4 w-4 text-rose-600"
                  />
                  {isSales || isSuperAdmin
                    ? 'Submit for Refund'
                    : 'Initiate refund'}
                </button>
              )}

            {selectedCycle?.refund_request && (
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-900 shadow-xs">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selectedCycle.refund_request.status === 'approved'
                        ? 'bg-amber-500'
                        : selectedCycle.refund_request.status === 'completed'
                          ? 'bg-emerald-500'
                          : selectedCycle.refund_request.status === 'rejected'
                            ? 'bg-red-500'
                            : 'bg-rose-500 animate-pulse'
                    }`}
                  />
                  <span>
                    Refund:{' '}
                    <strong className="uppercase">
                      {String(
                        selectedCycle.refund_request.status || ''
                      ).replace(/_/g, ' ')}
                    </strong>
                  </span>
                  {selectedCycle.refund_request.assignee_remarks && (
                    <span
                      className="max-w-[160px] truncate text-[11px] font-normal text-rose-800 italic"
                      title={selectedCycle.refund_request.assignee_remarks}
                    >
                      &quot;{selectedCycle.refund_request.assignee_remarks}
                      &quot;
                    </span>
                  )}
                </div>

                {selectedCycle.refund_request.status === 'initiated' &&
                  (isSales || isSuperAdmin) && (
                    <button
                      type="button"
                      onClick={() => handleOpenRefund(selectedCycle)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-100 transition active:scale-[0.98]"
                      title="Submit to Superadmin with supporting document"
                    >
                      <Icons
                        name="send"
                        className="h-3.5 w-3.5 text-purple-600"
                      />
                      Submit to Superadmin
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Selector Area */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div
            ref={periodDropdownRef}
            className="relative min-w-[320px] max-w-xl flex-1"
          >
            <button
              type="button"
              id={'package-period-' + mode}
              aria-expanded={periodDropdownOpen}
              onClick={() => {
                if (disableCycleChange) return
                setPeriodDropdownOpen((prev) => !prev)
              }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border transition-all text-left shadow-xs ${
                disableCycleChange
                  ? 'border-formBorder bg-gray-50/70 cursor-default'
                  : periodDropdownOpen
                    ? 'border-primaryGreen ring-4 ring-primaryGreen/10 shadow-md'
                    : 'border-formBorder hover:border-primaryGreen/50 hover:bg-cardWrapperBg/30'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    selectedValue === 'new'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : selectedValue === 'legacy'
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : selectedCycle?.status === 'active'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : selectedCycle?.status === 'proposed'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : selectedCycle?.status === 'refunded'
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-gray-100 border-gray-200 text-gray-600'
                  }`}
                >
                  {selectedValue === 'new' ? (
                    <Icons name="plus" className="h-4 w-4" />
                  ) : selectedValue === 'legacy' ? (
                    <Icons name="activities" className="h-4 w-4" />
                  ) : (
                    <Icons name="calendar" className="items-center" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primaryText truncate">
                      {selectedValue === 'new'
                        ? 'New / upcoming package'
                        : selectedValue === 'legacy'
                          ? 'Legacy / unlinked assignments'
                          : capitalizeFirst(selectedCycle?.plan?.name) ||
                            (selectedCycle?.id
                              ? `Package #${selectedCycle.id}`
                              : 'No package selected')}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-secondary truncate flex items-center gap-2">
                    {selectedValue === 'new' ? (
                      <span>Propose upcoming package for client</span>
                    ) : selectedValue === 'legacy' ? (
                      <span>Historical assignments prior to cycle linking</span>
                    ) : selectedCycle ? (
                      <span>
                        {formatDate(selectedCycle?.start_date)} –{' '}
                        {formatDate(selectedCycle?.end_date)}
                        {selectedCycle?.start_date &&
                          selectedCycle?.end_date && (
                            <span className="ml-1 text-[11px] text-secondary">
                              (
                              {moment(selectedCycle.end_date).diff(
                                moment(selectedCycle.start_date),
                                'days'
                              ) + 1}{' '}
                              days)
                            </span>
                          )}
                      </span>
                    ) : (
                      <span>No package cycle available</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Badges & Caret */}
              <div className="flex items-center gap-2.5 shrink-0">
                {selectedValue === 'new' ? (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
                    New Proposal
                  </span>
                ) : selectedValue === 'legacy' ? (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                    Legacy Records
                  </span>
                ) : selectedCycle ? (
                  <div className="flex items-center gap-2">
                    {selectedCycle.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : selectedCycle.status === 'proposed' ? (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
                        Proposed
                      </span>
                    ) : selectedCycle.status === 'refunded' ? (
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 border border-rose-200">
                        Refunded
                      </span>
                    ) : selectedCycle.status === 'cancelled' ? (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200">
                        Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-700 border border-gray-200 capitalize">
                        {selectedCycle.status || 'Expired'}
                      </span>
                    )}

                    {selectedCycle.assignments?.length ? (
                      <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-cardWrapperBg px-2 py-0.5 text-[11px] font-medium text-secondary border border-formBorder">
                        {selectedCycle.assignments.length} Staff
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {/* Chevron or locked badge */}
                {disableCycleChange ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                    <svg
                      className="w-3 h-3 text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Locked
                  </span>
                ) : (
                  <svg
                    className={`h-4 w-4 text-secondary transition-transform duration-200 ${
                      periodDropdownOpen ? 'rotate-180 text-primaryGreen' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </button>

            {/* Custom Popover Dropdown Menu */}
            {periodDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-full min-w-[340px] max-w-xl rounded-2xl border border-formBorder bg-white shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="border-b border-formBorder bg-cardWrapperBg/40 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    {mode === 'assignments'
                      ? 'Select Package'
                      : 'Select Package Subscription Period'}
                  </span>
                  <span className="text-[11px] text-secondary">
                    {cycles.length} Package{cycles.length === 1 ? '' : 's'}{' '}
                    Available
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto p-2 space-y-1 divide-y divide-formBorder/30">
                  {/* Cycles List */}
                  {cycles.length > 0 ? (
                    <div className="space-y-1 pb-1">
                      {mode !== 'assignments' && (
                        <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                          Subscription Cycles
                        </div>
                      )}
                      {cycles.map((c: any) => {
                        const isSelected = selectedValue === String(c.id)
                        const isActive = c.status === 'active'
                        const isProposed = c.status === 'proposed'
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              handleSelectCycle(String(c.id))
                              setPeriodDropdownOpen(false)
                            }}
                            className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition-all ${
                              isSelected
                                ? 'bg-primaryGreen/10 border border-primaryGreen/40 font-medium'
                                : 'hover:bg-cardWrapperBg/70 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                                  isActive
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : isProposed
                                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                                      : 'bg-gray-100 border-gray-200 text-gray-500'
                                }`}
                              >
                                <Icons name="calendar" className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-primaryText truncate">
                                  {capitalizeFirst(c.plan?.name) ||
                                    `Package #${c.id}`}
                                </p>
                                <p className="text-xs text-secondary mt-0.5">
                                  {formatDate(c.start_date)} –{' '}
                                  {formatDate(c.end_date)}
                                  {c.start_date && c.end_date && (
                                    <span className="ml-1 text-[11px]">
                                      (
                                      {moment(c.end_date).diff(
                                        moment(c.start_date),
                                        'days'
                                      ) + 1}{' '}
                                      days)
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active
                                </span>
                              ) : isProposed ? (
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                                  Proposed
                                </span>
                              ) : c.status === 'refunded' ? (
                                <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                  Refunded
                                </span>
                              ) : c.status === 'cancelled' ? (
                                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                                  Cancelled
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 border border-gray-200 capitalize">
                                  {c.status || 'Expired'}
                                </span>
                              )}

                              {c.assignments?.length ? (
                                <span className="text-[11px] text-secondary font-medium hidden sm:inline">
                                  {c.assignments.length} staff
                                </span>
                              ) : null}

                              {isSelected && (
                                <span className="text-primaryGreen font-bold text-sm">
                                  ✓
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-secondary">
                      No packages available for this client yet.
                    </div>
                  )}

                  {/* Actions & Other Options — ONLY shown in packages mode AND for sales/superadmin */}
                  {mode !== 'assignments' && canCreateUpcomingPackage && (
                    <div className="pt-2 space-y-1">
                      <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                        Actions & Archives
                      </div>

                      {/* New / Upcoming option */}
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectCycle('new')
                          setPeriodDropdownOpen(false)
                        }}
                        className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition-all ${
                          selectedValue === 'new'
                            ? 'bg-indigo-50/80 border border-indigo-200 font-medium'
                            : 'hover:bg-cardWrapperBg/70 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                            <Icons name="plus" className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-primaryText">
                              New / upcoming package
                            </p>
                            <p className="text-xs text-secondary mt-0.5">
                              Propose a new package plan for this client
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                            New
                          </span>
                          {selectedValue === 'new' && (
                            <span className="text-indigo-700 font-bold text-sm">
                              ✓
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Period Contextual Helper Banner */}
        {selectedValue === 'new' ? (
          <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-950">
            <Icons name="plus" className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>
              {mode === 'assignments'
                ? 'Propose a package in the Packages tab first, then select its period here to assign staff.'
                : 'Proposing an upcoming package. Once confirmed, this package period will schedule to start without disrupting current active subscriptions.'}
            </span>
          </div>
        ) : selectedValue === 'legacy' ? (
          <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950">
            <Icons
              name="activities"
              className="h-4 w-4 text-amber-700 shrink-0"
            />
            <span>
              These assignment records have no verified package link and are
              retained as historical audit records.
            </span>
          </div>
        ) : selectedCycle ? (
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-formBorder bg-white/70 p-3 text-xs text-secondary shadow-xs">
            <div className="flex items-center gap-2">
              <Icons
                name="calendar"
                className=" w-4 text-primaryGreen shrink-0"
              />
              <span>
                Selected period:{' '}
                <strong className="text-primaryText font-semibold">
                  {capitalizeFirst(selectedCycle.plan?.name) ||
                    `Package #${selectedCycle.id}`}
                </strong>{' '}
                ({formatDate(selectedCycle.start_date)} to{' '}
                {formatDate(selectedCycle.end_date)})
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>
                Staff assigned:{' '}
                <strong className="text-primaryText font-semibold">
                  {selectedCycle.assignments?.length || 0}
                </strong>
              </span>
              {selectedCycle.status === 'active' && (
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{' '}
                  Current active subscription
                </span>
              )}
              {selectedCycle.status === 'expired' && (
                <span className="font-semibold text-gray-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />{' '}
                  Expired Package Period (Read-only)
                </span>
              )}
              {selectedCycle.status === 'refunded' && (
                <span className="font-semibold text-rose-700 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />{' '}
                  Refunded & Cancelled
                </span>
              )}
            </div>
          </div>
        ) : null}
      </section>
      {renewalDialogOpen && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
          {/* Blurred backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setRenewalDialogOpen(false)}
          />
          {/* Modal card */}
          <div className="relative z-10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold tracking-tight">
                    Request Package Renewal
                  </h3>
                  <p className="mt-0.5 text-sm text-white/80">
                    Add any notes or special instructions for the Sales team
                    before submitting.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRenewalDialogOpen(false)}
                  className="shrink-0 rounded-lg p-1.5 hover:bg-white/20 transition"
                >
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {/* Body */}
            <div className="bg-white px-6 py-5">
              <TextArea
                id="renewal-notes"
                name="renewal_notes"
                label="Notes for Sales"
                rows={5}
                maxLength={1000}
                value={renewalNotes}
                onChange={(e) => setRenewalNotes(e.target.value)}
                placeholder="Add context, special requests, or instructions for the Sales team..."
              />
            </div>
            {/* Footer */}
            <div className="bg-white border-t border-formBorder px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRenewalDialogOpen(false)}
                className="rounded-xl border border-formBorder px-5 py-2 text-sm font-semibold text-secondary hover:bg-cardWrapperBg transition active:scale-[0.98]"
              >
                Cancel
              </button>
              <Button
                label={cycleActionLoading ? 'Sending...' : 'Send to Sales'}
                isLoading={cycleActionLoading}
                onClick={() => runCycleAction('renew')}
                primary
              />
            </div>
          </div>
        </div>
      )}
      {/* Confirm Package Popup Modal */}
      {confirmDialogOpen && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none p-4">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setConfirmDialogOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all z-10 overflow-hidden border border-slate-100">
            {/* Soft Top Right Gradient Glow */}
            <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cyan-100/60 blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setConfirmDialogOpen(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Header with Calendar Badge Icon */}
            <div className="flex items-start gap-4 pr-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-50 border border-cyan-100/80 shadow-xs">
                <div className="relative flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-cyan-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                    <svg
                      className="h-3 w-3"
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
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  Confirm Package
                </h3>
                <p className="mt-1 text-sm text-slate-500 font-normal">
                  Confirm package subscription and staff assignments.
                </p>
              </div>
            </div>

            {/* Info Message Box */}
            <div className="mt-6 rounded-2xl bg-cyan-50/70 border border-cyan-100/80 p-4 flex items-start gap-3.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white font-bold text-xs mt-0.5 shadow-xs">
                i
              </div>
              <p className="text-sm font-normal text-slate-700 leading-relaxed">
                Confirm this package and its staff assignments? The current
                subscription will continue until its end date.
              </p>
            </div>

            {/* Modal Footer Buttons */}
            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialogOpen(false)}
                disabled={cycleActionLoading}
                className="rounded-xl border border-blue-500 bg-white px-6 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition active:scale-[0.98] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCycle}
                disabled={cycleActionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:from-cyan-600 hover:to-emerald-600 transition active:scale-[0.98] disabled:opacity-50"
              >
                {cycleActionLoading ? (
                  <span>Confirming...</span>
                ) : (
                  <>
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
                    <span>Confirm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <DialogModal
        isOpen={refundDialogOpen}
        title="Initiate Subscription Refund"
        subTitle="Request a refund before the subscription starts. This request will be sent to Sales and Superadmin for verification and processing."
        onClose={() => setRefundDialogOpen(false)}
        actionLabel={refundActionLoading ? 'Submitting...' : 'Initiate Refund'}
        actionLoader={refundActionLoading}
        onSubmit={handleInitiateRefund}
        secondaryAction={() => setRefundDialogOpen(false)}
        secondaryActionLabel="Cancel"
        small={false}
        body={
          <div className="space-y-3.5 text-xs">
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-rose-950 flex items-start gap-2.5">
              <Icons
                name="notification"
                className="h-4 w-4 text-rose-600 shrink-0 mt-0.5"
              />
              <div>
                <strong className="font-semibold block">
                  Important Policy Notice
                </strong>
                Refunds can be requested for active packages until the
                subscription period ends on{' '}
                <strong className="font-semibold text-rose-900">
                  {selectedCycle?.end_date
                    ? moment(selectedCycle.end_date).format('DD-MM-YYYY')
                    : 'end date'}
                </strong>
                . Once approved and completed by Sales and Superadmin, this
                subscription will be refunded.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primaryText mb-1.5">
                Remarks / Reason for Refund{' '}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                aria-label="Refund remarks"
                className="w-full rounded-xl border border-formBorder p-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                maxLength={1000}
                rows={4}
                value={refundRemarks}
                onChange={(e) => setRefundRemarks(e.target.value)}
                placeholder="Explain why the client is requesting a refund..."
              />
            </div>
          </div>
        }
      />
      {submitToSuperadminRefund && (
        <SubmitToSuperadminModal
          isOpen={Boolean(submitToSuperadminRefund)}
          refund={submitToSuperadminRefund}
          onClose={() => setSubmitToSuperadminRefund(null)}
          onSuccess={() => {
            refetchCycles?.()
            refetchClient?.()
            setSubmitToSuperadminRefund(null)
          }}
        />
      )}
      <Tab
        id="packages"
        activeTab={mode === 'assignments' ? 'assignments' : 'packages'}
      >
        <section className="rounded-lg border border-formBorder bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-formBorder pb-3">
            <div>
              <h2 className="font-semibold text-primaryText">
                {selectedCycle?.status === 'refunded' ||
                selectedCycle?.status === 'cancelled'
                  ? 'Package details & Refund tracking'
                  : 'Proposed package'}
              </h2>
              <p className="mt-1 text-xs text-secondary">
                {selectedCycle?.status === 'refunded' ||
                selectedCycle?.status === 'cancelled'
                  ? 'This package period has been refunded and cancelled. You can propose and assign a new package plan below.'
                  : 'Propose an active package plan and record payment transaction details for the selected package period.'}
              </p>
            </div>
            {selectedCycle?.status === 'refunded' ||
            selectedCycle?.status === 'cancelled' ? (
              canCreateUpcomingPackage && (
                <Button
                  label="Propose New Package"
                  icon="plus"
                  onClick={() => openProposalModal(undefined, true)}
                  disabled={!client.profile_completed}
                />
              )
            ) : activeProposal ? (
              canEditProposal && (
                <Button
                  label="Update package"
                  icon="edit"
                  outlined
                  onClick={() => openProposalModal(activeProposal)}
                  disabled={!client.profile_completed}
                />
              )
            ) : canCreateUpcomingPackage ? (
              <Button
                label="Add proposed package"
                icon="plus"
                onClick={() => openProposalModal()}
                disabled={!canEditProposal || !client.profile_completed}
              />
            ) : null}
          </div>

          {/* Refund Tracking Summary Banner & Card */}
          {Boolean(
            selectedCycle?.refund_request ||
              selectedCycle?.status === 'refunded'
          ) && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50/90 via-rose-50/40 to-white p-4 sm:p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-200/70 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 shadow-xs">
                    <Icons name="notification" className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-rose-950">
                        Package Refunded & Cancelled
                      </h3>
                      <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        {String(
                          selectedCycle?.refund_request?.status || 'Completed'
                        ).replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-rose-800 mt-0.5">
                      This subscription period was refunded and cancelled prior
                      to service start. All refund transactions and audit logs
                      are tracked below.
                    </p>
                  </div>
                </div>

                {canCreateUpcomingPackage && (
                  <Button
                    label="Assign New Package"
                    icon="plus"
                    onClick={() => openProposalModal(undefined, true)}
                    disabled={!client.profile_completed}
                  />
                )}
              </div>

              {selectedCycle?.refund_request && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                  <div className="rounded-lg bg-white p-3 border border-rose-100 shadow-xs">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                      Refund Amount
                    </div>
                    <div className="mt-1 text-base font-bold text-rose-700">
                      ₹
                      {Number(
                        selectedCycle.refund_request.amount || 0
                      ).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-3 border border-rose-100 shadow-xs">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                      Refund Date
                    </div>
                    <div className="mt-1 font-semibold text-primaryText">
                      {formatDate(
                        selectedCycle.refund_request.refund_date ||
                          selectedCycle.refund_request.created_at
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-3 border border-rose-100 shadow-xs">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                      Return Method & Ref ID
                    </div>
                    <div className="mt-1 font-semibold text-primaryText capitalize truncate">
                      {selectedCycle.refund_request.return_method
                        ? selectedCycle.refund_request.return_method.replace(
                            /_/g,
                            ' '
                          )
                        : '--'}
                      {selectedCycle.refund_request.transaction_id && (
                        <span
                          className="block font-mono text-[11px] text-gray-700 truncate"
                          title={selectedCycle.refund_request.transaction_id}
                        >
                          Ref: {selectedCycle.refund_request.transaction_id}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-3 border border-rose-100 shadow-xs">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                      Refund Proof
                    </div>
                    <div className="mt-1">
                      {selectedCycle.refund_request.refund_receipt_url ? (
                        <a
                          href={selectedCycle.refund_request.refund_receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-semibold text-rose-700 hover:text-rose-900 hover:underline"
                        >
                          <svg
                            className="h-3.5 w-3.5 text-rose-600 shrink-0"
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
              )}

              {/* Remarks breakdown */}
              {(selectedCycle?.refund_request?.assignee_remarks ||
                selectedCycle?.refund_request?.sales_remarks ||
                selectedCycle?.refund_request?.superadmin_remarks ||
                selectedCycle?.refund_request?.dispense_notes) && (
                <div className="mt-3.5 space-y-2 text-xs">
                  {selectedCycle?.refund_request?.assignee_remarks && (
                    <div className="rounded-lg bg-white/80 p-2.5 border border-rose-100 text-rose-950">
                      <strong className="font-semibold text-rose-900">
                        Initiation Reason:{' '}
                      </strong>
                      <span>
                        {selectedCycle.refund_request.assignee_remarks}
                      </span>
                    </div>
                  )}
                  {selectedCycle?.refund_request?.sales_remarks && (
                    <div className="rounded-lg bg-white/80 p-2.5 border border-rose-100 text-rose-950">
                      <strong className="font-semibold text-rose-900">
                        Sales Notes:{' '}
                      </strong>
                      <span>{selectedCycle.refund_request.sales_remarks}</span>
                    </div>
                  )}
                  {selectedCycle?.refund_request?.superadmin_remarks && (
                    <div className="rounded-lg bg-white/80 p-2.5 border border-rose-100 text-rose-950">
                      <strong className="font-semibold text-rose-900">
                        Superadmin Remarks:{' '}
                      </strong>
                      <span>
                        {selectedCycle.refund_request.superadmin_remarks}
                      </span>
                    </div>
                  )}
                  {selectedCycle?.refund_request?.dispense_notes && (
                    <div className="rounded-lg bg-white/80 p-2.5 border border-rose-100 text-rose-950">
                      <strong className="font-semibold text-rose-900">
                        Dispense Notes:{' '}
                      </strong>
                      <span>{selectedCycle.refund_request.dispense_notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
                        {capitalizeFirst(activeProposal.plan?.name) ||
                          'Unnamed Package'}
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
                  disabled={!canEditProposal || !client.profile_completed}
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
                  <div className="mt-1 text-sm font-semibold text-primaryText flex items-center gap-3">
                    <Icons
                      name="calendar"
                      className="h-6 w-3.5 text-secondary mr-0.5"
                    />
                    {formatDate(activeProposal.start_date)}
                  </div>
                </div>

                <div className="rounded-lg border border-formBorder/60 bg-white p-3">
                  <div className="text-[11px] font-medium text-secondary uppercase tracking-wider">
                    Anticipated End
                  </div>
                  <div className="mt-1 text-sm font-semibold text-primaryText flex items-center gap-3">
                    <Icons
                      name="calendar"
                      className="h-6 w-3.5 text-secondary"
                    />
                    {formatDate(activeProposal.end_date)}
                  </div>
                </div>

                <div className="rounded-lg border border-formBorder/60 bg-white p-3">
                  <div className="text-[11px] font-medium text-secondary uppercase tracking-wider">
                    Proposed By
                  </div>
                  <div className="mt-1 text-sm font-semibold text-primaryText truncate">
                    {capitalizeFirst(activeProposal.created_by?.name) || '--'}
                  </div>
                </div>
              </div>

              {activeProposal.notes && (
                <div className="mt-3.5 rounded-lg border border-amber-200/60 bg-amber-50/40 p-3 text-xs text-amber-900">
                  <span className="font-semibold text-amber-800">Notes: </span>
                  <span className="whitespace-pre-wrap">
                    {activeProposal.notes}
                  </span>
                </div>
              )}

              {/* Recorded Payment Details Section */}
              {canViewPaymentDetails && activeProposal.payment && (
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
                      {getPaymentModeBadge(activeProposal.payment.payment_mode)}
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

              {/* Proposal Change History */}
              {Boolean(activeProposal.change_history?.length) && (
                <div className="mt-4 border-t border-formBorder pt-4">
                  <button
                    type="button"
                    onClick={() => setProposalHistoryOpen((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primaryText transition"
                  >
                    <Icons
                      name={proposalHistoryOpen ? 'chevron-up' : 'chevron-down'}
                      className="h-3.5 w-3.5"
                    />
                    <span>
                      Proposal change log (
                      {activeProposal.change_history.length})
                    </span>
                  </button>
                  {proposalHistoryOpen && (
                    <div className="mt-2.5 space-y-2">
                      {activeProposal.change_history.map(
                        (chg: any, idx: number) => (
                          <div
                            key={chg.id || idx}
                            className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-3 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-amber-900">
                                Changed by {chg.changed_by?.name || 'Staff'}
                              </span>
                              <span className="text-secondary text-[11px]">
                                {chg.changed_at
                                  ? moment(chg.changed_at).format(
                                      'DD MMM YYYY, h:mm A'
                                    )
                                  : '--'}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-secondary">
                              {chg.old_plan && (
                                <div>
                                  <span className="font-medium">Plan: </span>
                                  <span className="line-through text-red-500">
                                    {capitalizeFirst(chg.old_plan.name)}
                                  </span>
                                  {chg.new_plan && (
                                    <span>
                                      {' '}
                                      →{' '}
                                      <strong className="text-emerald-700">
                                        {capitalizeFirst(chg.new_plan.name)}
                                      </strong>
                                    </span>
                                  )}
                                </div>
                              )}
                              {chg.old_start_date && (
                                <div>
                                  <span className="font-medium">Dates: </span>
                                  <span className="line-through text-red-500">
                                    {formatDate(chg.old_start_date)} –{' '}
                                    {formatDate(chg.old_end_date)}
                                  </span>
                                </div>
                              )}
                              {chg.old_notes && (
                                <div>
                                  <span className="font-medium">
                                    Old notes:{' '}
                                  </span>
                                  <span className="italic">
                                    &quot;{chg.old_notes}&quot;
                                  </span>
                                </div>
                              )}
                              {chg.change_reason && (
                                <div>
                                  <span className="font-medium text-amber-900">
                                    Reason:{' '}
                                  </span>
                                  <span className="text-amber-950">
                                    {chg.change_reason}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      )}
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
                {canCreateUpcomingPackage
                  ? 'Assign a package plan to set expected duration, pricing, and services for this client.'
                  : 'A package proposal has not been created by Sales yet.'}
              </p>
              {/* <div className="mt-4">
                  <Button
                    label="Add proposed package"
                    icon="plus"
                    onClick={() => openProposalModal()}
                    disabled={!canEditProposal || !client.profile_completed}
                  />
                </div> */}
            </div>
          )}
        </section>
      </Tab>

      <Tab
        id="assignments"
        activeTab={mode === 'packages' ? 'packages' : 'assignments'}
      >
        {/* Sales Representative Assignment Section */}
        <section className="mb-6 rounded-xl border border-formBorder bg-white p-5 shadow-xs">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-formBorder pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
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
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </span>
                <h2 className="text-base font-bold text-primaryText">
                  Sales Representative
                </h2>
              </div>
              <p className="mt-1 text-xs text-secondary">
                {isLeadConverted
                  ? 'Sales representative linked to this account through lead conversion.'
                  : salesRep
                    ? 'Sales team member assigned to manage this registered client.'
                    : 'No sales representative currently assigned to this registered client.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isLeadConverted ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-2xs">
                  <svg
                    className="h-3.5 w-3.5 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Linked via Lead Conversion
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                  <svg
                    className="h-3.5 w-3.5 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Direct Client Registration
                </span>
              )}

              {salesRep ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Assigned
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Unassigned
                </span>
              )}
            </div>
          </div>

          {salesRep ? (
            <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-blue-50/50 via-indigo-50/20 to-white p-4 sm:p-5 shadow-xs transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-sm shadow-sm ring-4 ring-blue-500/10">
                    {getInitials(salesRep.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        {capitalizeFirst(salesRep.name)}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-100/70 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        Sales Representative
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                      {salesRep.email && (
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="h-3.5 w-3.5 text-gray-400 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span>{salesRep.email}</span>
                        </div>
                      )}
                      {salesRep.phone && (
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="h-3.5 w-3.5 text-gray-400 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span>{salesRep.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action button for Superadmin */}
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setSalesAssignModalOpen(true)}
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-semibold shadow-2xs transition-all hover:border-slate-300 active:scale-[0.99]"
                  >
                    <svg
                      className="h-3.5 w-3.5 text-slate-500"
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
                    <span>Change Sales Rep</span>
                  </button>
                )}
              </div>

              {/* Conversion / Registration origin details footer */}
              <div className="mt-3.5 pt-3 border-t border-indigo-100/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                {isLeadConverted ? (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600">
                    <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                      <svg
                        className="h-3.5 w-3.5 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Account linked via lead conversion
                    </span>
                    {/* {leadInfo?.source && (
                      <span>
                        <strong className="text-gray-700">Lead Source:</strong>{' '}
                        {leadInfo.source}
                      </span>
                    )} */}
                    {leadInfo?.campaign_name && (
                      <span>
                        <strong className="text-gray-700">Campaign:</strong>{' '}
                        {leadInfo.campaign_name}
                      </span>
                    )}
                    {salesAcquiredAt && (
                      <span>
                        <strong className="text-gray-700">Converted On:</strong>{' '}
                        {formatDate(salesAcquiredAt)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600">
                    <span className="inline-flex items-center gap-1 text-blue-800 font-medium">
                      <svg
                        className="h-3.5 w-3.5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Direct Registered Client
                    </span>
                    {salesAcquiredAt && (
                      <span>
                        <strong className="text-gray-700">Assigned On:</strong>{' '}
                        {formatDate(salesAcquiredAt)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition-all">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-2xs border border-blue-100 mb-3">
                <svg
                  className="h-6 w-6"
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
              <h3 className="text-sm font-bold text-gray-900">
                No Sales Representative Assigned
              </h3>
              <p className="mt-1 text-xs text-secondary max-w-md mx-auto">
                This client registered directly and does not have a Sales team
                member assigned yet. Assign a sales representative to handle
                package proposals, follow-ups, and renewals.
              </p>
              {isSuperAdmin && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setSalesAssignModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition active:scale-[0.99]"
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
                    <span>Assign Sales Representative</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

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
              {currentAssignments.length} of{' '}
              {Object.keys(serviceRoleConfigs).length} roles assigned
            </span>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
            {Object.entries(serviceRoleConfigs).map(([role, config]) => {
              const assignment = currentAssignments.find(
                (item: any) => item.role === role
              )
              const isAccepted = Boolean(
                assignment?.accepted_at ||
                  (assignment?.workflow_status &&
                    assignment.workflow_status !== 'pending' &&
                    assignment.workflow_status !== 'package_confirmed') ||
                  (assignment?.workflow_status === 'package_confirmed' &&
                    assignment?.accepted_at)
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
                                {capitalizeFirst(assignment.staff_name) ||
                                  'Assigned Staff'}
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
                              <span className="italic">{assignment.notes}</span>
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
                          {config.title.toLowerCase()} service for this client.
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
                              {roleHistories.map((hist: any, index: number) => {
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
                                          {capitalizeFirst(hist.staff_name) ||
                                            'Staff User'}
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
                                        {isCurrent ? 'Current' : hist.action}
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
                                          {capitalizeFirst(
                                            hist.assigned_by_name
                                          )}
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
                              })}
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
                      disabled={!canManageStaff || !client.profile_completed}
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
                      disabled={!canManageStaff || !client.profile_completed}
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
                    placeholder="Search packages by name"
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
                                {(() => {
                                  const name = pkg.name || 'Unnamed'
                                  return (
                                    name.charAt(0).toUpperCase() + name.slice(1)
                                  )
                                })()}
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
                {latestActiveSubEndDate && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
                    <Icons
                      name="calendar"
                      className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-semibold text-emerald-950">
                        Active subscription detected
                      </p>
                      <p className="mt-0.5 text-emerald-800">
                        Client currently has an active subscription until{' '}
                        <strong>{formatDate(latestActiveSubEndDate)}</strong>.
                        Dates on or before this are disabled — the upcoming
                        package will start from{' '}
                        <strong>{formatDate(minStartDate)}</strong> or later.
                      </p>
                    </div>
                  </div>
                )}
                <FormProvider {...proposalMethods}>
                  <FormBuilder
                    data={[
                      ...(editingProposal
                        ? [
                            {
                              name: 'change_reason',
                              id: 'change_reason',
                              label: 'Reason for proposal change',
                              type: 'text',
                              maxLength: 200,
                              fullWidth: true,
                              placeholder:
                                'Optional reason for changing package or schedule (Max 200 characters)',
                            },
                          ]
                        : []),
                      {
                        name: 'start_date',
                        id: 'start_date',
                        label: 'Anticipated start date',
                        type: 'date',
                        required: true,
                        minDate: minStartDate,
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
                    Payment Receipt / Proof of Payment{' '}
                    <span className="text-red-500">*</span>
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
          ? currentAssignments.find((item: any) => item.role === assignmentRole)
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
                            'pending' ||
                          (!currentAssignmentForModal.accepted_at &&
                            currentAssignmentForModal.workflow_status ===
                              'package_confirmed')
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
                    visibleStaff.map((staff: any) => {
                      const isCurrentAssignee = Boolean(
                        currentAssignmentForModal &&
                          String(currentAssignmentForModal.staff_user_id) ===
                            String(staff.id)
                      )
                      const alreadyInOtherRole = currentAssignments.find(
                        (a: any) =>
                          String(a.staff_user_id) === String(staff.id) &&
                          a.role !== assignmentRole
                      )
                      const isAlreadyAssigned =
                        isCurrentAssignee || Boolean(alreadyInOtherRole)
                      const isSelected =
                        String(selectedStaffId) === String(staff.id)

                      return (
                        <button
                          key={staff.id}
                          type="button"
                          disabled={isAlreadyAssigned}
                          onClick={() => {
                            if (isAlreadyAssigned) {
                              enqueueSnackbar(
                                isCurrentAssignee
                                  ? `Cannot reassign: ${staff.name || 'This staff member'} is already assigned to this role.`
                                  : `Cannot assign: ${staff.name || 'This staff member'} is already assigned to this package as ${roleLabels[alreadyInOtherRole.role] || alreadyInOtherRole.role}.`,
                                { variant: 'error' }
                              )
                              return
                            }
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
                            (isAlreadyAssigned
                              ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                              : isSelected
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
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-medium text-primaryText">
                                {staff.name || 'Unnamed staff'}
                              </span>
                              {isCurrentAssignee && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                                  Already Assigned (Current)
                                </span>
                              )}
                              {alreadyInOtherRole && (
                                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                                  Assigned (
                                  {roleLabels[alreadyInOtherRole.role] ||
                                    alreadyInOtherRole.role}
                                  )
                                </span>
                              )}
                            </span>
                            <span className="block truncate text-xs text-secondary">
                              {staff.email || 'Active team member'}
                            </span>
                          </span>
                          {isSelected && <Icons name="check-circle" />}
                        </button>
                      )
                    })
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
                              label: 'Reason for Reassignment / Change',
                              type: 'text',
                              required: true,
                              fullWidth: true,
                              maxLength: 200,
                              placeholder:
                                'e.g. Client requested schedule change / staff unavailable / specialist request (Max 200 characters)',
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

      <AssignSalesModal
        isOpen={salesAssignModalOpen}
        onClose={() => setSalesAssignModalOpen(false)}
        user={{
          id: id,
          name: client?.name || user?.name,
          email: client?.email || user?.email,
          sales_rep: salesRep,
        }}
        onSuccess={async () => {
          await refetchClient()
          queryClient.invalidateQueries(['client_detail'])
          queryClient.invalidateQueries(['admin_user'])
          onSalesAssignSuccess?.()
        }}
      />
    </div>
  )
}
