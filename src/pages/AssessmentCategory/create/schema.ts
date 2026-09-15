import { z } from 'zod'

import noLeadingSpaces from '../../../utilities/noLeadingSpaces'

export const assessmentCategoryFormSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, { message: 'Name is required' })
    .max(80, { message: 'Maximum 80 characters allowed.' })
    .refine(noLeadingSpaces, { message: 'Leading spaces are not allowed' }),
  description: z
    .string()
    .max(255, { message: 'Maximum 255 characters allowed.' })
    .optional()
    .or(z.literal('')),
  status: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' }),
  assessment_questions: z
    .array(
      z.object({
        id: z.number().optional(),
        question_text: z
          .string({ required_error: 'Question is required' })
          .min(1, { message: 'Question is required' })
          .max(255, { message: 'Maximum 255 characters allowed.' })
          .refine(noLeadingSpaces, {
            message: 'Leading spaces are not allowed',
          }),
      })
    )
    .min(1, { message: 'At least one question is required.' }),
})

export type AssessmentCategorySchema = z.infer<
  typeof assessmentCategoryFormSchema
>
