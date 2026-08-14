import { z } from 'zod'

export const workoutTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().min(1, 'Description is required'),
  intensity_level: z.string().min(1, 'Intensity level is required'),
  duration_days: z.coerce
    .number()
    .int()
    .min(1, 'Duration must be at least 1 day'),
  notes: z.string().optional(),
})

export type WorkoutTemplateForm = z.infer<typeof workoutTemplateSchema>
