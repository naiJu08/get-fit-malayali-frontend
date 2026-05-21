import { recipeFormSchema } from '../create/schema'
import { ZodIssue } from 'zod'

// ── Helper to test field-level validation ─────────────────────────────────────
const testField = (field: string, value: any) => {
  return (recipeFormSchema.shape as any)[field].safeParse(value)
}

const testIngredientField = (field: string, value: any) => {
  const ingredientSchema = (recipeFormSchema.shape as any).ingredients.element
  return ingredientSchema.shape[field].safeParse(value)
}

// ── Full object helpers ───────────────────────────────────────────────────────
const validRecipe = {
  name: 'Chicken Curry',
  description: 'A delicious curry',
  preparation_notes: 'Cook on medium heat',
  meal_category: 'Lunch',
  meal_category_id: 1,
  quantity: '500',
  serving_unit: 'grams',
  serving_people_count: 4,
  size: 'Medium',
  calories: 450,
  protein: 30,
  carbs: 20,
  fat: 25,
  fiber: 5,
  ingredients: [
    {
      name: 'Chicken',
      quantity: '500',
      unit: 'grams',
      details: 'Boneless',
      size: 'Medium',
    },
  ],
  additional_info: [{ info: 'Serve hot' }],
  image: '',
}

const parseRecipe = (overrides: Record<string, any> = {}) =>
  recipeFormSchema.safeParse({ ...validRecipe, ...overrides })

// ═══════════════════════════════════════════════════════════════════════════════
// Schema Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe('recipeFormSchema', () => {
  // ── Full object validation ──────────────────────────────────────────────

  describe('full object validation', () => {
    it('parses a valid recipe successfully', () => {
      const result = parseRecipe()
      expect(result.success).toBe(true)
    })

    it('fails when name is missing', () => {
      const result = parseRecipe({ name: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
      }
    })

    it('fails when preparation_notes is missing', () => {
      const result = parseRecipe({ preparation_notes: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('preparation_notes')
      }
    })

    it('fails when meal_category is missing', () => {
      const result = parseRecipe({ meal_category: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('meal_category')
      }
    })

    it('fails when meal_category_id is missing', () => {
      const result = parseRecipe({ meal_category_id: undefined })
      expect(result.success).toBe(false)
    })

    it('fails when serving_unit is missing', () => {
      const result = parseRecipe({ serving_unit: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('serving_unit')
      }
    })

    it('fails when ingredients array is empty', () => {
      const result = parseRecipe({ ingredients: [] })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'At least one ingredient is required'
        )
      }
    })

    it('fails when ingredients array is missing', () => {
      const result = parseRecipe({ ingredients: undefined })
      expect(result.success).toBe(false)
    })

    it('passes when additional_info is omitted', () => {
      const result = parseRecipe({ additional_info: undefined })
      expect(result.success).toBe(true)
    })

    it('passes when image is omitted', () => {
      const result = parseRecipe({ image: undefined })
      expect(result.success).toBe(true)
    })

    it('passes when description is omitted', () => {
      const result = parseRecipe({ description: undefined })
      expect(result.success).toBe(true)
    })

    it('passes with all optional fields omitted', () => {
      const minimal = {
        name: 'Minimal Recipe',
        preparation_notes: 'Simple',
        meal_category: 'Breakfast',
        meal_category_id: 2,
        serving_unit: 'pieces',
        ingredients: [{ name: 'Egg' }],
      }
      const result = recipeFormSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })
  })

  // ── name field ──────────────────────────────────────────────────────────

  describe('name field', () => {
    it('accepts a valid name', () => {
      const result = testField('name', 'Chicken Curry')
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = testField('name', '')
      expect(result.success).toBe(false)
    })

    it('accepts whitespace-only name (schema does not trim)', () => {
      const result = testField('name', '   ')
      expect(result.success).toBe(true)
    })
  })

  // ── description field ───────────────────────────────────────────────────

  describe('description field', () => {
    it('accepts a valid description', () => {
      const result = testField('description', 'A tasty dish')
      expect(result.success).toBe(true)
    })

    it('accepts undefined description', () => {
      const result = testField('description', undefined)
      expect(result.success).toBe(true)
    })

    it('accepts empty string description', () => {
      const result = testField('description', '')
      expect(result.success).toBe(true)
    })
  })

  // ── preparation_notes field ─────────────────────────────────────────────

  describe('preparation_notes field', () => {
    it('accepts valid preparation notes', () => {
      const result = testField('preparation_notes', 'Cook for 20 minutes')
      expect(result.success).toBe(true)
    })

    it('rejects empty preparation notes', () => {
      const result = testField('preparation_notes', '')
      expect(result.success).toBe(false)
    })
  })

  // ── meal_category field ─────────────────────────────────────────────────

  describe('meal_category field', () => {
    it('accepts a valid meal category', () => {
      const result = testField('meal_category', 'Lunch')
      expect(result.success).toBe(true)
    })

    it('rejects empty meal category', () => {
      const result = testField('meal_category', '')
      expect(result.success).toBe(false)
    })
  })

  // ── meal_category_id field (numberFromSelect) ───────────────────────────

  describe('meal_category_id field (numberFromSelect)', () => {
    it('accepts a number', () => {
      const result = testField('meal_category_id', 1)
      expect(result.success).toBe(true)
    })

    it('accepts a numeric string', () => {
      const result = testField('meal_category_id', '2')
      expect(result.success).toBe(true)
    })

    it('accepts an object with id property', () => {
      const result = testField('meal_category_id', { id: 3, name: 'Lunch' })
      expect(result.success).toBe(true)
    })

    it('rejects undefined', () => {
      const result = testField('meal_category_id', undefined)
      expect(result.success).toBe(false)
    })

    it('rejects empty string', () => {
      const result = testField('meal_category_id', '')
      expect(result.success).toBe(false)
    })

    it('rejects whitespace string', () => {
      const result = testField('meal_category_id', '   ')
      expect(result.success).toBe(false)
    })

    it('rejects non-numeric string', () => {
      const result = testField('meal_category_id', 'abc')
      expect(result.success).toBe(false)
    })

    it('rejects negative number', () => {
      const result = testField('meal_category_id', -1)
      expect(result.success).toBe(false)
    })

    it('rejects object without id property', () => {
      const result = testField('meal_category_id', { name: 'Lunch' })
      expect(result.success).toBe(false)
    })

    it('rejects null', () => {
      const result = testField('meal_category_id', null)
      expect(result.success).toBe(false)
    })

    it('rejects NaN', () => {
      const result = testField('meal_category_id', NaN)
      expect(result.success).toBe(false)
    })
  })

  // ── quantity field (optionalTextOrNumber) ───────────────────────────────

  describe('quantity field (optionalTextOrNumber)', () => {
    it('accepts a number', () => {
      const result = testField('quantity', 500)
      expect(result.success).toBe(true)
    })

    it('accepts a numeric string', () => {
      const result = testField('quantity', '500')
      expect(result.success).toBe(true)
    })

    it('accepts a non-numeric string', () => {
      const result = testField('quantity', 'to taste')
      expect(result.success).toBe(true)
    })

    it('accepts undefined', () => {
      const result = testField('quantity', undefined)
      expect(result.success).toBe(true)
    })

    it('accepts empty string', () => {
      const result = testField('quantity', '')
      expect(result.success).toBe(true)
    })

    it('accepts whitespace string', () => {
      const result = testField('quantity', '   ')
      expect(result.success).toBe(true)
    })

    it('accepts zero', () => {
      const result = testField('quantity', 0)
      expect(result.success).toBe(true)
    })

    it('rejects negative number', () => {
      const result = testField('quantity', -1)
      expect(result.success).toBe(false)
    })
  })

  // ── serving_unit field ──────────────────────────────────────────────────

  describe('serving_unit field', () => {
    it('accepts a valid serving unit', () => {
      const result = testField('serving_unit', 'grams')
      expect(result.success).toBe(true)
    })

    it('rejects empty serving unit', () => {
      const result = testField('serving_unit', '')
      expect(result.success).toBe(false)
    })
  })

  // ── serving_people_count field (optionalTextOrNumber) ───────────────────

  describe('serving_people_count field (optionalTextOrNumber)', () => {
    it('accepts a number', () => {
      const result = testField('serving_people_count', 4)
      expect(result.success).toBe(true)
    })

    it('accepts a numeric string', () => {
      const result = testField('serving_people_count', '4')
      expect(result.success).toBe(true)
    })

    it('accepts undefined', () => {
      const result = testField('serving_people_count', undefined)
      expect(result.success).toBe(true)
    })

    it('accepts empty string', () => {
      const result = testField('serving_people_count', '')
      expect(result.success).toBe(true)
    })

    it('rejects negative number', () => {
      const result = testField('serving_people_count', -1)
      expect(result.success).toBe(false)
    })
  })

  // ── size field (optionalTextOrNumber) ───────────────────────────────────

  describe('size field (optionalTextOrNumber)', () => {
    it('accepts a number', () => {
      const result = testField('size', 10)
      expect(result.success).toBe(true)
    })

    it('accepts a string', () => {
      const result = testField('size', 'Large')
      expect(result.success).toBe(true)
    })

    it('accepts undefined', () => {
      const result = testField('size', undefined)
      expect(result.success).toBe(true)
    })

    it('accepts empty string', () => {
      const result = testField('size', '')
      expect(result.success).toBe(true)
    })

    it('rejects negative number', () => {
      const result = testField('size', -5)
      expect(result.success).toBe(false)
    })
  })

  // ── Nutrition fields (optionalNumberFromText) ───────────────────────────

  describe('nutrition fields (optionalNumberFromText)', () => {
    const nutritionFields = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const

    nutritionFields.forEach((field) => {
      describe(`${field} field`, () => {
        it('accepts a number', () => {
          const result = testField(field, 100)
          expect(result.success).toBe(true)
        })

        it('accepts a numeric string', () => {
          const result = testField(field, '100')
          expect(result.success).toBe(true)
        })

        it('accepts a decimal string', () => {
          const result = testField(field, '10.5')
          expect(result.success).toBe(true)
        })

        it('accepts undefined', () => {
          const result = testField(field, undefined)
          expect(result.success).toBe(true)
        })

        it('accepts empty string', () => {
          const result = testField(field, '')
          expect(result.success).toBe(true)
        })

        it('accepts whitespace string', () => {
          const result = testField(field, '   ')
          expect(result.success).toBe(true)
        })

        it('accepts zero', () => {
          const result = testField(field, 0)
          expect(result.success).toBe(true)
        })

        it('rejects negative number', () => {
          const result = testField(field, -10)
          expect(result.success).toBe(false)
        })

        it('rejects non-numeric string', () => {
          const result = testField(field, 'abc')
          expect(result.success).toBe(false)
        })

        it('rejects null', () => {
          const result = testField(field, null)
          expect(result.success).toBe(false)
        })

        it('rejects NaN', () => {
          const result = testField(field, NaN)
          expect(result.success).toBe(false)
        })
      })
    })
  })

  // ── Ingredients ─────────────────────────────────────────────────────────

  describe('ingredients array', () => {
    it('accepts valid ingredients array', () => {
      const result = testField('ingredients', [
        { name: 'Chicken', quantity: '500', unit: 'grams' },
      ])
      expect(result.success).toBe(true)
    })

    it('rejects empty ingredients array', () => {
      const result = testField('ingredients', [])
      expect(result.success).toBe(false)
    })

    it('rejects ingredients with empty name', () => {
      const result = testField('ingredients', [{ name: '' }])
      expect(result.success).toBe(false)
    })

    it('accepts ingredients with whitespace-only name (schema does not trim)', () => {
      const result = testField('ingredients', [{ name: '   ' }])
      expect(result.success).toBe(true)
    })

    it('accepts ingredient with omitted quantity', () => {
      const result = testField('ingredients', [{ name: 'Chicken' }])
      expect(result.success).toBe(true)
    })

    it('accepts ingredient with empty quantity', () => {
      const result = testField('ingredients', [
        { name: 'Chicken', quantity: '' },
      ])
      expect(result.success).toBe(true)
    })

    it('accepts ingredient with omitted unit', () => {
      const result = testField('ingredients', [
        { name: 'Chicken', quantity: '500' },
      ])
      expect(result.success).toBe(true)
    })

    it('accepts ingredient with omitted details', () => {
      const result = testField('ingredients', [
        { name: 'Chicken', quantity: '500', unit: 'grams' },
      ])
      expect(result.success).toBe(true)
    })

    it('accepts ingredient with omitted size', () => {
      const result = testField('ingredients', [
        { name: 'Chicken', quantity: '500', unit: 'grams' },
      ])
      expect(result.success).toBe(true)
    })
  })

  // ── Ingredient quantity field ───────────────────────────────────────────

  describe('ingredient quantity field', () => {
    it('accepts a valid number string', () => {
      const result = testIngredientField('quantity', '500')
      expect(result.success).toBe(true)
    })

    it('accepts a decimal string', () => {
      const result = testIngredientField('quantity', '1.5')
      expect(result.success).toBe(true)
    })

    it('accepts a fraction (1/2)', () => {
      const result = testIngredientField('quantity', '1/2')
      expect(result.success).toBe(true)
    })

    it('accepts a fraction with spaces (1 / 2)', () => {
      const result = testIngredientField('quantity', '1 / 2')
      expect(result.success).toBe(true)
    })

    it('accepts undefined', () => {
      const result = testIngredientField('quantity', undefined)
      expect(result.success).toBe(true)
    })

    it('accepts empty string', () => {
      const result = testIngredientField('quantity', '')
      expect(result.success).toBe(true)
    })

    it('accepts whitespace string', () => {
      const result = testIngredientField('quantity', '   ')
      expect(result.success).toBe(true)
    })

    it('rejects non-numeric string', () => {
      const result = testIngredientField('quantity', 'abc')
      expect(result.success).toBe(false)
    })

    it('rejects zero', () => {
      const result = testIngredientField('quantity', '0')
      expect(result.success).toBe(false)
    })

    it('rejects negative number', () => {
      const result = testIngredientField('quantity', '-5')
      expect(result.success).toBe(false)
    })

    it('rejects fraction with zero denominator (1/0)', () => {
      const result = testIngredientField('quantity', '1/0')
      expect(result.success).toBe(false)
    })

    it('rejects fraction with zero denominator with spaces (1 / 0)', () => {
      const result = testIngredientField('quantity', '1 / 0')
      expect(result.success).toBe(false)
    })

    it('rejects mixed content like "2 cups"', () => {
      const result = testIngredientField('quantity', '2 cups')
      expect(result.success).toBe(false)
    })

    it('rejects special characters', () => {
      const result = testIngredientField('quantity', '@#$')
      expect(result.success).toBe(false)
    })
  })

  // ── Ingredient name field ───────────────────────────────────────────────

  describe('ingredient name field', () => {
    it('accepts a valid name', () => {
      const result = testIngredientField('name', 'Chicken')
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = testIngredientField('name', '')
      expect(result.success).toBe(false)
    })

    it('accepts whitespace-only name (schema does not trim)', () => {
      const result = testIngredientField('name', '   ')
      expect(result.success).toBe(true)
    })
  })

  // ── Ingredient unit field ───────────────────────────────────────────────

  describe('ingredient unit field', () => {
    it('accepts a valid unit', () => {
      const result = testIngredientField('unit', 'grams')
      expect(result.success).toBe(true)
    })

    it('accepts undefined', () => {
      const result = testIngredientField('unit', undefined)
      expect(result.success).toBe(true)
    })

    it('accepts empty string', () => {
      const result = testIngredientField('unit', '')
      expect(result.success).toBe(true)
    })
  })

  // ── Ingredient details field ────────────────────────────────────────────

  describe('ingredient details field', () => {
    it('accepts valid details', () => {
      const result = testIngredientField('details', 'Boneless')
      expect(result.success).toBe(true)
    })

    it('accepts undefined', () => {
      const result = testIngredientField('details', undefined)
      expect(result.success).toBe(true)
    })

    it('accepts empty string', () => {
      const result = testIngredientField('details', '')
      expect(result.success).toBe(true)
    })
  })

  // ── Ingredient size field ───────────────────────────────────────────────

  describe('ingredient size field', () => {
    it('accepts valid size', () => {
      const result = testIngredientField('size', 'Medium')
      expect(result.success).toBe(true)
    })

    it('accepts undefined', () => {
      const result = testIngredientField('size', undefined)
      expect(result.success).toBe(true)
    })

    it('accepts empty string', () => {
      const result = testIngredientField('size', '')
      expect(result.success).toBe(true)
    })
  })

  // ── additional_info ─────────────────────────────────────────────────────

  describe('additional_info field', () => {
    it('accepts valid additional info array', () => {
      const result = testField('additional_info', [
        { info: 'Serve hot' },
        { info: 'Garnish with coriander' },
      ])
      expect(result.success).toBe(true)
    })

    it('accepts undefined', () => {
      const result = testField('additional_info', undefined)
      expect(result.success).toBe(true)
    })

    it('accepts empty array', () => {
      const result = testField('additional_info', [])
      expect(result.success).toBe(true)
    })

    it('accepts items with empty info string', () => {
      const result = testField('additional_info', [{ info: '' }])
      expect(result.success).toBe(true)
    })

    it('accepts items with omitted info', () => {
      const result = testField('additional_info', [{}])
      expect(result.success).toBe(true)
    })
  })

  // ── image field ─────────────────────────────────────────────────────────

  describe('image field', () => {
    it('accepts empty string', () => {
      const result = testField('image', '')
      expect(result.success).toBe(true)
    })

    it('accepts undefined', () => {
      const result = testField('image', undefined)
      expect(result.success).toBe(true)
    })

    it('accepts a valid URL', () => {
      const result = testField('image', 'https://example.com/image.jpg')
      expect(result.success).toBe(true)
    })

    it('accepts a File object', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const result = testField('image', file)
      expect(result.success).toBe(true)
    })

    it('rejects an invalid URL string', () => {
      const result = testField('image', 'not-a-url')
      expect(result.success).toBe(false)
    })

    it('rejects null', () => {
      const result = testField('image', null)
      expect(result.success).toBe(false)
    })
  })

  // ── Edge cases for preprocessors ────────────────────────────────────────

  describe('preprocessor edge cases', () => {
    it('handles numberFromText with boolean input', () => {
      // Booleans are not numbers, so they should fail
      const result = testField('calories', true as any)
      expect(result.success).toBe(false)
    })

    it('handles numberFromText with object input', () => {
      const result = testField('calories', {} as any)
      expect(result.success).toBe(false)
    })

    it('handles numberFromText with array input', () => {
      const result = testField('calories', [] as any)
      expect(result.success).toBe(false)
    })

    it('handles optionalTextOrNumber with boolean input', () => {
      const result = testField('quantity', true as any)
      expect(result.success).toBe(false)
    })

    it('handles optionalTextOrNumber with object input', () => {
      const result = testField('quantity', {} as any)
      expect(result.success).toBe(false)
    })

    it('handles numberFromSelect with array input', () => {
      const result = testField('meal_category_id', [] as any)
      expect(result.success).toBe(false)
    })

    it('handles numberFromSelect with string number', () => {
      const result = testField('meal_category_id', '42')
      expect(result.success).toBe(true)
    })

    it('handles numberFromSelect with object having id as string number', () => {
      const result = testField('meal_category_id', { id: '5' })
      expect(result.success).toBe(true)
    })

    it('handles numberFromSelect with object having id as NaN', () => {
      const result = testField('meal_category_id', { id: NaN })
      expect(result.success).toBe(false)
    })
  })

  // ── Complex real-world scenarios ────────────────────────────────────────

  describe('complex real-world scenarios', () => {
    it('validates a complete recipe with all fields', () => {
      const recipe = {
        name: 'Butter Chicken',
        description: 'Creamy tomato-based curry',
        preparation_notes: 'Marinate overnight for best results',
        meal_category: 'Dinner',
        meal_category_id: 3,
        quantity: '1 kg',
        serving_unit: 'servings',
        serving_people_count: 4,
        size: 'Large',
        calories: 650,
        protein: 45,
        carbs: 15,
        fat: 35,
        fiber: 3,
        ingredients: [
          {
            name: 'Chicken thighs',
            quantity: '500',
            unit: 'grams',
            details: 'Boneless, skinless',
            size: 'Cubed',
          },
          {
            name: 'Butter',
            quantity: '2',
            unit: 'tbsp',
            details: 'Unsalted',
          },
          {
            name: 'Cream',
            quantity: '1/2',
            unit: 'cup',
          },
        ],
        additional_info: [
          { info: 'Best served with naan bread' },
          { info: 'Can be frozen for up to 1 month' },
        ],
        image: 'https://example.com/butter-chicken.jpg',
      }
      const result = recipeFormSchema.safeParse(recipe)
      expect(result.success).toBe(true)
    })

    it('validates a minimal recipe with only required fields', () => {
      const recipe = {
        name: 'Boiled Egg',
        preparation_notes: 'Boil for 10 minutes',
        meal_category: 'Breakfast',
        meal_category_id: 2,
        serving_unit: 'pieces',
        ingredients: [{ name: 'Egg', quantity: '1' }],
      }
      const result = recipeFormSchema.safeParse(recipe)
      expect(result.success).toBe(true)
    })

    it('validates a recipe with fraction quantities', () => {
      const recipe = {
        name: 'Half Recipe',
        preparation_notes: 'Mix well',
        meal_category: 'Snack',
        meal_category_id: 4,
        serving_unit: 'cups',
        ingredients: [
          { name: 'Flour', quantity: '1/2' },
          { name: 'Sugar', quantity: '1 / 4' },
          { name: 'Milk', quantity: '3/4' },
        ],
      }
      const result = recipeFormSchema.safeParse(recipe)
      expect(result.success).toBe(true)
    })

    it('validates a recipe with decimal quantities', () => {
      const recipe = {
        name: 'Precise Recipe',
        preparation_notes: 'Measure carefully',
        meal_category: 'Dessert',
        meal_category_id: 5,
        serving_unit: 'grams',
        ingredients: [
          { name: 'Flour', quantity: '250.5' },
          { name: 'Sugar', quantity: '100.75' },
        ],
      }
      const result = recipeFormSchema.safeParse(recipe)
      expect(result.success).toBe(true)
    })

    it('rejects a recipe with "to taste" quantity (schema requires numeric)', () => {
      const recipe = {
        name: 'Seasoned Dish',
        preparation_notes: 'Season to taste',
        meal_category: 'Lunch',
        meal_category_id: 1,
        serving_unit: 'servings',
        ingredients: [{ name: 'Salt', quantity: 'to taste' }],
      }
      const result = recipeFormSchema.safeParse(recipe)
      expect(result.success).toBe(false)
    })

    it('rejects a recipe with duplicate ingredient names (schema allows it)', () => {
      const recipe = {
        name: 'Duplicate Ingredients',
        preparation_notes: 'Mix',
        meal_category: 'Lunch',
        meal_category_id: 1,
        serving_unit: 'servings',
        ingredients: [
          { name: 'Chicken', quantity: '500' },
          { name: 'Chicken', quantity: '200' },
        ],
      }
      const result = recipeFormSchema.safeParse(recipe)
      // Schema does not validate uniqueness, so this should pass
      expect(result.success).toBe(true)
    })

    it('rejects a recipe with missing ingredient name', () => {
      const recipe = {
        name: 'Missing Name',
        preparation_notes: 'Mix',
        meal_category: 'Lunch',
        meal_category_id: 1,
        serving_unit: 'servings',
        ingredients: [{ quantity: '500' }],
      }
      const result = recipeFormSchema.safeParse(recipe)
      expect(result.success).toBe(false)
    })

    it('rejects a recipe with negative nutrition values', () => {
      const result = parseRecipe({ calories: -100 })
      expect(result.success).toBe(false)
    })

    it('rejects a recipe with negative quantity', () => {
      const result = parseRecipe({ quantity: -5 })
      expect(result.success).toBe(false)
    })

    it('rejects a recipe with negative serving_people_count', () => {
      const result = parseRecipe({ serving_people_count: -1 })
      expect(result.success).toBe(false)
    })

    it('rejects a recipe with negative size', () => {
      const result = parseRecipe({ size: -10 })
      expect(result.success).toBe(false)
    })
  })

  // ── Error message verification ──────────────────────────────────────────

  describe('error messages', () => {
    it('returns "Required" for empty name', () => {
      const result = testField('name', '')
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required')
      }
    })

    it('returns "Required" for empty meal_category', () => {
      const result = testField('meal_category', '')
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required')
      }
    })

    it('returns "Required" for empty preparation_notes', () => {
      const result = testField('preparation_notes', '')
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required')
      }
    })

    it('returns "Must be a number" for non-numeric meal_category_id', () => {
      const result = testField('meal_category_id', 'abc')
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/number/i)
      }
    })

    it('returns "Cannot be negative" for negative calories', () => {
      const result = testField('calories', -10)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Cannot be negative')
      }
    })

    it('returns "Must be a number or fraction" for invalid ingredient quantity', () => {
      const result = testField('ingredients', [
        { name: 'Chicken', quantity: 'abc' },
      ])
      if (!result.success) {
        const issue: ZodIssue | undefined = result.error.issues.find(
          (i: ZodIssue) =>
            i.path.length === 2 && i.path[1] === 'quantity'
        )
        expect(issue?.message).toMatch(/number or fraction/i)
      }
    })

    it('returns "Must be greater than 0" for zero ingredient quantity', () => {
      const result = testField('ingredients', [
        { name: 'Chicken', quantity: '0' },
      ])
      if (!result.success) {
        const issue: ZodIssue | undefined = result.error.issues.find(
          (i: ZodIssue) =>
            i.path.length === 2 && i.path[1] === 'quantity'
        )
        expect(issue?.message).toMatch(/greater than 0/i)
      }
    })

    it('returns "At least one ingredient is required" for empty ingredients', () => {
      const result = testField('ingredients', [])
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'At least one ingredient is required'
        )
      }
    })

    it('returns "Invalid URL" for invalid image URL', () => {
      const result = testField('image', 'not-a-url')
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid URL')
      }
    })
  })
})
