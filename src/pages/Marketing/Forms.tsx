import { useMemo, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import ListingHeader from '../../components/common/ListingTiles'
import Button from '../../components/common/buttons/Button'
import TextField from '../../components/common/inputs/TextField'
import TextArea from '../../components/common/inputs/TextArea'
import ColorPicker from '../../components/common/inputs/ColorPicker'
import Checkbox from '../../components/common/inputs/Checkbox'
import ToggleSwitch from '../../components/common/inputs/ToggleSwitch'
import FileUpload from '../../components/common/fileUpload/index'
import { AutoComplete } from 'qbs-core'
import SmartTable from '../../components/common/table/SmartTable'
import Icons from '../../components/common/icons'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useNavigate } from 'react-router-dom'
import { useMarketingForms, deleteMarketingForm } from './api'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'

type FormField = {
  key: string
  label: string
  type: string
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: string[]
}
const statusOptions = [
  { id: 'draft', name: 'Draft' },
  { id: 'active', name: 'Active' },
  { id: 'inactive', name: 'Inactive' },
]
const stepItems = ['Basic setup', 'Build your form']
const fieldTypes: [string, string, string][] = [
  ['text', 'Short text', 'Single-line text input'],
  ['textarea', 'Long text', 'Multi-line text area'],
  ['email', 'Email', 'Email address field'],
  ['phone', 'Phone', 'Phone number input'],
  ['number', 'Number', 'Numeric input'],
  ['date', 'Date', 'Date picker'],
  ['select', 'Dropdown', 'Select from options'],
  ['checkbox', 'Checkbox', 'Multiple choice'],
]
export const defaultDefinition = {
  header: {
    title: 'Get in touch',
    subtitle: 'Tell us a little about yourself.',
    image_url: '',
  },
  footer: {
    text: 'We respect your privacy. Your information is safe with us.',
  },
  theme: {
    accent: '#176b5b',
    background: '#f5f8f7',
    page_background: '#eef2f1',
    radius: '12px',
  },
  layout: 'single',
  fields: [
    {
      key: 'first_name',
      label: 'First name',
      type: 'text',
      required: true,
      placeholder: 'Enter your first name',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'you@example.com',
    },
    {
      key: 'phone',
      label: 'Phone',
      type: 'phone',
      placeholder: 'Your phone number',
    },
  ],
}
export const clone = (value: any) => JSON.parse(JSON.stringify(value))
const fieldLabel = (type: string) =>
  fieldTypes.find((item) => item[0] === type)?.[1] || 'Field'

export function Builder({
  editing,
  setEditing,
  definition,
  setDefinition,
  onSave,
  saving,
  onClose,
}: any) {
  const {
    control,
    trigger,
    formState: { errors },
  } = useFormContext()
  const [step, setStep] = useState(1)
  const [basicError, setBasicError] = useState('')
  const [selected, setSelected] = useState(0)
  const [dragging, setDragging] = useState<number | null>(null)
  const [hoveredField, setHoveredField] = useState<number | null>(null)
  const fields: FormField[] = definition.fields || []
  const selectedField = fields[selected]
  const accent = definition.theme?.accent || '#176b5b'
  const layout = definition.layout || 'single'

  const updateDefinition = (changes: any) =>
    setDefinition((value: any) => ({ ...value, ...changes }))
  const updateField = (index: number, changes: Partial<FormField>) =>
    setDefinition((value: any) => ({
      ...value,
      fields: value.fields.map((field: FormField, i: number) =>
        i === index ? { ...field, ...changes } : field
      ),
    }))
  const updateOption = (index: number, optionIndex: number, option: string) => {
    const options = [...(fields[index].options || [])]
    options[optionIndex] = option
    updateField(index, { options })
  }
  const addOption = (index: number) =>
    updateField(index, {
      options: [...(fields[index].options || []), 'New option'],
    })
  const removeOption = (index: number, optionIndex: number) =>
    updateField(index, {
      options: (fields[index].options || []).filter(
        (_: string, i: number) => i !== optionIndex
      ),
    })
  const addField = (type: string, atIndex = fields.length) => {
    const key = 'field_' + Date.now()
    const field = {
      key,
      label: fieldLabel(type),
      type,
      required: false,
      placeholder: 'Enter ' + fieldLabel(type).toLowerCase(),
      ...(['select', 'checkbox'].includes(type)
        ? { options: ['Option 1', 'Option 2'] }
        : {}),
    }
    setDefinition((value: any) => ({
      ...value,
      fields: [
        ...value.fields.slice(0, atIndex),
        field,
        ...value.fields.slice(atIndex),
      ],
    }))
    setSelected(atIndex)
  }
  const removeField = (index: number) => {
    setDefinition((value: any) => ({
      ...value,
      fields: value.fields.filter((_: any, i: number) => i !== index),
    }))
    setSelected(Math.max(0, Math.min(selected, fields.length - 2)))
  }
  const duplicateField = (index: number) => {
    const source = fields[index]
    const copy = {
      ...source,
      key: source.key + '_copy_' + Date.now(),
      label: source.label + ' copy',
    }
    setDefinition((value: any) => ({
      ...value,
      fields: [
        ...value.fields.slice(0, index + 1),
        copy,
        ...value.fields.slice(index + 1),
      ],
    }))
    setSelected(index + 1)
  }
  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= fields.length || from === to) return
    const copy = [...fields]
    const [item] = copy.splice(from, 1)
    copy.splice(to, 0, item)
    setDefinition((value: any) => ({ ...value, fields: copy }))
    setSelected(to)
  }
  const handleDrop = (event: React.DragEvent, targetIndex = fields.length) => {
    event.preventDefault()
    const type = event.dataTransfer.getData('field-type')
    const sourceIndex = event.dataTransfer.getData('field-index')
    if (type) addField(type, targetIndex)
    else if (sourceIndex !== '')
      moveField(
        Number(sourceIndex),
        targetIndex > Number(sourceIndex) ? targetIndex - 1 : targetIndex
      )
    setDragging(null)
  }
  const previewField = (field: FormField) => {
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
          data={(field.options || []).map((option) => ({
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
            (option, optionIndex) => (
              <Checkbox
                key={optionIndex}
                id={'preview-' + field.key + '-' + optionIndex}
                name={'preview_' + field.key + '-' + optionIndex}
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
  const validateBasicSetup = async () => {
    const valid = await trigger(['form_name', 'header_title'])
    if (!valid) {
      setBasicError('Complete the required fields before continuing.')
      setStep(1)
      return false
    }
    setBasicError('')
    return true
  }
  const goToStep = async (nextStep: number) => {
    if (nextStep === 2 && !(await validateBasicSetup())) return
    setStep(nextStep)
  }

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] w-full flex-col bg-[#f8f9fb]">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div>
          <div className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">
            Marketing /Forms
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {editing.id ? 'Edit Form' : 'Create reusable form'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button label="Cancel" outlined primary={false} onClick={onClose} />
          <Button label="Save form" onClick={onSave} isLoading={saving} />
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-5 sm:px-8 py-4">
        <div className="max-w-xl mx-auto flex items-center">
          {stepItems.map((label, index) => {
            const itemStep = index + 1
            const active = step === itemStep
            const completed = step > itemStep
            return (
              <div
                key={label}
                className="flex items-center flex-1 last:flex-none"
              >
                <button
                  type="button"
                  className="flex items-center gap-3 text-left group"
                  onClick={() => goToStep(itemStep)}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300"
                    style={{
                      background: completed
                        ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
                        : active
                          ? accent
                          : '#f3f4f6',
                      color: active || completed ? 'white' : '#9ca3af',
                      boxShadow: active
                        ? `0 0 0 4px ${accent}20, 0 4px 12px ${accent}30`
                        : completed
                          ? `0 2px 8px ${accent}25`
                          : 'none',
                    }}
                  >
                    {completed ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      itemStep
                    )}
                  </span>
                  <span className="hidden sm:block">
                    <span
                      className="block text-[10px] uppercase tracking-widest font-semibold mb-0.5"
                      style={{
                        color: active || completed ? accent : '#9ca3af',
                      }}
                    >
                      Step {itemStep}
                    </span>
                    <span
                      className="block text-sm font-medium transition-colors"
                      style={{
                        color: active
                          ? '#111827'
                          : completed
                            ? '#374151'
                            : '#6b7280',
                      }}
                    >
                      {label}
                    </span>
                  </span>
                </button>
                {index < stepItems.length - 1 && (
                  <div className="mx-4 sm:mx-8 flex-1 h-1 rounded-full overflow-hidden bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: step > itemStep ? '100%' : '0%',
                        background: `linear-gradient(90deg, ${accent}, ${accent}aa)`,
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {step === 1 ? (
        <div className="flex-1 overflow-auto p-5 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: accent + '12' }}
                  >
                    <svg
                      className="w-5 h-5"
                      style={{ color: accent }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Form details
                    </h3>
                    <p className="text-xs text-gray-500">
                      Name your form and set its publishing state.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Controller
                    name="form_name"
                    control={control}
                    rules={{ required: 'Form name is required' }}
                    render={({ field }) => (
                      <TextField
                        id="form-name"
                        name="form_name"
                        label="Form name"
                        placeholder="e.g. Free consultation enquiry"
                        value={field.value || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          const capitalized =
                            val.charAt(0).toUpperCase() + val.slice(1)
                          field.onChange({
                            ...e,
                            target: { ...e.target, value: capitalized },
                          })
                          setBasicError('')
                          setEditing({ ...editing, name: capitalized })
                        }}
                        errors={errors}
                        required
                      />
                    )}
                  />
                  <AutoComplete
                    name="form_status"
                    label="Status"
                    type="custom_select"
                    desc="name"
                    descId="id"
                    data={statusOptions}
                    value={
                      statusOptions.find(
                        (option) => option.id === editing.status
                      )?.name || ''
                    }
                    placeholder="Select status"
                    onChange={(option: any) =>
                      setEditing({ ...editing, status: option?.id || 'draft' })
                    }
                    required
                  />
                </div>
                <TextArea
                  id="form-description"
                  name="form_description"
                  label="Internal description"
                  rows={3}
                  placeholder="Explain where this form should be used."
                  value={editing.description || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: accent + '12' }}
                  >
                    <svg
                      className="w-5 h-5"
                      style={{ color: accent }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Page branding
                    </h3>
                    <p className="text-xs text-gray-500">
                      Customize how your form looks to visitors.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <Controller
                  name="header_title"
                  control={control}
                  rules={{ required: 'Header title is required' }}
                  render={({ field }) => (
                    <TextField
                      id="header-title"
                      name="header_title"
                      label="Header title"
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e)
                        updateDefinition({
                          header: {
                            ...definition.header,
                            title: e.target.value,
                          },
                        })
                      }}
                      errors={errors}
                      required
                    />
                  )}
                />
                <TextField
                  id="header-subtitle"
                  name="header_subtitle"
                  label="Header subtitle"
                  value={definition.header.subtitle}
                  onChange={(e) =>
                    updateDefinition({
                      header: {
                        ...definition.header,
                        subtitle: e.target.value,
                      },
                    })
                  }
                />
                <FileUpload
                  name="header_image"
                  subName="header_image_name"
                  id="header-image"
                  label="Header image"
                  value={definition.header.image_url || ''}
                  accept="image/*"
                  buttonLabel="Choose image"
                  onChange={(event: any) => {
                    const file = event?.target?.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () =>
                      updateDefinition({
                        header: {
                          ...definition.header,
                          image_url: String(reader.result || ''),
                        },
                      })
                    reader.readAsDataURL(file)
                  }}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent color
                  </label>
                  <div className="flex items-center gap-3">
                    <ColorPicker
                      id="accent-color"
                      name="accent_color"
                      label=""
                      value={definition.theme?.accent || accent}
                      onChange={(value) =>
                        updateDefinition({
                          theme: { ...definition.theme, accent: value },
                        })
                      }
                    />
                    <span className="text-xs text-gray-400 font-mono">
                      {definition.theme?.accent || accent}
                    </span>
                  </div>
                </div>
                <TextArea
                  id="footer-note"
                  name="footer_note"
                  label="Footer note"
                  rows={2}
                  value={definition.footer?.text || ''}
                  onChange={(e) =>
                    updateDefinition({ footer: { text: e.target.value } })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 items-center">
              {basicError && (
                <p className="text-sm text-red-600 flex items-center gap-1.5 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {basicError}
                </p>
              )}
              <button
                type="button"
                className="px-7 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                style={{
                  background: accent,
                  boxShadow: `0 4px 14px ${accent}35`,
                }}
                onClick={() => goToStep(2)}
              >
                Continue to builder →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-3 p-3 sm:p-4">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="font-bold text-gray-900 text-sm">
                Design your form
              </div>
              <div className="text-xs text-gray-400">
                Drag fields into the canvas, then select any field to edit it.
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200"
                  style={
                    layout === 'single'
                      ? {
                          backgroundColor: 'white',
                          color: accent,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        }
                      : { color: '#9ca3af' }
                  }
                  onClick={() => updateDefinition({ layout: 'single' })}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  Single
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200"
                  style={
                    layout === 'two'
                      ? {
                          backgroundColor: 'white',
                          color: accent,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        }
                      : { color: '#9ca3af' }
                  }
                  onClick={() => updateDefinition({ layout: 'two' })}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h7v12H4zM13 6h7v12h-7z"
                    />
                  </svg>
                  Two
                </button>
              </div>
              <div className="h-6 w-px bg-gray-200" />
              <ColorPicker
                id="page-background"
                name="page_background"
                label=""
                value={definition.theme?.page_background || '#eef2f1'}
                onChange={(value) =>
                  updateDefinition({
                    theme: { ...definition.theme, page_background: value },
                  })
                }
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[260px_1fr_300px] gap-3">
            <aside className="bg-white rounded-2xl border border-gray-200 p-4 overflow-auto shadow-sm flex flex-col">
              <div className="mb-4">
                <div className="font-bold text-sm text-gray-900 mb-0.5">
                  Add fields
                </div>
                <p className="text-[11px] text-gray-400">
                  Click a field to add it to your form
                </p>
              </div>
              <div className="space-y-1.5 flex-1">
                {fieldTypes.map(([type, label, desc]) => (
                  <button
                    key={type}
                    type="button"
                    draggable
                    onDragStart={(event) =>
                      event.dataTransfer.setData('field-type', type)
                    }
                    onClick={() => addField(type)}
                    className="w-full text-left rounded-xl px-3.5 py-3 hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all text-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          backgroundColor: accent + '10',
                          color: accent,
                        }}
                      >
                        {label.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-700 group-hover:text-gray-900 block text-[13px] leading-tight">
                          {label}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate">
                          {desc}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <main
              className="overflow-auto rounded-2xl border border-gray-200 p-5 shadow-sm"
              style={{
                backgroundColor: definition.theme?.page_background || '#eef2f1',
              }}
            >
              <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-xl border border-gray-200/50 bg-white">
                {definition.header.image_url && (
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={definition.header.image_url}
                      className="w-full h-full object-cover"
                      alt=""
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>
                )}
                <div className="p-8">
                  <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: accent }}
                  >
                    {definition.header.title}
                  </h1>
                  <p className="text-gray-500 mt-2 mb-8 text-sm">
                    {definition.header.subtitle}
                  </p>
                  <div
                    className={
                      layout === 'two' ? 'grid grid-cols-2 gap-4' : 'space-y-4'
                    }
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event)}
                  >
                    {fields.length === 0 && (
                      <div className="col-span-2 border-2 border-dashed border-gray-200 rounded-2xl p-14 text-center">
                        <div
                          className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
                          style={{ backgroundColor: accent + '10' }}
                        >
                          <svg
                            className="w-8 h-8"
                            style={{ color: accent + '60' }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                          Your form is empty
                        </p>
                        <p className="text-xs text-gray-400">
                          Click a field from the palette or drag it here
                        </p>
                      </div>
                    )}
                    {fields.map((field, index) => (
                      <div
                        key={field.key}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData(
                            'field-index',
                            String(index)
                          )
                          setDragging(index)
                        }}
                        onDragEnd={() => setDragging(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.stopPropagation()
                          handleDrop(event, index)
                        }}
                        onClick={() => setSelected(index)}
                        onMouseEnter={() => setHoveredField(index)}
                        onMouseLeave={() => setHoveredField(null)}
                        className={
                          'relative rounded-xl border-2 p-4 cursor-grab bg-white transition-all duration-150 ' +
                          (selected === index
                            ? 'shadow-lg scale-[1.01]'
                            : hoveredField === index
                              ? 'shadow-md border-gray-300'
                              : 'hover:shadow-sm border-transparent outline outline-1 outline-gray-200') +
                          (dragging === index ? ' opacity-40 scale-[0.97]' : '')
                        }
                        style={
                          selected === index
                            ? {
                                borderColor: accent,
                                outline: `2px solid ${accent}20`,
                              }
                            : {}
                        }
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md"
                              style={{
                                backgroundColor: accent + '10',
                                color: accent,
                              }}
                            >
                              {fieldLabel(field.type)}
                            </span>
                            {field.required && (
                              <span className="text-[10px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-300 font-mono">
                            {field.key}
                          </span>
                        </div>
                        <label className="block text-[13px] font-semibold text-gray-800 mb-2">
                          {field.label}
                        </label>
                        {previewField(field)}
                        {field.helpText && (
                          <span className="text-[11px] text-gray-400 mt-2 block">
                            {field.helpText}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {fields.length > 0 && (
                    <button
                      className="w-full rounded-xl py-3.5 mt-6 text-white font-semibold text-sm tracking-wide transition-all hover:shadow-lg active:scale-[0.99]"
                      style={{
                        background: accent,
                        boxShadow: `0 4px 14px ${accent}30`,
                      }}
                    >
                      Submit enquiry
                    </button>
                  )}
                  <p className="text-[11px] text-gray-400 text-center mt-5 leading-relaxed">
                    {definition.footer?.text}
                  </p>
                </div>
              </div>
            </main>

            <aside className="bg-white rounded-2xl border border-gray-200 p-4 overflow-auto shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-sm text-gray-900">
                    Field settings
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {selectedField
                      ? 'Edit the selected field'
                      : 'Select a field to edit'}
                  </p>
                </div>
                {selectedField && (
                  <span
                    className="text-[10px] font-bold rounded-full px-2 py-0.5"
                    style={{ backgroundColor: accent + '15', color: accent }}
                  >
                    {selected + 1}/{fields.length}
                  </span>
                )}
              </div>

              {selectedField ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 p-3.5 bg-gray-50/50">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: accent + '15',
                          color: accent,
                        }}
                      >
                        {fieldLabel(selectedField.type).charAt(0)}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">
                          {fieldLabel(selectedField.type)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {selectedField.key}
                        </span>
                      </div>
                    </div>
                  </div>

                  <TextField
                    id="field-label"
                    name="field_label"
                    label="Label"
                    value={selectedField.label}
                    onChange={(e) =>
                      updateField(selected, { label: e.target.value })
                    }
                  />
                  <TextField
                    id="field-key"
                    name="field_key"
                    label="Field key"
                    value={selectedField.key}
                    onChange={(e) =>
                      updateField(selected, {
                        key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'),
                      })
                    }
                  />
                  <TextField
                    id="field-placeholder"
                    name="field_placeholder"
                    label="Placeholder"
                    value={selectedField.placeholder || ''}
                    onChange={(e) =>
                      updateField(selected, { placeholder: e.target.value })
                    }
                  />
                  <TextArea
                    id="field-help-text"
                    name="field_help_text"
                    label="Help text"
                    rows={2}
                    value={selectedField.helpText || ''}
                    onChange={(e) =>
                      updateField(selected, { helpText: e.target.value })
                    }
                  />

                  {['select', 'checkbox'].includes(selectedField.type) && (
                    <div
                      className="rounded-xl border p-3.5"
                      style={{
                        borderColor: accent + '25',
                        backgroundColor: accent + '04',
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-xs font-bold text-gray-800">
                            {selectedField.type === 'select'
                              ? 'Dropdown options'
                              : 'Checkbox options'}
                          </div>
                          <p className="text-[10px] text-gray-400">
                            One option per line
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-bold px-2.5 py-1 rounded-lg transition-colors hover:bg-white"
                          style={{ color: accent }}
                          onClick={() => addOption(selected)}
                        >
                          + Add
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {(selectedField.options || []).map(
                          (option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex items-center gap-2"
                            >
                              <span className="text-[10px] text-gray-300 w-4 font-mono text-right">
                                {optionIndex + 1}
                              </span>
                              <div className="flex-1">
                                <TextField
                                  id={'field-option-' + optionIndex}
                                  name={'field_option_' + optionIndex}
                                  label=""
                                  value={option}
                                  onChange={(e) =>
                                    updateOption(
                                      selected,
                                      optionIndex,
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <button
                                type="button"
                                title="Remove option"
                                className="h-7 w-7 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center shrink-0"
                                onClick={() =>
                                  removeOption(selected, optionIndex)
                                }
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          )
                        )}
                      </div>
                      {!(selectedField.options || []).length && (
                        <p className="text-[11px] text-gray-400 italic text-center py-2">
                          No options yet
                        </p>
                      )}
                    </div>
                  )}

                  <div className="rounded-xl border border-gray-200 px-3.5 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Required
                    </span>
                    <ToggleSwitch
                      id="field-required"
                      checked={Boolean(selectedField.required)}
                      onChange={(checked) =>
                        updateField(selected, { required: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                    <span className="text-xs font-medium text-gray-500">
                      Reorder
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Move up"
                        disabled={selected === 0}
                        className="h-7 w-7 rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-25 hover:bg-gray-50 transition-colors flex items-center justify-center"
                        onClick={() => moveField(selected, selected - 1)}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Move down"
                        disabled={selected === fields.length - 1}
                        className="h-7 w-7 rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-25 hover:bg-gray-50 transition-colors flex items-center justify-center"
                        onClick={() => moveField(selected, selected + 1)}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="flex-1 text-xs font-semibold border border-gray-200 rounded-xl py-2.5 text-gray-600 hover:bg-gray-50 transition-colors"
                      onClick={() => duplicateField(selected)}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="flex-1 text-xs font-semibold border border-red-100 rounded-xl py-2.5 text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => removeField(selected)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 rounded-xl border border-dashed border-gray-200 p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    No field selected
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Click on any field in the canvas to edit its properties
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}
    </div>
  )
}
export default function Forms() {
  const { enqueueSnackbar } = useSnackbarManager()
  const navigate = useNavigate()
  const [params, setParams] = useState({ page: 1, per_page: 20, search: '' })
  const { data, isFetching, refetch } = useMarketingForms(params)
  const [deleteRow, setDeleteRow] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const rows = data?.marketing_forms || []
  const columns: any[] = useMemo(
    () => [
      {
        title: 'Name',
        field: 'name',
        renderCell: (r: any) => ({
          cell: (
            <button
              type="button"
              className="text-blue-600 hover:underline text-left"
              onClick={() => navigate('/marketing/forms/' + r.id)}
            >
              {r.name
                ? r.name.charAt(0).toUpperCase() + r.name.slice(1)
                : r.name}
            </button>
          ),
          toolTip: r.name,
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Campaigns',
        field: 'campaigns_count',
        renderCell: (r: any) => ({
          cell: r.campaigns_count || 0,
          toolTip: String(r.campaigns_count || 0),
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Status',
        field: 'status',
        renderCell: (r: any) => {
          const statusColor = (() => {
            switch (r.status?.toLowerCase()) {
              case 'active':
                return 'bg-green-100 text-green-800'
              case 'draft':
                return 'bg-yellow-100 text-yellow-800'
              case 'inactive':
                return 'bg-red-100 text-red-800'
              default:
                return 'bg-gray-100 text-gray-800'
            }
          })()
          return {
            cell: (
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor}`}
              >
                {r.status}
              </span>
            ),
            toolTip: r.status,
          }
        },
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
    ],
    []
  )
  return (
    <div>
      <ListingHeader
        data={{ title: 'Forms', icon: 'document-icon' }}
        onActionClick={() => navigate('/marketing/forms/new')}
        actionProps={{ actionTitle: 'Create form' }}
        checkPermission
      />
      <div className="p-4">
        <SmartTable
          data={rows}
          dataRowKey="id"
          columns={columns}
          search
          searchPlaceholder="Search forms"
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
              toolTip: 'View',
              icon: <Icons name="view" />,
              action: (row: any) => navigate('/marketing/forms/' + row.id),
            },
            {
              title: 'Edit',
              toolTip: 'Edit',
              icon: <Icons name="edit" />,
              action: (row: any) =>
                navigate('/marketing/forms/' + row.id + '/edit'),
            },
            {
              title: 'Delete',
              toolTip: 'Delete',
              icon: <Icons name="delete" />,
              variant: 'danger',
              action: (row: any) => setDeleteRow(row),
            },
          ]}
        />
      </div>
      <ConfirmDeleteModal
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        title="Delete form?"
        subTitle="This action cannot be undone. The form and all its data will be permanently removed."
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true)
          try {
            const res = await deleteMarketingForm(deleteRow.id)
            enqueueSnackbar(res?.message || 'Form deleted successfully', {
              variant: 'success',
            })
            setDeleteRow(null)
            refetch()
          } catch {
            enqueueSnackbar('Failed to delete form', { variant: 'error' })
          } finally {
            setDeleting(false)
          }
        }}
      />
    </div>
  )
}
