import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Button from '../../components/common/buttons/Button'
import SmartTable from '../../components/common/table/SmartTable'
import Tab from '../../components/common/tab/Tab'
import { DialogModal, TabContainer } from '../../components/common'
import FormBuilder from '../../components/app/formBuilder'
import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import {
  useMarketingCampaign,
  useCampaignLeads,
  createMarketingLead,
  updateMarketingLead,
  getSalesTeam,
  assignMarketingLead,
  createLeadActivity,
} from './api'

const leadStatusOptions = [
  { id: 'new_lead', name: 'New Lead' },
  { id: 'contacted', name: 'Contacted' },
  { id: 'qualified', name: 'Qualified' },
  { id: 'converted', name: 'Converted' },
  { id: 'lost', name: 'Lost' },
]

const emptyLead = () => ({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  status: 'New Lead',
  status_value: 'new_lead',
  notes: '',
})

// const displayLeadStatus = (val?: string) => {
//   const match = leadStatusOptions.find(
//     (o) =>
//       o.id === val || o.name.toLowerCase() === String(val || '').toLowerCase()
//   )
//   if (match) return match.name
//   return String(val || 'new_lead')
//     .replace(/_/g, ' ')
//     .replace(/^./, (letter) => letter.toUpperCase())
// }

const getCampaignFormFields = (campaign: any) => {
  if (!campaign) return []
  const rawForm = campaign.form || campaign.marketing_form
  if (!rawForm) return []

  let definition = rawForm
  if (typeof rawForm.definition === 'string') {
    try {
      definition = JSON.parse(rawForm.definition)
    } catch {
      definition = {}
    }
  } else if (rawForm.definition) {
    definition = rawForm.definition
  }

  const fields = definition.fields || rawForm.fields || []
  return Array.isArray(fields) ? fields : []
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">{value || '--'}</div>
    </div>
  )
}

function formatDate(d: any) {
  if (!d) return '--'
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return String(d)
  }
}

function displayStatus(value: any) {
  return String(value || 'draft')
    .replace(/_/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function statusColor(value: any) {
  const s = String(value || '').toLowerCase()
  if (s === 'active') return 'bg-green-50 text-green-700'
  if (s === 'draft') return 'bg-yellow-50 text-yellow-700'
  if (s === 'inactive') return 'bg-gray-100 text-gray-600'
  return 'bg-gray-100 text-gray-600'
}

export default function CampaignDetails() {
  const { id } = useParams()
  const nav = useNavigate()
  const location = useLocation()
  const { enqueueSnackbar } = useSnackbarManager()

  const { data: campaignData, isLoading: campaignLoading } =
    useMarketingCampaign(id)
  const campaign = campaignData?.marketing_campaign

  const activeTab = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (last === 'leads') return 'leads'
    return 'details'
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname === `/marketing/campaigns/${id}`) {
      nav(`/marketing/campaigns/${id}/details`, { replace: true })
    }
  }, [location.pathname, id, nav])

  const [leadsParams, setLeadsParams] = useState({
    page: 1,
    per_page: 100,
    search: '',
  })
  const {
    data: leadsData,
    isFetching: leadsFetching,
    refetch: refetchLeads,
  } = useCampaignLeads(id, leadsParams)
  const [editing, setEditing] = useState<any>(null)
  const [savingLead, setSavingLead] = useState(false)
  const [activity, setActivity] = useState<any>(null)
  const [assigning, setAssigning] = useState<any>(null)
  const { data: team } = useQuery(['sales_team'], getSalesTeam)

  const methods = useForm({ mode: 'onChange', defaultValues: emptyLead() })

  const dynamicFormFields = useMemo(() => {
    const rawFields = getCampaignFormFields(campaign)
    if (!rawFields.length) {
      return [
        {
          name: 'first_name',
          label: 'First name',
          type: 'text',
          required: true,
          placeholder: 'Enter first name',
        },
        {
          name: 'last_name',
          label: 'Last name',
          type: 'text',
          placeholder: 'Enter last name',
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          placeholder: 'Enter email',
        },
        {
          name: 'phone',
          label: 'Phone number',
          type: 'text',
          placeholder: 'Enter phone number',
        },
      ]
    }

    return rawFields.map((field: any) => {
      const fieldKey = field.key || field.name || field.id
      const rawType = String(field.type || 'text').toLowerCase()
      const fieldType = rawType === 'phone' ? 'text' : rawType

      if (
        fieldType === 'select' ||
        fieldType === 'custom_select' ||
        fieldType === 'dropdown'
      ) {
        const optionsData = (field.options || []).map((opt: any) => {
          if (typeof opt === 'object' && opt !== null) {
            return {
              id: String(opt.id || opt.value || opt.name),
              name: String(opt.name || opt.label || opt.value),
            }
          }
          return { id: String(opt), name: String(opt) }
        })

        return {
          name: `${fieldKey}_label`,
          id: fieldKey,
          label: field.label || fieldKey,
          type: 'custom_select',
          desc: 'name',
          descId: 'id',
          data: optionsData,
          required: Boolean(field.required),
          placeholder: field.placeholder || `Select ${field.label || fieldKey}`,
        }
      }

      return {
        name: fieldKey,
        label: field.label || fieldKey,
        type: fieldType === 'textarea' ? 'textarea' : 'text',
        required: Boolean(field.required),
        placeholder: field.placeholder || `Enter ${field.label || fieldKey}`,
      }
    })
  }, [campaign])

  const leadFormFields: any[] = useMemo(() => {
    const fields = [...dynamicFormFields]

    const hasStatus = fields.some(
      (f: any) =>
        f.name === 'status' || f.id === 'status' || f.id === 'status_value'
    )
    if (!hasStatus) {
      fields.push({
        name: 'status',
        id: 'status_value',
        label: 'Status',
        type: 'custom_select',
        desc: 'name',
        descId: 'id',
        data: leadStatusOptions,
        required: true,
        placeholder: 'Select status',
      })
    }

    const hasNotes = fields.some(
      (f: any) => f.name === 'notes' || f.id === 'notes'
    )
    if (!hasNotes) {
      fields.push({
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Enter notes',
      })
    }

    return fields
  }, [dynamicFormFields])

  // const openLead = (row?: any) => {
  //   const defaultValues: any = {
  //     status: 'New Lead',
  //     status_value: 'new_lead',
  //     notes: '',
  //   }

  //   leadFormFields.forEach((f: any) => {
  //     const key = f.id || f.name
  //     if (key && !(key in defaultValues)) {
  //       defaultValues[key] = ''
  //     }
  //   })

  //   if (row) {
  //     Object.keys(row).forEach((k) => {
  //       if (k === 'status') {
  //         defaultValues.status = displayLeadStatus(row.status)
  //         defaultValues.status_value = String(
  //           row.status || 'new_lead'
  //         ).toLowerCase()
  //       } else {
  //         defaultValues[k] = row[k] ?? ''
  //       }
  //     })
  //   }

  //   setEditing(row || defaultValues)
  //   methods.reset(defaultValues)
  // }

  const closeLead = () => {
    setEditing(null)
    methods.reset(emptyLead())
  }

  const saveLead = async () => {
    const valid = await methods.trigger()
    const values: any = methods.getValues()

    let missingRequired = false
    leadFormFields.forEach((f: any) => {
      if (f.required) {
        const val = values[f.id || f.name]
        if (!val || String(val).trim() === '') {
          missingRequired = true
          methods.setError(f.name, {
            type: 'manual',
            message: `${f.label || 'This field'} is required`,
          })
        }
      }
    })

    if (!valid || missingRequired) {
      enqueueSnackbar('Complete all required lead fields', {
        variant: 'error',
      })
      return
    }

    const capitalize = (val: any) => {
      if (typeof val !== 'string' || !val.trim()) return val
      const trimmed = val.trim()
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
    }

    try {
      setSavingLead(true)
      const payload: any = { ...values }

      Object.keys(payload).forEach((k) => {
        const lower = k.toLowerCase()
        if (
          (lower.includes('name') ||
            lower.includes('first') ||
            lower.includes('last')) &&
          typeof payload[k] === 'string' &&
          payload[k].trim()
        ) {
          payload[k] = capitalize(payload[k])
        }
      })

      payload.status =
        values.status_value || String(values.status || 'new_lead').toLowerCase()

      leadFormFields.forEach((f: any) => {
        if (f.type === 'custom_select' && f.id) {
          payload[f.id] = values[f.id] || values[f.name]
        }
      })

      if (editing?.id) {
        await updateMarketingLead({
          campaignId: id,
          id: editing.id,
          data: payload,
        })
      } else {
        await createMarketingLead({ campaignId: id, data: payload })
      }

      enqueueSnackbar(
        editing?.id ? 'Lead updated successfully' : 'Lead created successfully',
        { variant: 'success' }
      )
      closeLead()
      refetchLeads()
    } catch (e: any) {
      enqueueSnackbar(getApiErrorMessage(e, 'Unable to save lead'), {
        variant: 'error',
      })
    } finally {
      setSavingLead(false)
    }
  }

  const [assigningLoader, setAssigningLoader] = useState(false)
  const assignMethods = useForm({
    mode: 'onChange',
    defaultValues: { sales_user: '', assigned_to_id: '' },
  })

  const assignFormFields: any[] = useMemo(
    () => [
      {
        name: 'sales_user',
        id: 'assigned_to_id',
        label: 'Sales team member',
        type: 'custom_select',
        desc: 'name',
        descId: 'id',
        data: team?.users || [],
        required: true,
        placeholder: 'Select team member',
      },
    ],
    [team?.users]
  )

  const openAssignModal = (row: any) => {
    setAssigning(row)
    const userMatch = (team?.users || []).find(
      (u: any) => String(u.id) === String(row?.assigned_to?.id)
    )
    assignMethods.reset({
      sales_user: userMatch ? userMatch.name : '',
      assigned_to_id: userMatch ? String(userMatch.id) : '',
    })
  }

  const handleAssign = async () => {
    const valid = await assignMethods.trigger()
    const values: any = assignMethods.getValues()
    const targetId = values.assigned_to_id || values.sales_user

    if (!valid || !targetId) {
      enqueueSnackbar('Select a sales team member', { variant: 'error' })
      return
    }
    try {
      setAssigningLoader(true)
      await assignMarketingLead({
        campaignId: id,
        id: assigning.id,
        assigned_to_id: targetId,
      })
      enqueueSnackbar('Lead assigned successfully', { variant: 'success' })
      setAssigning(null)
      refetchLeads()
    } catch (e: any) {
      enqueueSnackbar(getApiErrorMessage(e, 'Unable to assign lead'), {
        variant: 'error',
      })
    } finally {
      setAssigningLoader(false)
    }
  }

  const [activityLoader, setActivityLoader] = useState(false)
  const activityMethods = useForm({
    mode: 'onChange',
    defaultValues: {
      activity_type_label: 'Contacted',
      activity_type: 'contacted',
      notes: '',
    },
  })

  const activityOptions = [
    { id: 'contacted', name: 'Contacted' },
    { id: 'qualified', name: 'Qualified' },
    { id: 'note', name: 'Note' },
    { id: 'converted', name: 'Converted' },
    { id: 'lost', name: 'Lost' },
  ]

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

  // const openActivityModal = (row: any) => {
  //   setActivity(row)
  //   activityMethods.reset({
  //     activity_type_label: 'Contacted',
  //     activity_type: 'contacted',
  //     notes: '',
  //   })
  // }

  const handleSaveActivity = async () => {
    const valid = await activityMethods.trigger()
    const values: any = activityMethods.getValues()
    const actType = values.activity_type || 'contacted'

    if (!valid) {
      enqueueSnackbar('Complete the required activity fields', {
        variant: 'error',
      })
      return
    }

    try {
      setActivityLoader(true)
      await createLeadActivity({
        campaignId: id,
        id: activity.id,
        data: {
          activity_type: actType,
          notes: values.notes || '',
        },
      })
      enqueueSnackbar('Activity added successfully', { variant: 'success' })
      setActivity(null)
      refetchLeads()
    } catch (e: any) {
      enqueueSnackbar(getApiErrorMessage(e, 'Unable to add activity'), {
        variant: 'error',
      })
    } finally {
      setActivityLoader(false)
    }
  }

  const rows = leadsData?.leads || []
  const columns: any[] = [
    {
      title: 'Name',
      field: 'first_name',
      renderCell: (r: any) => ({
        cell: r.first_name + ' ' + (r.last_name || ''),
        toolTip: r.first_name,
      }),
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Contact',
      field: 'email',
      renderCell: (r: any) => ({
        cell: r.email || r.phone || '',
        toolTip: r.email || r.phone || '',
      }),
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Status',
      field: 'status',
      renderCell: (r: any) => ({
        cell: (
          <span className="capitalize">
            {String(r.status).replace('_', ' ')}
          </span>
        ),
        toolTip: r.status,
      }),
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Assigned to',
      field: 'assigned_to.name',
      renderCell: (r: any) => ({
        cell: r.assigned_to?.name || 'Unassigned',
        toolTip: r.assigned_to?.name || 'Unassigned',
      }),
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
    },
  ]

  const handleTabClick = (item: { id: string | number; label: string }) => {
    nav(`/marketing/campaigns/${id}/${item.id}`)
  }

  const copyLink = async () => {
    if (!campaign) return
    try {
      const publicUrl = new URL(
        `/public/campaigns/${campaign.public_token}`,
        window.location.origin
      ).toString()
      await navigator.clipboard.writeText(publicUrl)
      enqueueSnackbar('Public link copied', { variant: 'success' })
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Unable to copy link', {
        variant: 'error',
      })
    }
  }

  const [showAddLeadModal, setShowAddLeadModal] = useState(false)

  const openAddLead = () => {
    if (campaign?.public_token || campaign?.public_url) {
      setShowAddLeadModal(true)
    } else {
      enqueueSnackbar('Public form link is not available for this campaign', {
        variant: 'error',
      })
    }
  }

  return (
    <div className="p-4">
      {/* Header card */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div>
          <div className="flex items-center">
            <button
              onClick={() => nav('/marketing/campaigns')}
              className="rounded-lg hover:bg-gray-100 transition"
              aria-label="Back"
            >
              <Icons name="left-arrow-icon" />
            </button>

            <h1 className="text-xl font-semibold text-gray-900">
              {campaignLoading ? 'Loading...' : campaign?.name || 'Campaign'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm ml-3">
            {campaign?.status && (
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-lg ${statusColor(campaign.status)}`}
              >
                <span className="font-medium">Status:</span>
                <span>{displayStatus(campaign.status)}</span>
              </div>
            )}

            {campaign?.marketing_form?.name && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700">
                <span className="font-medium">Form:</span>
                <span>{campaign.marketing_form.name}</span>
              </div>
            )}

            {campaign?.leads_count !== undefined && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-50 text-purple-700">
                <span className="font-medium">Leads:</span>
                <span>{campaign.leads_count}</span>
              </div>
            )}

            {campaign?.starts_on && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 text-gray-700">
                <span className="font-medium">Dates:</span>
                <span>
                  {campaign.starts_on}
                  {campaign.ends_on ? ` – ${campaign.ends_on}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {campaignLoading && (
        <div className="p-6">
          <InfoBox content="Loading campaign details..." />
        </div>
      )}

      {!campaignLoading && !campaign && (
        <div className="p-6">
          <InfoBox content="Campaign not found." />
        </div>
      )}

      {!campaignLoading && campaign && (
        <TabContainer
          data={[
            { id: 'details', label: 'Details' },
            { id: 'leads', label: 'Leads' },
          ]}
          activeTab={activeTab}
          onClick={handleTabClick}
        >
          <Tab id="details">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem label="Name" value={campaign.name} />
                <DetailItem label="Description" value={campaign.description} />
                <DetailItem
                  label="Status"
                  value={
                    <span className="capitalize">
                      {displayStatus(campaign.status)}
                    </span>
                  }
                />
                <DetailItem
                  label="Form"
                  value={campaign.marketing_form?.name || '--'}
                />
                <DetailItem
                  label="Total Leads"
                  value={campaign.leads_count || 0}
                />
                <DetailItem
                  label="Start Date"
                  value={formatDate(campaign.starts_on)}
                />
                <DetailItem
                  label="End Date"
                  value={formatDate(campaign.ends_on)}
                />
                <DetailItem
                  label="Created At"
                  value={formatDate(campaign.created_at)}
                />
              </div>
              {campaign.public_url && (
                <div className="border rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">Public Link</span>
                    <button
                      onClick={copyLink}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <Icons name="external-link" />
                      Copy link
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 break-all">
                    {campaign.public_url}
                  </div>
                </div>
              )}
            </div>
          </Tab>
          <Tab id="leads">
            <SmartTable
              data={rows}
              dataRowKey="id"
              columns={columns}
              search
              searchPlaceholder="Search leads"
              searchValue={leadsParams.search}
              onSearchChange={(value: string) =>
                setLeadsParams({ ...leadsParams, search: value, page: 1 })
              }
              createButton={
                <Button label="Add lead" icon="plus" onClick={openAddLead} />
              }
              isLoading={leadsFetching}
              height={calcWindowHeight(rows.length ? 200 : 218)}
              emptyTitle="No leads to display"
              pagination
              paginationProps={{
                onPagination: (page: number) =>
                  setLeadsParams({ ...leadsParams, page }),
                total: leadsData?.meta?.total_count || rows.length,
                currentPage: leadsData?.meta?.current_page || 1,
                rowsPerPage: leadsParams.per_page,
                onRowsPerPage: (per_page: string | number) =>
                  setLeadsParams({
                    ...leadsParams,
                    per_page: Number(per_page),
                    page: 1,
                  }),
                totalPages: leadsData?.meta?.total_pages || 1,
                dropOptions: [10, 20, 50, 100],
              }}
              externalActions
              actionProps={[
                /* {
                  title: 'Edit',
                  toolTip: 'Edit lead',
                  icon: <Icons name="edit" />,
                  action: (row: any) => openLead(row),
                }, */
                {
                  title: 'Assign',
                  toolTip: 'Assign lead to sales member',
                  icon: <Icons name="external-link" />,
                  action: (row: any) => openAssignModal(row),
                },
                /* {
                  title: 'Track',
                  toolTip: 'Add tracking activity',
                  icon: <Icons name="eye" />,
                  action: (row: any) => openActivityModal(row),
                }, */
              ]}
            />
          </Tab>
        </TabContainer>
      )}

      <DialogModal
        isOpen={Boolean(editing)}
        onClose={closeLead}
        title={editing?.id ? 'Edit lead' : 'Add lead'}
        actionLabel="Save"
        actionLoader={savingLead}
        onSubmit={saveLead}
        secondaryAction={closeLead}
        secondaryActionLabel="Cancel"
        small={false}
        body={
          <FormProvider {...methods}>
            <FormBuilder data={leadFormFields} edit spacing />
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
        className="max-w-lg w-full"
        body={
          <FormProvider {...assignMethods}>
            <div className="w-full space-y-4 min-h-[220px] pb-24">
              <FormBuilder data={assignFormFields} edit />
            </div>
          </FormProvider>
        }
      />

      <DialogModal
        isOpen={Boolean(activity)}
        onClose={() => setActivity(null)}
        title="Add tracking activity"
        actionLabel="Save activity"
        actionLoader={activityLoader}
        onSubmit={handleSaveActivity}
        secondaryAction={() => setActivity(null)}
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
        isOpen={showAddLeadModal}
        onClose={() => {
          setShowAddLeadModal(false)
          refetchLeads()
        }}
        small={false}
        className="max-w-4xl w-full"
        body={
          campaign?.public_token ? (
            <iframe
              src={`/public/campaigns/${campaign.public_token}`}
              className="w-full h-[700px] border-0"
              title="Add lead form"
            />
          ) : campaign?.public_url ? (
            <iframe
              src={campaign.public_url}
              className="w-full h-[700px] border-0"
              title="Add lead form"
            />
          ) : (
            <div className="flex h-40 items-center justify-center p-6 text-gray-500">
              Public form is not available for this campaign.
            </div>
          )
        }
      />
    </div>
  )
}
