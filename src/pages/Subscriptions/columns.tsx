import moment from 'moment'

import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

export const getColumns = (onNameClick?: (row: any) => void) => {
  const createRenderCell =
    (key: string, formatter?: (v: any) => any) => (row: any) => {
      const val = getNestedProperty(row, key)
      const cell = formatter ? formatter(val) : val
      return { cell, toolTip: typeof cell === 'string' ? cell : '' }
    }

  const formatDate = (d: any) => (d ? moment(d).format('DD-MM-YYYY') : '')

  const getStatusBadge = (status: any) => {
    const raw = status === null || status === undefined ? '' : String(status)
    const key = raw.toLowerCase()
    const statusColors: { [k: string]: string } = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      paused: 'bg-red-100 text-red-800 border-red-200',
      suspended: 'bg-red-100 text-red-800 border-red-200',
      expired: 'bg-orange-100 text-orange-800 border-orange-200',
      canceled: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-blue-100 text-blue-800 border-blue-200',
      dropped_out: 'bg-blue-100 text-blue-800 border-blue-200',
    }
    const colorClass =
      statusColors[key] || 'bg-gray-100 text-gray-800 border-gray-200'
    const label = raw
      ? key === 'dropped_out' || key === 'dropped out'
        ? 'Dropped Out'
        : raw.charAt(0).toUpperCase() + raw.slice(1)
      : '--'
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
      >
        {label}
      </span>
    )
  }

  const column = [
    {
      title: 'Client',
      field: 'user_name',
      renderCell: (row: any) => {
        const value = getNestedProperty(row, 'user_name')
        return {
          cell: (
            <button
              className="text-blue-600 hover:underline"
              onClick={() => onNameClick && onNameClick(row)}
              type="button"
            >
              {value ?? ''}
            </button>
          ),
          toolTip: value ?? '',
        }
      },
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Plan',
      field: 'plan_name',
      renderCell: createRenderCell('plan_name'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Start Date',
      field: 'start_date',
      renderCell: createRenderCell('start_date', formatDate),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'End Date',
      field: 'end_date',
      renderCell: createRenderCell('end_date', formatDate),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Days Remaining',
      field: 'days_remaining',
      renderCell: createRenderCell('days_remaining'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Status',
      field: 'status',
      renderCell: createRenderCell('status', getStatusBadge),
      customCell: true,
      ...defaultColumnProps,
    },
  ]

  return column
}

export default getColumns
