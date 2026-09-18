import moment from 'moment'
import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

const getModeBadge = (mode?: string) => {
  const m = (mode || '').toLowerCase()
  switch (m) {
    case 'upi':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          UPI
        </span>
      )
    case 'bank_transfer':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Bank Transfer
        </span>
      )
    case 'card':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          Card
        </span>
      )
    case 'cash':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Cash
        </span>
      )
    case 'cheque':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Cheque
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
          {m ? m.toUpperCase() : 'N/A'}
        </span>
      )
  }
}

export const getColumns = (navigate?: (path: string) => void) => {
  const createRenderCell =
    (key: string, formatter?: (v: any, row?: any) => any) => (row: any) => {
      const val = getNestedProperty(row, key)
      const cell = formatter ? formatter(val, row) : val
      return { cell, toolTip: typeof cell === 'string' ? cell : '' }
    }

  const formatDate = (d: any) => (d ? moment(d).format('DD-MM-YYYY') : '-')

  const column = [
    {
      title: 'Client',
      field: 'user_name',
      renderCell: createRenderCell('user_name', (val, row) => (
        <button
          type="button"
          className="text-blue-600 hover:underline font-medium text-left"
          onClick={() => navigate && navigate(`/payment-history/${row.id}`)}
        >
          {val || row?.client_name || '-'}
        </button>
      )),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Plan',
      field: 'plan_name',
      renderCell: createRenderCell('plan_name', (val) => (
        <span className="font-medium text-gray-800">{val || '-'}</span>
      )),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Payment Date',
      field: 'payment_date',
      renderCell: createRenderCell('payment_date', (val, row) =>
        formatDate(val || row?.start_date || row?.created_at)
      ),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Mode',
      field: 'payment_mode',
      renderCell: createRenderCell('payment_mode', (val) => getModeBadge(val)),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Transaction ID',
      field: 'transaction_id',
      renderCell: createRenderCell('transaction_id', (val) =>
        val ? (
          <span className="font-mono text-xs text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
            {val}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )
      ),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Amount',
      field: 'amount',
      renderCell: createRenderCell('amount', (val, row) => {
        const amt = val != null ? val : row?.plan_fees
        return (
          <span className="font-semibold text-gray-900">
            {amt != null ? `₹${Number(amt).toLocaleString('en-IN')}` : '-'}
          </span>
        )
      }),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Receipt',
      field: 'receipt_url',
      renderCell: createRenderCell('receipt_url', (val, row) => {
        if (!val) {
          return (
            <span className="text-xs text-gray-400 italic">No receipt</span>
          )
        }
        return (
          <a
            href={val}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded transition-colors"
            title={row?.receipt_filename || 'View uploaded receipt proof'}
          >
            <svg
              className="w-3.5 h-3.5 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            <span>Receipt</span>
          </a>
        )
      }),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Payment Notes',
      field: 'notes',
      renderCell: createRenderCell('notes', (val) => val || '-'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Recorded By',
      field: 'recorded_by.name',
      renderCell: createRenderCell('recorded_by.name', (val) => val || '-'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Status',
      field: 'status',
      renderCell: createRenderCell('status', (val) => {
        const isCompleted = !val || val === 'completed' || val === 'active'
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isCompleted ? 'Completed' : (val || '').toUpperCase()}
          </span>
        )
      }),
      customCell: true,
      ...defaultColumnProps,
    },
  ]

  return column
}

export default getColumns
