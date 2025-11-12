import moment from 'moment'
import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

export const getRecipeColumns = (onNameClick?: (row: any) => void) => {
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
    } else if (isCustom === 'boolean') {
      const value = getNestedProperty(row, key)
      const label = value ? 'Yes' : 'No'
      return { cell: label, toolTip: label }
    } else if (isCustom === 'link') {
      const propertyValue = getNestedProperty(row, key)
      const url = typeof propertyValue === 'string' ? propertyValue : ''
      return {
        cell: url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2563eb' }}
          >
            {url}
          </a>
        ) : (
          ''
        ),
        toolTip: url || '',
      }
    }
    return {
      cell: getNestedProperty(row, key),
      toolTip: getNestedProperty(row, key) ?? '',
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
      title: 'Category',
      field: 'category',
      renderCell: createRenderCell('category'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Calories',
      field: 'calories',
      renderCell: createRenderCell('calories'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Portion Size',
      field: 'portion_size',
      renderCell: createRenderCell('portion_size'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Low Calorie',
      field: 'low_calorie',
      renderCell: createRenderCell('low_calorie', 'boolean'),
      customCell: true,
      ...defaultColumnProps,
    },
    // {
    //   title: 'Image URL',
    //   field: 'image_url',
    //   renderCell: createRenderCell('image_url', 'link'),
    //   customCell: true,
    //   ...defaultColumnProps,
    // },

    // {
    //   title: 'Created By',
    //   field: 'created_by',
    //   renderCell: createRenderCell('created_by'),
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
    // {
    //   title: 'Created At',
    //   field: 'created_at',
    //   renderCell: createRenderCell('created_at', 'date'),
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
  ]
}
