import moment from 'moment'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlan } from '../api'
import Icons from '../../../components/common/icons'
import InfoBox from '../../../components/app/alertBox/infoBox'
import TabContainer from '../../../components/common/tab/TabContainer'
import { TabItemProps } from '../../../common/types'
import WorkoutPlanIndex from './WorkoutPlan'
import DietPlanIndex from './DietPlan'

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">{safeStr(value)}</div>
    </div>
  )
}

function DetailsSection(props: { plan: any; activeTab?: string | number }) {
  const { plan, activeTab } = props
  if (activeTab !== 'details') return null
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
      <DetailItem label="Created At" value={formatDate(plan?.created_at)} />
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
function WorkoutTab(props: {
  activeTab?: string | number
  planName?: string
  planId?: string | number
}) {
  const { activeTab, planName, planId } = props
  if (activeTab !== 'workout details') return null
  return <WorkoutPlanIndex planName={planName} planId={planId} />
}

function DietTab(props: {
  activeTab?: string | number
  planName?: string
  planId?: string | number
}) {
  const { activeTab, planName, planId } = props
  if (activeTab !== 'diet details') return null
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
  const { data, isLoading, isError, error } = usePlan(id as string)

  const plan = (data as any)?.plan ?? (data as any) ?? {}
  const [activeTab, setActiveTab] = useState<
    'details' | 'workout details' | 'diet details'
  >('details')

  // Only Details tab
  const tabs: TabItemProps[] = [
    { id: 'details', label: 'Details', bgClass: 'bg-blue-100' },
    { id: 'workout details', label: 'Workout Plan', bgClass: 'bg-green-100' },
    { id: 'diet details', label: 'Diet Plan', bgClass: 'bg-amber-100' },
  ]

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

      <TabContainer
        data={tabs}
        activeTab={activeTab}
        onClick={(item) => setActiveTab(item.id as any)}
      >
        <DetailsSection plan={plan} />
        <WorkoutTab planName={plan?.name} planId={id} />
        <DietTab planName={plan?.name} planId={id} />
      </TabContainer>

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
function formatDate(d: any) {
  if (!d) return '--'
  const m = moment(d)
  return m.isValid() ? m.format('YYYY-MM-DD') : String(d)
}
function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
