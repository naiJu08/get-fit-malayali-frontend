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
        cell: isActive ? 'Active' : 'Inactive',
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
      renderCell: createRenderCell('name'),
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
      title: 'Active',
      field: 'active',
      renderCell: createRenderCell('active', 'boolean'),
      ...defaultColumnProps,
      customCell: true,
    },
    {
      title: 'Created By',
      field: 'created_by',
      renderCell: createRenderCell('created_by'),
      ...defaultColumnProps,
      customCell: true,
    },
  ]

  return column
}
