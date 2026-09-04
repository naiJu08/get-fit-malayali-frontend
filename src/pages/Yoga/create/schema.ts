import { z } from 'zod'

import noLeadingSpaces from '../../../utilities/noLeadingSpaces'

const passerror =
  'Password should contain at least one uppercase letter, one lowercase letter, one digit, and one special character, with a minimum length of eight characters, and must not contain any spaces.'

export const formSchema = z
  .object({
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
    video_source: z.enum(['file', 'url']).default('file'),

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
        { message: 'Invalid file format' }
      ),

    thumbnail: z.any().optional(),
  })
  .refine(
    (data) => {
      const baseFilled =
        typeof data.name === 'string' &&
        data.name.trim().length > 0 &&
        typeof data.description === 'string' &&
        data.description.trim().length > 0 &&
        typeof data.intensity_level === 'string' &&
        data.intensity_level.trim().length > 0 &&
        typeof data.category === 'string' &&
        data.category.trim().length > 0

      // If base required fields are not yet filled, don't enforce video requirement
      if (!baseFilled) return true

      const hasExistingVideo =
        !!data.video_url && data.video_url.trim().length > 0
      const hasNewVideoFile = data.video_file instanceof File

      // Once base fields are filled, a video is required – either file OR existing URL
      return hasExistingVideo || hasNewVideoFile
    },
    {
      message: 'Video is required.',
      path: ['video_file'], // the error appears under video file field
    }
  )

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
