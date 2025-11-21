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

export const mealFormSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, { message: 'Name is required' }),

  meal_time: z
    .string({ required_error: 'Meal time is required' })
    .min(1, { message: 'Meal time is required' }),

  notes: z.string().optional(),

  // Macro calories (numbers). If your inputs are text, we can switch to preprocess.
  //   protein: z
  //     .number({ invalid_type_error: 'Protein must be a number' })
  //     .nonnegative({ message: 'Protein cannot be negative' }),

  //   carbs: z
  //     .number({ invalid_type_error: 'Carbs must be a number' })
  //     .nonnegative({ message: 'Carbs cannot be negative' }),

  //   fat: z
  //     .number({ invalid_type_error: 'Fat must be a number' })
  //     .nonnegative({ message: 'Fat cannot be negative' }),

  //   fiber: z
  //     .number({ invalid_type_error: 'Fiber must be a number' })
  //     .nonnegative({ message: 'Fiber cannot be negative' }),

  //   total_calories: z
  //     .number({ invalid_type_error: 'Total calories must be a number' })
  //     .nonnegative({ message: 'Total calories cannot be negative' }),
  protein: numberFromText,
  carbs: numberFromText,
  fat: numberFromText,
  fiber: numberFromText,
  total_calories: numberFromText,
})

export type MealSchema = z.infer<typeof mealFormSchema>
