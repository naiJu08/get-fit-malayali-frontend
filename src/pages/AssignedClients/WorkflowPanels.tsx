import { useState, useMemo } from 'react'
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
  const [proposalStep, setProposalStep] = useState(1)
  const [pkgSearch, setPkgSearch] = useState('')
  const [pkgPage, setPkgPage] = useState(1)
  const pkgPerPage = 4
  const [saving, setSaving] = useState(false)
  const [proposal, setProposal] = useState({
    plan_id: '',
    start_date: '',
    notes: '',
  })

  const openProposalModal = () => {
    setProposal({
      plan_id: '',
      start_date: assignment?.anticipated_package?.start_date || '',
      notes: assignment?.anticipated_package?.notes || '',
    })
    setProposalStep(1)
    setPkgSearch('')
    setPkgPage(1)
    setProposalDialogOpen(true)
  }

  const filteredPackages = useMemo(() => {
    if (!pkgSearch.trim()) return plans
    const q = pkgSearch.toLowerCase()
    return plans.filter((p: any) => {
      const nameMatch = p.name?.toLowerCase().includes(q)
      const catMatch = (p.category || p.plan_category)
        ?.toLowerCase()
        .includes(q)
      const priceMatch = String(p.fees || p.price || p.amount || '').includes(q)
      return nameMatch || catMatch || priceMatch
    })
  }, [plans, pkgSearch])

  const pkgTotalPages = Math.max(
    1,
    Math.ceil(filteredPackages.length / pkgPerPage)
  )

  const visiblePackages = useMemo(() => {
    const start = (pkgPage - 1) * pkgPerPage
    return filteredPackages.slice(start, start + pkgPerPage)
  }, [filteredPackages, pkgPage, pkgPerPage])

  const selectedPlan = useMemo(() => {
    return plans.find(
      (item: any) => String(item.id) === String(proposal.plan_id)
    )
  }, [plans, proposal.plan_id])

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
    if (proposalStep === 1) {
      if (!proposal.plan_id) {
        enqueueSnackbar('Please select a package plan.', {
          variant: 'error',
        })
        return
      }
      setProposalStep(2)
    } else {
      if (!proposal.start_date) {
        enqueueSnackbar('Choose a start date.', { variant: 'error' })
        return
      }
      await run(
        () => proposeAssignedClientPackage(assignmentId, proposal),
        'Proposed package updated successfully'
      )
      setProposalDialogOpen(false)
    }
  }

  const handleSecondaryAction = () => {
    if (proposalStep === 2) {
      setProposalStep(1)
    } else {
      setProposalDialogOpen(false)
    }
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
                      onClick={openProposalModal}
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
        onClose={() => {
          setProposalDialogOpen(false)
          setProposalStep(1)
        }}
        title="Propose a different package"
        subTitle={
          proposalStep === 1
            ? 'Select a package plan for the client.'
            : 'Set start date and optional notes.'
        }
        onSubmit={submitProposal}
        actionLabel={proposalStep === 1 ? 'Next' : 'Save proposed package'}
        actionLoader={saving}
        secondaryAction={handleSecondaryAction}
        secondaryActionLabel={proposalStep === 2 ? 'Back' : 'Cancel'}
        small={false}
        className="w-full max-w-4xl"
        body={
          <div>
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
                    {filteredPackages.length} package
                    {filteredPackages.length === 1 ? '' : 's'} found
                  </span>
                </div>
                <div className="space-y-2.5">
                  {visiblePackages.map((pkg: any) => {
                    const isSelected =
                      String(proposal.plan_id) === String(pkg.id)
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => {
                          setProposal((prev) => ({
                            ...prev,
                            plan_id: String(pkg.id),
                          }))
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
                              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ' +
                              (isSelected
                                ? 'bg-primaryGreen text-white shadow-sm'
                                : 'bg-cardWrapperBg text-primaryGreen')
                            }
                          >
                            <Icons name="package" className="h-6 w-6" />
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
                              {(pkg.category || pkg.plan_category) && (
                                <span
                                  className={
                                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ' +
                                    (isSelected
                                      ? 'bg-primaryGreen/15 text-primaryGreen'
                                      : 'bg-cardWrapperBg text-secondary')
                                  }
                                >
                                  {pkg.category || pkg.plan_category}
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
                            {(pkg.fees || pkg.price || pkg.amount) && (
                              <span
                                className={
                                  'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ' +
                                  (isSelected
                                    ? 'bg-primaryGreen text-white'
                                    : 'bg-successColor/10 text-successColor')
                                }
                              >
                                {'₹'}
                                {pkg.fees || pkg.price || pkg.amount}
                              </span>
                            )}
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
                  {filteredPackages.length === 0 && (
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
            ) : (
              <div className="space-y-4">
                {selectedPlan && (
                  <div className="rounded-lg border border-formBorder bg-cardWrapperBg p-4">
                    <div className="text-xs text-secondary">
                      Selected package
                    </div>
                    <div className="mt-1 text-sm font-medium text-primaryText">
                      {selectedPlan.name}
                      {selectedPlan.category || selectedPlan.plan_category
                        ? ` — ${selectedPlan.category || selectedPlan.plan_category}`
                        : ''}
                      {selectedPlan.duration_days
                        ? ` — ${selectedPlan.duration_days} days`
                        : ''}
                      {selectedPlan.fees ||
                      selectedPlan.price ||
                      selectedPlan.amount
                        ? ` — ₹${selectedPlan.fees || selectedPlan.price || selectedPlan.amount}`
                        : ''}
                    </div>
                  </div>
                )}
                <label className="block text-sm font-medium text-gray-700">
                  Anticipated start date <span className="text-red-500">*</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-formBorder p-2.5 text-sm outline-none focus:border-primaryGreen focus:ring-2 focus:ring-primaryGreen/20"
                    type="date"
                    value={proposal.start_date}
                    onChange={(event) =>
                      setProposal({
                        ...proposal,
                        start_date: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                  <textarea
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-formBorder p-2.5 text-sm outline-none focus:border-primaryGreen focus:ring-2 focus:ring-primaryGreen/20"
                    placeholder="Optional notes for this proposed assignment"
                    value={proposal.notes}
                    onChange={(event) =>
                      setProposal({ ...proposal, notes: event.target.value })
                    }
                  />
                </label>
              </div>
            )}
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
        <div className="flex items-center justify-end gap-3 mb-3">
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
          <p className="text-sm text-secondary mb-3">
            Accept the client before scheduling a follow-up.
          </p>
        )}
        {assignment.workflow_status === 'package_confirmed' && (
          <p className="text-sm text-secondary mb-3">
            The package is confirmed; no further assignment follow-up is
            required.
          </p>
        )}
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
