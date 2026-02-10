import { z } from 'zod'

import noLeadingSpaces from '../../../utilities/noLeadingSpaces'

const passerror =
  'Password should contain at least one uppercase letter, one lowercase letter, one digit, and one special character, with a minimum length of eight characters, and must not contain any spaces.'

export const formSchema = z.object({
  name: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' })
    .refine(noLeadingSpaces, { message: 'Leading spaces are not allowed' }),
  description: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' }),
  intensity_level: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' }),
  category: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' }),
  // video_url: z
  //   .string({ invalid_type_error: 'Required.' })
  //   .min(1, { message: 'Required.' })
  //   .url({ message: 'Enter a valid URL' }),
  video_url: z.string().optional(), // added support for existing video

  video_file: z
    .any()
    .optional()
    .refine(
      (val) =>
        val === undefined ||
        val === null ||
        val === '' ||
        typeof val === 'string' ||
        val instanceof File,
      { message: 'Video is required.' }
    ),

  thumbnail: z.any().optional(),
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

export type YogaSchema = z.infer<typeof formSchema>
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>
