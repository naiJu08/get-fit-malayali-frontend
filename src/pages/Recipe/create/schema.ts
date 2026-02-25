import { z } from 'zod'

const numberFromText = z.preprocess(
  (val) => {
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      const trimmed = val.trim()
      if (!trimmed.length) return undefined
      const n = Number(trimmed)
      return Number.isNaN(n) ? val : n
    }
    return val
  },
  z
    .number({
      required_error: 'Required',
      invalid_type_error: 'Must be a number',
    })
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
  description: z.string().optional(),

  preparation_notes: z.string().min(1, 'Required'),

  meal_category: z.string().min(1, 'Required'),
  meal_category_id: numberFromSelect.refine(
    (val) => typeof val === 'number' && !Number.isNaN(val),
    'Required'
  ),
  serving_unit: z.string().min(1, 'Required'),

  // Nutrition fields
  calories: numberFromText,
  protein: numberFromText,
  carbs: numberFromText,
  fat: numberFromText,
  fiber: numberFromText,

  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, 'Required'),
        quantity: numberFromText
          .refine((val) => val !== undefined, 'Required')
          .refine((val) => val > 0, 'Required'),
        unit: z.string().min(1, 'Required'),
      })
    )
    .min(1, 'At least one ingredient is required'),

  image: z
    .union([z.string().url('Invalid URL'), z.instanceof(File), z.literal('')])
    .refine(
      (val) =>
        (typeof val === 'string' && val.trim().length > 0) ||
        val instanceof File,
      'Required'
    ),
})

export type RecipeSchema = z.infer<typeof recipeFormSchema>
