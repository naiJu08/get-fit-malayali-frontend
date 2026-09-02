import { useState } from 'react'
import InfoBox from '../../components/app/alertBox/infoBox'
import { DialogModal } from '../../components/common'
import Button from '../../components/common/buttons/Button'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage } from '../../utilities/parsers'
import {
  completeAssignedClientFollowUp,
  confirmAssignedClientPackage,
  createAssignedClientAssessment,
  scheduleAssignedClientFollowUp,
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
}

export function ClientWorkflowDetails({
  assignment,
  assignmentId,
  role,
  onRefresh,
}: WorkflowProps) {
  const { enqueueSnackbar } = useSnackbarManager()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [assessment, setAssessment] = useState({
    assessment_type: role.toLowerCase(),
    assessed_at: new Date().toISOString().slice(0, 16),
    notes: '',
    summary: '',
    goals: '',
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

  const submitAssessment = async () => {
    if (!assessment.summary.trim()) {
      enqueueSnackbar('Add the assessment summary before saving.', {
        variant: 'error',
      })
      return
    }
    await run(
      () =>
        createAssignedClientAssessment(assignmentId, {
          assessment_type: assessment.assessment_type,
          assessed_at: new Date(assessment.assessed_at).toISOString(),
          notes: assessment.notes,
          responses: { summary: assessment.summary, goals: assessment.goals },
        }),
      'Assessment created successfully'
    )
    setDialogOpen(false)
  }

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Anticipated package</h2>
            {assignment.anticipated_package?.plan?.name && (
              <span className="font-medium text-blue-600">
                {assignment.anticipated_package.plan.name}
              </span>
            )}
          </div>
          {assignment.anticipated_package ? (
            <div className="text-sm space-y-1">
              <div>
                Duration:{' '}
                {assignment.anticipated_package.plan.duration_days || '--'} days
              </div>
              <div>
                Start date: {assignment.anticipated_package.start_date || '--'}
              </div>
              <div>
                End date: {assignment.anticipated_package.end_date || '--'}
              </div>
              <div>
                Fees: {assignment.anticipated_package.plan.fees ?? '--'}
              </div>
            </div>
          ) : (
            <InfoBox content="Sales has not proposed a package yet." />
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold mb-3">Workflow actions</h2>
          <div className="flex flex-wrap gap-2">
            {assignment.follow_ups?.some(
              (item: any) => item.status === 'completed'
            ) && (
              <Button
                outlined
                label="Create assessment"
                onClick={() => setDialogOpen(true)}
                disabled={saving}
              />
            )}
            {assignment.can_confirm_package && (
              <Button
                primary
                label="Confirm & activate package"
                onClick={() =>
                  run(
                    () => confirmAssignedClientPackage(assignmentId),
                    'Package confirmed and activated successfully'
                  )
                }
                isLoading={saving}
              />
            )}
          </div>
          <p className="text-xs text-secondary mt-3">
            Package confirmation is restricted by service assignment:
            Nutritionist leads multi-service clients; solo Physio/Yoga
            assignments confirm their own package.
          </p>
        </section>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold mb-3">Assessments</h2>
        {assignment.assessments?.length ? (
          <div className="space-y-3">
            {assignment.assessments.map((item: any) => (
              <div key={item.id} className="border-b border-gray-100 pb-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium capitalize">
                    {item.assessment_type}
                  </span>
                  <span>{formatDate(item.assessed_at)}</span>
                </div>
                <div className="text-sm mt-1">
                  {item.responses?.summary || item.notes || '--'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <InfoBox content="No assessment created yet." />
        )}
      </section>

      <DialogModal
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Create client assessment"
        subTitle="Record the assessment completed after the follow-up."
        onSubmit={submitAssessment}
        actionLabel="Save assessment"
        actionLoader={saving}
        secondaryAction={() => setDialogOpen(false)}
        secondaryActionLabel="Cancel"
        body={
          <div className="space-y-4">
            <label className="block text-sm">
              Assessment summary
              <textarea
                className="mt-1 w-full border rounded-lg p-2"
                rows={4}
                value={assessment.summary}
                onChange={(event) =>
                  setAssessment({ ...assessment, summary: event.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              Goals
              <textarea
                className="mt-1 w-full border rounded-lg p-2"
                rows={3}
                value={assessment.goals}
                onChange={(event) =>
                  setAssessment({ ...assessment, goals: event.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              Additional notes
              <textarea
                className="mt-1 w-full border rounded-lg p-2"
                rows={3}
                value={assessment.notes}
                onChange={(event) =>
                  setAssessment({ ...assessment, notes: event.target.value })
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
        <h2 className="font-semibold mb-3">Follow-up history</h2>
        {assignment.follow_ups?.length ? (
          <div className="space-y-3">
            {assignment.follow_ups.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-gray-100 pb-3 gap-3"
              >
                <div>
                  <div className="text-sm font-medium">
                    {formatDate(item.scheduled_at)}
                  </div>
                  <div className="text-xs text-secondary">
                    {item.notes || 'No notes'}
                  </div>
                </div>
                {item.status === 'scheduled' ? (
                  <Button
                    outlined
                    label="Mark completed"
                    onClick={() =>
                      run(
                        () =>
                          completeAssignedClientFollowUp(assignmentId, item.id),
                        'Follow-up marked as completed'
                      )
                    }
                    isLoading={saving}
                  />
                ) : (
                  <span className="text-xs capitalize text-green-700">
                    {item.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <InfoBox content="No follow-ups scheduled." />
        )}
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
    </>
  )
}
