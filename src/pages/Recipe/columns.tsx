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
      field: 'meal_category',
      renderCell: createRenderCell('meal_category'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Calories',
      field: 'nutrition.calories',
      renderCell: createRenderCell('nutrition.calories'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Portion Size',
      field: 'serving_unit',
      renderCell: createRenderCell('serving_unit'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Image',
      field: 'image_url', // or whatever field your API returns
      customCell: true,
      ...defaultColumnProps,
      renderCell: (row: any) => {
        const url = getNestedProperty(row, 'image_url') // adjust key if needed
        return {
          cell: url ? (
            <div className="w-14 h-14 rounded-md overflow-hidden border bg-gray-50">
              <img
                src={url}
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            '--'
          ),
          toolTip: url || '',
        }
      },
    },
  ]
}
