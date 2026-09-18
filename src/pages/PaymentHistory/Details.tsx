import type { ReactNode } from 'react'
import moment from 'moment'
import { Link, useParams } from 'react-router-dom'
import { usePaymentDetail } from './api'
import InfoBox from '../../components/app/alertBox/infoBox'
import { getApiErrorMessage } from '../../utilities/commonUtilities'

const date = (value?: string) =>
  value ? moment(value).format('DD MMM YYYY') : '—'
const label = (value?: string) => (value ? value.replace(/_/g, ' ') : '—')

function Field({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-formBorder bg-white p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-secondary">
        {title}
      </dt>
      <dd className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold text-primaryText">
        {children ?? '—'}
      </dd>
    </div>
  )
}

export default function PaymentDetails() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = usePaymentDetail(id)
  const payment = data?.payment
  const subscription = payment?.subscription
  const proposal = payment?.proposal

  return (
    <div className="space-y-5 p-4">
      <Link
        to="/payment-history"
        className="inline-flex text-sm font-medium text-primaryBlue hover:underline"
      >
        ← Payment history
      </Link>
      {isLoading ? (
        <InfoBox content="Loading payment details..." />
      ) : error ? (
        <div className="space-y-3">
          <InfoBox
            content={
              getApiErrorMessage(error) || 'Unable to load this payment.'
            }
          />
          <button
            type="button"
            className="text-sm text-primaryBlue underline"
            onClick={() => refetch()}
          >
            Try again
          </button>
        </div>
      ) : !payment ? (
        <InfoBox content="Payment record not found." />
      ) : (
        <>
          <header className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Payment #{payment.id}
                </p>
                <h1 className="mt-2 text-xl font-bold text-primaryText">
                  {payment.client_name || 'Payment details'}
                </h1>
                <p className="mt-1 text-sm text-secondary">
                  {payment.plan_name || 'Package not recorded'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primaryText">
                  {payment.amount == null
                    ? '—'
                    : `₹${Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </p>
                <span className="mt-2 inline-block rounded-full border border-formBorder bg-white px-3 py-1 text-xs font-semibold capitalize">
                  {label(payment.status)}
                </span>
              </div>
            </div>
          </header>

          <section className="rounded-xl border border-formBorder bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-primaryText">
              Payment details
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field title="Payment date">{date(payment.payment_date)}</Field>
              <Field title="Payment mode">
                <span className="capitalize">
                  {payment.payment_mode === 'upi'
                    ? 'UPI'
                    : label(payment.payment_mode)}
                </span>
              </Field>
              <Field title="Transaction / Reference ID">
                {payment.transaction_id || 'Not recorded'}
              </Field>
              <Field title="Recorded by">
                {payment.recorded_by?.name || 'Not recorded'}
              </Field>
              <Field title="Staff role">
                <span className="capitalize">
                  {label(payment.recorded_by?.role)}
                </span>
              </Field>
              <Field title="Recorded at">
                {payment.created_at
                  ? moment(payment.created_at).format('DD MMM YYYY, h:mm A')
                  : '—'}
              </Field>
              <div className="sm:col-span-2 lg:col-span-3">
                <Field title="Payment notes">
                  {payment.notes || 'No payment notes recorded.'}
                </Field>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Field title="Payment proof">
                  {payment.receipt_url ? (
                    <a
                      href={payment.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primaryBlue underline"
                    >
                      {payment.receipt_filename || 'View receipt'}
                    </a>
                  ) : (
                    'No receipt uploaded.'
                  )}
                </Field>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-formBorder bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-primaryText">
              Client details
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field title="Client">{payment.client_name || '—'}</Field>
              <Field title="Email">{payment.client_email || '—'}</Field>
              <Field title="Phone">{payment.client_phone || '—'}</Field>
            </dl>
          </section>

          <section className="rounded-xl border border-formBorder bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-primaryText">
              Subscription details
            </h2>
            {subscription ? (
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field title="Subscription ID">{subscription.id}</Field>
                <Field title="Package">{subscription.plan_name}</Field>
                <Field title="Status">
                  <span className="capitalize">
                    {label(subscription.status)}
                  </span>
                </Field>
                <Field title="Start date">
                  {date(subscription.start_date)}
                </Field>
                <Field title="End date">{date(subscription.end_date)}</Field>
                <Field title="Created on">
                  {date(subscription.created_at)}
                </Field>
              </dl>
            ) : (
              <InfoBox content="No subscription is linked to this payment yet." />
            )}
            {proposal && (
              <div className="mt-5">
                <h3 className="mb-3 text-sm font-semibold text-primaryText">
                  Linked package proposal
                </h3>
                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field title="Package">{proposal.plan_name}</Field>
                  <Field title="Proposal ID">{proposal.id}</Field>
                  <Field title="Status">
                    <span className="capitalize">{label(proposal.status)}</span>
                  </Field>
                  <Field title="Anticipated start">
                    {date(proposal.start_date)}
                  </Field>
                  <Field title="Anticipated end">
                    {date(proposal.end_date)}
                  </Field>
                  <Field title="Proposal notes">{proposal.notes || '—'}</Field>
                </dl>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
