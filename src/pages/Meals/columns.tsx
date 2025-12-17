import moment from 'moment'
import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

const capitalizeFirst = (value: unknown) => {
  const str = typeof value === 'string' ? value : ''
  if (!str) return str
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

export const getMealsColumns = (onNameClick?: (row: any) => void) => {
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
        const label = value ? 'Yes' : 'No'
        return { cell: label, toolTip: label }
      }
      const rawValue = getNestedProperty(row, key)
      const displayValue = key === 'name' ? capitalizeFirst(rawValue) : rawValue
      return {
        cell: displayValue,
        toolTip: displayValue ?? '',
      }
    }

  return [
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
      title: 'Serving Quantity',
      field: 'default_serving_quantity',
      renderCell: createRenderCell('default_serving_quantity'),
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
      renderCell: createRenderCell('total_calories'),
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
}
