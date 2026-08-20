import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Icons from '../../components/common/icons'
import Tab from '../../components/common/tab/Tab'
import { TabContainer } from '../../components/common'
import Button from '../../components/common/buttons/Button'
import TextField from '../../components/common/inputs/TextField'
import TextArea from '../../components/common/inputs/TextArea'
import Checkbox from '../../components/common/inputs/Checkbox'
import { AutoComplete } from 'qbs-core'
import { useMarketingForm } from './api'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-600',
}

const cap = (val?: string) =>
  val ? val.charAt(0).toUpperCase() + val.slice(1) : val || '--'

const fieldLabel = (type: string) => {
  const map: Record<string, string> = {
    text: 'Short text',
    textarea: 'Long text',
    email: 'Email',
    phone: 'Phone',
    number: 'Number',
    date: 'Date',
    select: 'Dropdown',
    checkbox: 'Checkbox',
  }
  return map[type] || 'Field'
}

function PreviewField({ field }: { field: any }) {
  if (field.type === 'textarea')
    return (
      <TextArea
        id={'preview-' + field.key}
        name={'preview_' + field.key}
        label=""
        placeholder={field.placeholder}
        rows={3}
        disabled
        value=""
        onChange={() => undefined}
      />
    )
  if (field.type === 'select')
    return (
      <AutoComplete
        name={'preview_' + field.key}
        type="custom_select"
        desc="name"
        descId="id"
        data={(field.options || []).map((option: string) => ({
          id: option,
          name: option,
        }))}
        value=""
        placeholder={field.placeholder || 'Select an option'}
        onChange={() => undefined}
        disabled
      />
    )
  if (field.type === 'checkbox')
    return (
      <div className="space-y-2">
        {(field.options || [field.placeholder || field.label]).map(
          (option: string, oi: number) => (
            <Checkbox
              key={oi}
              id={'preview-' + field.key + '-' + oi}
              name={'preview_' + field.key + '-' + oi}
              checked={false}
              disabled
              label={option}
            />
          )
        )}
      </div>
    )
  return (
    <TextField
      id={'preview-' + field.key}
      name={'preview_' + field.key}
      label=""
      type={field.type === 'phone' ? 'tel' : field.type}
      placeholder={field.placeholder}
      disabled
      value=""
      onChange={() => undefined}
    />
  )
}

function FormPreview({ definition }: { definition: any }) {
  const fields = definition?.fields || []
  const accent = definition?.theme?.accent || '#176b5b'
  const layout = definition?.layout || 'single'

  return (
    <div
      className="flex-1 overflow-auto rounded-xl border p-5"
      style={{
        backgroundColor: definition?.theme?.page_background || '#eef2f1',
      }}
    >
      <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-sm border bg-white">
        {definition?.header?.image_url && (
          <img
            src={definition.header.image_url}
            className="w-full h-36 object-cover"
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        <div className="p-6">
          <h1 className="text-2xl font-semibold" style={{ color: accent }}>
            {definition?.header?.title
              ? definition.header.title.charAt(0).toUpperCase() +
                definition.header.title.slice(1)
              : ''}
          </h1>
          <p className="text-gray-600 mt-2 mb-6">
            {definition?.header?.subtitle
              ? definition.header.subtitle.charAt(0).toUpperCase() +
                definition.header.subtitle.slice(1)
              : ''}
          </p>
          <div
            className={
              layout === 'two' ? 'grid grid-cols-2 gap-3' : 'space-y-1'
            }
          >
            {fields.length === 0 && (
              <div className="col-span-2 border-2 border-dashed rounded-xl p-10 text-center text-sm text-gray-500">
                No fields in this form
              </div>
            )}
            {fields.map((field: any, index: number) => (
              <div
                key={field.key || index}
                className="rounded-xl border p-3 mb-3 bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wide text-gray-400">
                    {fieldLabel(field.type)}
                  </span>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>
                <PreviewField field={field} />
                {field.helpText && (
                  <span className="text-xs text-gray-500 mt-1 block">
                    {field.helpText}
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            className="w-full rounded-lg py-3 mt-3 text-white font-medium"
            style={{ backgroundColor: accent }}
          >
            Submit enquiry
          </button>
          <p className="text-xs text-gray-500 text-center mt-4">
            {definition?.footer?.text}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FormDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useMarketingForm(id)
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details')

  const form = data?.marketing_form || data
  const definition = form?.definition
  const fields = definition?.fields || []

  if (isLoading) return <div className="p-6">Loading form details...</div>
  if (!form) return <div className="p-6 text-gray-500">Form not found.</div>

  const statusClass = statusColors[form.status] || 'bg-gray-100 text-gray-600'

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/marketing/forms')}
            aria-label="Back"
          >
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">
            Form Details -{' '}
            {form.name
              ? form.name.charAt(0).toUpperCase() + form.name.slice(1)
              : form.name}
          </h1>
        </div>
        <Button
          label="Edit form"
          icon="edit"
          className="bg-primaryGreen"
          onClick={() => navigate('/marketing/forms/' + id + '/edit')}
        />
      </div>
      <TabContainer
        data={[
          { id: 'details', label: 'Details' },
          { id: 'preview', label: 'Preview' },
        ]}
        activeTab={activeTab}
        onClick={(item: any) =>
          setActiveTab(item.id === 'details' ? 'details' : 'preview')
        }
      >
        <Tab id="details">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="border rounded-lg p-3 bg-white">
              <div className="text-xs text-gray-500 mb-1">Form Name</div>
              <div className="text-sm">{form.name || '--'}</div>
            </div>
            <div className="border rounded-lg p-3 bg-white">
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <div className="text-sm">
                <span
                  className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusClass}`}
                >
                  {form.status}
                </span>
              </div>
            </div>
            <div className="border rounded-lg p-3 bg-white">
              <div className="text-xs text-gray-500 mb-1">Fields</div>
              <div className="text-sm">{fields.length}</div>
            </div>
            <div className="border rounded-lg p-3 bg-white">
              <div className="text-xs text-gray-500 mb-1">Layout</div>
              <div className="text-sm capitalize">
                {definition?.layout || 'Single'}
              </div>
            </div>
            <div className="border rounded-lg p-3 bg-white md:col-span-2 xl:col-span-4">
              <div className="text-xs text-gray-500 mb-1">Description</div>
              <div className="text-sm whitespace-pre-wrap">
                {cap(form.description)}
              </div>
            </div>
            <div className="border rounded-lg p-3 bg-white md:col-span-2 xl:col-span-4">
              <div className="text-xs text-gray-500 mb-1">Header Title</div>
              <div className="text-sm">{cap(definition?.header?.title)}</div>
            </div>
            <div className="border rounded-lg p-3 bg-white md:col-span-2 xl:col-span-4">
              <div className="text-xs text-gray-500 mb-1">Header Subtitle</div>
              <div className="text-sm">{cap(definition?.header?.subtitle)}</div>
            </div>
            <div className="border rounded-lg p-3 bg-white">
              <div className="text-xs text-gray-500 mb-1">Accent Color</div>
              <div className="text-sm flex items-center gap-2">
                <span
                  className="inline-block h-4 w-4 rounded-full border"
                  style={{
                    backgroundColor: definition?.theme?.accent || '#176b5b',
                  }}
                />
                {definition?.theme?.accent || '#176b5b'}
              </div>
            </div>
            <div className="border rounded-lg p-3 bg-white">
              <div className="text-xs text-gray-500 mb-1">Footer Note</div>
              <div className="text-sm">{definition?.footer?.text || '--'}</div>
            </div>
            {form.created_at && (
              <div className="border rounded-lg p-3 bg-white">
                <div className="text-xs text-gray-500 mb-1">Created</div>
                <div className="text-sm">
                  {new Date(form.created_at).toLocaleDateString()}
                </div>
              </div>
            )}
            {form.updated_at && (
              <div className="border rounded-lg p-3 bg-white">
                <div className="text-xs text-gray-500 mb-1">Updated</div>
                <div className="text-sm">
                  {new Date(form.updated_at).toLocaleDateString()}
                </div>
              </div>
            )}
            <div className="border rounded-lg p-3 bg-white">
              <div className="text-xs text-gray-500 mb-1">Campaigns</div>
              <div className="text-sm">{form.campaigns_count || 0}</div>
            </div>
          </div>
        </Tab>
        <Tab id="preview">
          <FormPreview definition={definition} />
        </Tab>
      </TabContainer>
    </div>
  )
}
