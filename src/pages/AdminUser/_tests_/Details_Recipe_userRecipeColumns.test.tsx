import {
  createRenderCell,
  getUserRecipeColumns,
} from '../Details/Recipe.tsx/userRecipeColumns'

describe('Recipe userRecipeColumns', () => {
  it('builds expected columns and wires row click handler', () => {
    const onNameClick = jest.fn()
    const columns = getUserRecipeColumns(onNameClick)

    expect(columns).toHaveLength(7)
    expect(columns[0]).toMatchObject({
      title: 'Name',
      field: 'recipe.name',
      sortable: false,
      resizable: true,
      isVisible: true,
      fixed: true,
      customCell: true,
      link: true,
      rowClick: onNameClick,
    })
  })

  it('formats recipe names and falls back to dashes for missing values', () => {
    const columns = getUserRecipeColumns()

    expect(columns[0].renderCell({ recipe: { name: 'paneer butter masala' } }))
      .toEqual({
        cell: 'Paneer Butter Masala',
        toolTip: 'Paneer Butter Masala',
      })

    expect(columns[1].renderCell({ recipe: { meal_category: null } })).toEqual({
      cell: '--',
      toolTip: '--',
    })
  })

  it('formats date fields when using the date renderer helper', () => {
    const renderDate = createRenderCell('created_at', 'date')
    const rendered = renderDate({ created_at: '2026-01-15T10:30:00Z' })

    expect(rendered.cell).toBe(rendered.toolTip)
    expect(rendered.cell).toContain('15-01-2026')

    expect(renderDate({ created_at: '' })).toEqual({
      cell: '--',
      toolTip: '--',
    })
  })
})
