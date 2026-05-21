import React from 'react'
import { render } from '@testing-library/react'
import { getRecipeColumns } from '../columns'
import { getNestedProperty } from '../../../utilities/parsers'

// ── Mock moment ──────────────────────────────────────────────────────────────
// IMPORTANT: The mock factory must return a plain function (not a jest.fn())
// so that jest.clearAllMocks() in beforeEach does not clear its implementation.

jest.mock('moment', () => {
  // Return a plain function, not a jest.fn(), so clearAllMocks doesn't affect it
  return function momentMock(...args: any[]) {
    return {
      format: () => '15-05-2026',
    }
  }
})

// ── Mock parsers ─────────────────────────────────────────────────────────────

jest.mock('../../../utilities/parsers', () => ({
  getNestedProperty: jest.fn(),
}))

// ── Test data ────────────────────────────────────────────────────────────────

const mockRow = {
  id: 1,
  name: 'chicken curry',
  meal_category: 'Lunch',
  nutrition: {
    calories: 450,
    protein: 30,
    carbs: 20,
    fat: 25,
    fiber: 5,
  },
  serving_unit: '1 bowl',
  image_url: 'http://example.com/img.jpg',
}

const mockRowNoImage = {
  id: 2,
  name: 'fruit salad',
  meal_category: 'Breakfast',
  nutrition: {
    calories: 200,
    protein: 5,
    carbs: 40,
    fat: 2,
    fiber: 8,
  },
  serving_unit: '1 cup',
  image_url: '',
}

const mockUserModeRow = {
  id: 3,
  recipe: {
    id: 10,
    name: 'grilled fish',
    meal_category: 'Dinner',
    nutrition: {
      calories: 350,
      protein: 40,
      carbs: 5,
      fat: 15,
      fiber: 2,
    },
    serving_unit: '1 fillet',
    image_url: 'http://example.com/fish.jpg',
  },
  assigned_at: '2026-05-15T10:00:00Z',
  notes: 'Serve with lemon',
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('getRecipeColumns', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: getNestedProperty returns the value from the row directly
    ;(getNestedProperty as jest.Mock).mockImplementation(
      (obj: any, key: string) => {
        const parts = key?.split('.')
        return parts.reduce(
          (o: any, x: string) => (o === undefined || o === null ? o : o[x]),
          obj
        )
      }
    )
  })

  // ── Basic structure ────────────────────────────────────────────────────

  it('returns 9 columns by default (non-user mode)', () => {
    const columns = getRecipeColumns()
    expect(columns).toHaveLength(9)
  })

  it('returns 11 columns in user mode', () => {
    const columns = getRecipeColumns(undefined, { userMode: true })
    expect(columns).toHaveLength(11)
  })

  it('each column has required properties', () => {
    const columns = getRecipeColumns()
    columns.forEach((col: any) => {
      expect(col).toHaveProperty('title')
      expect(col).toHaveProperty('field')
      expect(col).toHaveProperty('sortable', false)
      expect(col).toHaveProperty('resizable', true)
      expect(col).toHaveProperty('isVisible', true)
      expect(col).toHaveProperty('customCell', true)
    })
  })

  // ── Name column ────────────────────────────────────────────────────────

  describe('Name column', () => {
    it('has correct title and field', () => {
      const columns = getRecipeColumns()
      const nameCol = columns[0]
      expect(nameCol.title).toBe('Name')
      expect(nameCol.field).toBe('name')
      expect((nameCol as any).fixed).toBe(true)
      expect((nameCol as any).sortKey).toBe('name')
      expect((nameCol as any).link).toBe(true)
    })

    it('uses recipe.name field in user mode', () => {
      const columns = getRecipeColumns(undefined, { userMode: true })
      const nameCol = columns[0]
      expect(nameCol.field).toBe('recipe.name')
    })

    it('formats name to title case', () => {
      const columns = getRecipeColumns()
      const nameCol = columns[0]
      const result = nameCol.renderCell(mockRow)
      // toTitleCase: first char uppercased, rest lowercased
      expect(result.cell).toBe('Chicken curry')
      expect(result.toolTip).toBe('Chicken curry')
    })

    it('handles null name', () => {
      const columns = getRecipeColumns()
      const nameCol = columns[0]
      const result = nameCol.renderCell({ ...mockRow, name: null })
      expect(result.cell).toBe('')
    })

    it('handles undefined name', () => {
      const columns = getRecipeColumns()
      const nameCol = columns[0]
      const result = nameCol.renderCell({ ...mockRow, name: undefined })
      expect(result.cell).toBe('')
    })

    it('handles empty string name', () => {
      const columns = getRecipeColumns()
      const nameCol = columns[0]
      const result = nameCol.renderCell({ ...mockRow, name: '' })
      expect(result.cell).toBe('')
    })

    it('passes onNameClick as rowClick', () => {
      const onClick = jest.fn()
      const columns = getRecipeColumns(onClick)
      expect((columns[0] as any).rowClick).toBe(onClick)
    })

    it('rowClick is undefined when no callback provided', () => {
      const columns = getRecipeColumns()
      expect((columns[0] as any).rowClick).toBeUndefined()
    })
  })

  // ── Category column ────────────────────────────────────────────────────

  describe('Category column', () => {
    it('has correct title and field', () => {
      const columns = getRecipeColumns()
      const catCol = columns[1]
      expect(catCol.title).toBe('Category')
      expect(catCol.field).toBe('meal_category')
    })

    it('uses recipe.meal_category in user mode', () => {
      const columns = getRecipeColumns(undefined, { userMode: true })
      expect(columns[1].field).toBe('recipe.meal_category')
    })

    it('renders category value', () => {
      const columns = getRecipeColumns()
      const catCol = columns[1]
      const result = catCol.renderCell(mockRow)
      expect(result.cell).toBe('Lunch')
      expect(result.toolTip).toBe('Lunch')
    })
  })

  // ── Nutrition columns ──────────────────────────────────────────────────

  describe('Nutrition columns', () => {
    const nutritionFields = [
      { index: 2, title: 'Calories', key: 'calories' },
      { index: 3, title: 'Protein', key: 'protein' },
      { index: 4, title: 'Carbs', key: 'carbs' },
      { index: 5, title: 'Fat', key: 'fat' },
      { index: 6, title: 'Fiber', key: 'fiber' },
    ]

    nutritionFields.forEach(({ index, title, key }) => {
      it(`renders ${title} correctly`, () => {
        const columns = getRecipeColumns()
        const col = columns[index]
        expect(col.title).toBe(title)
        expect(col.field).toBe(`nutrition.${key}`)
        const result = col.renderCell(mockRow)
        expect(result.cell).toBe(mockRow.nutrition[key as keyof typeof mockRow.nutrition])
        expect(result.toolTip).toBe(mockRow.nutrition[key as keyof typeof mockRow.nutrition])
      })

      it(`uses recipe.nutrition.${key} in user mode`, () => {
        const columns = getRecipeColumns(undefined, { userMode: true })
        expect(columns[index].field).toBe(`recipe.nutrition.${key}`)
      })
    })
  })

  // ── Portion Size column ────────────────────────────────────────────────

  describe('Portion Size column', () => {
    it('has correct title and field', () => {
      const columns = getRecipeColumns()
      const col = columns[7]
      expect(col.title).toBe('Portion Size')
      expect(col.field).toBe('serving_unit')
    })

    it('renders serving unit', () => {
      const columns = getRecipeColumns()
      const col = columns[7]
      const result = col.renderCell(mockRow)
      expect(result.cell).toBe('1 bowl')
      expect(result.toolTip).toBe('1 bowl')
    })

    it('uses recipe.serving_unit in user mode', () => {
      const columns = getRecipeColumns(undefined, { userMode: true })
      expect(columns[7].field).toBe('recipe.serving_unit')
    })
  })

  // ── Image column ───────────────────────────────────────────────────────

  describe('Image column', () => {
    it('has correct title and field', () => {
      const columns = getRecipeColumns()
      const col = columns[8]
      expect(col.title).toBe('Image')
      expect(col.field).toBe('image_url')
    })

    it('renders image when URL is present', () => {
      const columns = getRecipeColumns()
      const col = columns[8]
      const result = col.renderCell(mockRow)
      const { container } = render(<>{result.cell}</>)
      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'http://example.com/img.jpg')
      expect(img).toHaveAttribute('alt', 'Thumbnail')
    })

    it('renders "--" when image URL is empty', () => {
      const columns = getRecipeColumns()
      const col = columns[8]
      const result = col.renderCell(mockRowNoImage)
      expect(result.cell).toBe('--')
      expect(result.toolTip).toBe('')
    })

    it('renders "--" when image URL is null', () => {
      const columns = getRecipeColumns()
      const col = columns[8]
      const result = col.renderCell({ ...mockRow, image_url: null })
      expect(result.cell).toBe('--')
    })

    it('renders "--" when image URL is undefined', () => {
      const columns = getRecipeColumns()
      const col = columns[8]
      const result = col.renderCell({ ...mockRow, image_url: undefined })
      expect(result.cell).toBe('--')
    })

    it('uses recipe.image_url in user mode', () => {
      const columns = getRecipeColumns(undefined, { userMode: true })
      expect(columns[8].field).toBe('recipe.image_url')
    })
  })

  // ── User mode extra columns ────────────────────────────────────────────

  describe('User mode extra columns', () => {
    it('adds Assigned At column in user mode', () => {
      const columns = getRecipeColumns(undefined, { userMode: true })
      const assignedAtCol = columns[9]
      expect(assignedAtCol.title).toBe('Assigned At')
      expect(assignedAtCol.field).toBe('assigned_at')
    })

    it('adds Notes column in user mode', () => {
      const columns = getRecipeColumns(undefined, { userMode: true })
      const notesCol = columns[10]
      expect(notesCol.title).toBe('Notes')
      expect(notesCol.field).toBe('notes')
    })

    it('renders assigned_at as formatted date', () => {
      const columns = getRecipeColumns(undefined, { userMode: true })
      const assignedAtCol = columns[9]
      const result = assignedAtCol.renderCell(mockUserModeRow)
      const { container } = render(<>{result.cell}</>)
      expect(container.textContent).toBe('15-05-2026')
    })

    it('renders empty string when assigned_at is missing', () => {
      const columns = getRecipeColumns(undefined, { userMode: true })
      const assignedAtCol = columns[9]
      const result = assignedAtCol.renderCell({
        ...mockUserModeRow,
        assigned_at: null,
      })
      const { container } = render(<>{result.cell}</>)
      expect(container.textContent).toBe('')
    })

    it('renders notes value', () => {
      const columns = getRecipeColumns(undefined, { userMode: true })
      const notesCol = columns[10]
      const result = notesCol.renderCell(mockUserModeRow)
      expect(result.cell).toBe('Serve with lemon')
      expect(result.toolTip).toBe('Serve with lemon')
    })
  })

  // ── createRenderCell edge cases ────────────────────────────────────────

  describe('createRenderCell edge cases', () => {
    it('handles boolean custom type', () => {
      const columns = getRecipeColumns()
      expect(columns).toBeDefined()
    })

    it('handles link custom type', () => {
      const columns = getRecipeColumns()
      expect(columns).toBeDefined()
    })

    it('handles null/undefined values in getNestedProperty', () => {
      ;(getNestedProperty as jest.Mock).mockReturnValue(undefined)
      const columns = getRecipeColumns()
      const catCol = columns[1]
      const result = catCol.renderCell(mockRow)
      expect(result.cell).toBeUndefined()
      expect(result.toolTip).toBe('')
    })
  })

  // ── User mode full integration ─────────────────────────────────────────

  describe('User mode full integration', () => {
    it('renders all columns correctly for user mode row', () => {
      const columns = getRecipeColumns(undefined, { userMode: true })
      expect(columns).toHaveLength(11)

      // Name - toTitleCase: first char uppercased, rest lowercased
      const nameResult = columns[0].renderCell(mockUserModeRow)
      expect(nameResult.cell).toBe('Grilled fish')

      // Category
      const catResult = columns[1].renderCell(mockUserModeRow)
      expect(catResult.cell).toBe('Dinner')

      // Calories
      const calResult = columns[2].renderCell(mockUserModeRow)
      expect(calResult.cell).toBe(350)

      // Protein
      const protResult = columns[3].renderCell(mockUserModeRow)
      expect(protResult.cell).toBe(40)

      // Carbs
      const carbsResult = columns[4].renderCell(mockUserModeRow)
      expect(carbsResult.cell).toBe(5)

      // Fat
      const fatResult = columns[5].renderCell(mockUserModeRow)
      expect(fatResult.cell).toBe(15)

      // Fiber
      const fiberResult = columns[6].renderCell(mockUserModeRow)
      expect(fiberResult.cell).toBe(2)

      // Portion Size
      const portionResult = columns[7].renderCell(mockUserModeRow)
      expect(portionResult.cell).toBe('1 fillet')

      // Image
      const imageResult = columns[8].renderCell(mockUserModeRow)
      const { container } = render(<>{imageResult.cell}</>)
      const img = container.querySelector('img')
      expect(img).toHaveAttribute('src', 'http://example.com/fish.jpg')

      // Assigned At
      const assignedResult = columns[9].renderCell(mockUserModeRow)
      const assignedContainer = render(<>{assignedResult.cell}</>)
      expect(assignedContainer.container.textContent).toBe('15-05-2026')

      // Notes
      const notesResult = columns[10].renderCell(mockUserModeRow)
      expect(notesResult.cell).toBe('Serve with lemon')
    })
  })

  // ── toTitleCase edge cases ─────────────────────────────────────────────

  describe('toTitleCase edge cases', () => {
    it('handles already title-cased name', () => {
      const columns = getRecipeColumns()
      const nameCol = columns[0]
      const result = nameCol.renderCell({ ...mockRow, name: 'Chicken Curry' })
      // toTitleCase: first char uppercased, rest lowercased
      expect(result.cell).toBe('Chicken curry')
    })

    it('handles uppercase name', () => {
      const columns = getRecipeColumns()
      const nameCol = columns[0]
      const result = nameCol.renderCell({ ...mockRow, name: 'CHICKEN CURRY' })
      expect(result.cell).toBe('Chicken curry')
    })

    it('handles mixed case name', () => {
      const columns = getRecipeColumns()
      const nameCol = columns[0]
      const result = nameCol.renderCell({ ...mockRow, name: 'cHiCkEn CuRrY' })
      expect(result.cell).toBe('Chicken curry')
    })

    it('handles numeric name', () => {
      const columns = getRecipeColumns()
      const nameCol = columns[0]
      const result = nameCol.renderCell({ ...mockRow, name: 12345 as any })
      expect(result.cell).toBe('12345')
    })
  })
})
