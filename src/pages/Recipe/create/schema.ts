import { z } from 'zod'
import { sanitizeIngredientQuantity } from './sanitizeIngredientQuantity'

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

const optionalNumberFromText = z.preprocess(
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
      invalid_type_error: 'Must be a number',
    })
    .nonnegative({ message: 'Cannot be negative' })
    .optional()
)

const optionalTextOrNumber = z.preprocess(
  (val) => {
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      const trimmed = val.trim()
      if (!trimmed.length) return undefined
      return trimmed
    }
    return val
  },
  z.union([z.string().optional(), z.number().nonnegative().optional()])
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
  quantity: optionalTextOrNumber,
  serving_unit: z.string().min(1, 'Required'),
  serving_people_count: optionalTextOrNumber,
  size: optionalTextOrNumber,

  // Nutrition fields
  calories: optionalNumberFromText,
  protein: optionalNumberFromText,
  carbs: optionalNumberFromText,
  fat: optionalNumberFromText,
  fiber: optionalNumberFromText,

  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, 'Required'),
        quantity: z
          .string()
          .optional()
          .transform((value, ctx) => {
            if (value === undefined) return value
            const sanitized = sanitizeIngredientQuantity(value)
            if (sanitized !== null) return sanitized
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                'Enter a quantity greater than 0 (e.g., 1.5, 1/2, 1 1/4)',
            })
            return z.NEVER
          }),
        unit: z.string().optional(),
        details: z.string().optional(),
        size: z.string().optional(),
      })
    )
    .min(1, 'At least one ingredient is required'),

  additional_info: z
    .array(
      z.object({
        info: z.string().optional(),
      })
    )
    .optional(),

  image: z
    .union([z.string().url('Invalid URL'), z.instanceof(File), z.literal('')])
    .optional(),
})

export type RecipeSchema = z.infer<typeof recipeFormSchema>
