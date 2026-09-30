import { z } from 'zod'

import noLeadingSpaces from '../../../utilities/noLeadingSpaces'

const passerror =
  'Password should contain at least one uppercase letter, one lowercase letter, one digit, and one special character, with a minimum length of eight characters, and must not contain any spaces.'

const baseSchema = {
  title: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' })
    .refine(noLeadingSpaces, { message: 'Leading spaces are not allowed' }),
  description: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' }),
  thumbnail: z.any().optional(),
}

const requiredVideoField = z
  .any({ required_error: 'Required.' })
  .refine((val) => val !== undefined && val !== null && val !== '', {
    message: 'Required.',
  })

export const formSchema = z.object({
  ...baseSchema,
  video_file: requiredVideoField,
  video_file_label: z.any().optional(),
})

export const editFormSchema = z.object({
  ...baseSchema,
  video_file: z.any().optional(),
  video_file_label: z.any().optional(),
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

export type MeditationSchema = z.infer<typeof editFormSchema>
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>
