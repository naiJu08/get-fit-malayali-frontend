import { z } from 'zod'

export const yogaTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Template Name is required'),
  description: z.string().trim().min(1, 'Description is required'),
  intensity_level: z.enum(['Low', 'Moderate', 'High'], {
    required_error: 'Intensity Level is required',
  }),
  duration_days: z.coerce
    .number()
    .int()
    .min(1, 'Days must be at least 1')
    .max(365, 'Days cannot exceed 365'),
  notes: z.string().optional(),
})

export type YogaTemplateForm = z.infer<typeof yogaTemplateSchema>
