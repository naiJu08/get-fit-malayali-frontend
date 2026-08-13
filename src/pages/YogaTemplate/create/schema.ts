import { z } from 'zod'

export const yogaTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  duration_days: z.coerce
    .number()
    .int()
    .min(1, 'Duration must be at least 1 day'),
  description: z.string().optional(),
})

export type YogaTemplateForm = z.infer<typeof yogaTemplateSchema>
