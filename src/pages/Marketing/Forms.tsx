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
const fieldTypes = [
  ['text', 'Short text'],
  ['textarea', 'Long text'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['number', 'Number'],
  ['date', 'Date'],
  ['select', 'Dropdown'],
  ['checkbox', 'Checkbox'],
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
    <div className="relative flex min-h-[calc(100vh-64px)] w-full flex-col bg-[#eef2f1]">
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">
            Marketing / Reusable forms
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {editing.id ? 'Edit reusable form' : 'Create reusable form'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button label="Cancel" outlined primary={false} onClick={onClose} />
          <Button label="Save form" onClick={onSave} isLoading={saving} />
        </div>
      </div>
      <div className="bg-white border-b px-5 sm:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center">
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
                  className="flex items-center gap-3 text-left"
                  onClick={() => goToStep(itemStep)}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold"
                    style={{
                      borderColor: active || completed ? accent : '#d1d5db',
                      backgroundColor: completed
                        ? accent
                        : active
                          ? accent + '12'
                          : 'white',
                      color: active || completed ? accent : '#6b7280',
                    }}
                  >
                    {completed ? '✓' : itemStep}
                  </span>
                  <span className="hidden sm:block">
                    <span
                      className={
                        'block text-xs uppercase tracking-wide ' +
                        (active || completed
                          ? 'font-semibold'
                          : 'text-gray-500')
                      }
                      style={active || completed ? { color: accent } : {}}
                    >
                      Step {itemStep}
                    </span>
                    <span
                      className={
                        'block text-sm ' +
                        (active
                          ? 'font-semibold text-gray-900'
                          : 'text-gray-500')
                      }
                    >
                      {label}
                    </span>
                  </span>
                </button>
                {index < stepItems.length - 1 && (
                  <span
                    className="mx-3 sm:mx-6 h-px flex-1"
                    style={{
                      backgroundColor: step > itemStep ? accent : '#e5e7eb',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
      {step === 1 ? (
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border shadow-sm p-5 sm:p-7">
            <div className="mb-7">
              <h3 className="text-lg font-semibold">Form basics</h3>
              <p className="text-sm text-gray-500">
                Set the identity and publishing state of this reusable form.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
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
                  statusOptions.find((option) => option.id === editing.status)
                    ?.name || ''
                }
                placeholder="Select status"
                onChange={(option: any) =>
                  setEditing({ ...editing, status: option?.id || 'draft' })
                }
                required
              />
            </div>
            <div className="block mt-5">
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
            <div className="border-t mt-7 pt-7">
              <h3 className="font-semibold">Page branding</h3>
              <div className="grid md:grid-cols-2 gap-5 mt-4">
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
                <ColorPicker
                  id="accent-color"
                  name="accent_color"
                  label="Accent color"
                  value={definition.theme?.accent || accent}
                  onChange={(value) =>
                    updateDefinition({
                      theme: { ...definition.theme, accent: value },
                    })
                  }
                />
              </div>
              <div className="block mt-5">
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
            <div className="mt-7 flex justify-end gap-4 items-center">
              {basicError && (
                <p className="text-sm text-red-600">{basicError}</p>
              )}
              <Button label="Continue to builder" onClick={() => goToStep(2)} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-3 p-4">
          <div className="rounded-xl border bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-gray-900">
                Design your form
              </div>
              <div className="text-xs text-gray-500">
                Drag fields into the canvas, then select any field to edit it.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Form layout</span>
              <button
                type="button"
                className={
                  'px-3 py-2 rounded-lg border text-xs ' +
                  (layout === 'single' ? 'font-semibold' : 'text-gray-500')
                }
                style={
                  layout === 'single'
                    ? { borderColor: accent, color: accent }
                    : {}
                }
                onClick={() => updateDefinition({ layout: 'single' })}
              >
                Single column
              </button>
              <button
                type="button"
                className={
                  'px-3 py-2 rounded-lg border text-xs ' +
                  (layout === 'two' ? 'font-semibold' : 'text-gray-500')
                }
                style={
                  layout === 'two' ? { borderColor: accent, color: accent } : {}
                }
                onClick={() => updateDefinition({ layout: 'two' })}
              >
                Two columns
              </button>
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
          <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[220px_minmax(440px,1fr)_300px] gap-3">
            <aside className="bg-white rounded-xl border p-4 overflow-auto">
              <div className="font-semibold">Field palette</div>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Drag a field into the form or click to add it.
              </p>
              {fieldTypes.map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  draggable
                  onDragStart={(event) =>
                    event.dataTransfer.setData('field-type', type)
                  }
                  onClick={() => addField(type)}
                  className="w-full text-left border rounded-lg p-3 mb-2 hover:border-primaryGreen hover:bg-green-50 text-sm"
                >
                  <span className="font-medium">{label}</span>
                  <span className="block text-xs text-gray-500">
                    Drag to add
                  </span>
                </button>
              ))}
            </aside>
            <main
              className="overflow-auto rounded-xl border p-5"
              style={{
                backgroundColor: definition.theme?.page_background || '#eef2f1',
              }}
            >
              <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-sm border bg-white">
                {definition.header.image_url && (
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
                  <h1
                    className="text-2xl font-semibold"
                    style={{ color: accent }}
                  >
                    {definition.header.title}
                  </h1>
                  <p className="text-gray-600 mt-2 mb-6">
                    {definition.header.subtitle}
                  </p>
                  <div
                    className={
                      layout === 'two' ? 'grid grid-cols-2 gap-3' : 'space-y-1'
                    }
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event)}
                  >
                    {fields.length === 0 && (
                      <div className="col-span-2 border-2 border-dashed rounded-xl p-10 text-center text-sm text-gray-500">
                        Drop your first field here
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
                        className={
                          'relative rounded-xl border p-3 mb-3 cursor-grab bg-white ' +
                          (selected === index ? 'ring-2' : '') +
                          (dragging === index ? ' opacity-50' : '')
                        }
                        style={
                          selected === index
                            ? { outlineColor: accent, borderColor: accent }
                            : {}
                        }
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-wide text-gray-400">
                            {fieldLabel(field.type)}
                          </span>
                          <span className="text-xs text-gray-400">⠿ Drag</span>
                        </div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                          {field.required ? (
                            <span className="text-red-500"> *</span>
                          ) : null}
                        </label>
                        {previewField(field)}
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
                    {definition.footer?.text}
                  </p>
                </div>
              </div>
            </main>
            <aside className="bg-white rounded-xl border p-4 overflow-auto">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Field settings</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Configure the selected field
                  </p>
                </div>
                {selectedField && (
                  <span className="text-xs rounded-full px-2 py-1 bg-gray-100 text-gray-600">
                    {selected + 1} of {fields.length}
                  </span>
                )}
              </div>
              {selectedField ? (
                <div className="mt-5 space-y-4">
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
                    <div className="rounded-xl border bg-gray-50 p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-sm font-semibold">
                            {selectedField.type === 'select'
                              ? 'Dropdown options'
                              : 'Checkbox options'}
                          </div>
                          <p className="text-xs text-gray-500">
                            Add each option separately.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-semibold text-primaryGreen"
                          onClick={() => addOption(selected)}
                        >
                          + Add option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(selectedField.options || []).map(
                          (option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex items-center gap-2"
                            >
                              <span className="text-xs text-gray-400 w-4">
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
                                className="h-9 w-9 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                                onClick={() =>
                                  removeOption(selected, optionIndex)
                                }
                              >
                                ×
                              </button>
                            </div>
                          )
                        )}
                      </div>
                      {!(selectedField.options || []).length && (
                        <p className="text-xs text-gray-500">
                          No options yet. Add one to get started.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="rounded-xl border px-3 py-2">
                    <ToggleSwitch
                      id="field-required"
                      checked={Boolean(selectedField.required)}
                      onChange={(checked) =>
                        updateField(selected, { required: checked })
                      }
                    />
                    <span className="ml-3 text-sm font-medium">
                      Required field
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border bg-gray-50 p-2">
                    <span className="text-xs font-medium text-gray-600">
                      Field order
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        title="Move field up"
                        aria-label="Move field up"
                        disabled={selected === 0}
                        className="h-9 w-9 rounded-lg border bg-white text-lg disabled:opacity-30 hover:bg-gray-100"
                        onClick={() => moveField(selected, selected - 1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        title="Move field down"
                        aria-label="Move field down"
                        disabled={selected === fields.length - 1}
                        className="h-9 w-9 rounded-lg border bg-white text-lg disabled:opacity-30 hover:bg-gray-100"
                        onClick={() => moveField(selected, selected + 1)}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full text-sm text-primaryGreen border border-primaryGreen rounded-lg py-2"
                    onClick={() => duplicateField(selected)}
                  >
                    Duplicate field
                  </button>
                  <button
                    type="button"
                    className="w-full text-red-600 text-sm border border-red-100 rounded-lg py-2"
                    onClick={() => removeField(selected)}
                  >
                    Remove field
                  </button>
                </div>
              ) : (
                <div className="mt-8 rounded-xl border border-dashed p-5 text-center text-sm text-gray-500">
                  Select a field from the canvas to configure it.
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
        title: 'Status',
        field: 'status',
        renderCell: (r: any) => ({
          cell: <span className="capitalize">{r.status}</span>,
          toolTip: r.status,
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
    ],
    []
  )
  return (
    <div>
      <ListingHeader
        data={{ title: 'Reusable Forms', icon: 'category-header-icon' }}
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
              action: async (row) => {
                if (window.confirm('Delete form?')) {
                  await deleteMarketingForm(row.id)
                  enqueueSnackbar('Form deleted', { variant: 'success' })
                  refetch()
                }
              },
            },
          ]}
        />
      </div>
    </div>
  )
}
