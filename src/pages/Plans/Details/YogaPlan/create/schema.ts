import { z } from 'zod'

export const yogaPlanFormSchema = z.object({
  plan_id: z.coerce
    .number({ invalid_type_error: 'Plan is required' })
    .positive('Invalid plan'),
  day_number: z.coerce
    .number({ invalid_type_error: 'Day number is required' })
    .min(1, 'Day number must be at least 1'),
  // sequence_number: z.coerce
  //   .number({ invalid_type_error: 'Sequence number is required' })
  //   .min(1, 'Sequence number must be at least 1'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  // duration_minutes: z.coerce
  //   .number({ invalid_type_error: 'Duration must be a number' })
  //   .min(0, 'Duration cannot be negative')
  //   .default(0),
})

export type YogaPlanSchema = z.infer<typeof yogaPlanFormSchema>
