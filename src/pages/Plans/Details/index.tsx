import { useCallback, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { usePlan } from '../api'
import Icons from '../../../components/common/icons'
import InfoBox from '../../../components/app/alertBox/infoBox'
import DietPlanIndex from './DietPlan'
import MeditationPlanIndex, {
  MeditationAssignCTAConfig,
} from './MeditationPlan'
import DetailsInfo from './DetailsInfo'
import CreatePlan from '../create'
import { Tab, TabContainer } from '../../../components/common/tab'

function DietTab(props: { planName?: string; planId?: string | number }) {
  const { planName, planId } = props
  return <DietPlanIndex planName={planName} planId={planId} />
}

function MeditationTab(props: {
  planName?: string
  registerAssignCTA?: (config: MeditationAssignCTAConfig | null) => void
}) {
  const { planName, registerAssignCTA } = props
  return (
    <MeditationPlanIndex
      planName={planName}
      registerAssignCTA={registerAssignCTA}
    />
  )
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
  const { data, isLoading, isError, error, refetch } = usePlan(id as string)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [meditationAssignCTA, setMeditationAssignCTA] =
    useState<MeditationAssignCTAConfig | null>(null)

  const handleMeditationAssignCTA = useCallback(
    (config: MeditationAssignCTAConfig | null) => {
      setMeditationAssignCTA(config)
    },
    []
  )

  const plan = (data as any)?.plan ?? (data as any) ?? {}

  const hasMeditationPlan = useMemo(() => {
    const medFlag = plan?.meditation_included
    if (typeof medFlag === 'string') {
      const normalized = medFlag.trim().toLowerCase()
      return normalized === 'true' || normalized === '1'
    }
    return Boolean(medFlag)
  }, [plan?.meditation_included])

  type TabConfig = { id: string; label: string }
  const tabs = useMemo(() => {
    const baseTabs: TabConfig[] = [
      { id: 'details', label: 'Details' },
      // { id: 'dietplan', label: 'Diet Plan' },
    ]
    if (hasMeditationPlan)
      baseTabs.push({ id: 'meditationplan', label: 'Meditations' })
    return baseTabs
  }, [hasMeditationPlan])

  // Derive active tab from URL (like User Details)
  const path = location.pathname || ''
  const trimmed = path.replace(/\/+$/, '')
  const parts = trimmed.split('/')
  const lastSegment = parts[parts.length - 1]
  const allowedTabIds = tabs.map((t) => t.id)
  const derivedTab = lastSegment === String(id) ? 'details' : lastSegment
  const activeTab = allowedTabIds.includes(derivedTab) ? derivedTab : 'details'

  // Redirect /plans/:id -> /plans/:id/details
  if (location.pathname === `/plans/${id}`) {
    // keep base URL for Details tab
  }

  // Normalize any /plans/:id/details to base /plans/:id
  if (location.pathname === `/plans/${id}/details`) {
    navigate(`/plans/${id}`, { replace: true })
  }

  // Redirect /plans/:id -> /plans/:id/details
  if (location.pathname === `/plans/${id}`) {
    // keep base URL for Details tab
  }

  // Normalize any /plans/:id/details to base /plans/:id
  if (location.pathname === `/plans/${id}/details`) {
    navigate(`/plans/${id}`, { replace: true })
  }

  const showMeditationAssignCTA =
    activeTab === 'meditationplan' && meditationAssignCTA?.visible

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} aria-label="Back">
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">Plan Details</h1>
        </div>
        {showMeditationAssignCTA && (
          <button
            className="px-3 py-1.5 text-sm border rounded btn-primary"
            onClick={meditationAssignCTA?.handler}
          >
            Assign
          </button>
        )}
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
            onEdit={() => setEditModalOpen(true)}
          />
        </Tab>
        <Tab id="dietplan">
          <DietTab planName={plan?.name} planId={id} />
        </Tab>
        {hasMeditationPlan && (
          <Tab id="meditationplan">
            <MeditationTab
              planName={plan?.name}
              registerAssignCTA={handleMeditationAssignCTA}
            />
          </Tab>
        )}
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

      <CreatePlan
        isDrawerOpen={editModalOpen}
        handleClose={() => setEditModalOpen(false)}
        handleRefresh={() => refetch()}
        edit
        rowData={{ plan }}
      />
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
