import moment from 'moment'
import { useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'

import FormBuilder from '../../components/app/formBuilder'
import InfoBox from '../../components/app/alertBox/infoBox'
import Button from '../../components/common/buttons/Button'
import Icons from '../../components/common/icons'
import { DialogModal } from '../../components/common'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import {
  assignSalesClientStaff,
  createSalesPlanProposal,
  updateSalesPlanProposal,
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

const accountStatusColor = (value: any) => {
  switch (String(value || '').toLowerCase()) {
    case 'active':
      return 'border-green-200 bg-green-50 text-green-700'
    case 'pending':
    case 'inactive':
      return 'border-yellow-200 bg-yellow-50 text-yellow-700'
    case 'suspended':
    case 'blocked':
      return 'border-red-200 bg-red-50 text-red-700'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700'
  }
}

const statusLabel = (value: any) =>
  String(value || '--')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

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
  const [editingProposal, setEditingProposal] = useState<any>(null)
  const [assignmentRole, setAssignmentRole] = useState('')
  const [proposalLoading, setProposalLoading] = useState(false)
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const proposalMethods = useForm<any>({
    defaultValues: { plan_name: '', plan_id: '', start_date: '', notes: '' },
  })
  const assignmentMethods = useForm<any>({
    defaultValues: { staff_name: '', staff_user_id: '', notes: '' },
  })
  const [staffSearch, setStaffSearch] = useState('')
  const [staffPage, setStaffPage] = useState(1)
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
        rows: 5,
        maxLength: 500,
        fullWidth: true,
        placeholder: 'Optional notes for this proposed assignment',
      },
    ],
    [packages, packagesLoading]
  )

  const selectedStaffId = assignmentMethods.watch('staff_user_id')
  const activeStaff = useMemo(() => {
    const term = staffSearch.trim().toLowerCase()
    const staff = client?.assignable_staff?.[assignmentRole] || []
    return staff.filter(
      (member: any) =>
        !term ||
        [member.name, member.email].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(term)
        )
    )
  }, [assignmentRole, client?.assignable_staff, staffSearch])
  const staffPageSize = 6
  const staffTotalPages = Math.max(
    1,
    Math.ceil(activeStaff.length / staffPageSize)
  )
  const visibleStaff = activeStaff.slice(
    (staffPage - 1) * staffPageSize,
    staffPage * staffPageSize
  )

  const openProposalModal = (proposal?: any) => {
    setEditingProposal(proposal || null)
    proposalMethods.reset({
      plan_name: proposal?.plan?.name || '',
      plan_id: proposal?.plan?.id || '',
      start_date: proposal?.start_date || '',
      notes: proposal?.notes || '',
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
      notes: current?.notes || '',
    })
    setStaffSearch('')
    setStaffPage(1)
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
      if (editingProposal) {
        await updateSalesPlanProposal(id, editingProposal.id, {
          plan_id: values.plan_id,
          start_date: apiDate(values.start_date),
          notes: values.notes,
        })
      } else {
        await createSalesPlanProposal(id, {
          plan_id: values.plan_id,
          start_date: apiDate(values.start_date),
          notes: values.notes,
        })
      }
      enqueueSnackbar(
        editingProposal
          ? 'Package proposal updated successfully.'
          : 'Package proposal created successfully.',
        { variant: 'success' }
      )
      setProposalModal(false)
      setEditingProposal(null)
      await refetch()
    } catch (error: any) {
      enqueueSnackbar(
        getApiErrorMessage(error) || 'Unable to save proposed package.',
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
        notes: values.notes || '',
      })
      enqueueSnackbar(roleLabels[assignmentRole] + ' assigned successfully.', {
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
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/sales/clients')}
              className="rounded-lg hover:bg-gray-100 transition"
              aria-label="Back to clients"
            >
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {client.name || 'Client #' + id}
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span
              className={
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ' +
                accountStatusColor(client.status)
              }
            >
              {statusLabel(client.status)}
            </span>
            <span
              className={
                'rounded-full px-3 py-1 text-xs font-medium ' +
                (client.profile_completed
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700')
              }
            >
              {client.profile_completed
                ? 'Profile completed'
                : 'Profile not completed'}
            </span>
          </div>
        </div>
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
              Saving a proposed package does not create a subscription or
              payment record.
            </p>
          </div>
          <Button
            label="Add package plan"
            icon="plus"
            onClick={() => openProposalModal()}
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
                  <th className="p-3">Actions</th>
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
                    <td className="p-3">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={() => openProposalModal(proposal)}
                      >
                        Edit proposal
                      </button>
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
        onClose={() => {
          setProposalModal(false)
          setEditingProposal(null)
        }}
        title={
          editingProposal ? 'Edit proposed package' : 'Add proposed package'
        }
        subTitle="Select an active package and anticipated start date. The end date is calculated from the package duration."
        actionLabel={editingProposal ? 'Update proposal' : 'Save proposed plan'}
        actionLoader={proposalLoading}
        onSubmit={saveProposal}
        secondaryAction={() => {
          setProposalModal(false)
          setEditingProposal(null)
        }}
        secondaryActionLabel="Cancel"
        small={false}
        className="w-full max-w-4xl"
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
        small={false}
        className="w-full max-w-4xl"
        body={
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-primaryText">
                Select an active {roleLabels[assignmentRole] || 'staff member'}
              </label>
              <input
                type="search"
                value={staffSearch}
                onChange={(event) => {
                  setStaffSearch(event.target.value)
                  setStaffPage(1)
                }}
                placeholder="Search by name or email"
                className="w-full rounded-lg border border-formBorder px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {visibleStaff.length ? (
                visibleStaff.map((staff: any) => (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => {
                      assignmentMethods.setValue('staff_user_id', staff.id, {
                        shouldValidate: true,
                      })
                      assignmentMethods.setValue('staff_name', staff.name || '')
                    }}
                    className={
                      'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ' +
                      (String(selectedStaffId) === String(staff.id)
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-formBorder bg-white hover:border-primary/60 hover:bg-cardWrapperBg')
                    }
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primaryAlt font-semibold text-primary">
                      {String(staff.name || '?')
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-primaryText">
                        {staff.name || 'Unnamed staff'}
                      </span>
                      <span className="block truncate text-xs text-secondary">
                        {staff.email || 'Active team member'}
                      </span>
                    </span>
                    {String(selectedStaffId) === String(staff.id) && (
                      <Icons name="check-circle" />
                    )}
                  </button>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-formBorder p-6 text-center text-sm text-secondary">
                  No active team members match your search.
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-formBorder pt-3 text-sm">
              <span className="text-secondary">
                {activeStaff.length} active member
                {activeStaff.length === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={staffPage <= 1}
                  onClick={() => setStaffPage((page) => Math.max(1, page - 1))}
                  className="rounded border border-formBorder px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-secondary">
                  Page {Math.min(staffPage, staffTotalPages)} of{' '}
                  {staffTotalPages}
                </span>
                <button
                  type="button"
                  disabled={staffPage >= staffTotalPages}
                  onClick={() =>
                    setStaffPage((page) => Math.min(staffTotalPages, page + 1))
                  }
                  className="rounded border border-formBorder px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
            <FormProvider {...assignmentMethods}>
              <FormBuilder
                data={[
                  {
                    name: 'notes',
                    label: 'Notes',
                    type: 'textarea',
                    rows: 5,
                    maxLength: 500,
                    fullWidth: true,
                    placeholder: 'Optional notes for this assignment',
                  },
                ]}
                edit
                spacing
              />
            </FormProvider>
          </div>
        }
      />
    </div>
  )
}
