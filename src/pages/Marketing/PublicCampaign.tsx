import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AutoComplete } from 'qbs-core'

import Checkbox from '../../components/common/inputs/Checkbox'
import TextArea from '../../components/common/inputs/TextArea'
import TextField from '../../components/common/inputs/TextField'
import { getPublicCampaign, submitPublicLead } from './api'

type FieldErrors = Record<string, { message: string }>

const isEmpty = (value: any) =>
  Array.isArray(value) ? value.length === 0 : String(value ?? '').trim() === ''

const responseMessage = (error: any) =>
  error?.response?.data?.errors?.join?.(', ') ||
  error?.response?.data?.error ||
  error?.message ||
  'We could not submit your details. Please try again.'

export default function PublicCampaign() {
  const { token = '' } = useParams()
  const { data, isLoading, error } = useQuery(
    ['public_campaign', token],
    () => getPublicCampaign(token),
    { enabled: Boolean(token), retry: 1 }
  )
  const [values, setValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [sent, setSent] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
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

  if (error || !data?.campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
            !
          </div>
          <h1 className="mt-5 text-xl font-semibold text-slate-800">
            This form is unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            The campaign may have ended, been paused, or the link may be
            incorrect.
          </p>
        </div>
      </div>
    )
  }

  const campaign = data.campaign
  const definition = campaign.form || {}
  const theme = definition.theme || {}
  const fields = definition.fields || []
  const accent = theme.accent || '#176b5b'

  const updateValue = (key: string, value: any) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
    setSubmitError('')
  }

  const validate = () => {
    const nextErrors: FieldErrors = {}
    fields.forEach((field: any) => {
      const value = values[field.key]
      if (field.required && isEmpty(value)) {
        nextErrors[field.key] = {
          message: `${field.label || 'This field'} is required`,
        }
      } else if (
        field.type === 'email' &&
        !isEmpty(value) &&
        !/^\S+@\S+\.\S+$/.test(String(value))
      ) {
        nextErrors[field.key] = { message: 'Enter a valid email address' }
      }
    })
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) {
      requestAnimationFrame(() =>
        document
          .querySelector('.textfield-error')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      )
      return
    }

    const capitalize = (val: any) => {
      if (typeof val !== 'string' || !val.trim()) return val
      const trimmed = val.trim()
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
    }

    const payload: Record<string, any> = { ...values }
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

    try {
      setSubmitting(true)
      setSubmitError('')
      await submitPublicLead(token, payload)
      setSent(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (requestError: any) {
      setSubmitError(responseMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: any) => {
    const fieldError = errors[field.key]

    if (field.type === 'textarea') {
      return (
        <TextArea
          id={field.key}
          name={field.key}
          label={field.label}
          placeholder={field.placeholder}
          desc={field.helpText}
          required={field.required}
          value={values[field.key] || ''}
          errors={errors as any}
          onChange={(event) => updateValue(field.key, event.target.value)}
        />
      )
    }

    if (field.type === 'select') {
      return (
        <div>
          <AutoComplete
            name={field.key}
            label={field.label}
            type="custom_select"
            desc="name"
            descId="id"
            data={(field.options || []).map((option: string) => ({
              id: option,
              name: option,
            }))}
            value={values[field.key] || ''}
            placeholder={field.placeholder || 'Select an option'}
            required={field.required}
            className={fieldError ? 'textfield-error' : ''}
            onChange={(option: any) => updateValue(field.key, option?.id || '')}
          />
          {field.helpText && !fieldError && (
            <p className="mt-1 text-xs text-slate-500">{field.helpText}</p>
          )}
          {fieldError && (
            <p className="mt-1 text-xs text-error">{fieldError.message}</p>
          )}
        </div>
      )
    }

    if (field.type === 'checkbox') {
      const selected = values[field.key] || []
      return (
        <fieldset
          className={fieldError ? 'textfield-error rounded-xl p-2' : ''}
        >
          <legend className="mb-2 text-xs font-medium text-slate-700">
            {field.label}
            {field.required && <span className="text-error"> *</span>}
          </legend>
          <div className="grid gap-2">
            {(field.options || [field.placeholder || field.label]).map(
              (option: string, index: number) => {
                const id = `${field.key}-${index}`
                const checked = selected.includes(option)
                return (
                  <div
                    key={`${option}-${index}`}
                    className={`flex min-h-[46px] items-center gap-3 rounded-xl border px-3 py-2.5 transition ${checked ? 'border-transparent shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    style={
                      checked
                        ? {
                            borderColor: accent,
                            backgroundColor: `${accent}0d`,
                          }
                        : undefined
                    }
                  >
                    <Checkbox
                      id={id}
                      name={id}
                      label=""
                      checked={checked}
                      handleChange={(event: any) =>
                        updateValue(
                          field.key,
                          event.target.checked
                            ? [...selected, option]
                            : selected.filter((item: string) => item !== option)
                        )
                      }
                    />
                    <label
                      htmlFor={id}
                      className="flex-1 cursor-pointer text-sm font-medium text-slate-700"
                    >
                      {option}
                    </label>
                  </div>
                )
              }
            )}
          </div>
          {field.helpText && !fieldError && (
            <p className="mt-1 text-xs text-slate-500">{field.helpText}</p>
          )}
          {fieldError && (
            <p className="mt-1 text-xs text-error">{fieldError.message}</p>
          )}
        </fieldset>
      )
    }

    return (
      <TextField
        id={field.key}
        name={field.key}
        label={field.label}
        type={field.type === 'phone' ? 'tel' : field.type}
        placeholder={field.placeholder}
        required={field.required}
        value={values[field.key] || ''}
        errors={errors as any}
        onChange={(event) => updateValue(field.key, event.target.value)}
      />
    )
  }

  return (
    <div className="relative w-full min-h-screen overflow-y-auto p-0 bg-white">
      <style>{`@keyframes success-pop{0%{opacity:0;transform:scale(.72)}70%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}@keyframes success-draw{from{stroke-dashoffset:48}to{stroke-dashoffset:0}}@keyframes soft-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <main
        className="relative mx-auto max-w-3xl"
        style={{ animation: 'soft-rise .45s ease-out both' }}
      >
        <form
          onSubmit={submit}
          noValidate
          className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm"
          style={{ backgroundColor: theme.background || '#f5f8f7' }}
        >
          {definition.header?.image_url ? (
            <div className="relative h-40 overflow-hidden sm:h-48">
              <img
                src={definition.header.image_url}
                className="h-full w-full object-cover"
                alt=""
              />
            </div>
          ) : null}

          <div className="p-5 sm:p-6">
            {!sent ? (
              <>
                <div className="mb-4">
                  <h1
                    className="text-xl font-bold tracking-tight sm:text-2xl"
                    style={{ color: accent || '#176b5b' }}
                  >
                    {definition.header?.title || campaign.name}
                  </h1>
                  {(definition.header?.subtitle || campaign.description) && (
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                      {definition.header?.subtitle || campaign.description}
                    </p>
                  )}
                </div>

                <div
                  className={
                    definition.layout === 'two'
                      ? 'grid gap-x-4 gap-y-4 md:grid-cols-2'
                      : 'grid gap-y-4'
                  }
                >
                  {fields.map((field: any) => (
                    <div key={field.key}>{renderField(field)}</div>
                  ))}
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="mt-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
                      !
                    </span>
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="mt-5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: accent || '#176b5b' }}
                  >
                    {submitting ? 'Submitting...' : 'Submit enquiry'}
                  </button>
                  <p className="mt-3 text-center text-xs text-slate-400">
                    {definition.footer?.text ||
                      'We respect your privacy. Your information is safe with us.'}
                  </p>
                </div>
              </>
            ) : (
              <section
                className="flex min-h-[350px] flex-col items-center justify-center py-8 text-center"
                aria-live="polite"
              >
                <div
                  className="relative flex h-20 w-20 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `${accent}14`,
                    animation: 'success-pop .55s cubic-bezier(.2,.8,.2,1) both',
                  }}
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
                    style={{ backgroundColor: accent }}
                  >
                    <svg
                      width="30"
                      height="30"
                      viewBox="0 0 34 34"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M8 17.5l6 6L27 10"
                        stroke="white"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          strokeDasharray: 48,
                          animation: 'success-draw .6s .25s ease-out both',
                        }}
                      />
                    </svg>
                  </div>
                </div>
                <div style={{ animation: 'soft-rise .45s .2s ease-out both' }}>
                  <p
                    className="mt-5 text-xs font-bold uppercase tracking-[0.22em]"
                    style={{ color: accent }}
                  >
                    Submission received
                  </p>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    Thank you!
                  </h1>
                  <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500 sm:text-sm">
                    Your details have been submitted successfully. Our team will
                    review your enquiry and contact you soon.
                  </p>
                  <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> You
                    may safely close this page
                  </div>
                </div>
              </section>
            )}
          </div>
        </form>
        <p className="mt-3 text-center text-xs text-slate-400">
          Powered by Get Fit Malayali
        </p>
      </main>
    </div>
  )
}
