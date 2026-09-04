import moment from 'moment'
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
import CustomDrawer from '../../components/common/drawer'
import SearchInput from '../../components/common/inputs/SearchInput'
import DatePicker from '../../components/common/inputs/DatePicker'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import {
  useMarketingCampaign,
  useCampaignLeads,
  useMarketingForms,
  useMarketingForm,
  updateMarketingCampaign,
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

const activityOptions = [
  { id: 'contacted', name: 'Contacted' },
  { id: 'qualified', name: 'Qualified' },
  { id: 'note', name: 'Note' },
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

const displayLeadStatus = (value?: string) => {
  const normalized = String(value || 'new_lead').toLowerCase()
  return (
    leadStatusOptions.find((option) => option.id === normalized)?.name ||
    normalized
      .replace(/_/g, ' ')
      .replace(/^./, (letter) => letter.toUpperCase())
  )
}

const leadStatusColor = (value?: string) => {
  switch (String(value || '').toLowerCase()) {
    case 'new_lead':
    case 'contacted':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'qualified':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'converted':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'lost':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

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

const escapeHtml = (value: any) =>
  String(value ?? '').replace(
    /[&<>\"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '\"': '&quot;',
        "'": '&#039;',
      })[character] || character
  )

const formPreviewHtml = (form: any) => {
  const definition = form?.definition || {}
  const theme = definition.theme || {}
  const fields = (definition.fields || [])
    .map((field: any) => {
      const label = `<label>${escapeHtml(field.label)}${field.required ? ' <b>*</b>' : ''}</label>`
      if (field.type === 'textarea')
        return `<div class="field">${label}<textarea placeholder="${escapeHtml(field.placeholder)}" disabled></textarea></div>`
      if (field.type === 'select')
        return `<div class="field">${label}<select disabled><option>${escapeHtml(field.placeholder || 'Select an option')}</option>${(field.options || []).map((option: string) => `<option>${escapeHtml(option)}</option>`).join('')}</select></div>`
      if (field.type === 'checkbox')
        return `<div class="field">${label}<div>${(field.options || [field.placeholder || field.label]).map((option: string) => `<div class="check"><input type="checkbox" disabled> ${escapeHtml(option)}</div>`).join('')}</div></div>`
      return `<div class="field">${label}<input type="${field.type === 'phone' ? 'tel' : escapeHtml(field.type || 'text')}" placeholder="${escapeHtml(field.placeholder)}" disabled></div>`
    })
    .join('')
  const image = definition.header?.image_url
    ? `<img class="hero" src="${definition.header.image_url}" alt="">`
    : ''
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:${theme.page_background || '#eef2f1'};font-family:Arial,sans-serif;color:#374151}.page{min-height:1123px;background:${theme.background || '#fff'};overflow:hidden}.hero{width:100%;height:170px;object-fit:cover}.content{padding:48px}.title{color:${theme.accent || '#176b5b'};font-size:30px;font-weight:700}.subtitle{margin:12px 0 28px;color:#6b7280}.fields{display:${definition.layout === 'two' ? 'grid' : 'block'};grid-template-columns:1fr 1fr;gap:18px}.field{margin-bottom:18px}label{display:block;margin-bottom:8px;font-size:13px;font-weight:600}label b{color:#ef4444}input,textarea,select{width:100%;border:1px solid #d1d5db;border-radius:8px;padding:12px;background:#f9fafb;font-size:13px;cursor:not-allowed}input:disabled,textarea:disabled,select:disabled{opacity:0.7}textarea{min-height:82px}.check{margin:8px 0;font-size:13px}.check input{width:auto}.submit{margin-top:40px;width:100%;border:0;border-radius:8px;padding:13px;color:#fff;background:${theme.accent || '#176b5b'};font-weight:600}.footer{margin-top:22px;text-align:center;color:#9ca3af;font-size:11px}</style></head><body><div class="page">${image}<div class="content"><div class="title">${escapeHtml(definition.header?.title || form.name)}</div><div class="subtitle">${escapeHtml(definition.header?.subtitle || form.description)}</div><div class="fields">${fields}</div><button class="submit" disabled>Submit enquiry</button><div class="footer">${escapeHtml(definition.footer?.text || '')}</div></div></div></body></html>`
}

export default function CampaignDetails() {
  const { id, userId, user_id } = useParams()
  const activeUserId = userId || user_id
  const nav = useNavigate()
  const location = useLocation()
  const { enqueueSnackbar } = useSnackbarManager()

  const {
    data: campaignData,
    isLoading: campaignLoading,
    refetch: refetchCampaign,
  } = useMarketingCampaign(id, activeUserId)
  const campaign = campaignData?.marketing_campaign

  const activeTab = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (last === 'leads') return 'leads'
    return 'details'
  }, [location.pathname])

  useEffect(() => {
    const basePath = activeUserId
      ? `/users/marketing/${activeUserId}/campaigns/${id}`
      : `/marketing/campaigns/${id}`
    if (location.pathname === basePath) {
      nav(`${basePath}/details`, { replace: true })
    }
  }, [location.pathname, id, activeUserId, nav])

  const [leadsParams, setLeadsParams] = useState({
    page: 1,
    per_page: 100,
    search: '',
    status: '',
  })
  const {
    data: leadsData,
    isFetching: leadsFetching,
    refetch: refetchLeads,
  } = useCampaignLeads(id, leadsParams, activeUserId)
  const [editing, setEditing] = useState<any>(null)
  const [savingLead, setSavingLead] = useState(false)
  const [activity, setActivity] = useState<any>(null)
  const [assigning, setAssigning] = useState<any>(null)
  const [selectedLeadIds, setSelectedLeadIds] = useState<
    Array<string | number>
  >([])
  const [selectedSalesId, setSelectedSalesId] = useState<
    string | number | null
  >(null)
  const [salesPage, setSalesPage] = useState(1)
  const salesPageSize = 6
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
          maxLength: 25,
        },
        {
          name: 'last_name',
          label: 'Last name',
          type: 'text',
          placeholder: 'Enter last name',
          maxLength: 25,
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
          maxLength: 10,
          digitsOnly: true,
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

      const isPhone = fieldType === 'phone' || fieldKey === 'phone'
      const isName = fieldKey === 'first_name' || fieldKey === 'last_name'
      const isNumber = fieldType === 'number'
      const base = {
        name: fieldKey,
        label: field.label || fieldKey,
        type: fieldType === 'textarea' ? 'textarea' : 'text',
        required: Boolean(field.required),
        placeholder: field.placeholder || `Enter ${field.label || fieldKey}`,
      }
      if (isPhone) return { ...base, maxLength: 10, digitsOnly: true }
      if (isName) return { ...base, maxLength: 25 }
      if (isNumber)
        return { ...base, maxLength: field.maxLength || 15, digitsOnly: true }
      return base
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
  const openAssignModal = (rowsToAssign: any | any[]) => {
    const selectedRows = Array.isArray(rowsToAssign)
      ? rowsToAssign
      : [rowsToAssign]
    setAssigning(selectedRows)
    const currentSalesId =
      selectedRows.length === 1 ? selectedRows[0]?.assigned_to?.id : null
    setSelectedSalesId(currentSalesId ? String(currentSalesId) : null)
    setSalesPage(1)
  }

  const salesUsers = team?.users || []
  const totalSalesPages = Math.max(
    1,
    Math.ceil(salesUsers.length / salesPageSize)
  )
  const paginatedSalesUsers = salesUsers.slice(
    (salesPage - 1) * salesPageSize,
    salesPage * salesPageSize
  )

  const handleAssign = async () => {
    if (!selectedSalesId || !assigning?.length) {
      enqueueSnackbar('Select a sales team member', { variant: 'error' })
      return
    }
    try {
      setAssigningLoader(true)
      await Promise.all(
        assigning.map((lead: any) =>
          assignMarketingLead({
            campaignId: id,
            id: lead.id,
            assigned_to_id: selectedSalesId,
          })
        )
      )
      enqueueSnackbar(
        assigning.length === 1
          ? 'Lead assigned successfully'
          : assigning.length + ' leads assigned successfully',
        { variant: 'success' }
      )
      setAssigning(null)
      setSelectedLeadIds([])
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

  const rows = leadsData?.leads || leadsData?.marketing_leads || []
  const selectedLeads = rows.filter((row: any) =>
    selectedLeadIds.includes(row.id)
  )
  const columns: any[] = [
    {
      title: (
        <input
          type="checkbox"
          aria-label="Select all leads"
          checked={
            rows.length > 0 &&
            rows.every((row: any) => selectedLeadIds.includes(row.id))
          }
          ref={(element) => {
            if (element) {
              const selectedVisibleCount = rows.filter((row: any) =>
                selectedLeadIds.includes(row.id)
              ).length
              element.indeterminate =
                selectedVisibleCount > 0 && selectedVisibleCount < rows.length
            }
          }}
          onChange={(event) => {
            const visibleIds = rows.map((row: any) => row.id)
            setSelectedLeadIds((current) =>
              event.target.checked
                ? Array.from(new Set([...current, ...visibleIds]))
                : current.filter((leadId) => !visibleIds.includes(leadId))
            )
          }}
        />
      ),
      field: 'selection',
      colWidth: '56px',
      align: 'center',
      customCell: true,
      renderCell: (row: any) => ({
        cell: (
          <input
            type="checkbox"
            aria-label={'Select ' + (row.first_name || 'lead')}
            checked={selectedLeadIds.includes(row.id)}
            onChange={() =>
              setSelectedLeadIds((current) =>
                current.includes(row.id)
                  ? current.filter((leadId) => leadId !== row.id)
                  : [...current, row.id]
              )
            }
          />
        ),
      }),
      sortable: false,
      isVisible: true,
    },
    {
      title: 'Name',
      field: 'first_name',
      renderCell: (r: any) => {
        const basePath = activeUserId
          ? `/users/marketing/${activeUserId}/campaigns/${id}`
          : `/marketing/campaigns/${id}`
        return {
          cell: (
            <button
              onClick={() => nav(`${basePath}/leads/${r.id}`)}
              className="text-blue-600 hover:underline text-left"
            >
              {r.first_name + ' ' + (r.last_name || '')}
            </button>
          ),
          toolTip: r.first_name,
        }
      },
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
          <span
            className={
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ' +
              leadStatusColor(r.status)
            }
          >
            {displayLeadStatus(r.status)}
          </span>
        ),
        toolTip: displayLeadStatus(r.status),
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
        cell: r.assigned_to?.name
          ? r.assigned_to.name.charAt(0).toUpperCase() +
            r.assigned_to.name.slice(1)
          : 'Unassigned',
        toolTip: r.assigned_to?.name
          ? r.assigned_to.name.charAt(0).toUpperCase() +
            r.assigned_to.name.slice(1)
          : 'Unassigned',
      }),
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
    },
  ]

  const handleTabClick = (item: { id: string | number; label: string }) => {
    const basePath = activeUserId
      ? `/users/marketing/${activeUserId}/campaigns/${id}`
      : `/marketing/campaigns/${id}`
    nav(`${basePath}/${item.id}`)
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

  const [editingCampaign, setEditingCampaign] = useState<any>(null)
  const [selectedForm, setSelectedForm] = useState<any>(null)
  const [formDrawerOpen, setFormDrawerOpen] = useState(false)
  const [formParams, setFormParams] = useState({
    page: 1,
    per_page: 4,
    search: '',
    status: 'active',
  })
  const [campaignDateRange, setCampaignDateRange] = useState<any[]>([
    null,
    null,
  ])
  const [savingCampaign, setSavingCampaign] = useState(false)
  const { data: formsData, isFetching: formsFetching } =
    useMarketingForms(formParams)
  const forms = useMemo(() => formsData?.marketing_forms || [], [formsData])

  const { data: selectedFormData } = useMarketingForm(selectedForm?.id)
  const formForPreview = useMemo(
    () => selectedFormData?.marketing_form || selectedForm,
    [selectedFormData, selectedForm]
  )

  const campaignStatusOptions = [
    { id: 'draft', name: 'Draft' },
    { id: 'active', name: 'Active' },
    { id: 'inactive', name: 'Inactive' },
  ]

  const campaignFormFields: any[] = useMemo(
    () => [
      {
        name: 'name',
        label: 'Campaign name',
        type: 'text',
        required: true,
        placeholder: 'e.g. New year wellness campaign',
        maxLength: 100,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Describe the purpose of this campaign',
        maxLength: 500,
      },
      {
        name: 'status',
        id: 'status_value',
        label: 'Status',
        type: 'custom_select',
        desc: 'name',
        descId: 'id',
        data: campaignStatusOptions,
        required: true,
        placeholder: 'Select status',
      },
    ],
    []
  )

  const campaignMethods = useForm({
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      status: 'Draft',
      status_value: 'draft',
      starts_on: '',
      ends_on: '',
    },
  })

  const dateValue = (value: any) =>
    value ? new Date(value + 'T00:00:00') : null
  const dateString = (value: any) =>
    value instanceof Date && !Number.isNaN(value.getTime())
      ? value.toISOString().slice(0, 10)
      : ''

  const openEditCampaign = () => {
    if (!campaign) return
    const form = campaign.marketing_form || campaign.form || null
    const values = {
      name: campaign.name || '',
      description: campaign.description || '',
      status: displayStatus(campaign.status),
      status_value: String(campaign.status || 'draft').toLowerCase(),
      starts_on: campaign.starts_on || '',
      ends_on: campaign.ends_on || '',
    }
    setEditingCampaign(campaign)
    setSelectedForm(form || null)
    setCampaignDateRange([
      dateValue(values.starts_on),
      dateValue(values.ends_on),
    ])
    campaignMethods.reset(values)
  }

  const closeEditCampaign = () => {
    setEditingCampaign(null)
    setSelectedForm(null)
    setCampaignDateRange([null, null])
    campaignMethods.reset({
      name: '',
      description: '',
      status: 'Draft',
      status_value: 'draft',
      starts_on: '',
      ends_on: '',
    })
  }

  const handleCampaignDateRange = ({ value }: any) => {
    const range = Array.isArray(value) ? value : [value, null]
    setCampaignDateRange(range)
    campaignMethods.setValue('starts_on', dateString(range[0]), {
      shouldValidate: true,
    })
    campaignMethods.setValue('ends_on', dateString(range[1]), {
      shouldValidate: true,
    })
  }

  const saveCampaign = async () => {
    const valid = await campaignMethods.trigger()
    const values: any = campaignMethods.getValues()
    const rawName = String(values.name || '').trim()

    if (!rawName) {
      campaignMethods.setError('name', {
        type: 'manual',
        message: 'Campaign name is required',
      })
    }

    if (!valid || !rawName || !selectedForm?.id) {
      enqueueSnackbar(
        !rawName
          ? 'Campaign name is required'
          : !selectedForm?.id
            ? 'Attach a form before saving'
            : 'Complete the required campaign fields',
        { variant: 'error' }
      )
      return
    }
    if (
      values.starts_on &&
      values.ends_on &&
      values.ends_on < values.starts_on
    ) {
      enqueueSnackbar('End date must be on or after the start date', {
        variant: 'error',
      })
      return
    }
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
    try {
      setSavingCampaign(true)
      const payload = {
        name: formattedName,
        description: values.description,
        status:
          values.status_value || String(values.status || 'draft').toLowerCase(),
        starts_on: values.starts_on || null,
        ends_on: values.ends_on || null,
        marketing_form_id: selectedForm.id,
      }
      await updateMarketingCampaign({ id: editingCampaign.id, data: payload })
      enqueueSnackbar('Campaign updated successfully', { variant: 'success' })
      closeEditCampaign()
      refetchCampaign()
    } catch (error: any) {
      enqueueSnackbar(getApiErrorMessage(error, 'Unable to save campaign'), {
        variant: 'error',
      })
    } finally {
      setSavingCampaign(false)
    }
  }

  const attachCampaignForm = () => {
    if (!selectedForm?.id) {
      enqueueSnackbar('Select a form to attach', { variant: 'error' })
      return
    }
    setFormDrawerOpen(false)
    enqueueSnackbar('Form attached', { variant: 'success' })
  }

  return (
    <div className="p-4">
      {/* Header card */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => {
                  if (activeUserId) {
                    nav(`/users/marketing/${activeUserId}/campaigns`)
                  } else {
                    nav('/marketing/campaigns')
                  }
                }}
                className="rounded-lg hover:bg-gray-100 transition"
                aria-label="Back"
              >
                <Icons name="left-arrow-icon" />
              </button>

              <h1 className="text-xl font-semibold text-gray-900">
                {campaignLoading ? 'Loading...' : campaign?.name || 'Campaign'}
              </h1>
            </div>
            {campaign && !campaignLoading && (
              <Button
                label="Edit campaign"
                icon="edit"
                className="bg-primaryGreen"
                onClick={openEditCampaign}
              />
            )}
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

            {(campaign?.marketing_form?.name || campaign?.form?.name) && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700">
                <span className="font-medium">Form:</span>
                <span>
                  {campaign.marketing_form?.name || campaign.form?.name}
                </span>
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
                  {moment(campaign.starts_on).format('DD-MM-YYYY')}
                  {campaign.ends_on
                    ? ` – ${moment(campaign.ends_on).format('DD-MM-YYYY')}`
                    : ''}
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
                  value={
                    campaign.marketing_form?.name || campaign.form?.name || '--'
                  }
                />
                <DetailItem
                  label="Total Leads"
                  value={campaign.leads_count ?? 0}
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
                  <div className="text-sm text-gray-700 break-all font-mono">
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
              columnWidths={{ selection: '56px' }}
              search
              searchPlaceholder="Search leads"
              searchValue={leadsParams.search}
              toolbarExtra={
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600">Status</label>
                  <select
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-0 focus:border-gray-200 w-40"
                    value={leadsParams.status}
                    onChange={(event) =>
                      setLeadsParams({
                        ...leadsParams,
                        status: event.target.value,
                        page: 1,
                      })
                    }
                  >
                    <option value="">All statuses</option>
                    {leadStatusOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              }
              onSearchChange={(value: string) =>
                setLeadsParams({ ...leadsParams, search: value, page: 1 })
              }
              createButton={
                <div className="flex items-center gap-2">
                  {selectedLeadIds.length > 0 && (
                    <Button
                      label={
                        'Assign ' +
                        selectedLeadIds.length +
                        ' lead' +
                        (selectedLeadIds.length === 1 ? '' : 's')
                      }
                      icon="external-link"
                      onClick={() => openAssignModal(selectedLeads)}
                    />
                  )}
                  <Button label="Add lead" icon="plus" onClick={openAddLead} />
                </div>
              }
              isLoading={leadsFetching}
              height={calcWindowHeight(rows.length ? 310 : 330)}
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
                {
                  title: 'View',
                  toolTip: 'View lead details',
                  icon: <Icons name="eye" />,
                  action: (row: any) => {
                    const basePath = activeUserId
                      ? `/users/marketing/${activeUserId}/campaigns/${id}`
                      : `/marketing/campaigns/${id}`
                    nav(`${basePath}/leads/${row.id}`)
                  },
                },
                {
                  title: 'Assign',
                  toolTip: 'Assign lead to sales member',
                  icon: <Icons name="external-link" />,
                  action: (row: any) => openAssignModal(row),
                },
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
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select a sales team member for {assigning?.length || 0} selected
              lead{assigning?.length === 1 ? '' : 's'}.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paginatedSalesUsers.map((user: any) => {
                const isSelected = String(selectedSalesId) === String(user.id)
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedSalesId(user.id)}
                    className={
                      isSelected
                        ? 'text-left rounded-xl border p-4 transition border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                        : 'text-left rounded-xl border p-4 transition border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                    }
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        checked={isSelected}
                        readOnly
                        aria-label={
                          'Select ' +
                          (user.name || user.email || 'sales member')
                        }
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {user.name || 'Unnamed sales member'}
                        </div>
                        {user.email && (
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            {salesUsers.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">
                No sales members available.
              </div>
            )}
            {totalSalesPages > 1 && (
              <div className="flex items-center justify-between border-t pt-3 text-sm">
                <span className="text-gray-500">
                  Page {salesPage} of {totalSalesPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
                    disabled={salesPage === 1}
                    onClick={() => setSalesPage((page) => page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
                    disabled={salesPage === totalSalesPages}
                    onClick={() => setSalesPage((page) => page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
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

      <DialogModal
        isOpen={Boolean(editingCampaign)}
        onClose={closeEditCampaign}
        title={editingCampaign?.id ? 'Edit campaign' : 'Create campaign'}
        actionLabel="Save"
        actionLoader={savingCampaign}
        onSubmit={saveCampaign}
        secondaryAction={closeEditCampaign}
        secondaryActionLabel="Cancel"
        small={false}
        body={
          <FormProvider {...campaignMethods}>
            <FormBuilder data={campaignFormFields} edit spacing />
            <div className="mt-5 w-full rounded-xl border bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-primaryText">
                    Form <span className="text-red-500">*</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose the form that will collect campaign leads.
                  </p>
                </div>
                <Button
                  label={selectedForm ? 'Change form' : 'Add form'}
                  icon="plus"
                  outlined
                  onClick={() => {
                    setFormParams({ ...formParams, page: 1, search: '' })
                    setFormDrawerOpen(true)
                  }}
                />
              </div>
              {selectedForm ? (
                <div className="mt-4 rounded-lg border bg-white p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedForm.name}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {selectedForm.status}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-red-600"
                    onClick={() => setSelectedForm(null)}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>
            <div className="mt-5 grid grid-cols-6 gap-4">
              <div className="col-span-6">
                <DatePicker
                  label="Campaign date range"
                  name="campaign_date_range"
                  selectRange
                  value={campaignDateRange}
                  onChange={handleCampaignDateRange}
                  placeholder="Select start and end dates"
                  fromPopup
                />
              </div>
            </div>
          </FormProvider>
        }
      />

      <CustomDrawer
        open={formDrawerOpen}
        handleClose={() => setFormDrawerOpen(false)}
        title="Attach form"
        className="w-screen max-w-[100vw]"
        handleSubmit={attachCampaignForm}
        actionLabel="Attach form"
        accentHeader
        zIndex={1500}
      >
        <div className="flex h-full min-w-0 flex-col gap-5 bg-gray-50 p-5 xl:flex-row">
          <div className="w-full shrink-0 xl:w-[360px]">
            <div className="mb-3">
              <h3 className="font-semibold text-primaryText">Forms</h3>
              <p className="text-xs text-gray-500">
                Search and select a form to attach.
              </p>
            </div>
            <SearchInput
              placeholder="Search forms"
              searchValue={formParams.search}
              handleChange={(search) =>
                setFormParams({ ...formParams, search, page: 1 })
              }
              handleSearch={(search) =>
                setFormParams({ ...formParams, search: search || '', page: 1 })
              }
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {formsFetching ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  Loading forms...
                </div>
              ) : (
                forms.map((form: any) => (
                  <button
                    type="button"
                    key={form.id}
                    onClick={() => setSelectedForm(form)}
                    className={
                      'text-left rounded-xl border overflow-hidden bg-white transition ' +
                      (selectedForm?.id === form.id
                        ? 'ring-2 border-primaryGreen'
                        : 'hover:border-primaryGreen')
                    }
                  >
                    <div className="h-20 bg-gray-100 overflow-hidden">
                      {form.definition?.header?.image_url ? (
                        <img
                          src={form.definition.header.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-gray-400">
                          Form preview
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-primaryText">
                        {form.name}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {form.description ||
                          form.definition?.header?.subtitle ||
                          'Lead capture form'}
                      </p>
                      <span className="inline-block mt-2 text-xs capitalize rounded-full px-2 py-1 bg-gray-100 text-gray-600">
                        {displayStatus(form.status)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
            {!formsFetching && !forms.length && (
              <div className="p-8 text-center text-sm text-gray-500">
                No forms found.
              </div>
            )}
            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <button
                type="button"
                className="text-sm text-gray-600 disabled:opacity-40"
                disabled={(formsData?.meta?.current_page || 1) <= 1}
                onClick={() =>
                  setFormParams({
                    ...formParams,
                    page: (formsData?.meta?.current_page || 1) - 1,
                  })
                }
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {formsData?.meta?.current_page || 1} of{' '}
                {formsData?.meta?.total_pages || 1}
              </span>
              <button
                type="button"
                className="text-sm text-gray-600 disabled:opacity-40"
                disabled={
                  (formsData?.meta?.current_page || 1) >=
                  (formsData?.meta?.total_pages || 1)
                }
                onClick={() =>
                  setFormParams({
                    ...formParams,
                    page: (formsData?.meta?.current_page || 1) + 1,
                  })
                }
              >
                Next
              </button>
            </div>
          </div>
          <div className="min-w-0 flex-1 overflow-auto rounded-xl border bg-gray-200 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primaryText">
                  A4 form preview
                </h3>
                <p className="text-xs text-gray-500">
                  This is how the selected form will appear to leads.
                </p>
              </div>
              {selectedForm && (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  Selected: {selectedForm.name}
                </span>
              )}
            </div>
            {selectedForm ? (
              <iframe
                title={selectedForm?.name || 'Form preview'}
                srcDoc={formPreviewHtml(formForPreview)}
                className="mx-auto h-[1123px] w-[794px] max-w-none rounded-sm border-0 bg-white shadow-xl"
              />
            ) : (
              <div className="flex min-h-[600px] items-center justify-center text-sm text-gray-500">
                Select a form to preview it.
              </div>
            )}
          </div>
        </div>
      </CustomDrawer>
    </div>
  )
}
