import { useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import FormBuilder from '../../components/app/formBuilder'
import { DialogModal } from '../../components/common'
import CustomDrawer from '../../components/common/drawer'
import ListingHeader from '../../components/common/ListingTiles'
import SmartTable from '../../components/common/table/SmartTable'
import Icons from '../../components/common/icons'
import DatePicker from '../../components/common/inputs/DatePicker'
import Button from '../../components/common/buttons/Button'
import SearchInput from '../../components/common/inputs/SearchInput'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { useSnackbarManager } from '../../components/common/snackbar'
import {
  useMarketingCampaigns,
  useMarketingForms,
  createMarketingCampaign,
  updateMarketingCampaign,
  deleteMarketingCampaign,
  getCampaignPublicLink,
} from './api'

const statusOptions = [
  { id: 'draft', name: 'Draft' },
  { id: 'active', name: 'Active' },
  { id: 'inactive', name: 'Inactive' },
]
const emptyCampaign = () => ({
  name: '',
  description: '',
  status: 'Draft',
  status_value: 'draft',
  starts_on: '',
  ends_on: '',
})
const dateValue = (value: any) => (value ? new Date(value + 'T00:00:00') : null)
const dateString = (value: any) =>
  value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toISOString().slice(0, 10)
    : ''
const displayStatus = (value: any) =>
  String(value || 'draft')
    .replace(/_/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
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
        return `<div class=\"field\">${label}<textarea placeholder=\"${escapeHtml(field.placeholder)}\"></textarea></div>`
      if (field.type === 'select')
        return `<div class=\"field\">${label}<select><option>${escapeHtml(field.placeholder || 'Select an option')}</option>${(field.options || []).map((option: string) => `<option>${escapeHtml(option)}</option>`).join('')}</select></div>`
      if (field.type === 'checkbox')
        return `<div class=\"field\">${label}<div>${(field.options || [field.placeholder || field.label]).map((option: string) => `<div class=\"check\"><input type=\"checkbox\" disabled> ${escapeHtml(option)}</div>`).join('')}</div></div>`
      return `<div class=\"field\">${label}<input type=\"${field.type === 'phone' ? 'tel' : escapeHtml(field.type || 'text')}\" placeholder=\"${escapeHtml(field.placeholder)}\"></div>`
    })
    .join('')
  const image = definition.header?.image_url
    ? `<img class=\"hero\" src=\"${definition.header.image_url}\" alt=\"\">`
    : ''
  return `<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><style>*{box-sizing:border-box}body{margin:0;background:${theme.page_background || '#eef2f1'};font-family:Arial,sans-serif;color:#374151}.page{min-height:1123px;background:${theme.background || '#fff'};overflow:hidden}.hero{width:100%;height:170px;object-fit:cover}.content{padding:48px}.title{color:${theme.accent || '#176b5b'};font-size:30px;font-weight:700}.subtitle{margin:12px 0 28px;color:#6b7280}.fields{display:${definition.layout === 'two' ? 'grid' : 'block'};grid-template-columns:1fr 1fr;gap:18px}.field{margin-bottom:18px}label{display:block;margin-bottom:8px;font-size:13px;font-weight:600}label b{color:#ef4444}input,textarea,select{width:100%;border:1px solid #d1d5db;border-radius:8px;padding:12px;background:#fff;font-size:13px}textarea{min-height:82px}.check{margin:8px 0;font-size:13px}.check input{width:auto}.submit{margin-top:40px;width:100%;border:0;border-radius:8px;padding:13px;color:#fff;background:${theme.accent || '#176b5b'};font-weight:600}.footer{margin-top:22px;text-align:center;color:#9ca3af;font-size:11px}</style></head><body><div class=\"page\">${image}<div class=\"content\"><div class=\"title\">${escapeHtml(definition.header?.title || form.name)}</div><div class=\"subtitle\">${escapeHtml(definition.header?.subtitle || form.description)}</div><div class=\"fields\">${fields}</div><button class=\"submit\">Submit enquiry</button><div class=\"footer\">${escapeHtml(definition.footer?.text || '')}</div></div></div></body></html>`
}

export default function Campaigns() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const [params, setParams] = useState({ page: 1, per_page: 20, search: '' })
  const [editing, setEditing] = useState<any>(null)
  const [selectedForm, setSelectedForm] = useState<any>(null)
  const [formDrawerOpen, setFormDrawerOpen] = useState(false)
  const [formParams, setFormParams] = useState({
    page: 1,
    per_page: 6,
    search: '',
  })
  const [dateRange, setDateRange] = useState<any[]>([null, null])
  const [saving, setSaving] = useState(false)
  const { data, isFetching, refetch } = useMarketingCampaigns(params)
  const { data: formsData, isFetching: formsFetching } =
    useMarketingForms(formParams)
  const forms = useMemo(() => formsData?.marketing_forms || [], [formsData])
  const methods = useForm({ mode: 'onChange', defaultValues: emptyCampaign() })

  const formFields: any[] = useMemo(
    () => [
      {
        name: 'name',
        label: 'Campaign name',
        type: 'text',
        required: true,
        placeholder: 'e.g. New year wellness campaign',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Describe the purpose of this campaign',
      },
      {
        name: 'status',
        id: 'status_value',
        label: 'Status',
        type: 'custom_select',
        desc: 'name',
        descId: 'id',
        data: statusOptions,
        required: true,
        placeholder: 'Select status',
      },
    ],
    []
  )

  const open = (row?: any) => {
    const form = row?.marketing_form ? row.marketing_form : null
    const values = row
      ? {
          name: row.name || '',
          description: row.description || '',
          status: displayStatus(row.status),
          status_value: String(row.status || 'draft').toLowerCase(),
          starts_on: row.starts_on || '',
          ends_on: row.ends_on || '',
        }
      : emptyCampaign()
    setEditing(row || values)
    setSelectedForm(form || null)
    setDateRange([dateValue(values.starts_on), dateValue(values.ends_on)])
    methods.reset(values)
  }
  const close = () => {
    setEditing(null)
    setSelectedForm(null)
    setDateRange([null, null])
    methods.reset(emptyCampaign())
  }
  const handleDateRange = ({ value }: any) => {
    const range = Array.isArray(value) ? value : [value, null]
    setDateRange(range)
    methods.setValue('starts_on', dateString(range[0]), {
      shouldValidate: true,
    })
    methods.setValue('ends_on', dateString(range[1]), { shouldValidate: true })
  }
  const save = async () => {
    const valid = await methods.trigger()
    if (!valid || !selectedForm?.id) {
      enqueueSnackbar(
        !selectedForm?.id
          ? 'Attach a form before saving'
          : 'Complete the required campaign fields',
        { variant: 'error' }
      )
      return
    }
    const values: any = methods.getValues()
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
    try {
      setSaving(true)
      const payload = {
        name: values.name,
        description: values.description,
        status:
          values.status_value || String(values.status || 'draft').toLowerCase(),
        starts_on: values.starts_on || null,
        ends_on: values.ends_on || null,
        marketing_form_id: selectedForm.id,
      }
      if (editing?.id)
        await updateMarketingCampaign({ id: editing.id, data: payload })
      else await createMarketingCampaign(payload)
      enqueueSnackbar(
        editing?.id
          ? 'Campaign updated successfully'
          : 'Campaign created successfully',
        { variant: 'success' }
      )
      close()
      refetch()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Unable to save campaign', {
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }
  const attachForm = () => {
    if (!selectedForm?.id) {
      enqueueSnackbar('Select a form to attach', { variant: 'error' })
      return
    }
    setFormDrawerOpen(false)
    enqueueSnackbar('Form attached', { variant: 'success' })
  }
  const renderFormPreview = (form: any) => (
    <iframe
      title={form?.name || 'Form preview'}
      srcDoc={formPreviewHtml(form)}
      className="mx-auto h-[1123px] w-[794px] max-w-none rounded-sm border-0 bg-white shadow-xl"
    />
  )

  const copyLink = async (row: any) => {
    try {
      const result = await getCampaignPublicLink(row.id)
      const publicToken = result.public_token || row.public_token
      const publicUrl = new URL(
        `/public/campaigns/${publicToken}`,
        window.location.origin
      ).toString()
      await navigator.clipboard.writeText(publicUrl)
      enqueueSnackbar('Public link copied', { variant: 'success' })
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Unable to copy public link', {
        variant: 'error',
      })
    }
  }
  const rows = data?.marketing_campaigns || []
  const columns: any[] = useMemo(
    () => [
      {
        title: 'Name',
        field: 'name',
        renderCell: (row: any) => ({
          cell: (
            <button
              className="text-blue-600 hover:underline"
              onClick={() => navigate('/marketing/campaigns/' + row.id)}
            >
              {row.name}
            </button>
          ),
          toolTip: row.name,
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Form',
        field: 'marketing_form.name',
        renderCell: (row: any) => ({
          cell: row.marketing_form?.name || '-',
          toolTip: row.marketing_form?.name || '',
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Status',
        field: 'status',
        renderCell: (row: any) => ({
          cell: <span>{displayStatus(row.status)}</span>,
          toolTip: displayStatus(row.status),
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Leads',
        field: 'leads_count',
        renderCell: (row: any) => ({
          cell: row.leads_count || 0,
          toolTip: String(row.leads_count || 0),
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Date range',
        field: 'starts_on',
        renderCell: (row: any) => ({
          cell:
            row.starts_on && row.ends_on
              ? `${row.starts_on} – ${row.ends_on}`
              : 'No dates',
          toolTip:
            row.starts_on && row.ends_on
              ? `${row.starts_on} – ${row.ends_on}`
              : 'No dates',
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
    ],
    [navigate]
  )

  return (
    <div>
      <ListingHeader
        data={{ title: 'Campaigns', icon: 'customer-icon' }}
        onActionClick={() => open()}
        actionProps={{ actionTitle: 'Create campaign' }}
        checkPermission
      />
      <div className="p-4">
        <SmartTable
          data={rows}
          dataRowKey="id"
          columns={columns}
          search
          searchPlaceholder="Search campaigns"
          searchValue={params.search}
          onSearchChange={(value) =>
            setParams({ ...params, search: value, page: 1 })
          }
          isLoading={isFetching}
          height={
            rows.length === 0 ? calcWindowHeight(218) : calcWindowHeight(150)
          }
          emptyTitle="No records to display"
          pagination
          paginationProps={{
            onPagination: (page) => setParams({ ...params, page }),
            total: data?.meta?.total_count || 0,
            currentPage: data?.meta?.current_page || 1,
            rowsPerPage: params.per_page,
            onRowsPerPage: (per_page) =>
              setParams({ ...params, per_page: Number(per_page), page: 1 }),
            totalPages: data?.meta?.total_pages || 1,
            dropOptions: [10, 20, 30, 50, 100],
          }}
          columnToggle
          externalActions
          actionProps={[
            {
              title: 'View',
              toolTip: 'View campaign',
              icon: <Icons name="eye" />,
              action: (row: any) => navigate('/marketing/campaigns/' + row.id),
            },
            {
              title: 'Copy link',
              toolTip: 'Copy public link',
              icon: <Icons name="external-link" />,
              action: copyLink,
            },
            {
              title: 'Edit',
              toolTip: 'Edit',
              icon: <Icons name="edit" />,
              action: open,
            },
            {
              title: 'Delete',
              toolTip: 'Delete',
              icon: <Icons name="delete" />,
              variant: 'danger',
              action: async (row: any) => {
                if (window.confirm('Delete campaign?')) {
                  await deleteMarketingCampaign(row.id)
                  enqueueSnackbar('Campaign deleted successfully', {
                    variant: 'success',
                  })
                  refetch()
                }
              },
            },
          ]}
        />
      </div>
      <DialogModal
        isOpen={Boolean(editing)}
        onClose={close}
        title={editing?.id ? 'Edit campaign' : 'Create campaign'}
        actionLabel="Save"
        actionLoader={saving}
        onSubmit={save}
        secondaryAction={close}
        secondaryActionLabel="Cancel"
        small={false}
        body={
          <FormProvider {...methods}>
            <FormBuilder data={formFields} edit spacing />
            <div className="mt-5 w-full rounded-xl border bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-primaryText">Form</div>
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
              ) : (
                <p className="mt-4 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                  A form is required.
                </p>
              )}
            </div>
            <div className="mt-5 grid grid-cols-6 gap-4">
              <div className="col-span-6">
                <DatePicker
                  label="Campaign date range"
                  name="campaign_date_range"
                  selectRange
                  value={dateRange}
                  onChange={handleDateRange}
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
        handleSubmit={attachForm}
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
              renderFormPreview(selectedForm)
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
