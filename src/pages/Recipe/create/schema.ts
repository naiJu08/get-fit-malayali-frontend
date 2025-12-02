import { z } from 'zod'

const numberFromText = z.preprocess(
  (val) => {
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      const n = Number(val)
      return Number.isNaN(n) ? undefined : n
    }
    return val
  },
  z
    .number({ invalid_type_error: 'Must be a number' })
    .nonnegative({ message: 'Cannot be negative' })
)

const numberFromSelect = z.preprocess((val) => {
  if (val && typeof val === 'object' && 'id' in (val as any)) {
    return (val as any).id
  }
  return val
}, numberFromText)

export const recipeFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  // Make description non-mandatory
  description: z.string().optional(),

  // Optional preparation notes for the recipe
  preparation_notes: z.string().optional(),

  // Meal category & serving unit (fetched from APIs)
  meal_category: z.string().min(1, 'Required'),
  // ID from custom_search_select; allow optional so edit works even if user
  // does not re-select the category (we fall back to rowData in onSubmit).
  meal_category_id: numberFromSelect.optional(),
  serving_unit: z.string().min(1, 'Required'),

  // Nutrition fields
  calories: numberFromText,
  protein: numberFromText,
  carbs: numberFromText,
  fat: numberFromText,
  fiber: numberFromText,

  // Optional ingredients list
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, 'Required'),
        quantity: numberFromText,
        unit: z.string().min(1, 'Required'),
      })
    )
    .optional(),

  image: z
    .union([z.string().url('Invalid URL'), z.instanceof(File), z.literal('')])
    .optional(),
})

export type RecipeSchema = z.infer<typeof recipeFormSchema>
