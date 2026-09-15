import moment from 'moment'

import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

const toTitleCase = (value: unknown) => {
  const str = typeof value === 'string' ? value : ''
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const getDietTemplateCategoryColumns = () => {
  return [
    {
      title: 'Name',
      field: 'name',
      renderCell: (row: any) => {
        const value = toTitleCase(getNestedProperty(row, 'name'))
        return {
          cell: value,
          toolTip: value,
        }
      },
      customCell: true,
      sortKey: 'name',
      ...defaultColumnProps,
    },
    {
      title: 'Status',
      field: 'status',
      renderCell: (row: any) => {
        const raw = getNestedProperty(row, 'status')
        const isActive =
          typeof raw === 'string' && raw.trim().toLowerCase() === 'active'
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
}
