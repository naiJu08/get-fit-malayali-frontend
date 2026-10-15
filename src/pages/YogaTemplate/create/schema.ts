import { z } from 'zod'

export const yogaTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Template Name is required')
    .max(100, 'Template name cannot exceed 100 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(500, 'Description cannot exceed 500 characters'),
  intensity_level: z.enum(['Low', 'Moderate', 'High'], {
    required_error: 'Intensity Level is required',
  }),
  duration_days: z.coerce
    .number()
    .int()
    .min(1, 'Days must be at least 1')
    .max(365, 'Days cannot exceed 365'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
})

export type YogaTemplateForm = z.infer<typeof yogaTemplateSchema>
