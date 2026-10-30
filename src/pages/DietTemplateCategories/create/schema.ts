import { z } from 'zod'

import noLeadingSpaces from '../../../utilities/noLeadingSpaces'

export const dietTemplateCategoryFormSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, { message: 'Name is required' })
    .refine(noLeadingSpaces, { message: 'Leading spaces are not allowed' }),
  status: z
    .string({ required_error: 'Status is required' })
    .min(1, { message: 'Status is required' }),
})

export type DietTemplateCategorySchema = z.infer<
  typeof dietTemplateCategoryFormSchema
>
