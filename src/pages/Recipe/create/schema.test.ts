import { recipeFormSchema } from './schema'

const ingredientSchema = recipeFormSchema.shape.ingredients.element

describe('recipe ingredient quantity submission', () => {
  test.each([
    ['50', '50'],
    ['50 ', '50'],
    [' 50 ', '50'],
    ['50.0', '50'],
    ['2.5', '5/2'],
    ['0.125', '1/8'],
    ['.5', '1/2'],
    ['1.', '1'],
    ['1/2', '1/2'],
    ['1 / 2', '1/2'],
    ['1 1/4', '1 1/4'],
    [' 1   1 / 4 ', '1 1/4'],
    ['', ''],
    ['   ', ''],
  ])('sanitizes %p to %p before building the payload', (input, expected) => {
    const result = ingredientSchema.parse({ name: 'Oats', quantity: input })
    expect(result.quantity).toBe(expected)
    if (expected) {
      expect(expected).toMatch(/^(\d+\/\d+|\d+\s+\d+\/\d+|\d+)$/)
    }
  })

  test.each([
    '0',
    '0.0',
    '-2',
    '1/0',
    '1 1/0',
    '0/2',
    '1//2',
    '1e3',
    '5 grams',
  ])('rejects invalid quantity %p before submission', (quantity) => {
    expect(ingredientSchema.safeParse({ name: 'Oats', quantity }).success).toBe(
      false
    )
  })
})
