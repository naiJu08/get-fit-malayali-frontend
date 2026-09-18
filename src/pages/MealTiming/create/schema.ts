import { z } from 'zod'
import noLeadingSpaces from '../../../utilities/noLeadingSpaces'

export const mealTimingFormSchema = z.object({
  name: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' })
    .max(50, { message: 'Maximum 50 characters allowed.' })
    .refine(noLeadingSpaces, {
      message: 'Leading spaces are not allowed',
    }),

  time: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' }),

  sequence_number: z.coerce.number({
    required_error: 'Required.',
    invalid_type_error: 'Required.',
  }),

  status: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' }),
})

export type MealTimingSchema = z.infer<typeof mealTimingFormSchema>
