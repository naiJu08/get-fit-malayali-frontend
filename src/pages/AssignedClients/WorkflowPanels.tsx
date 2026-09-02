import { useState } from 'react'
import { AutoComplete } from 'qbs-core'
import InfoBox from '../../components/app/alertBox/infoBox'
import { DialogModal } from '../../components/common'
import Button from '../../components/common/buttons/Button'
import SmartTable from '../../components/common/table/SmartTable'
import Icons from '../../components/common/icons'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage } from '../../utilities/parsers'
import {
  completeAssignedClientFollowUp,
  confirmAssignedClientPackage,
  scheduleAssignedClientFollowUp,
  proposeAssignedClientPackage,
} from './api'

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '--'

const errorMessage = (error: any) =>
  getErrorMessage(error) ||
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  'Request failed'

type WorkflowProps = {
  assignment: any
  assignmentId: string | number
  role: string
  onRefresh: () => Promise<any>
  plans?: any[]
  showWorkflowActions?: boolean
}

export function ClientWorkflowDetails({
  assignment,
  assignmentId,
  onRefresh,
  plans = [],
  showWorkflowActions = true,
}: WorkflowProps) {
  const { enqueueSnackbar } = useSnackbarManager()
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [proposal, setProposal] = useState({
    plan_id: '',
    start_date: '',
    notes: '',
  })
  const run = async (action: () => Promise<any>, success: string) => {
    try {
      setSaving(true)
      const response = await action()
      enqueueSnackbar(response?.message || success, { variant: 'success' })
      await onRefresh()
    } catch (error: any) {
      enqueueSnackbar(errorMessage(error), { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const submitProposal = async () => {
    if (!proposal.plan_id || !proposal.start_date) {
      enqueueSnackbar('Choose a package and start date.', { variant: 'error' })
      return
    }
    await run(
      () => proposeAssignedClientPackage(assignmentId, proposal),
      'Proposed package updated successfully'
    )
    setProposalDialogOpen(false)
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-sm">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100/60" />
        <div className="absolute -bottom-12 left-1/3 h-24 w-24 rounded-full bg-blue-100/50" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-blue-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white shadow-sm">
                ✦
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Proposed package
                  </h2>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                    Proposed
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Review the package details before activation
                </div>
              </div>
            </div>
            {assignment.anticipated_package?.plan?.name && (
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                {assignment.anticipated_package.plan.name}
              </span>
            )}
          </div>

          {assignment.anticipated_package ? (
            <>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-white/80 p-3 ring-1 ring-blue-100">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Assigned to
                  </div>
                  <div className="mt-1 text-sm font-semibold capitalize text-gray-800">
                    {assignment.staff_name || '--'}
                  </div>
                </div>
                <div className="rounded-xl bg-white/80 p-3 ring-1 ring-blue-100">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Proposed by
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-800">
                    {assignment.anticipated_package.created_by?.name ||
                      'Sales team'}
                  </div>
                </div>
                <div className="rounded-xl bg-white/80 p-3 ring-1 ring-blue-100">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Duration
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-800">
                    {assignment.anticipated_package.plan.duration_days || '--'}{' '}
                    days
                  </div>
                </div>
                <div className="rounded-xl bg-white/80 p-3 ring-1 ring-blue-100">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Fees
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-800">
                    {assignment.anticipated_package.plan.fees ?? '--'}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-blue-100">
                  Start:{' '}
                  <strong>
                    {assignment.anticipated_package.start_date || '--'}
                  </strong>
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-blue-100">
                  End:{' '}
                  <strong>
                    {assignment.anticipated_package.end_date || '--'}
                  </strong>
                </span>
              </div>
              {assignment.anticipated_package.notes && (
                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <span className="font-semibold">Sales note:</span>{' '}
                  {assignment.anticipated_package.notes}
                </div>
              )}
              {showWorkflowActions && assignment.can_confirm_package && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 pt-4">
                  <p className="text-xs text-gray-500">
                    Nutritionist leads multi-service clients; solo Physio/Yoga
                    assignments confirm their own package.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      outlined
                      size="xs"
                      icon="edit"
                      className="rounded-lg !border-indigo-500 !text-indigo-700 hover:!bg-indigo-50"
                      label="Change package"
                      onClick={() => setProposalDialogOpen(true)}
                      disabled={saving || !plans.length}
                    />
                    <Button
                      primary
                      size="xs"
                      icon="check-circle"
                      className="rounded-lg !border-emerald-500 !bg-emerald-500 hover:!bg-emerald-600 shadow-sm"
                      label="Confirm & activate"
                      onClick={() =>
                        run(
                          () => confirmAssignedClientPackage(assignmentId),
                          'Package confirmed and activated successfully'
                        )
                      }
                      isLoading={saving}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4">
              <InfoBox content="No proposed package is available yet." />
            </div>
          )}
        </div>
      </section>

      <DialogModal
        isOpen={proposalDialogOpen}
        onClose={() => setProposalDialogOpen(false)}
        title="Propose a different package"
        subTitle="The new package will remain proposed until it is confirmed."
        onSubmit={submitProposal}
        actionLabel="Save proposed package"
        actionLoader={saving}
        secondaryAction={() => setProposalDialogOpen(false)}
        secondaryActionLabel="Cancel"
        body={
          <div className="space-y-4">
            <AutoComplete
              placeholder="Select package"
              desc="name"
              descId="id"
              type="custom_search_select"
              data={plans}
              value={
                plans.find(
                  (item: any) => String(item.id) === String(proposal.plan_id)
                ) || null
              }
              name="proposed_plan"
              onChange={(item: any) =>
                setProposal({ ...proposal, plan_id: item?.id || '' })
              }
            />
            <label className="block text-sm">
              Start date
              <input
                className="mt-1 w-full border rounded-lg p-2"
                type="date"
                value={proposal.start_date}
                onChange={(event) =>
                  setProposal({ ...proposal, start_date: event.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              Notes
              <textarea
                className="mt-1 w-full border rounded-lg p-2"
                rows={3}
                value={proposal.notes}
                onChange={(event) =>
                  setProposal({ ...proposal, notes: event.target.value })
                }
              />
            </label>
          </div>
        }
      />
    </>
  )
}

export function ClientWorkflowFollowUps({
  assignment,
  assignmentId,
  onRefresh,
}: Omit<WorkflowProps, 'role'>) {
  const { enqueueSnackbar } = useSnackbarManager()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [followUp, setFollowUp] = useState({ scheduled_at: '', notes: '' })
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState<any>(null)
  const [completionNotes, setCompletionNotes] = useState('')

  const run = async (action: () => Promise<any>, success: string) => {
    try {
      setSaving(true)
      const response = await action()
      enqueueSnackbar(response?.message || success, { variant: 'success' })
      await onRefresh()
    } catch (error: any) {
      enqueueSnackbar(errorMessage(error), { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const submitFollowUp = async () => {
    if (!followUp.scheduled_at) {
      enqueueSnackbar('Choose a date and time for the follow-up.', {
        variant: 'error',
      })
      return
    }
    await run(
      () =>
        scheduleAssignedClientFollowUp(assignmentId, {
          ...followUp,
          scheduled_at: new Date(followUp.scheduled_at).toISOString(),
        }),
      'Follow-up scheduled successfully'
    )
    setDialogOpen(false)
    setFollowUp({ scheduled_at: '', notes: '' })
  }

  const submitCompletion = async () => {
    if (!completionNotes.trim() || !selectedFollowUp) return
    await run(
      () =>
        completeAssignedClientFollowUp(
          selectedFollowUp.assignment_id || assignmentId,
          selectedFollowUp.id,
          { completion_notes: completionNotes.trim() }
        ),
      'Follow-up marked as completed'
    )
    setCompletionDialogOpen(false)
    setSelectedFollowUp(null)
    setCompletionNotes('')
  }

  return (
    <>
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-semibold">Follow-ups</h2>
          <Button
            outlined
            label="Schedule follow-up"
            onClick={() => setDialogOpen(true)}
            disabled={
              saving ||
              assignment.workflow_status === 'pending' ||
              assignment.workflow_status === 'package_confirmed'
            }
          />
        </div>
        {assignment.workflow_status === 'pending' && (
          <p className="text-sm text-secondary">
            Accept the client before scheduling a follow-up.
          </p>
        )}
        {assignment.workflow_status === 'package_confirmed' && (
          <p className="text-sm text-secondary">
            The package is confirmed; no further assignment follow-up is
            required.
          </p>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="mb-3 font-semibold">Follow-up history</h2>
        <SmartTable
          data={assignment.follow_ups || []}
          dataRowKey="id"
          columns={[
            {
              title: 'Scheduled date',
              field: 'scheduled_at',
              customCell: true,
              renderCell: (row: any) => ({
                cell: formatDate(row.scheduled_at),
              }),
              isVisible: true,
            },
            {
              title: 'Assigned staff',
              field: 'assigned_staff_name',
              customCell: true,
              renderCell: (row: any) => ({
                cell: row.assigned_staff_name
                  ? row.assigned_staff_name +
                    ' (' +
                    (row.assigned_staff_role || 'service team') +
                    ')'
                  : assignment.staff_name || '--',
              }),
              isVisible: true,
            },
            {
              title: 'Added by',
              field: 'created_by',
              customCell: true,
              renderCell: (row: any) => ({
                cell: row.created_by?.name || '--',
              }),
              isVisible: true,
            },
            {
              title: 'Notes',
              field: 'notes',
              customCell: true,
              renderCell: (row: any) => ({
                cell: row.notes || '--',
                toolTip: row.notes || '',
              }),
              isVisible: true,
            },
            {
              title: 'Completion remarks',
              field: 'completion_notes',
              customCell: true,
              renderCell: (row: any) => ({
                cell: row.completion_notes || '--',
                toolTip: row.completion_notes || '',
              }),
              isVisible: true,
            },
            {
              title: 'Status',
              field: 'status',
              customCell: true,
              renderCell: (row: any) => ({
                cell: (
                  <span
                    className={
                      row.status === 'completed'
                        ? 'capitalize text-green-700'
                        : 'capitalize text-amber-700'
                    }
                  >
                    {row.status || 'scheduled'}
                  </span>
                ),
              }),
              isVisible: true,
            },
          ]}
          actionProps={[
            {
              title: 'Mark completed',
              toolTip: 'Complete follow-up',
              icon: <Icons name="check-circle" />,
              variant: 'success',
              action: (row: any) => {
                setSelectedFollowUp(row)
                setCompletionNotes('')
                setCompletionDialogOpen(true)
              },
              hide: (row: any) => row.status !== 'scheduled',
              disabled: () => saving,
            },
          ]}
          externalActions
          toolbar
          columnToggle
          height={calcWindowHeight(
            (assignment.follow_ups || []).length ? 260 : 320
          )}
          emptyTitle="No follow-ups scheduled"
        />
      </section>

      <DialogModal
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Schedule follow-up"
        subTitle="Choose the date and time for the client call."
        onSubmit={submitFollowUp}
        actionLabel="Schedule"
        actionLoader={saving}
        secondaryAction={() => setDialogOpen(false)}
        secondaryActionLabel="Cancel"
        body={
          <div className="space-y-4">
            <label className="block text-sm">
              Date and time
              <input
                className="mt-1 w-full border rounded-lg p-2"
                type="datetime-local"
                value={followUp.scheduled_at}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(event) =>
                  setFollowUp({ ...followUp, scheduled_at: event.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              Notes
              <textarea
                className="mt-1 w-full border rounded-lg p-2"
                rows={3}
                value={followUp.notes}
                onChange={(event) =>
                  setFollowUp({ ...followUp, notes: event.target.value })
                }
              />
            </label>
          </div>
        }
      />
      <DialogModal
        isOpen={completionDialogOpen}
        onClose={() => setCompletionDialogOpen(false)}
        title="Complete follow-up"
        subTitle="Add remarks about the completed client follow-up."
        onSubmit={submitCompletion}
        actionLabel="Save remarks"
        actionLoader={saving}
        secondaryAction={() => setCompletionDialogOpen(false)}
        secondaryActionLabel="Cancel"
        body={
          <label className="block text-sm">
            Follow-up remarks
            <textarea
              className="mt-1 w-full border rounded-lg p-2"
              rows={4}
              value={completionNotes}
              onChange={(event) => setCompletionNotes(event.target.value)}
              placeholder="Enter the outcome or remarks"
            />
          </label>
        }
      />
    </>
  )
}
