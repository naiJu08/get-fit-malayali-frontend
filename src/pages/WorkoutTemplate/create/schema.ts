import { z } from 'zod'

export const workoutTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  duration_days: z.coerce
    .number()
    .int()
    .min(1, 'Duration must be at least 1 day'),
  description: z.string().optional(),
})

export type WorkoutTemplateForm = z.infer<typeof workoutTemplateSchema>
