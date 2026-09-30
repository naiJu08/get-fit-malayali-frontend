import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

import InfoBox from '../../components/app/alertBox/infoBox'
import Icons from '../../components/common/icons'
import { TabContainer } from '../../components/common'
import Tab from '../../components/common/tab/Tab'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useSalesClient } from './api'
import ClientPackagesTab from './ClientPackagesTab'

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
  const { data, isLoading } = useSalesClient(id)

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
  const client = data?.client

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
                label="Registered On"
                value={
                  client.created_at
                    ? moment(client.created_at).format('DD MMM YYYY, hh:mm A')
                    : '--'
                }
              />
              <DetailItem
                label="Account Status"
                value={statusLabel(client.status)}
              />
            </div>
          </section>
        </Tab>

        <Tab id="packages">
          <ClientPackagesTab
            clientId={id}
            canManage
            apiPrefix="/sales/clients"
            mode="packages"
          />
        </Tab>
        <Tab id="assignments">
          <ClientPackagesTab
            clientId={id}
            canManage
            apiPrefix="/sales/clients"
            mode="assignments"
          />
        </Tab>
      </TabContainer>
    </div>
  )
}
