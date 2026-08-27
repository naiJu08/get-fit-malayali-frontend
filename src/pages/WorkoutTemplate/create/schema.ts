import { z } from 'zod'

export const workoutTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Template name is required')
    .max(100, 'Template name cannot exceed 100 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(500, 'Description cannot exceed 500 characters'),
  intensity_level: z.string().min(1, 'Intensity level is required'),
  duration_days: z.coerce
    .number()
    .int()
    .min(1, 'Duration must be at least 1 day')
    .max(365, 'Duration cannot exceed 365 days'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
})

export type WorkoutTemplateForm = z.infer<typeof workoutTemplateSchema>
