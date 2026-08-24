import moment from 'moment'
import { useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'

import FormBuilder from '../../components/app/formBuilder'
import InfoBox from '../../components/app/alertBox/infoBox'
import Button from '../../components/common/buttons/Button'
import { DialogModal } from '../../components/common'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import {
  assignSalesClientStaff,
  createSalesPlanProposal,
  useSalesClient,
  useSalesPackages,
} from './api'

const roleLabels: Record<string, string> = {
  nutritionist: 'Nutritionist',
  physiotherapist: 'Physiotherapist',
  yogist: 'Yogist',
}

const formatDate = (value: any) =>
  value ? moment(value).format('DD-MM-YYYY') : '--'

const apiDate = (value: any) => {
  if (!value) return ''
  return value instanceof Date
    ? moment(value).format('YYYY-MM-DD')
    : moment(value).format('YYYY-MM-DD')
}

export default function SalesClientDetails() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const { enqueueSnackbar } = useSnackbarManager()
  const { data, isLoading, refetch } = useSalesClient(id)
  const { data: packagesData, isFetching: packagesLoading } = useSalesPackages({
    page: 1,
    per_page: 100,
    search: '',
  })
  const client = data?.client
  const packages = useMemo(
    () => packagesData?.packages || [],
    [packagesData?.packages]
  )
  const [proposalModal, setProposalModal] = useState(false)
  const [assignmentRole, setAssignmentRole] = useState('')
  const [proposalLoading, setProposalLoading] = useState(false)
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const proposalMethods = useForm<any>({
    defaultValues: { plan_name: '', plan_id: '', start_date: '', notes: '' },
  })
  const assignmentMethods = useForm<any>({
    defaultValues: { staff_name: '', staff_user_id: '' },
  })
  const selectedPlanId = proposalMethods.watch('plan_id')
  const anticipatedStart = proposalMethods.watch('start_date')
  const selectedPlan = packages.find(
    (plan: any) => String(plan.id) === String(selectedPlanId)
  )
  const anticipatedEnd =
    selectedPlan?.duration_days && anticipatedStart
      ? moment(anticipatedStart).add(
          Number(selectedPlan.duration_days) - 1,
          'days'
        )
      : null

  const proposalFields = useMemo(
    () => [
      {
        name: 'plan_name',
        id: 'plan_id',
        label: 'Package plan',
        type: 'custom_select',
        desc: 'name',
        descId: 'id',
        data: packages,
        required: true,
        placeholder: packagesLoading
          ? 'Loading active plans...'
          : 'Select active plan',
        disabled: packagesLoading,
      },
      {
        name: 'start_date',
        id: 'start_date',
        label: 'Anticipated start date',
        type: 'date',
        required: true,
        minDate: new Date(),
      },
      {
        name: 'notes',
        id: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Optional notes for this proposed assignment',
      },
    ],
    [packages, packagesLoading]
  )

  const assignmentFields = useMemo(() => {
    const staff = client?.assignable_staff?.[assignmentRole] || []
    return [
      {
        name: 'staff_name',
        id: 'staff_user_id',
        label: roleLabels[assignmentRole] || 'Staff member',
        type: 'custom_select',
        desc: 'name',
        descId: 'id',
        data: staff,
        required: true,
        placeholder: `Select ${roleLabels[assignmentRole]?.toLowerCase() || 'staff member'}`,
      },
    ]
  }, [assignmentRole, client?.assignable_staff])

  const openProposalModal = () => {
    proposalMethods.reset({
      plan_name: '',
      plan_id: '',
      start_date: '',
      notes: '',
    })
    setProposalModal(true)
  }

  const openAssignmentModal = (role: string) => {
    const current = client?.assignments?.find(
      (assignment: any) => assignment.role === role
    )
    assignmentMethods.reset({
      staff_name: current?.staff_name || '',
      staff_user_id: current?.staff_user_id || '',
    })
    setAssignmentRole(role)
  }

  const saveProposal = async () => {
    const values = proposalMethods.getValues()
    if (!values.plan_id || !values.start_date) {
      enqueueSnackbar('Select a package and anticipated start date.', {
        variant: 'error',
      })
      return
    }
    try {
      setProposalLoading(true)
      await createSalesPlanProposal(id, {
        plan_id: values.plan_id,
        start_date: apiDate(values.start_date),
        notes: values.notes,
      })
      enqueueSnackbar('Proposed package assigned successfully.', {
        variant: 'success',
      })
      setProposalModal(false)
      await refetch()
    } catch (error: any) {
      enqueueSnackbar(
        getApiErrorMessage(error) || 'Unable to assign proposed package.',
        { variant: 'error' }
      )
    } finally {
      setProposalLoading(false)
    }
  }

  const saveAssignment = async () => {
    const values = assignmentMethods.getValues()
    if (!assignmentRole || !values.staff_user_id) {
      enqueueSnackbar('Select a staff member.', { variant: 'error' })
      return
    }
    try {
      setAssignmentLoading(true)
      await assignSalesClientStaff(id, {
        role: assignmentRole,
        staff_user_id: values.staff_user_id,
      })
      enqueueSnackbar(`${roleLabels[assignmentRole]} assigned successfully.`, {
        variant: 'success',
      })
      setAssignmentRole('')
      await refetch()
    } catch (error: any) {
      enqueueSnackbar(
        getApiErrorMessage(error) || 'Unable to assign staff member.',
        { variant: 'error' }
      )
    } finally {
      setAssignmentLoading(false)
    }
  }

  if (isLoading) return <InfoBox content="Loading client details..." />
  if (!client) return <InfoBox content="Client not found." />

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            className="mb-2 text-sm text-primary hover:underline"
            onClick={() => navigate('/sales/clients')}
          >
            ← Back to clients
          </button>
          <h1 className="text-xl font-semibold text-primaryText">
            {client.name}
          </h1>
          <p className="text-sm text-secondary">
            Client details and service assignment
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${client.profile_completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
        >
          {client.profile_completed
            ? 'Profile completed'
            : 'Profile not completed'}
        </span>
      </div>

      {!client.profile_completed && client.profile_completion_url && (
        <InfoBox content="The client must complete the public registration link before service planning begins." />
      )}

      <section className="rounded-lg border border-formBorder bg-white p-4">
        <h2 className="mb-4 border-b border-formBorder pb-3 font-semibold text-primaryText">
          Client information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Email', client.email],
            ['Phone', client.phone],
            ['Gender', client.profile?.gender],
            ['Date of Birth', formatDate(client.profile?.date_of_birth)],
            [
              'Height',
              client.profile?.height ? `${client.profile.height} cm` : '--',
            ],
            [
              'Weight',
              client.profile?.weight ? `${client.profile.weight} kg` : '--',
            ],
            ['Lifestyle', client.profile?.lifestyle],
            ['Goal', client.profile?.goal],
            ['Food Preferences', client.profile?.food_preferences],
            ['Medical Conditions', client.profile?.medical_conditions],
            ['Food Allergies', client.profile?.food_allergies],
            [
              'Location',
              [client.profile?.state, client.profile?.country]
                .filter(Boolean)
                .join(', '),
            ],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <div className="text-xs text-secondary">{label}</div>
              <div className="mt-1 break-words text-sm text-primaryText">
                {value || '--'}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-formBorder bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-formBorder pb-3">
          <div>
            <h2 className="font-semibold text-primaryText">
              Proposed package plans
            </h2>
            <p className="mt-1 text-xs text-secondary">
              These are proposed assignments and do not create confirmed
              subscriptions.
            </p>
          </div>
          <Button
            label="Add package plan"
            icon="plus"
            onClick={openProposalModal}
            disabled={!client.profile_completed}
          />
        </div>
        {client.plan_proposals?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-formBorder text-xs text-secondary">
                  <th className="p-3">Package</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Start date</th>
                  <th className="p-3">End date</th>
                  <th className="p-3">Added by</th>
                </tr>
              </thead>
              <tbody>
                {client.plan_proposals.map((proposal: any) => (
                  <tr
                    key={proposal.id}
                    className="border-b border-formBorder last:border-0"
                  >
                    <td className="p-3 font-medium text-primaryText">
                      {proposal.plan?.name || '--'}
                    </td>
                    <td className="p-3 capitalize text-secondary">
                      {proposal.status || '--'}
                    </td>
                    <td className="p-3 text-secondary">
                      {formatDate(proposal.start_date)}
                    </td>
                    <td className="p-3 text-secondary">
                      {formatDate(proposal.end_date)}
                    </td>
                    <td className="p-3 text-secondary">
                      {proposal.created_by?.name || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-secondary">
            No proposed package plans yet.
          </div>
        )}
      </section>

      <section className="rounded-lg border border-formBorder bg-white p-4">
        <div className="mb-4 border-b border-formBorder pb-3">
          <h2 className="font-semibold text-primaryText">
            Service team assignments
          </h2>
          <p className="mt-1 text-xs text-secondary">
            Assign one active team member for each service role.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Object.entries(roleLabels).map(([role, label]) => {
            const assignment = client.assignments?.find(
              (item: any) => item.role === role
            )
            return (
              <div
                key={role}
                className="rounded-lg border border-formBorder bg-cardWrapperBg p-4"
              >
                <div className="text-xs text-secondary">{label}</div>
                <div className="mt-2 font-medium text-primaryText">
                  {assignment?.staff_name || 'Not assigned'}
                </div>
                <div className="mt-4">
                  <Button
                    label={assignment ? 'Change assignment' : `Assign ${label}`}
                    outlined
                    fullwidth
                    onClick={() => openAssignmentModal(role)}
                    disabled={!client.profile_completed}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <DialogModal
        isOpen={proposalModal}
        onClose={() => setProposalModal(false)}
        title="Add proposed package"
        subTitle="Select an active package and anticipated start date. The end date is calculated from the package duration."
        actionLabel="Save proposed plan"
        actionLoader={proposalLoading}
        onSubmit={saveProposal}
        secondaryAction={() => setProposalModal(false)}
        secondaryActionLabel="Cancel"
        small={false}
        className="w-full max-w-2xl"
        body={
          <div>
            <FormProvider {...proposalMethods}>
              <FormBuilder data={proposalFields} edit spacing />
            </FormProvider>
            {anticipatedEnd && (
              <div className="mt-4 rounded-lg border border-formBorder bg-cardWrapperBg p-4">
                <div className="text-xs text-secondary">
                  Automatically calculated end date
                </div>
                <div className="mt-1 text-sm font-medium text-primaryText">
                  {anticipatedEnd.format('DD-MM-YYYY')} (
                  {selectedPlan.duration_days} days)
                </div>
              </div>
            )}
          </div>
        }
      />
      <DialogModal
        isOpen={Boolean(assignmentRole)}
        onClose={() => setAssignmentRole('')}
        title={`Assign ${roleLabels[assignmentRole] || 'staff member'}`}
        subTitle="Select an active team member for this client."
        actionLabel="Save assignment"
        actionLoader={assignmentLoading}
        onSubmit={saveAssignment}
        secondaryAction={() => setAssignmentRole('')}
        secondaryActionLabel="Cancel"
        body={
          <FormProvider {...assignmentMethods}>
            <FormBuilder data={assignmentFields} edit spacing />
          </FormProvider>
        }
      />
    </div>
  )
}
