// import React from 'react'
// import { render, fireEvent } from '@testing-library/react'
// import { getMealsColumns } from '../columns'

// const originalConsoleError = console.error
// beforeAll(() => {
//   console.error = jest.fn((...args: any[]) => {
//     const msg = typeof args[0] === 'string' ? args[0] : ''
//     if (msg.includes('ReactDOMTestUtils.act')) return
//     originalConsoleError(...args)
//   })
// })

// afterAll(() => {
//   console.error = originalConsoleError
// })

// describe('Meals Columns', () => {
//   beforeEach(() => {
//     jest.clearAllMocks()
//   })

//   it('returns columns array with required properties', () => {
//     const columns = getMealsColumns()
//     expect(Array.isArray(columns)).toBe(true)
//     expect(columns.length).toBeGreaterThan(0)
//     columns.forEach((col) => {
//       expect(col).toHaveProperty('title')
//       expect(col).toHaveProperty('field')
//     })
//   })

//   it('includes checkbox column when selection handlers provided', () => {
//     const selectedItems = new Set<number>()
//     const onSelectItem = jest.fn()
//     const onSelectAll = jest.fn()

//     const columns = getMealsColumns(
//       undefined,
//       selectedItems,
//       onSelectItem,
//       onSelectAll
//     )
//     const checkboxCol = columns.find((c) => c.field === 'checkbox')
//     expect(checkboxCol).toBeDefined()
//   })

//   it('does not include checkbox column when selection handlers not provided', () => {
//     const columns = getMealsColumns()
//     const checkboxCol = columns.find((c) => c.field === 'checkbox')
//     expect(checkboxCol).toBeUndefined()
//   })

//   it('renders Name column with link and click handler', () => {
//     const onNameClick = jest.fn()
//     const columns = getMealsColumns(onNameClick)
//     const nameCol: any = columns.find((c) => c.field === 'name')

//     expect(nameCol).toBeDefined()
//     expect(nameCol.rowClick).toBe(onNameClick)
//     expect(nameCol.link).toBe(true)
//   })

//   it('renders Status column as boolean type', () => {
//     const columns = getMealsColumns()
//     const statusCol: any = columns.find((c) => c.field === 'status')

//     expect(statusCol).toBeDefined()
//     const res = statusCol.renderCell({ status: true })
//     const { getByText } = render(<>{res.cell}</>)
//     getByText('Active')
//   })

//   it('renders Status column as Inactive when false', () => {
//     const columns = getMealsColumns()
//     const statusCol: any = columns.find((c) => c.field === 'status')

//     const res = statusCol.renderCell({ status: false })
//     const { getByText } = render(<>{res.cell}</>)
//     getByText('Inactive')
//   })

//   it('renders Meal Category column', () => {
//     const columns = getMealsColumns()
//     const mealCatCol: any = columns.find((c) => c.field === 'meal_category')

//     expect(mealCatCol).toBeDefined()
//     const res = mealCatCol.renderCell({ meal_category: 'Vegetarian' })
//     expect(res.cell).toBe('Vegetarian')
//   })

//   it('renders Serving Unit column', () => {
//     const columns = getMealsColumns()
//     const servingCol: any = columns.find((c) => c.field === 'serving_unit')

//     expect(servingCol).toBeDefined()
//     const res = servingCol.renderCell({ serving_unit: 'cup' })
//     expect(res.cell).toBe('cup')
//   })

//   it('renders Total Calories column correctly', () => {
//     const columns = getMealsColumns()
//     const caloriesCol: any = columns.find((c) => c.field === 'total_calories')

//     expect(caloriesCol).toBeDefined()
//     const res = caloriesCol.renderCell({
//       per_serving_calories: 300,
//     })
//     expect(res.cell).toBe('300')
//   })

//   it('displays -- for missing calories', () => {
//     const columns = getMealsColumns()
//     const caloriesCol: any = columns.find((c) => c.field === 'total_calories')

//     const res = caloriesCol.renderCell({})
//     expect(res.cell).toBe('--')
//   })

//   it('renders Meal Time column', () => {
//     const columns = getMealsColumns()
//     const mealTimeCol: any = columns.find((c) => c.field === 'meal_time')

//     expect(mealTimeCol).toBeDefined()
//     const res = mealTimeCol.renderCell({ meal_time: 'Breakfast' })
//     expect(res.cell).toBe('Breakfast')
//   })

//   it('handles checkbox selection when provided', () => {
//     const selectedItems = new Set<number>([1, 2])
//     const onSelectItem = jest.fn()
//     const onSelectAll = jest.fn()

//     const columns = getMealsColumns(
//       undefined,
//       selectedItems,
//       onSelectItem,
//       onSelectAll
//     )
//     const checkboxCol: any = columns.find((c) => c.field === 'checkbox')

//     expect(checkboxCol).toBeDefined()
//     const res = checkboxCol.renderCell({ id: 1 })
//     const { getByRole } = render(<>{res.cell}</>)
//     const checkbox = getByRole('checkbox')
//     expect(checkbox).toBeChecked()
//   })

//   it('handles checkbox state change', () => {
//     const selectedItems = new Set<number>()
//     const onSelectItem = jest.fn()
//     const onSelectAll = jest.fn()

//     const columns = getMealsColumns(
//       undefined,
//       selectedItems,
//       onSelectItem,
//       onSelectAll
//     )
//     const checkboxCol: any = columns.find((c) => c.field === 'checkbox')

//     const res = checkboxCol.renderCell({ id: 3 })
//     const { getByRole } = render(<>{res.cell}</>)
//     const checkbox = getByRole('checkbox') as HTMLInputElement

//     fireEvent.click(checkbox)
//     expect(onSelectItem).toHaveBeenCalledWith(3, true)
//   })
// })


import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { getMealsColumns } from '../columns'

const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn((...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    if (msg.includes('ReactDOMTestUtils.act')) return
    originalConsoleError(...args)
  })
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('Meals Columns', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns columns array with required properties', () => {
    const columns = getMealsColumns()
    expect(Array.isArray(columns)).toBe(true)
    expect(columns.length).toBeGreaterThan(0)
    columns.forEach((col) => {
      expect(col).toHaveProperty('title')
      expect(col).toHaveProperty('field')
    })
  })

  it('includes checkbox column when selection handlers provided', () => {
    const selectedItems = new Set<number>()
    const onSelectItem = jest.fn()
    const onSelectAll = jest.fn()

    const columns = getMealsColumns(
      undefined,
      selectedItems,
      onSelectItem,
      onSelectAll
    )
    const checkboxCol = columns.find((c) => c.field === 'checkbox')
    expect(checkboxCol).toBeDefined()
  })

  it('does not include checkbox column when selection handlers not provided', () => {
    const columns = getMealsColumns()
    const checkboxCol = columns.find((c) => c.field === 'checkbox')
    expect(checkboxCol).toBeUndefined()
  })

  it('renders Name column with link and click handler', () => {
    const onNameClick = jest.fn()
    const columns = getMealsColumns(onNameClick)
    const nameCol: any = columns.find((c) => c.field === 'name')

    expect(nameCol).toBeDefined()
    expect(nameCol.rowClick).toBe(onNameClick)
    expect(nameCol.link).toBe(true)
  })

  it('renders Status column as boolean type', () => {
    const columns = getMealsColumns()
    const statusCol: any = columns.find((c) => c.field === 'status')

    expect(statusCol).toBeDefined()
    const res = statusCol.renderCell({ status: true })
    const { getByText } = render(<>{res.cell}</>)
    getByText('Active')
  })

  it('renders Status column as Inactive when false', () => {
    const columns = getMealsColumns()
    const statusCol: any = columns.find((c) => c.field === 'status')

    const res = statusCol.renderCell({ status: false })
    const { getByText } = render(<>{res.cell}</>)
    getByText('Inactive')
  })

  it('renders Meal Category column', () => {
    const columns = getMealsColumns()
    const mealCatCol: any = columns.find((c) => c.field === 'meal_category')

    expect(mealCatCol).toBeDefined()
    const res = mealCatCol.renderCell({ meal_category: 'Vegetarian' })
    expect(res.cell).toBe('Vegetarian')
  })

  it('renders Serving Unit column', () => {
    const columns = getMealsColumns()
    const servingCol: any = columns.find((c) => c.field === 'serving_unit')

    expect(servingCol).toBeDefined()
    const res = servingCol.renderCell({ serving_unit: 'cup' })
    expect(res.cell).toBe('cup')
  })

  it('renders Total Calories column correctly', () => {
    const columns = getMealsColumns()
    const caloriesCol: any = columns.find((c) => c.field === 'total_calories')

    expect(caloriesCol).toBeDefined()
    const res = caloriesCol.renderCell({
      per_serving_calories: 300,
    })
    expect(res.cell).toBe('300')
  })

  it('displays -- for missing calories', () => {
    const columns = getMealsColumns()
    const caloriesCol: any = columns.find((c) => c.field === 'total_calories')

    const res = caloriesCol.renderCell({})
    expect(res.cell).toBe('--')
  })

  it('renders Meal Time column', () => {
    const columns = getMealsColumns()
    const mealTimeCol: any = columns.find((c) => c.field === 'meal_time')

    expect(mealTimeCol).toBeDefined()
    const res = mealTimeCol.renderCell({ meal_time: 'Breakfast' })
    expect(res.cell).toBe('Breakfast')
  })

  it('handles checkbox selection when provided', () => {
    const selectedItems = new Set<number>([1, 2])
    const onSelectItem = jest.fn()
    const onSelectAll = jest.fn()

    const columns = getMealsColumns(
      undefined,
      selectedItems,
      onSelectItem,
      onSelectAll
    )
    const checkboxCol: any = columns.find((c) => c.field === 'checkbox')

    expect(checkboxCol).toBeDefined()
    const res = checkboxCol.renderCell({ id: 1 })
    const { getByRole } = render(<>{res.cell}</>)
    const checkbox = getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('handles checkbox state change', () => {
    const selectedItems = new Set<number>()
    const onSelectItem = jest.fn()
    const onSelectAll = jest.fn()

    const columns = getMealsColumns(
      undefined,
      selectedItems,
      onSelectItem,
      onSelectAll
    )
    const checkboxCol: any = columns.find((c) => c.field === 'checkbox')

    const res = checkboxCol.renderCell({ id: 3 })
    const { getByRole } = render(<>{res.cell}</>)
    const checkbox = getByRole('checkbox') as HTMLInputElement

    fireEvent.click(checkbox)
    expect(onSelectItem).toHaveBeenCalledWith(3, true)
  })
})
