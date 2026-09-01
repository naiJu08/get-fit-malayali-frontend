import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { acceptPublicLeadConfirmation, getPublicLeadConfirmation } from './api'

const accent = '#0fc8cd'

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

  const styles = (
    <style>{`
      * { box-sizing: border-box; }
      html, body, #root { margin: 0; padding: 0; height: 100%; overflow: hidden; }
      @keyframes pubFadeIn {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pubPop {
        0% { opacity: 0; transform: scale(0.72); }
        70% { transform: scale(1.08); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes pubDraw {
        from { stroke-dashoffset: 48; }
        to { stroke-dashoffset: 0; }
      }
      .pub-animate-in { animation: pubFadeIn .5s ease-out both; }
      .pub-animate-d1 { animation: pubFadeIn .5s .15s ease-out both; }
      .pub-animate-d2 { animation: pubFadeIn .5s .3s ease-out both; }
      .pub-pop { animation: pubPop .55s cubic-bezier(.2,.8,.2,1) both; }
      .pub-draw { stroke-dasharray: 48; animation: pubDraw .6s .25s ease-out both; }
      .msg-scroll::-webkit-scrollbar { width: 4px; }
      .msg-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      .msg-scroll::-webkit-scrollbar-track { background: transparent; }
    `}</style>
  )

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 p-4 sm:p-6 overflow-hidden">
        <div className="w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-5 sm:p-8 text-center shadow-xl shadow-slate-200/60">
          <img
            src="/gfm-logo.png"
            alt="Get Fit Malayali"
            className="mx-auto h-12 sm:h-16 w-auto object-contain mb-4 sm:mb-6"
          />
          <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-slate-100 border-t-primaryGreen" />
          <h1 className="mt-4 sm:mt-5 text-base sm:text-lg font-semibold text-slate-800">
            Loading confirmation
          </h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500">
            This will only take a moment.
          </p>
        </div>
        {styles}
      </div>
    )
  }

  if (error || !confirmation) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 p-4 sm:p-6 overflow-hidden">
        <div className="w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-5 sm:p-8 text-center shadow-xl shadow-slate-200/60">
          <img
            src="/gfm-logo.png"
            alt="Get Fit Malayali"
            className="mx-auto h-12 sm:h-16 w-auto object-contain mb-4 sm:mb-6"
          />
          <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-red-50">
            <svg
              className="h-6 w-6 sm:h-8 sm:w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="mt-4 sm:mt-5 text-lg sm:text-xl font-semibold text-slate-800">
            Link unavailable
          </h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-500">
            This confirmation link may have expired, already been used, or the
            URL may be incorrect.
          </p>
        </div>
        {styles}
      </div>
    )
  }

  const isAccepted = accepted || confirmation.accepted

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 p-3 sm:p-6 overflow-hidden">
      {styles}

      <div className="w-full max-w-lg sm:max-w-2xl h-full max-h-full flex flex-col pub-animate-in">
        <div className="rounded-2xl sm:rounded-3xl border border-slate-100/80 bg-white/90 backdrop-blur-sm shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden h-full">
          <div
            className="h-1 w-full shrink-0"
            style={{
              background: `linear-gradient(90deg, ${accent}, #667eea, ${accent})`,
            }}
          />

          <div className="shrink-0 px-4 sm:px-8 pt-4 sm:pt-6 pb-2 sm:pb-3 text-center pub-animate-in">
            <img
              src="/gfm-logo.png"
              alt="Get Fit Malayali"
              className="mx-auto h-10 sm:h-14 w-auto object-contain mb-2 sm:mb-3"
            />
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-r from-teal-50 to-blue-50 px-3 sm:px-4 py-1 sm:py-1.5 border border-teal-100/60">
              <svg
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0"
                style={{ color: accent }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider"
                style={{ color: accent }}
              >
                Client Confirmation
              </span>
            </div>
          </div>

          <div className="shrink-0 px-4 sm:px-8 text-center pub-animate-d1">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900">
              Hello, {confirmation.first_name || 'there'}!
            </h1>
            <p className="mt-1 text-[11px] sm:text-sm leading-5 text-slate-500">
              Please review the details below and confirm everything is correct.
            </p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-3 sm:py-4 msg-scroll pub-animate-d2">
            <div className="rounded-xl sm:rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/80 to-blue-50/30 p-3 sm:p-5">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div
                  className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${accent}14` }}
                >
                  <svg
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    style={{ color: accent }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Review Details
                </span>
              </div>
              <div className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-5 sm:leading-7 text-slate-700">
                {confirmation.message}
              </div>
            </div>
          </div>

          <div className="shrink-0 px-4 sm:px-8 py-3 sm:py-4 pub-animate-d2">
            {isAccepted ? (
              <div className="text-center py-1">
                <div
                  className="relative mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full pub-pop"
                  style={{ backgroundColor: `${accent}14` }}
                >
                  <div
                    className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full shadow-lg"
                    style={{ backgroundColor: accent }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 34 34"
                      fill="none"
                      className="sm:w-7 sm:h-7"
                    >
                      <path
                        d="M8 17.5l6 6L27 10"
                        stroke="white"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="pub-draw"
                      />
                    </svg>
                  </div>
                </div>
                <div style={{ animation: 'pubFadeIn .45s .2s ease-out both' }}>
                  <p
                    className="mt-3 text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em]"
                    style={{ color: accent }}
                  >
                    Confirmed
                  </p>
                  <h2 className="mt-1 text-base sm:text-xl font-bold text-slate-900">
                    Thank you!
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Your confirmation has been recorded successfully.
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-[10px] sm:text-xs font-medium text-slate-500 border border-slate-100">
                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500" />
                    You may safely close this page
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={accept}
                disabled={busy}
                className="w-full rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 text-white font-semibold text-sm sm:text-base transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${accent}, #0ea5a8)`,
                  boxShadow: `0 4px 20px ${accent}40`,
                }}
              >
                {busy ? (
                  <>
                    <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Accept and Confirm
                  </>
                )}
              </button>
            )}
            {message && (
              <div className="mt-2 sm:mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-2.5 sm:p-3 text-[11px] sm:text-sm text-red-600">
                <svg
                  className="h-4 w-4 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="break-words">{message}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/30 px-4 sm:px-8 py-2 sm:py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-slate-400">
              <svg
                className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Powered by{' '}
              <span className="font-semibold text-slate-500">
                Get Fit Malayali
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
