import moment from 'moment'

import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

const truncateText = (value?: string, limit = 80) => {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.length <= limit) return trimmed
  return `${trimmed.slice(0, limit).trim()}...`
}

export const getAssessmentCategoryColumns = ({
  onNameClick,
}: {
  onNameClick?: (row: any) => void
} = {}) => [
  {
    title: 'Name',
    field: 'name',
    renderCell: (row: any) => {
      const value = String(getNestedProperty(row, 'name') ?? '')
      const displayValue = truncateText(value, 50)
      if (onNameClick) {
        return {
          cell: (
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => onNameClick(row)}
            >
              {displayValue}
            </button>
          ),
          toolTip: value,
        }
      }

      return {
        cell: displayValue,
        toolTip: value,
      }
    },
    customCell: true,
    link: Boolean(onNameClick),
    rowClick: onNameClick,
    sortKey: 'name',
    ...defaultColumnProps,
  },
  {
    title: 'Description',
    field: 'description',
    renderCell: (row: any) => {
      const value = String(getNestedProperty(row, 'description') ?? '')
      return {
        cell: (
          <div className="max-w-xs truncate">{truncateText(value, 120)}</div>
        ),
        toolTip: value,
      }
    },
    customCell: true,
    ...defaultColumnProps,
  },
  {
    title: 'Questions',
    field: 'assessment_questions',
    renderCell: (row: any) => {
      const count = Array.isArray(row?.assessment_questions)
        ? row.assessment_questions.length
        : 0
      return {
        cell: count,
        toolTip: String(count),
      }
    },
    customCell: true,
    ...defaultColumnProps,
  },
  {
    title: 'Status',
    field: 'active',
    renderCell: (row: any) => {
      const isActive =
        row?.active === true ||
        String(row?.status ?? '').toLowerCase() === 'active'
      const label = isActive ? 'Active' : 'Inactive'
      return {
        cell: (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {label}
          </span>
        ),
        toolTip: label,
      }
    },
    customCell: true,
    ...defaultColumnProps,
  },
  {
    title: 'Created At',
    field: 'created_at',
    renderCell: (row: any) => {
      const value = getNestedProperty(row, 'created_at')
      const formatted = value ? moment(value).format('DD-MM-YYYY') : ''
      return {
        cell: formatted,
        toolTip: formatted,
      }
    },
    customCell: true,
    ...defaultColumnProps,
  },
]
