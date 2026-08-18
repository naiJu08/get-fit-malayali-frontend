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
  const [editing, setEditing] = useState<any>({
    name: '',
    description: '',
    status: 'draft',
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
    const form = data?.marketing_form || data
    if (form && !isNew) {
      setEditing({
        name: form.name || '',
        description: form.description || '',
        status: form.status || 'draft',
        id: form.id,
      })
      const nextDefinition = clone(form.definition || defaultDefinition)
      setDefinition(nextDefinition)
      methods.reset({
        form_name: form.name || '',
        header_title: nextDefinition.header?.title || '',
        header_image: nextDefinition.header?.image_url || '',
      })
    }
  }, [data, isNew, methods])

  const save = async () => {
    try {
      const valid = await methods.trigger(['form_name', 'header_title'])
      if (!valid) {
        enqueueSnackbar('Complete the required form fields', {
          variant: 'error',
        })
        return
      }
      if (!editing.name.trim()) throw new Error('Form name is required')
      setSaving(true)
      const payload = {
        name: editing.name,
        description: editing.description,
        status: editing.status,
        definition,
      }
      if (editing.id)
        await updateMarketingForm({ id: editing.id, data: payload })
      else await createMarketingForm(payload)
      enqueueSnackbar('Form saved successfully', { variant: 'success' })
      navigate('/marketing/forms')
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Unable to save form', {
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isNew && isLoading) return <div className="p-6">Loading form...</div>

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
