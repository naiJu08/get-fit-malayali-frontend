import { useParams } from 'react-router-dom'
import { usePlan } from '../api'

export default function PlanDetails() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2 text-primaryText">Plan Details</h1>
      <PlanDetailsContent />
    </div>
  )
}

function PlanDetailsContent() {
  const { id } = useParams()
  const { data, isLoading, isError } = usePlan(id as string)

  if (isLoading) {
    return <p className="text-neutral-600">Loading...</p>
  }
  if (isError) {
    return <p className="text-red-600">Failed to load plan details.</p>
  }

  const plan = (data as any)?.plan ?? (data as any)

  if (!plan) {
    return <p className="text-neutral-600">No data found.</p>
  }

  return (
    <div className="mt-4 grid gap-3">
      <div>
        <span className="text-sm text-neutral-500">Name</span>
        <div className="text-primaryText font-medium">{plan?.name ?? '-'}</div>
      </div>
      <div>
        <span className="text-sm text-neutral-500">Category</span>
        <div className="text-primaryText font-medium">
          {plan?.category ?? '-'}
        </div>
      </div>
      <div>
        <span className="text-sm text-neutral-500">Duration (days)</span>
        <div className="text-primaryText font-medium">
          {plan?.duration_days ?? '-'}
        </div>
      </div>
      <div>
        <span className="text-sm text-neutral-500">Active</span>
        <div className="text-primaryText font-medium">
          {plan?.active ? 'Active' : 'Inactive'}
        </div>
      </div>
      <div>
        <span className="text-sm text-neutral-500">Created By</span>
        <div className="text-primaryText font-medium">
          {plan?.created_by ?? '-'}
        </div>
      </div>
      <div>
        <span className="text-sm text-neutral-500">Created At</span>
        <div className="text-primaryText font-medium">
          {plan?.created_at ?? '-'}
        </div>
      </div>
    </div>
  )
}
