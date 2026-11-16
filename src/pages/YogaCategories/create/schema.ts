import { z } from 'zod'

import noLeadingSpaces from '../../../utilities/noLeadingSpaces'

export const formSchema = z.object({
  name: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' })
    .refine(noLeadingSpaces, { message: 'Leading spaces are not allowed' }),
  description: z.string().optional(),
})

export type CategorySchema = z.infer<typeof formSchema>
