import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { acceptPublicLeadConfirmation, getPublicLeadConfirmation } from './api'

export default function PublicConfirmation() {
  const { token = '' } = useParams()
  const { data, isLoading, error } = useQuery(
    ['public_lead_confirmation', token],
    () => getPublicLeadConfirmation(token),
    { enabled: Boolean(token), retry: 1 }
  )
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const confirmation = data?.confirmation || data
  const accept = async () => {
    try {
      setBusy(true)
      await acceptPublicLeadConfirmation(token)
      setAccepted(true)
    } catch (e: any) {
      setMessage(e?.response?.data?.error || 'Unable to accept confirmation.')
    } finally {
      setBusy(false)
    }
  }
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading confirmation...
      </div>
    )
  if (error || !confirmation)
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="rounded-xl border bg-white p-8 text-center">
          This confirmation link is unavailable.
        </div>
      </div>
    )
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <div className="w-full max-w-2xl rounded-2xl border bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Client confirmation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Hello {confirmation.first_name || 'there'}, please review the message
          below.
        </p>
        <div className="mt-6 rounded-xl bg-slate-50 p-5 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {confirmation.message}
        </div>
        {accepted || confirmation.accepted ? (
          <div className="mt-6 rounded-lg bg-emerald-50 text-emerald-700 p-4">
            Thank you. Your confirmation has been recorded.
          </div>
        ) : (
          <button
            className="mt-6 w-full rounded-lg bg-primaryGreen text-white px-4 py-3 disabled:opacity-50"
            disabled={busy}
            onClick={accept}
          >
            {busy ? 'Submitting...' : 'Accept and confirm'}
          </button>
        )}
        {message && <div className="mt-3 text-sm text-rose-600">{message}</div>}
      </div>
    </div>
  )
}
