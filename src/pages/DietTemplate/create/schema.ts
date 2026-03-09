import { z } from 'zod'

import noLeadingSpaces from '../../../utilities/noLeadingSpaces'

const passerror =
  'Password should contain at least one uppercase letter, one lowercase letter, one digit, and one special character, with a minimum length of eight characters, and must not contain any spaces.'

const baseSchema = {
  name: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' })
    .refine(noLeadingSpaces, { message: 'Leading spaces are not allowed' }),
  description: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' }),
  duration_days: z.coerce
    .number({
      invalid_type_error: 'Duration must be a number',
    })
    .positive('Duration must be greater than 0'),
  thumbnail: z.any().optional(),
}
export const formSchema = z.object({
  ...baseSchema,
})

export const editFormSchema = z.object({
  ...baseSchema,
})

export const changePasswordSchema = z.object({
  new_password: z
    .string({ required_error: passerror })
    .regex(new RegExp(/^[^\s]*$/), { message: 'Space not allowed' })
    .regex(new RegExp('.*[A-Z].*'), {
      message: passerror,
    })
    .regex(new RegExp('.*[a-z].*'), {
      message: passerror,
    })
    .regex(new RegExp('.*\\d.*'), {
      message: passerror,
    })
    .regex(new RegExp('.*[`~<>?,./!@#$%^&*()\\-_+="\'|{}\\[\\];:\\\\].*'), {
      message: passerror,
    })
    .min(8, {
      message: passerror,
    }),
})

export type TemplateSchema = z.infer<typeof editFormSchema>
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>
