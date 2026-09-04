import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Button from '../../components/common/buttons/Button'
import { DialogModal, TabContainer } from '../../components/common'
import FormBuilder from '../../components/app/formBuilder'
import Icons from '../../components/common/icons'
import Tab from '../../components/common/tab/Tab'
import InfoBox from '../../components/app/alertBox/infoBox'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import {
  acceptSalesLead,
  convertSalesLead,
  createSalesInteraction,
  generateSalesConfirmation,
  useSalesLead,
} from './api'

const confirmationTemplate = `As per our discussion, I’ve noted the following points. Please go through them and confirm if everything is correct. Once you confirm, I’ll plan your customized diet and workout accordingly.

Height:
Weight:
Medical condition:
Cuisine preference:
Diet type:
Food allergies:
Food dislikes:
Fitness Goal:
Starting date:`

const allActivityOptions = [
  { id: 'call', name: 'Call' },
  { id: 'email', name: 'Email' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'meeting', name: 'Meeting' },
  { id: 'note', name: 'Note' },
  { id: 'contacted', name: 'Contacted' },
  { id: 'qualified', name: 'Qualified' },
  { id: 'lost', name: 'Lost' },
]

const statusProgression = [
  'new_lead',
  'assigned',
  'accepted',
  'contacted',
  'qualified',
  'confirmation_pending',
  'client_accepted',
  'converted',
]

const activityIcon = (type: string) => {
  switch (type) {
    case 'call':
    case 'whatsapp':
      return 'phone'
    case 'email':
      return 'email'
    case 'meeting':
      return 'calendar'
    case 'contacted':
      return 'activities'
    case 'qualified':
      return 'badge-check'
    case 'lost':
      return 'exclamation-circle'
    default:
      return 'add-notes'
  }
}

const parseNotes = (value: any) => {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const statusLabel = (value: any) => {
  const key = String(value || 'assigned').toLowerCase()
  const labels: Record<string, string> = {
    assigned: 'Assigned',
    accepted: 'Accepted',
    contacted: 'Contacted',
    qualified: 'Qualified',
    lost: 'Lost',
    confirmation_pending: 'Confirmation pending',
    client_accepted: 'Client accepted',
    converted: 'Converted',
    new_lead: 'Assigned',
    client_confirmation: 'Confirmation pending',
  }
  return (
    labels[key] ||
    key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  )
}

const statusColor = (value: any) => {
  switch (String(value || '').toLowerCase()) {
    case 'accepted':
    case 'client_accepted':
    case 'converted':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'contacted':
    case 'assigned':
    case 'new_lead':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'qualified':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'confirmation_pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'lost':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function SalesLeadDetails() {
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()
  const { data, isLoading, refetch } = useSalesLead(id)
  const lead = data?.lead
  const statusBlockedActivities = ['contacted', 'qualified', 'lost']
  const activityOptions =
    lead &&
    statusProgression.indexOf(lead.status) >=
      statusProgression.indexOf('confirmation_pending')
      ? allActivityOptions.filter(
          (opt) => !statusBlockedActivities.includes(opt.id)
        )
      : allActivityOptions
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'details'
    return window.localStorage.getItem('sales-lead-tab-' + id) || 'details'
  })
  const [activityModal, setActivityModal] = useState(false)
  const [selectedActivityType, setSelectedActivityType] = useState('call')
  const [confirmationModal, setConfirmationModal] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [conversionModal, setConversionModal] = useState(false)
  const [activityLoader, setActivityLoader] = useState(false)
  const [confirmationLoader, setConfirmationLoader] = useState(false)
  const [conversionLoader, setConversionLoader] = useState(false)

  useEffect(() => {
    window.localStorage.setItem('sales-lead-tab-' + id, activeTab)
  }, [activeTab, id])

  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'confirmation') {
      setConfirmationModal(true)
    } else if (action === 'convert') {
      setConversionModal(true)
    }
    if (action) {
      setSearchParams({}, { replace: true })
    }
  }, [])

  const activityMethods = useForm({
    defaultValues: {
      activity_type_label: 'Call',
      activity_type: 'call',
      notes: '',
    },
  })
  const confirmationMethods = useForm({
    defaultValues: { message: confirmationTemplate },
  })
  const conversionMethods = useForm({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      date_of_birth: '',
      gender: '',
    },
  })

  useEffect(() => {
    if (!lead) return
    confirmationMethods.setValue(
      'message',
      lead.confirmation?.message || confirmationTemplate
    )
    conversionMethods.reset({
      name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
      phone: lead.phone || '',
      email: lead.email || '',
      date_of_birth: '',
      gender: '',
    })
  }, [lead, confirmationMethods, conversionMethods])

  const activityFields = useMemo(
    () => [
      {
        name: 'activity_type_label',
        id: 'activity_type',
        label: 'Activity type',
        type: 'custom_select',
        desc: 'name',
        descId: 'id',
        data: activityOptions,
        required: true,
        placeholder: 'Select activity type',
      },
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        rows: 12,
        maxLength: 500,
        fullWidth: true,
        placeholder: 'Add notes for this activity',
      },
    ],
    []
  )
  const confirmationFields = useMemo(
    () => [
      {
        name: 'message',
        label: 'Confirmation message',
        type: 'textarea',
        required: true,
        placeholder: 'Enter the confirmation message',
      },
    ],
    []
  )
  const conversionFields = useMemo(
    () => [
      { name: 'name', label: 'Name', type: 'text', required: true },
      {
        name: 'phone',
        label: 'Phone number',
        type: 'text',
        required: true,
        maxLength: 10,
      },
      { name: 'email', label: 'Email', type: 'text', required: true },
      {
        name: 'date_of_birth',
        label: 'Date of birth',
        type: 'date',
        required: true,
        maxDate: new Date(),
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'custom_select',
        desc: 'name',
        descId: 'id',
        data: [
          { id: 'male', name: 'Male' },
          { id: 'female', name: 'Female' },
          { id: 'others', name: 'Other' },
        ],
        placeholder: 'Select gender',
        required: true,
      },
    ],
    []
  )

  const action = async (callback: () => Promise<any>, success: string) => {
    try {
      await callback()
      enqueueSnackbar(success, { variant: 'success' })
      await refetch()
      queryClient.invalidateQueries(['sales_leads'])
    } catch (error: any) {
      enqueueSnackbar(getApiErrorMessage(error, 'Unable to complete action'), {
        variant: 'error',
      })
    }
  }

  const accept = () =>
    action(() => acceptSalesLead(id), 'Lead accepted successfully')

  const saveActivity = async () => {
    const valid = await activityMethods.trigger()
    if (!valid) {
      enqueueSnackbar('Complete the required activity fields', {
        variant: 'error',
      })
      return
    }
    try {
      setActivityLoader(true)
      const values = activityMethods.getValues()
      await createSalesInteraction(id, {
        activity_type: values.activity_type,
        notes: values.notes || '',
      })
      enqueueSnackbar('Activity saved successfully', { variant: 'success' })
      setActivityModal(false)
      await refetch()
      queryClient.invalidateQueries(['sales_leads'])
    } catch (error: any) {
      enqueueSnackbar(getApiErrorMessage(error, 'Unable to save activity'), {
        variant: 'error',
      })
    } finally {
      setActivityLoader(false)
    }
  }

  const generateConfirmation = async () => {
    const valid = await confirmationMethods.trigger()
    if (!valid) {
      enqueueSnackbar('Enter a confirmation message', { variant: 'error' })
      return
    }
    try {
      setConfirmationLoader(true)
      await generateSalesConfirmation(
        id,
        confirmationMethods.getValues('message')
      )
      enqueueSnackbar('Confirmation link generated successfully', {
        variant: 'success',
      })
      await refetch()
      queryClient.invalidateQueries(['sales_leads'])
      setConfirmationModal(false)
      setSuccessModal(true)
    } catch (error: any) {
      enqueueSnackbar(
        getApiErrorMessage(error, 'Unable to generate confirmation link'),
        { variant: 'error' }
      )
    } finally {
      setConfirmationLoader(false)
    }
  }

  const convert = async () => {
    const valid = await conversionMethods.trigger()
    if (!valid) {
      enqueueSnackbar('Complete the required client fields', {
        variant: 'error',
      })
      return
    }
    try {
      setConversionLoader(true)
      await convertSalesLead(id, conversionMethods.getValues())
      enqueueSnackbar('Client created in pending state', { variant: 'success' })
      setConversionModal(false)
      await refetch()
      queryClient.invalidateQueries(['sales_leads'])
    } catch (error: any) {
      enqueueSnackbar(getApiErrorMessage(error, 'Unable to convert lead'), {
        variant: 'error',
      })
    } finally {
      setConversionLoader(false)
    }
  }

  const copyLink = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url)
      enqueueSnackbar(`${label} copied`, { variant: 'success' })
    } catch {
      enqueueSnackbar(`Unable to copy ${label.toLowerCase()}`, {
        variant: 'error',
      })
    }
  }

  const formNotes = parseNotes(lead?.notes)
  const leadName =
    `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim() || `Lead #${id}`

  return (
    <div className="p-4">
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/sales/leads')}
              className="rounded-lg hover:bg-gray-100 transition"
              aria-label="Back to leads"
            >
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {isLoading ? 'Loading...' : leadName}
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {lead && !lead.accepted && (
              <Button
                label="Accept lead"
                icon="check-circle"
                onClick={accept}
              />
            )}
            {lead?.accepted &&
              ['accepted', 'contacted', 'qualified'].includes(lead.status) && (
                <Button
                  label="Confirmation link"
                  icon="link"
                  outlined
                  onClick={() => setConfirmationModal(true)}
                />
              )}
            {lead?.status === 'client_accepted' && !lead.client && (
              <Button
                label="Convert to client"
                icon="user"
                onClick={() => setConversionModal(true)}
              />
            )}
          </div>
        </div>
      </div>
      {isLoading && <InfoBox content="Loading lead details..." />}
      {!isLoading && !lead && <InfoBox content="Lead not found." />}
      {!isLoading &&
        lead &&
        lead.client &&
        !lead.client.profile_completed &&
        lead.client.profile_completion_url && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-amber-700">
              The client must complete the public registration link before
              service planning begins.
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(
                  lead.client.profile_completion_url
                )
                enqueueSnackbar('Profile completion link copied', {
                  variant: 'success',
                })
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg shadow-md shadow-blue-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Icons name="external-link" className="h-3.5 w-3.5" />
              Copy profile link
            </button>
          </div>
        )}
      {!isLoading && lead && (
        <TabContainer
          data={[
            { id: 'details', label: 'Details' },
            { id: 'activities', label: 'Activities' },
          ]}
          activeTab={activeTab}
          onClick={(tab) => setActiveTab(String(tab.id))}
        >
          <Tab id="details">
            <div className="space-y-4">
              <section className="border border-formBorder rounded-lg bg-white p-4">
                <div className="flex items-center justify-between border-b border-formBorder pb-3 mb-3">
                  <h3 className="font-semibold text-primaryText">
                    Lead details
                  </h3>
                  <span
                    className={
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ' +
                      statusColor(lead.status)
                    }
                  >
                    {statusLabel(lead.status)}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ['First name', lead.first_name],
                    ['Last name', lead.last_name],
                    ['Email', lead.email],
                    ['Phone', lead.phone],
                    ['Campaign', lead.campaign?.name],
                    [
                      'Assigned to',
                      lead.assigned_to?.name
                        ? lead.assigned_to.name.charAt(0).toUpperCase() +
                          lead.assigned_to.name.slice(1)
                        : '',
                    ],
                    [
                      'Assigned by',
                      lead.assigned_by?.name
                        ? lead.assigned_by.name.charAt(0).toUpperCase() +
                          lead.assigned_by.name.slice(1)
                        : '',
                    ],
                    [
                      'Assigned date',
                      lead.assigned_at
                        ? new Date(lead.assigned_at).toLocaleString()
                        : null,
                    ],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <div className="text-xs text-secondary">{label}</div>
                      <div className="text-sm text-primaryText mt-1 break-words">
                        {value || '--'}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              {lead.status === 'confirmation_pending' && lead.confirmation && (
                <section className="border border-formBorder rounded-lg bg-white p-4">
                  <div className="flex items-center justify-between border-b border-formBorder pb-3 mb-3">
                    <h3 className="font-semibold text-primaryText">
                      Confirmation Details
                    </h3>
                    {/* <span
                      className={
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ' +
                        statusColor(lead.status)
                      }
                    >
                      {statusLabel(lead.status)}
                    </span> */}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-secondary">
                        Confirmation message
                      </div>
                      <div className="text-sm text-primaryText mt-1 whitespace-pre-wrap bg-cardWrapperBg rounded border border-formBorder p-3">
                        {lead.confirmation.message || '--'}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-secondary">Sent at</div>
                        <div className="text-sm text-primaryText mt-1">
                          {lead.confirmation.sent_at
                            ? new Date(
                                lead.confirmation.sent_at
                              ).toLocaleString()
                            : '--'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-secondary">
                          Client confirmed
                        </div>
                        <div className="text-sm text-primaryText mt-1">
                          {lead.confirmation.client_confirmed_at
                            ? new Date(
                                lead.confirmation.client_confirmed_at
                              ).toLocaleString()
                            : 'Not yet confirmed'}
                        </div>
                      </div>
                    </div>
                    {lead.confirmation.public_url && (
                      <div>
                        <div className="text-xs text-secondary mb-1">
                          Confirmation link
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 break-all text-sm text-primaryText bg-cardWrapperBg rounded border border-formBorder p-3">
                            {lead.confirmation.public_url}
                          </div>
                          <Button
                            label="Copy"
                            icon="link"
                            outlined
                            onClick={() =>
                              copyLink(
                                lead.confirmation.public_url,
                                'Confirmation link'
                              )
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
              <section className="border border-formBorder rounded-lg bg-white p-4">
                <h3 className="font-semibold text-primaryText border-b border-formBorder pb-3 mb-3">
                  Form shared details
                </h3>
                {formNotes ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(formNotes).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded border border-formBorder p-3"
                      >
                        <div className="text-xs text-secondary capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-primaryText mt-1 whitespace-pre-wrap">
                          {Array.isArray(value)
                            ? value.join(', ')
                            : String(value ?? '--')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-secondary whitespace-pre-wrap">
                    {lead.notes || 'No form details available.'}
                  </div>
                )}
              </section>
              {lead.client && (
                <section className="border border-formBorder rounded-lg bg-white p-4">
                  <h3 className="font-semibold text-primaryText border-b border-formBorder pb-3 mb-3">
                    Client account
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-secondary">Name</span>
                      <div className="text-primaryText">{lead.client.name}</div>
                    </div>
                    <div>
                      <span className="text-secondary">Email</span>
                      <div className="text-primaryText">
                        {lead.client.email}
                      </div>
                    </div>
                    <div>
                      <span className="text-secondary">Phone</span>
                      <div className="text-primaryText">
                        {lead.client.phone || '--'}
                      </div>
                    </div>
                    <div>
                      <span className="text-secondary">Status</span>
                      <div className="text-primaryText capitalize">
                        {lead.client.status}
                      </div>
                    </div>
                    <div>
                      <span className="text-secondary">Gender</span>
                      <div className="text-primaryText capitalize">
                        {lead.client.gender || '--'}
                      </div>
                    </div>
                    <div>
                      <span className="text-secondary">Date of birth</span>
                      <div className="text-primaryText">
                        {lead.client.date_of_birth
                          ? new Date(
                              lead.client.date_of_birth
                            ).toLocaleDateString()
                          : '--'}
                      </div>
                    </div>
                    <div>
                      <span className="text-secondary">Profile</span>
                      <div className="text-primaryText">
                        {lead.client.profile_completed
                          ? 'Completed'
                          : 'Not completed'}
                      </div>
                    </div>
                    <div>
                      <span className="text-secondary">Converted at</span>
                      <div className="text-primaryText">
                        {lead.client.converted_at
                          ? new Date(lead.client.converted_at).toLocaleString()
                          : '--'}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </Tab>
          <Tab id="activities">
            <div className="space-y-4">
              {lead.status !== 'assigned' && lead.status !== 'new_lead' && (
                <div className="flex justify-end">
                  <Button
                    label="Add Interaction"
                    icon="plus"
                    onClick={() => {
                      setSelectedActivityType('call')
                      activityMethods.reset({
                        activity_type_label: 'Call',
                        activity_type: 'call',
                        notes: '',
                      })
                      setActivityModal(true)
                    }}
                  />
                </div>
              )}
              {(lead.activities || []).length ? (
                <div className="relative pl-5 border-l-2 border-formBorder space-y-4">
                  {lead.activities.map((activity: any) => (
                    <div key={activity.id} className="relative">
                      <div className="absolute -left-[26px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-white" />
                      <div className="rounded border border-formBorder bg-cardWrapperBg p-3">
                        <div className="flex justify-between gap-3">
                          <span className="text-sm font-medium capitalize text-primaryText">
                            {statusLabel(activity.activity_type)}
                          </span>
                          <span className="text-xs text-secondary">
                            {activity.occurred_at
                              ? new Date(activity.occurred_at).toLocaleString()
                              : '--'}
                          </span>
                        </div>
                        {activity.notes && (
                          <div className="mt-2 whitespace-pre-wrap text-sm text-primaryText">
                            {activity.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-secondary py-10">
                  No activities recorded for this lead yet.
                </div>
              )}
            </div>
          </Tab>
        </TabContainer>
      )}
      <DialogModal
        isOpen={confirmationModal}
        onClose={() => setConfirmationModal(false)}
        title="Generate confirmation link"
        subTitle="Write the message that the client will review and accept."
        actionLabel="Generate link"
        actionLoader={confirmationLoader}
        onSubmit={generateConfirmation}
        secondaryAction={() => setConfirmationModal(false)}
        secondaryActionLabel="Cancel"
        small={false}
        className="w-full max-w-3xl"
        body={
          <div className="mx-auto w-full max-w-2xl">
            <FormProvider {...confirmationMethods}>
              <FormBuilder data={confirmationFields} edit spacing />
            </FormProvider>
          </div>
        }
      />
      <DialogModal
        isOpen={successModal}
        onClose={() => setSuccessModal(false)}
        title=""
        actionLabel=""
        onSubmit={() => setSuccessModal(false)}
        small={false}
        className="w-full max-w-md"
        body={
          <div className="text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
              <svg
                className="h-8 w-8 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-primaryText mb-1">
              Link Generated Successfully
            </h3>
            <p className="text-sm text-secondary mb-5">
              Share this link with the client to review and confirm.
            </p>
            {lead?.confirmation?.public_url ? (
              <div className="rounded-xl border border-formBorder bg-cardWrapperBg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icons name="link" className="h-4 w-4 text-secondary" />
                  <span className="text-xs font-medium text-secondary">
                    Confirmation link
                  </span>
                </div>
                <div className="break-all text-sm text-primaryText font-medium bg-white rounded-lg border border-formBorder p-3 mb-3">
                  {lead.confirmation.public_url}
                </div>
                <Button
                  label="Copy link"
                  icon="link"
                  outlined
                  onClick={() =>
                    copyLink(lead.confirmation.public_url, 'Confirmation link')
                  }
                />
              </div>
            ) : (
              <p className="text-sm text-secondary mb-4">
                No link available yet.
              </p>
            )}
            <button
              onClick={() => setSuccessModal(false)}
              className="w-full rounded-lg bg-primaryGreen px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
            >
              Close
            </button>
          </div>
        }
      />
      <DialogModal
        isOpen={activityModal}
        onClose={() => setActivityModal(false)}
        title="Add Interaction"
        actionLabel="Save Interaction"
        actionLoader={activityLoader}
        onSubmit={saveActivity}
        secondaryAction={() => setActivityModal(false)}
        secondaryActionLabel="Cancel"
        small={false}
        className="w-full max-w-3xl"
        body={
          <FormProvider {...activityMethods}>
            <div className="w-full space-y-6">
              <input
                type="hidden"
                {...activityMethods.register('activity_type', {
                  required: 'Activity type is required',
                })}
              />
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-semibold text-primaryText">
                    Activity type <span className="text-error">*</span>
                  </label>
                  <span className="text-xs text-secondary">
                    Choose an activity
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {activityOptions.map((option) => {
                    const selected = selectedActivityType === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={
                          'flex min-h-[60px] flex-col items-center justify-center gap-2 rounded-xl border p-2 text-[11px] font-medium transition ' +
                          (selected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-formBorder bg-white text-secondary hover:border-primary/50 hover:bg-gray-50')
                        }
                        onClick={() => {
                          setSelectedActivityType(option.id)
                          activityMethods.setValue('activity_type', option.id, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                          activityMethods.setValue(
                            'activity_type_label',
                            option.name
                          )
                        }}
                      >
                        <span
                          className={
                            'flex h-7 w-7 items-center justify-center rounded-full ' +
                            (selected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-500')
                          }
                        >
                          <Icons
                            name={activityIcon(option.id)}
                            className="h-4 w-4"
                          />
                        </span>
                        {option.name}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="border-t border-formBorder pt-5">
                <FormBuilder data={[activityFields[1]]} edit spacing />
              </div>
            </div>
          </FormProvider>
        }
      />
      <DialogModal
        isOpen={conversionModal}
        onClose={() => setConversionModal(false)}
        title="Convert to client"
        subTitle="Review the lead information before creating the pending client account."
        actionLabel="Confirm and convert"
        actionLoader={conversionLoader}
        onSubmit={convert}
        secondaryAction={() => setConversionModal(false)}
        secondaryActionLabel="Cancel"
        small={false}
        className="w-full max-w-2xl"
        body={
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-5 rounded-lg border border-formBorder bg-cardWrapperBg p-4">
              <div className="text-sm font-semibold text-primaryText">
                Client account details
              </div>
              <div className="mt-1 text-xs text-secondary">
                These values are prefilled from the lead and can be edited
                before conversion.
              </div>
            </div>
            <FormProvider {...conversionMethods}>
              <FormBuilder data={conversionFields} edit spacing />
            </FormProvider>
          </div>
        }
      />
    </div>
  )
}
