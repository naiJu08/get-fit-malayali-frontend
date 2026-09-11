import moment from 'moment'
import { getNestedProperty } from '../../utilities/parsers'

const toTitleCase = (value: any) => {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

export const getRecipeColumns = (
  onNameClick?: (row: any) => void,
  options?: { userMode?: boolean }
) => {
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

  const nameField = options?.userMode ? 'recipe.name' : 'name'

  return [
    {
      title: 'Name',
      field: nameField,
      ...defaultColumnProps,
      fixed: true,
      renderCell: (row: any) => {
        const raw = getNestedProperty(row, nameField)
        const formatted = toTitleCase(raw)
        return {
          cell: formatted,
          toolTip: formatted,
        }
      },
      customCell: true,
      sortKey: 'name',
      link: true,
      rowClick: onNameClick,
    },
    {
      title: 'Category',
      field: options?.userMode ? 'recipe.meal_category' : 'meal_category',
      renderCell: options?.userMode
        ? createRenderCell('recipe.meal_category')
        : createRenderCell('meal_category'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Calories',
      field: options?.userMode
        ? 'recipe.nutrition.calories'
        : 'nutrition.calories',
      renderCell: options?.userMode
        ? createRenderCell('recipe.nutrition.calories')
        : createRenderCell('nutrition.calories'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Protein',
      field: options?.userMode
        ? 'recipe.nutrition.protein'
        : 'nutrition.protein',
      renderCell: options?.userMode
        ? createRenderCell('recipe.nutrition.protein')
        : createRenderCell('nutrition.protein'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Carbs',
      field: options?.userMode ? 'recipe.nutrition.carbs' : 'nutrition.carbs',
      renderCell: options?.userMode
        ? createRenderCell('recipe.nutrition.carbs')
        : createRenderCell('nutrition.carbs'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Fat',
      field: options?.userMode ? 'recipe.nutrition.fat' : 'nutrition.fat',
      renderCell: options?.userMode
        ? createRenderCell('recipe.nutrition.fat')
        : createRenderCell('nutrition.fat'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Fiber',
      field: options?.userMode ? 'recipe.nutrition.fiber' : 'nutrition.fiber',
      renderCell: options?.userMode
        ? createRenderCell('recipe.nutrition.fiber')
        : createRenderCell('nutrition.fiber'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Portion Size',
      field: options?.userMode ? 'recipe.serving_unit' : 'serving_unit',
      renderCell: options?.userMode
        ? createRenderCell('recipe.serving_unit')
        : createRenderCell('serving_unit'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Image',
      field: options?.userMode ? 'recipe.image_url' : 'image_url',
      customCell: true,
      ...defaultColumnProps,
      renderCell: (row: any) => {
        const url = getNestedProperty(
          row,
          options?.userMode ? 'recipe.image_url' : 'image_url'
        )
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
    ...(options?.userMode
      ? [
          {
            title: 'Assigned At',
            field: 'assigned_at',
            renderCell: createRenderCell('assigned_at', 'date'),
            customCell: true,
            ...defaultColumnProps,
          },
          {
            title: 'Notes',
            field: 'notes',
            renderCell: createRenderCell('notes'),
            customCell: true,
            ...defaultColumnProps,
          },
        ]
      : []),
  ]
}
