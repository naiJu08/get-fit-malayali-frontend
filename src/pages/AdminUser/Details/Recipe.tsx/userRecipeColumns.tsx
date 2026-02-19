import moment from 'moment'

import { getNestedProperty } from '../../../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

type ColumnBuilder = (row: any) => { cell: React.ReactNode; toolTip?: string }

const createRenderCell = (
  path: string,
  type?: 'date' | 'text'
): ColumnBuilder => {
  return (row: any) => {
    const value = getNestedProperty(row, path)
    if (type === 'date') {
      const formatted = value ? moment(value).format('DD-MM-YYYY HH:mm') : '--'
      return { cell: formatted, toolTip: formatted }
    }
    return { cell: value ?? '--', toolTip: value ?? '--' }
  }
}

export const getUserRecipeColumns = (onNameClick?: (row: any) => void) => {
  return [
    {
      title: 'Name',
      field: 'recipe.name',
      ...defaultColumnProps,
      fixed: true,
      customCell: true,
      renderCell: createRenderCell('recipe.name'),
      link: true,
      rowClick: onNameClick,
    },
    {
      title: 'Category',
      field: 'recipe.meal_category',
      ...defaultColumnProps,
      customCell: true,
      renderCell: createRenderCell('recipe.meal_category'),
    },
    {
      title: 'Calories',
      field: 'recipe.nutrition.calories',
      ...defaultColumnProps,
      customCell: true,
      renderCell: createRenderCell('recipe.nutrition.calories'),
    },
    {
      title: 'Protein',
      field: 'recipe.nutrition.protein',
      ...defaultColumnProps,
      customCell: true,
      renderCell: createRenderCell('recipe.nutrition.protein'),
    },
    {
      title: 'Carbs',
      field: 'recipe.nutrition.carbs',
      ...defaultColumnProps,
      customCell: true,
      renderCell: createRenderCell('recipe.nutrition.carbs'),
    },
    {
      title: 'Fat',
      field: 'recipe.nutrition.fat',
      ...defaultColumnProps,
      customCell: true,
      renderCell: createRenderCell('recipe.nutrition.fat'),
    },
    {
      title: 'Fiber',
      field: 'recipe.nutrition.fiber',
      ...defaultColumnProps,
      customCell: true,
      renderCell: createRenderCell('recipe.nutrition.fiber'),
    },
  ]
}
