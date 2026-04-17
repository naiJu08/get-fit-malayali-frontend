import moment from 'moment'
import { getNestedProperty } from '../../utilities/parsers'
import { Checkbox } from '@mui/material'

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

export const getMealsColumns = (
  onNameClick?: (row: any) => void,
  selectedItems?: Set<number>,
  onSelectItem?: (id: number, checked: boolean) => void,
  onSelectAll?: (checked: boolean) => void
) => {
  const createRenderCell =
    (key: string, type?: 'date' | 'boolean') => (row: any) => {
      if (type === 'date') {
        const value = getNestedProperty(row, key)
        const formatted = value ? moment(value).format('DD-MM-YYYY') : ''
        return {
          cell: <>{formatted}</>,
          toolTip: formatted,
        }
      }
      if (type === 'boolean') {
        const value = getNestedProperty(row, key)
        const isActive =
          (typeof value === 'boolean' && value === true) ||
          (typeof value === 'number' && value === 1) ||
          (typeof value === 'string' &&
            (value === '1' ||
              value.toLowerCase() === 'true' ||
              value.toLowerCase() === 'active'))
        return {
          cell: (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          ),
          toolTip: isActive ? 'Active' : 'Inactive',
        }
      }
      const rawValue = getNestedProperty(row, key)
      const displayValue = key === 'name' ? toTitleCase(rawValue) : rawValue
      return {
        cell: displayValue,
        toolTip: displayValue ?? '',
      }
    }

  const columns = [
    ...(selectedItems && onSelectItem && onSelectAll
      ? [
          {
            title: '',
            field: 'checkbox',
            width: 50,
            ...defaultColumnProps,
            fixed: true,
            renderCell: (row: any) => ({
              cell: (
                <Checkbox
                  checked={selectedItems.has(row.id)}
                  onChange={(e) => onSelectItem(row.id, e.target.checked)}
                  size="small"
                />
              ),
              toolTip: 'Select item',
            }),
            customCell: true,
          },
        ]
      : []),
    {
      title: 'Name',
      field: 'name',
      ...defaultColumnProps,
      fixed: true,
      renderCell: createRenderCell('name'),
      customCell: true,
      sortKey: 'name',
      link: true,
      rowClick: onNameClick,
    },
    {
      title: 'Meal Time',
      field: 'meal_time',
      renderCell: createRenderCell('meal_time'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Meal Category',
      field: 'meal_category',
      renderCell: createRenderCell('meal_category'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Serving Unit',
      field: 'serving_unit',
      renderCell: createRenderCell('serving_unit'),
      customCell: true,
      ...defaultColumnProps,
    },

    {
      title: 'Total Calories',
      field: 'total_calories',
      renderCell: (row: any) => {
        const calories =
          getNestedProperty(row, 'per_serving.calories') ??
          getNestedProperty(row, 'per_serving_calories') ??
          getNestedProperty(row, 'total_calories') ??
          '--'
        const displayValue = calories === '--' ? calories : `${calories}`
        return {
          cell: displayValue,
          toolTip: displayValue,
        }
      },
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Status',
      field: 'status',
      renderCell: createRenderCell('status', 'boolean'),
      customCell: true,
      ...defaultColumnProps,
    },

    // keep Created At if you still want it
    // {
    //   title: 'Created At',
    //   field: 'created_at',
    //   renderCell: createRenderCell('created_at', 'date'),
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
  ]

  return columns
}
