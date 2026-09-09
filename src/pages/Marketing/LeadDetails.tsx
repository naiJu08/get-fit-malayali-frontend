import { useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import moment from 'moment'
import { useQuery } from '@tanstack/react-query'
import { useSnackbarManager } from '../../components/common/snackbar'
import Button from '../../components/common/buttons/Button'
import Tab from '../../components/common/tab/Tab'
import { DialogModal, TabContainer } from '../../components/common'
import FormBuilder from '../../components/app/formBuilder'
import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import {
  useMarketingLead,
  createLeadActivity,
  getSalesTeam,
  assignMarketingLead,
  useMarketingForm,
} from './api'
// import { usePlans } from '../Plans/api'

const leadStatusOptions = [
  { id: 'new_lead', name: 'New Lead' },
  { id: 'contacted', name: 'Contacted' },
  { id: 'qualified', name: 'Qualified' },
  { id: 'converted', name: 'Converted' },
  { id: 'lost', name: 'Lost' },
]

const activityOptions = [
  { id: 'contacted', name: 'Contacted' },
  { id: 'qualified', name: 'Qualified' },
  { id: 'note', name: 'Note' },
  { id: 'converted', name: 'Converted' },
  { id: 'lost', name: 'Lost' },
]

function displayStatus(value: any) {
  if (!value || String(value).toLowerCase() === 'assigned') return 'New Lead'
  const match = leadStatusOptions.find(
    (o) =>
      o.id === value || o.name.toLowerCase() === String(value).toLowerCase()
  )
  if (match) return match.name
  return String(value)
    .replace(/_/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function statusColor(value: any) {
  const s = String(value || '').toLowerCase()
  if (s === 'assigned' || s === 'new_lead' || s === 'new')
    return 'bg-blue-50 text-blue-700 border-blue-200'
  if (s === 'contacted') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (s === 'qualified') return 'bg-purple-50 text-purple-700 border-purple-200'
  if (s === 'converted')
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (s === 'lost') return 'bg-rose-50 text-rose-700 border-rose-200'
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

function formatDateTime(d: any) {
  if (!d) return '--'
  try {
    const m = moment(d)
    return m.isValid() ? m.format('DD MMM YYYY, hh:mm A') : String(d)
  } catch {
    return String(d)
  }
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-xs">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-gray-900 break-words">{value || '--'}</div>
    </div>
  )
}

function parseNotes(rawNotes: any) {
  if (!rawNotes) return { isJson: false, data: null, text: '' }
  if (typeof rawNotes === 'object' && rawNotes !== null) {
    return { isJson: true, data: rawNotes, text: '' }
  }
  if (typeof rawNotes === 'string') {
    const trimmed = rawNotes.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (typeof parsed === 'object' && parsed !== null) {
          return { isJson: true, data: parsed, text: '' }
        }
      } catch {
        // Fallthrough to plain text
      }
    }
    return { isJson: false, data: null, text: rawNotes }
  }
  return { isJson: false, data: null, text: String(rawNotes) }
}

function getFormFields(formOrSchema?: any): any[] {
  if (!formOrSchema) return []
  let def =
    formOrSchema.definition ||
    formOrSchema.form_schema ||
    formOrSchema.form ||
    formOrSchema
  if (typeof def === 'string') {
    try {
      def = JSON.parse(def)
    } catch {
      def = {}
    }
  }
  if (Array.isArray(def)) return def
  if (Array.isArray(def?.fields)) return def.fields
  return []
}

function findFieldDefinition(
  key: string,
  formOrSchema?: any,
  fallbackSchema?: any
): any {
  if (!key) return null
  const fields = [
    ...getFormFields(formOrSchema),
    ...getFormFields(fallbackSchema),
  ]
  const normalizedKey = String(key).trim().toLowerCase()
  return (
    fields.find((f: any) => {
      const k = String(f?.key || '')
        .trim()
        .toLowerCase()
      const n = String(f?.name || '')
        .trim()
        .toLowerCase()
      const id = String(f?.id || '')
        .trim()
        .toLowerCase()
      return k === normalizedKey || n === normalizedKey || id === normalizedKey
    }) || null
  )
}

function formatFieldKey(key: string, formOrSchema?: any, fallbackSchema?: any) {
  if (!key) return key
  const field = findFieldDefinition(key, formOrSchema, fallbackSchema)
  if (field && field.label) {
    return field.label
  }

  const standardLabels: Record<string, string> = {
    first_name: 'First name',
    last_name: 'Last name',
    email: 'Email',
    phone: 'Phone',
  }
  if (standardLabels[key]) return standardLabels[key]

  const clean = key.replace(/^field_/, '').replace(/_/g, ' ')
  if (key.startsWith('field_')) {
    return `Field ${clean}`
  }
  return clean.replace(/^./, (l) => l.toUpperCase())
}

function formatFieldValue(val: any, field?: any) {
  if (val === null || val === undefined || val === '') return '--'
  if (field && Array.isArray(field.options)) {
    const matchedOpt = field.options.find(
      (opt: any) =>
        (typeof opt === 'object' &&
          opt !== null &&
          (String(opt.value) === String(val) ||
            String(opt.id) === String(val))) ||
        String(opt) === String(val)
    )
    if (matchedOpt) {
      return typeof matchedOpt === 'object'
        ? matchedOpt.label || matchedOpt.name || matchedOpt.value
        : String(matchedOpt)
    }
  }
  return typeof val === 'object' && val !== null
    ? JSON.stringify(val)
    : String(val)
}

export default function LeadDetails() {
  const params = useParams()
  const nav = useNavigate()
  const location = useLocation()
  const { enqueueSnackbar } = useSnackbarManager()

  const leadId = params.leadId || params.id
  const campaignId = params.campaignId
  const activeUserId = params.userId || params.user_id

  const {
    data: leadData,
    isLoading: leadLoading,
    refetch: refetchLead,
  } = useMarketingLead(campaignId, leadId)

  const lead =
    leadData?.lead || leadData?.data?.lead || (leadData?.id ? leadData : null)
  const campaign = lead?.campaign
  const form = lead?.marketing_form
  const effectiveCampaignId = campaignId || campaign?.id

  const formId = form?.id
  const hasEmbeddedFields =
    getFormFields(lead?.form_schema).length > 0 ||
    getFormFields(form?.definition).length > 0

  const { data: fetchedFormData } = useMarketingForm(
    !hasEmbeddedFields && formId ? formId : null
  )
  const fetchedForm = fetchedFormData?.marketing_form || fetchedFormData

  const formSchema = useMemo(() => {
    return (
      lead?.form_schema ||
      form?.definition ||
      fetchedForm?.definition ||
      form ||
      fetchedForm
    )
  }, [lead?.form_schema, form, fetchedForm])

  const activeTab = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (last === 'activities') return 'activities'
    return 'details'
  }, [location.pathname])

  const handleTabClick = (item: { id: string | number; label: string }) => {
    if (activeUserId && effectiveCampaignId && leadId) {
      nav(
        `/users/marketing/${activeUserId}/campaigns/${effectiveCampaignId}/leads/${leadId}/${item.id}`
      )
    } else if (effectiveCampaignId && leadId) {
      nav(
        `/marketing/campaigns/${effectiveCampaignId}/leads/${leadId}/${item.id}`
      )
    } else if (leadId) {
      nav(`/marketing/leads/${leadId}/${item.id}`)
    }
  }

  const [activityModal, setActivityModal] = useState<boolean>(false)
  const [activityLoader, setActivityLoader] = useState<boolean>(false)
  const activityMethods = useForm({
    mode: 'onChange',
    defaultValues: {
      activity_type_label: 'Contacted',
      activity_type: 'contacted',
      notes: '',
    },
  })

  const activityFormFields: any[] = useMemo(
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
        placeholder: 'Enter notes',
      },
    ],
    []
  )

  const openActivityModal = () => {
    activityMethods.reset({
      activity_type_label: 'Contacted',
      activity_type: 'contacted',
      notes: '',
    })
    setActivityModal(true)
  }

  const handleSaveActivity = async () => {
    const valid = await activityMethods.trigger()
    const values: any = activityMethods.getValues()
    const actType = values.activity_type || 'contacted'

    if (!valid) {
      enqueueSnackbar('Complete required activity fields', { variant: 'error' })
      return
    }

    try {
      setActivityLoader(true)
      await createLeadActivity({
        campaignId: effectiveCampaignId,
        id: leadId,
        data: {
          activity_type: actType,
          notes: values.notes || '',
        },
      })
      enqueueSnackbar('Activity added successfully', { variant: 'success' })
      setActivityModal(false)
      refetchLead()
    } catch (e: any) {
      enqueueSnackbar(getApiErrorMessage(e, 'Unable to add activity'), {
        variant: 'error',
      })
    } finally {
      setActivityLoader(false)
    }
  }

  const [assigning, setAssigning] = useState<any>(null)
  const [assigningLoader, setAssigningLoader] = useState(false)
  const [selectedSalesId, setSelectedSalesId] = useState<
    string | number | null
  >(null)
  const [salesPage, setSalesPage] = useState(1)
  const [salesSearch, setSalesSearch] = useState('')
  const salesPageSize = 4
  const { data: team } = useQuery(['sales_team'], getSalesTeam)

  const allSalesUsers = team?.users || []
  const salesUsers = allSalesUsers.filter((u: any) => {
    if (!salesSearch) return true
    const q = salesSearch.toLowerCase()
    return (
      String(u.name || '')
        .toLowerCase()
        .includes(q) ||
      String(u.email || '')
        .toLowerCase()
        .includes(q)
    )
  })
  const totalSalesPages = Math.max(
    1,
    Math.ceil(salesUsers.length / salesPageSize)
  )
  const paginatedSalesUsers = salesUsers.slice(
    (salesPage - 1) * salesPageSize,
    salesPage * salesPageSize
  )

  const handleAssign = async () => {
    if (!selectedSalesId || !assigning) {
      enqueueSnackbar('Select a sales team member', { variant: 'error' })
      return
    }
    try {
      setAssigningLoader(true)
      await assignMarketingLead({
        campaignId: effectiveCampaignId,
        id: assigning.id,
        assigned_to_id: selectedSalesId,
      })
      enqueueSnackbar('Lead assigned successfully', { variant: 'success' })
      setAssigning(null)
      setSelectedSalesId(null)
      refetchLead()
    } catch (e: any) {
      enqueueSnackbar(getApiErrorMessage(e, 'Unable to assign lead'), {
        variant: 'error',
      })
    } finally {
      setAssigningLoader(false)
    }
  }

  const copyPublicLink = async () => {
    if (!campaign?.public_url) return
    try {
      await navigator.clipboard.writeText(campaign.public_url)
      enqueueSnackbar('Public link copied', { variant: 'success' })
    } catch {
      enqueueSnackbar('Failed to copy link', { variant: 'error' })
    }
  }

  const parsedNotesInfo = useMemo(() => parseNotes(lead?.notes), [lead?.notes])

  const goBack = () => {
    if (activeUserId && effectiveCampaignId) {
      nav(
        `/users/marketing/${activeUserId}/campaigns/${effectiveCampaignId}/leads`
      )
    } else if (effectiveCampaignId) {
      nav(`/marketing/campaigns/${effectiveCampaignId}/leads`)
    } else {
      nav(-1)
    }
  }

  return (
    <div className="p-4">
      {/* Header Card */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={goBack}
                className="p-1 rounded-lg hover:bg-gray-100 transition text-gray-600"
                aria-label="Back"
              >
                <Icons name="left-arrow-icon" />
              </button>

              <h1 className="text-xl font-bold text-gray-900">
                {leadLoading
                  ? 'Loading Lead...'
                  : `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim() ||
                    `Lead #${leadId}`}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3 ml-7 text-xs">
              {lead?.status && (
                <div
                  className={`px-2.5 py-1 rounded-full font-medium ${statusColor(lead.status)}`}
                >
                  Status: {displayStatus(lead.status)}
                </div>
              )}

              {lead?.source && (
                <div className="px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-200 capitalize">
                  Source: {String(lead.source).replace(/_/g, ' ')}
                </div>
              )}

              <div className="px-2.5 py-1 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200">
                Assigned: {lead?.assigned_to?.name || 'Unassigned'}
              </div>

              {campaign?.name && (
                <div className="px-2.5 py-1 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Campaign: {campaign.name}
                </div>
              )}
            </div>
          </div>

          {!leadLoading && lead && (
            <div className="flex items-center gap-2">
              <Button
                label="Assign"
                icon="external-link"
                onClick={() => {
                  setSelectedSalesId(lead.assigned_to?.id || null)
                  setSalesSearch('')
                  setSalesPage(1)
                  setAssigning(lead)
                }}
              />
            </div>
          )}
        </div>
      </div>

      {leadLoading && (
        <div className="p-6">
          <InfoBox content="Loading lead details..." />
        </div>
      )}

      {!leadLoading && !lead && (
        <div className="p-6">
          <InfoBox content="Lead not found." />
        </div>
      )}

      {!leadLoading && lead && (
        <TabContainer
          data={[
            { id: 'details', label: 'Details' },
            { id: 'activities', label: 'Activities' },
          ]}
          activeTab={activeTab}
          onClick={handleTabClick}
        >
          <Tab id="details">
            <div className="flex flex-col gap-6">
              {/* Basic Information Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <Icons name="profile" />
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <DetailItem label="First Name" value={lead.first_name} />
                  <DetailItem label="Last Name" value={lead.last_name} />
                  <DetailItem label="Email" value={lead.email} />
                  <DetailItem label="Phone" value={lead.phone} />
                  <DetailItem
                    label="Status"
                    value={
                      <span
                        className={`px-2 py-0.5 rounded text-xs inline-block font-medium ${statusColor(lead.status)}`}
                      >
                        {displayStatus(lead.status)}
                      </span>
                    }
                  />
                  <DetailItem
                    label="Source"
                    value={
                      <span className="capitalize">
                        {String(lead.source || '--').replace(/_/g, ' ')}
                      </span>
                    }
                  />
                  <DetailItem
                    label="Assigned To"
                    value={lead.assigned_to?.name || 'Unassigned'}
                  />
                  <DetailItem
                    label="Last Contacted At"
                    value={formatDateTime(lead.last_contacted_at)}
                  />
                  <DetailItem
                    label="Created At"
                    value={formatDateTime(lead.created_at)}
                  />
                </div>
              </div>

              {/* Form Responses / Notes Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <Icons name="edit" />
                  Form Submissions & Notes
                </h2>

                {parsedNotesInfo.isJson && parsedNotesInfo.data ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(parsedNotesInfo.data).map(([k, v]) => {
                      const field = findFieldDefinition(k, formSchema, form)
                      const label = formatFieldKey(k, formSchema, form)
                      let valDisplay: any = '--'
                      if (Array.isArray(v)) {
                        valDisplay = (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {v.map((item: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded font-medium border border-gray-200"
                              >
                                {formatFieldValue(item, field)}
                              </span>
                            ))}
                          </div>
                        )
                      } else if (typeof v === 'object' && v !== null) {
                        valDisplay = JSON.stringify(v)
                      } else {
                        valDisplay = formatFieldValue(v, field)
                      }
                      return (
                        <DetailItem key={k} label={label} value={valDisplay} />
                      )
                    })}
                  </div>
                ) : parsedNotesInfo.text ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                    {parsedNotesInfo.text}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic p-2">
                    No additional notes or submission data provided.
                  </div>
                )}
              </div>

              {/* Campaign & Marketing Form Details Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <Icons name="leads" />
                  Campaign & Marketing Form
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <DetailItem
                    label="Campaign Name"
                    value={
                      campaign?.id ? (
                        <Link
                          to={
                            activeUserId
                              ? `/users/marketing/${activeUserId}/campaigns/${campaign.id}/details`
                              : `/marketing/campaigns/${campaign.id}/details`
                          }
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          {campaign.name}
                          <Icons name="external-link" />
                        </Link>
                      ) : (
                        campaign?.name || '--'
                      )
                    }
                  />
                  <DetailItem
                    label="Campaign Description"
                    value={campaign?.description}
                  />
                  <DetailItem
                    label="Campaign Status"
                    value={
                      campaign?.status ? (
                        <span className="capitalize">{campaign.status}</span>
                      ) : (
                        '--'
                      )
                    }
                  />
                  <DetailItem label="Marketing Form Name" value={form?.name} />
                  <DetailItem
                    label="Form Description"
                    value={form?.description}
                  />
                  <DetailItem
                    label="Form Status"
                    value={
                      form?.status ? (
                        <span className="capitalize">{form.status}</span>
                      ) : (
                        '--'
                      )
                    }
                  />
                </div>

                {campaign?.public_url && (
                  <div className="mt-4 border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Public Campaign Form URL
                      </div>
                      <div className="text-xs font-mono text-gray-700 break-all mt-0.5">
                        {campaign.public_url}
                      </div>
                    </div>
                    <button
                      onClick={copyPublicLink}
                      // className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg shadow-md shadow-blue-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      <Icons name="external-link" />
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Tab>

          <Tab id="activities">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Icons name="eye" />
                  Activity History
                </h2>
                <Button
                  label="Add Activity"
                  icon="plus"
                  onClick={openActivityModal}
                  className="hidden"
                />
              </div>

              {!lead.activities || lead.activities.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  No activity recorded for this lead yet.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
                  {lead.activities.map((act: any) => (
                    <div key={act.id} className="relative group">
                      {/* Timeline Node Icon */}
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-xs" />

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition group-hover:border-gray-300">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900 capitalize">
                              {String(act.activity_type || 'activity').replace(
                                /_/g,
                                ' '
                              )}
                            </span>
                            {act.created_by && (
                              <span className="text-xs text-gray-500">
                                by {act.created_by?.name || act.created_by}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(act.occurred_at || act.created_at)}
                          </span>
                        </div>

                        {act.notes && (
                          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-gray-100">
                            {act.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Tab>
        </TabContainer>
      )}

      {/* Add Tracking Activity Modal */}
      <DialogModal
        isOpen={activityModal}
        onClose={() => setActivityModal(false)}
        title="Add tracking activity"
        actionLabel="Save activity"
        actionLoader={activityLoader}
        onSubmit={handleSaveActivity}
        secondaryAction={() => setActivityModal(false)}
        secondaryActionLabel="Cancel"
        className="max-w-lg w-full"
        body={
          <FormProvider {...activityMethods}>
            <div className="w-full space-y-4 min-h-[220px] pb-16">
              <FormBuilder data={activityFormFields} edit />
            </div>
          </FormProvider>
        }
      />

      <DialogModal
        isOpen={Boolean(assigning)}
        onClose={() => setAssigning(null)}
        title="Assign to sales"
        actionLabel="Assign"
        actionLoader={assigningLoader}
        onSubmit={handleAssign}
        secondaryAction={() => setAssigning(null)}
        secondaryActionLabel="Cancel"
        className="max-w-xl w-full"
        body={
          <div className="space-y-5">
            <div className="rounded-lg bg-purple-50 border border-purple-100 px-4 py-3 flex items-center gap-3">
              <Icons name="external-link" className="text-[#0fc8cd] shrink-0" />
              <p className="text-sm text-[#0fc8cd]">
                Assign this lead to a sales team member for follow-up.
              </p>
            </div>
            <div className="relative">
              <Icons
                name="search"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={salesSearch}
                onChange={(e) => {
                  setSalesSearch(e.target.value)
                  setSalesPage(1)
                }}
                placeholder="Search by name or email..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
              />
            </div>
            {salesUsers.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Icons name="profile" className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  No sales members found
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {allSalesUsers.length === 0
                    ? 'Add team members to assign leads.'
                    : 'Try a different search term.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {paginatedSalesUsers.map((user: any) => {
                  const isSelected = String(selectedSalesId) === String(user.id)
                  const initials = (user.name || '?')
                    .split(' ')
                    .map((w: string) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedSalesId(user.id)}
                      className={
                        'group relative text-left rounded-xl border-2 p-4 transition-all duration-200 ' +
                        (isSelected
                          ? 'border-purple-500 bg-purple-50 shadow-sm ring-1 ring-purple-500/20'
                          : 'border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/30 hover:shadow-sm')
                      }
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0fc8cd]">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 14 14"
                              fill="none"
                            >
                              <path
                                d="M3 7.5l3 3 5-6"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 shrink-0 rounded-full text-sm font-semibold text-white transition-colors overflow-hidden"
                          style={{
                            backgroundColor: isSelected
                              ? '#0fc8cd'
                              : '#0fc8cd99',
                          }}
                        >
                          {user.thumbnail_url ? (
                            <img
                              src={user.thumbnail_url}
                              alt={user.name || ''}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="flex items-center justify-center w-full h-full">
                              {initials}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-sm text-gray-900 truncate">
                              {user.name || 'Unnamed'}
                            </div>
                            {user.phone && (
                              <span className="text-xs text-gray-400 shrink-0">
                                {user.phone}
                              </span>
                            )}
                          </div>
                          {user.email && (
                            <div className="text-xs text-gray-400 truncate mt-0.5">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            {totalSalesPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-xs font-medium text-gray-400">
                  Page {salesPage} of {totalSalesPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={salesPage === 1}
                    onClick={() => setSalesPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={salesPage === totalSalesPages}
                    onClick={() => setSalesPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />
    </div>
  )
}
