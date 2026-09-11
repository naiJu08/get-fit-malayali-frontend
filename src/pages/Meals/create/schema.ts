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

const requiredNumberFromText = (fieldLabel: string) =>
  z.preprocess(
    (val) => {
      if (typeof val === 'number') return val
      if (typeof val === 'string') {
        const trimmed = val.trim()
        if (!trimmed) return undefined
        const n = Number(trimmed)
        return Number.isNaN(n) ? undefined : n
      }
      return val
    },
    z
      .number({
        required_error: `${fieldLabel} is required`,
        invalid_type_error: `${fieldLabel} must be a number`,
      })
      .nonnegative({ message: `${fieldLabel} cannot be negative` })
  )

export const mealFormSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, { message: 'Name is required' }),

  meal_time: z
    .string({ required_error: 'Meal time is required' })
    .min(1, { message: 'Meal time is required' }),

  notes: z.string().optional(),

  meal_category: z.string().optional(),
  meal_category_id: numberFromSelect,
  serving_unit: z.string().min(1, { message: 'Serving unit is required' }),
  default_serving_quantity: z.number().default(1),
  per_serving_calories: requiredNumberFromText('Total Calories'),
  per_serving_protein: requiredNumberFromText('Protein'),
  per_serving_carbs: requiredNumberFromText('Carbs'),
  per_serving_fat: requiredNumberFromText('Fat'),
  per_serving_fiber: requiredNumberFromText('Fiber'),
})

export type MealSchema = z.infer<typeof mealFormSchema>
