import { useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { usePlan } from '../api'
import Icons from '../../../components/common/icons'
import InfoBox from '../../../components/app/alertBox/infoBox'
import WorkoutPlanIndex from './WorkoutPlan'
import DietPlanIndex from './DietPlan'
import DetailsInfo from './DetailsInfo'
import { Tab, TabContainer } from '../../../components/common/tab'

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

  const tabs = useMemo(
    () => [
      { id: 'details', label: 'Details' },
      {
        id: 'workout-plan',
        label: 'Workout Plan',
      },
      { id: 'dietplan', label: 'Diet Plan' },
    ],
    []
  )

  // Derive active tab from URL (like User Details)
  const path = location.pathname || ''
  const trimmed = path.replace(/\/+$/, '')
  const parts = trimmed.split('/')
  const lastSegment = parts[parts.length - 1]
  const activeTab =
    lastSegment === String(id)
      ? 'details'
      : (lastSegment as 'details' | 'workout-plan' | 'dietplan')

  // Redirect /plans/:id -> /plans/:id/details
  if (location.pathname === `/plans/${id}`) {
    // keep base URL for Details tab
  }

  // Normalize any /plans/:id/details to base /plans/:id
  if (location.pathname === `/plans/${id}/details`) {
    navigate(`/plans/${id}`, { replace: true })
  }

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

      {/* <div className="no-tab-bg"> */}
      <TabContainer
        data={tabs}
        activeTab={activeTab}
        onClick={(item) => {
          const base = `/plans/${id}`
          if (item.id === 'details') navigate(base)
          else navigate(`${base}/${item.id}`)
        }}
      >
        <Tab id="details">
          <DetailsInfo
            plan={plan}
            loading={isLoading as boolean}
            error={(isError ? (error as any)?.message : '') as string}
          />
        </Tab>
        <Tab id="workout-plan">
          <WorkoutTab planName={plan?.name} planId={id} />
        </Tab>
        <Tab id="dietplan">
          <DietTab planName={plan?.name} planId={id} />
        </Tab>
      </TabContainer>
      {/* </div> */}

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

/// function formatDate(d: any) {
//   if (!d) return '--'
//   const m = moment(d)
//   return m.isValid() ? m.format('YYYY-MM-DD') : String(d)
// }
// function safeStr(v: any) {
//   if (v === null || v === undefined || v === '') return '--'
//   return String(v)
// }
