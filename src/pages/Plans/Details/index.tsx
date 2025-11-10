// import moment from 'moment'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { usePlan } from '../api'
import Icons from '../../../components/common/icons'
import InfoBox from '../../../components/app/alertBox/infoBox'
// import TabContainer from '../../../components/common'
import Tab from '../../../components/common/tab/Tab'
import { TabItemProps } from '../../../common/types'
import WorkoutPlanIndex from './WorkoutPlan'
import DietPlanIndex from './DietPlan'
import { TabContainer } from '../../../components/common'

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">{safeStr(value)}</div>
    </div>
  )
}

function DetailsSection(props: { plan: any }) {
  const { plan } = props
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DetailItem label="Name" value={plan?.name} />
      <DetailItem label="Category" value={plan?.category} />
      <DetailItem label="Description" value={plan?.description} />
      <DetailItem
        label="Duration (days)"
        value={safeStr(plan?.duration_days)}
      />
      <DetailItem label="Active" value={mapActive(plan?.active)} />
      <DetailItem label="Created By" value={plan?.created_by} />
      {/* <DetailItem label="Created At" value={formatDate(plan?.created_at)} /> */}
      <DetailItem
        label="Workout Plans"
        value={safeStr(plan?.workout_plans_count)}
      />
      <DetailItem label="Diet Plans" value={safeStr(plan?.diet_plans_count)} />
      <DetailItem
        label="Subscribers"
        value={safeStr(plan?.subscribers_count)}
      />
    </div>
  )
}
function WorkoutTab(props: { planName?: string; planId?: string | number }) {
  const { planName, planId } = props
  return <WorkoutPlanIndex planName={planName} planId={planId} />
}

function DietTab(props: { planName?: string; planId?: string | number }) {
  const { planName, planId } = props
  return <DietPlanIndex planName={planName} planId={planId} />
}

export default function PlanDetails() {
  return (
    <div className="p-4">
      <PlanDetailsContent />
    </div>
  )
}

function PlanDetailsContent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, isLoading, isError, error } = usePlan(id as string)

  const plan = (data as any)?.plan ?? (data as any) ?? {}

  // Only Details tab
  const tabs: TabItemProps[] = [
    { id: 'details', label: 'Details' },
    { id: 'workout details', label: 'Workout Plan' },
    { id: 'diet details', label: 'Diet Plan' },
  ]

  // Derive tab from URL (robust to trailing slashes)
  const path = location.pathname || ''
  const trimmed = path.replace(/\/+$/, '')
  const parts = trimmed.split('/')
  const lastSegment = parts[parts.length - 1]
  const derivedTab =
    lastSegment === 'workout-plan'
      ? 'workout details'
      : lastSegment === 'dietplan'
        ? 'diet details'
        : 'details'
  const activeTab = derivedTab as 'details' | 'workout details' | 'diet details'

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/plans')} aria-label="Back">
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">Plan Details</h1>
        </div>
      </div>

      <div className="no-tab-bg">
        <TabContainer
          data={tabs}
          activeTab={activeTab}
          onClick={(item) => {
            const base = `/plans/${id}`
            if (item.id === 'details') navigate(base)
            else if (item.id === 'workout details')
              navigate(`${base}/workout-plan`)
            else if (item.id === 'diet details') navigate(`${base}/dietplan`)
          }}
        >
          <Tab id="details">
            <DetailsSection plan={plan} />
          </Tab>
          <Tab id="workout details">
            <WorkoutTab planName={plan?.name} planId={id} />
          </Tab>
          <Tab id="diet details">
            <DietTab planName={plan?.name} planId={id} />
          </Tab>
        </TabContainer>
      </div>

      {isLoading && (
        <div className="p-6">
          <InfoBox content="Loading plan details..." />
        </div>
      )}
      {isError && !isLoading && (
        <div className="p-6">
          <InfoBox content={(error as any)?.message || 'Failed to load plan'} />
        </div>
      )}
    </div>
  )
}

function mapActive(v: any) {
  if (v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true')
    return 'Active'
  if (
    v === false ||
    v === 0 ||
    v === '0' ||
    String(v).toLowerCase() === 'false'
  )
    return 'Inactive'
  return safeStr(v)
}
// function formatDate(d: any) {
//   if (!d) return '--'
//   const m = moment(d)
//   return m.isValid() ? m.format('YYYY-MM-DD') : String(d)
// }
function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
