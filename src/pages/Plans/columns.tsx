import moment from 'moment'

import { convertUTCtoBrowserTimeZone } from '../../utilities/format'
import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

export const getColumns = (onNameClick?: (row: any) => void) => {
  const createRenderCell = (key: string, isCustom?: string) => (row: any) => {
    if (isCustom === 'date') {
      return {
        cell: (
          <>
            {getNestedProperty(row, key)
              ? moment(getNestedProperty(row, key)).format('DD-MM-YYYY')
              : ''}
          </>
        ),
      }
    } else if (isCustom === 'fulldate') {
      const propertyValue = getNestedProperty(row, key)

      return {
        cell: convertUTCtoBrowserTimeZone(propertyValue),
        toolTip: getNestedProperty(row, key) ?? '',
      }
    } else if (isCustom === 'boolean') {
      const value = getNestedProperty(row, key)
      const isActive =
        (typeof value === 'boolean' && value === true) ||
        (typeof value === 'number' && value === 1) ||
        (typeof value === 'string' &&
          (value === '1' || value.toLowerCase() === 'true'))
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
    } else {
      return {
        cell: getNestedProperty(row, key),
        toolTip: getNestedProperty(row, key) ?? '',
      }
    }
  }

  const column = [
    {
      title: 'Name',
      field: 'name',
      ...defaultColumnProps,
      fixed: true,
      renderCell: (row: any) => {
        const value = getNestedProperty(row, 'name')
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
      sortKey: 'name',
      link: true,
      rowClick: onNameClick,
    },
    {
      title: 'Category',
      field: 'category',
      renderCell: createRenderCell('category'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Duration (days)',
      renderCell: createRenderCell('duration_days'),
      field: 'duration_days',
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Description',
      renderCell: createRenderCell('description'),
      field: 'description',
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'fees',
      renderCell: createRenderCell('fees'),
      field: 'fees',
      customCell: true,
      ...defaultColumnProps,
    },

    {
      title: 'Active',
      field: 'active',
      renderCell: createRenderCell('active', 'boolean'),
      ...defaultColumnProps,
      customCell: true,
    },
  ]

  return column
}
