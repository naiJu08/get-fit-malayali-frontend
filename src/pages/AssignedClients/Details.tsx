import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import InfoBox from '../../components/app/alertBox/infoBox'
import { DialogModal } from '../../components/common'
import { Tab, TabContainer } from '../../components/common/tab'
import Button from '../../components/common/buttons/Button'
import Icons from '../../components/common/icons'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage } from '../../utilities/parsers'
import {
  acceptAssignedClient,
  completeAssignedClientFollowUp,
  confirmAssignedClientPackage,
  createAssignedClientAssessment,
  scheduleAssignedClientFollowUp,
  useAssignedClientDetail,
} from './api'

const roleFromPath = (path: string) =>
  path.includes('/physiotherapist/')
    ? 'Physiotherapist'
    : path.includes('/yogist/')
      ? 'Yogist'
      : 'Nutritionist'

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '--'

const statusLabel = (value?: string) =>
  (value || 'pending')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const errorMessage = (error: any) =>
  getErrorMessage(error) ||
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  'Request failed'

export default function AssignedClientDetails() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const { data, isFetching, refetch } = useAssignedClientDetail(id)
  const assignment = data?.assigned_client
  const client = assignment?.client
  const assignedClientId = id || ''
  const role = roleFromPath(location.pathname)
  const [activeTab, setActiveTab] = useState<'details' | 'follow-ups'>(
    'details'
  )
  const [dialog, setDialog] = useState<'follow_up' | 'assessment' | null>(null)
  const [saving, setSaving] = useState(false)
  const [followUp, setFollowUp] = useState({ scheduled_at: '', notes: '' })
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
      await refetch()
    } catch (error: any) {
      enqueueSnackbar(errorMessage(error), { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (isFetching && !assignment) {
    return (
      <div className="p-6">
        <InfoBox content="Loading assigned client details..." />
      </div>
    )
  }

  if (!assignment || !client) {
    return (
      <div className="p-6">
        <InfoBox content="Assigned client not found." />
      </div>
    )
  }

  const profileRows = [
    ['Email', client.email],
    ['Phone', client.phone],
    ['Date of birth', client.profile?.date_of_birth],
    ['Gender', client.profile?.gender],
    ['Height', client.profile?.height],
    ['Weight', client.profile?.weight],
    ['Goal', client.profile?.goal],
    ['Lifestyle', client.profile?.lifestyle],
    ['Medical conditions', client.profile?.medical_conditions],
    ['Food preferences', client.profile?.food_preferences],
    ['Food allergies', client.profile?.food_allergies],
  ]

  const submitFollowUp = async () => {
    if (!followUp.scheduled_at) {
      enqueueSnackbar('Choose a date and time for the follow-up.', {
        variant: 'error',
      })
      return
    }
    await run(
      () =>
        scheduleAssignedClientFollowUp(assignedClientId, {
          ...followUp,
          scheduled_at: new Date(followUp.scheduled_at).toISOString(),
        }),
      'Follow-up scheduled successfully'
    )
    setDialog(null)
    setFollowUp({ scheduled_at: '', notes: '' })
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
        createAssignedClientAssessment(assignedClientId, {
          assessment_type: assessment.assessment_type,
          assessed_at: new Date(assessment.assessed_at).toISOString(),
          notes: assessment.notes,
          responses: { summary: assessment.summary, goals: assessment.goals },
        }),
      'Assessment created successfully'
    )
    setDialog(null)
  }

  return (
    <div className="p-4">
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() =>
                  navigate(location.pathname.split('/').slice(0, -1).join('/'))
                }
                className="rounded-lg hover:bg-gray-100 transition"
                aria-label="Back"
              >
                <Icons name="left-arrow-icon" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {client.name || 'Client'}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm ml-3">
              {client.email && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-50 text-green-700">
                  <span className="font-medium">Email:</span>
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-50 text-purple-700">
                  <span className="font-medium">Phone:</span>
                  <span>{client.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700">
                <span className="font-medium">Role:</span>
                <span>{role}</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 text-gray-700">
                <span className="font-medium">Status:</span>
                <span>{statusLabel(assignment.workflow_status)}</span>
              </div>
            </div>
          </div>
          {assignment.workflow_status === 'pending' && (
            <Button
              primary
              label="Accept client"
              onClick={() =>
                run(
                  () => acceptAssignedClient(assignedClientId),
                  'Client accepted successfully'
                )
              }
              isLoading={saving}
            />
          )}
        </div>
      </div>

      <TabContainer
        data={[
          { id: 'details', label: 'Details' },
          { id: 'follow-ups', label: 'Follow-ups' },
        ]}
        activeTab={activeTab}
        onClick={(tab) =>
          setActiveTab(String(tab.id) as 'details' | 'follow-ups')
        }
      >
        <Tab id="details">
          <div className="space-y-4">
            <section className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-900 mb-3">
                Client information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profileRows.map(([label, value]) => (
                  <div key={label} className="border-b border-gray-100 pb-2">
                    <div className="text-xs text-secondary">{label}</div>
                    <div className="text-sm text-gray-900">{value || '--'}</div>
                  </div>
                ))}
              </div>
            </section>

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
                      {assignment.anticipated_package.plan.duration_days ||
                        '--'}{' '}
                      days
                    </div>
                    <div>
                      Start date:{' '}
                      {assignment.anticipated_package.start_date || '--'}
                    </div>
                    <div>
                      End date:{' '}
                      {assignment.anticipated_package.end_date || '--'}
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
                      onClick={() => setDialog('assessment')}
                      disabled={saving}
                    />
                  )}
                  {assignment.can_confirm_package && (
                    <Button
                      primary
                      label="Confirm & activate package"
                      onClick={() =>
                        run(
                          () => confirmAssignedClientPackage(assignedClientId),
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
                    <div
                      key={item.id}
                      className="border-b border-gray-100 pb-3"
                    >
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
          </div>
        </Tab>

        <Tab id="follow-ups">
          <div className="space-y-4">
            <section className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="font-semibold">Follow-ups</h2>
                <Button
                  outlined
                  label="Schedule follow-up"
                  onClick={() => setDialog('follow_up')}
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
                                completeAssignedClientFollowUp(
                                  assignedClientId,
                                  item.id
                                ),
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
          </div>
        </Tab>
      </TabContainer>

      <DialogModal
        isOpen={dialog === 'follow_up'}
        onClose={() => setDialog(null)}
        title="Schedule follow-up"
        subTitle="Choose the date and time for the client call."
        onSubmit={submitFollowUp}
        actionLabel="Schedule"
        actionLoader={saving}
        secondaryAction={() => setDialog(null)}
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
        isOpen={dialog === 'assessment'}
        onClose={() => setDialog(null)}
        title="Create client assessment"
        subTitle="Record the assessment completed after the follow-up."
        onSubmit={submitAssessment}
        actionLabel="Save assessment"
        actionLoader={saving}
        secondaryAction={() => setDialog(null)}
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
    </div>
  )
}
