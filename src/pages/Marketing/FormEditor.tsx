import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { useSnackbarManager } from '../../components/common/snackbar'
import {
  createMarketingForm,
  updateMarketingForm,
  useMarketingForm,
} from './api'
import { Builder, clone, defaultDefinition } from './Forms'

export default function FormEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const isNew = !id || id === 'new'
  const { data, isLoading } = useMarketingForm(isNew ? null : id)
  const [ready, setReady] = useState(false)
  const [editing, setEditing] = useState<any>({
    name: '',
    description: '',
    status: 'active',
  })
  const [definition, setDefinition] = useState<any>(clone(defaultDefinition))
  const [saving, setSaving] = useState(false)
  const methods = useForm({
    defaultValues: {
      form_name: '',
      header_title: defaultDefinition.header.title,
      header_image: '',
    },
  })

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setReady(true), 300)
      return () => clearTimeout(timer)
    }
  }, [isNew])

  useEffect(() => {
    const form = data?.marketing_form || data
    if (form && !isNew) {
      const formId = form.id || id
      setEditing({
        name: form.name || '',
        description: form.description || '',
        status: form.status || 'draft',
        id: formId,
      })
      const nextDefinition = clone(form.definition || defaultDefinition)
      setDefinition(nextDefinition)
      methods.reset({
        form_name: form.name || '',
        header_title: nextDefinition.header?.title || '',
        header_image: nextDefinition.header?.image_url || '',
      })
      setReady(true)
    }
  }, [data, isNew, methods, id])

  const save = async () => {
    try {
      const valid = await methods.trigger(['form_name', 'header_title'])
      if (!valid) {
        enqueueSnackbar('Complete the required form fields', {
          variant: 'error',
        })
        return
      }
      const rawFormName = String(methods.getValues('form_name') || '').trim()
      const formName = rawFormName
        ? rawFormName.charAt(0).toUpperCase() + rawFormName.slice(1)
        : ''
      if (!formName) throw new Error('Form name is required')
      setSaving(true)
      const payload = {
        name: formName,
        description: editing.description,
        status: editing.status,
        definition,
      }
      if (editing.id || (!isNew && id)) {
        await updateMarketingForm({ id: editing.id || id, data: payload })
        enqueueSnackbar('Form updated successfully', { variant: 'success' })
      } else {
        await createMarketingForm(payload)
        enqueueSnackbar('Form saved successfully', { variant: 'success' })
      }
      navigate('/marketing/forms')
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Unable to save form', {
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!ready || (!isNew && isLoading)) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#f8f9fb]">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-100 border-t-primaryGreen" />
          <h1 className="mt-5 text-lg font-semibold text-slate-800">
            Preparing your form
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This will only take a moment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <FormProvider {...methods}>
      <Builder
        editing={editing}
        setEditing={setEditing}
        definition={definition}
        setDefinition={setDefinition}
        onSave={save}
        saving={saving}
        onClose={() => navigate('/marketing/forms')}
      />
    </FormProvider>
  )
}
