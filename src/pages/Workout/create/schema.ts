import { z } from 'zod'

import noLeadingSpaces from '../../../utilities/noLeadingSpaces'

const passerror =
  'Password should contain at least one uppercase letter, one lowercase letter, one digit, and one special character, with a minimum length of eight characters, and must not contain any spaces.'

const preprocessSelectValue = (val: unknown) => {
  if (
    typeof val === 'object' &&
    val !== null &&
    'id' in (val as Record<string, unknown>)
  ) {
    return (val as Record<string, unknown>).id
  }
  if (typeof val === 'string') {
    const trimmed = val.trim()
    return trimmed === '' ? undefined : trimmed
  }
  if (val === '') return undefined
  return val ?? undefined
}

const requiredSelectId = (fieldLabel: string) =>
  z.preprocess(
    preprocessSelectValue,
    z.coerce.number({
      required_error: `${fieldLabel} is required.`,
      invalid_type_error: `${fieldLabel} is required.`,
    })
  )

// const optionalSelectId = () =>
//   z.preprocess(preprocessSelectValue, z.coerce.number().optional())

// export const formSchema = z.object({
//   name: z
//     .string({ invalid_type_error: 'Required.' })
//     .min(1, { message: 'Required.' })
//     .refine(noLeadingSpaces, { message: 'Leading spaces are not allowed' }),
//   description: z
//     .string({ invalid_type_error: 'Required.' })
//     .min(1, { message: 'Required.' }),
//   intensity_level: z
//     .string({ invalid_type_error: 'Required.' })
//     .min(1, { message: 'Required.' }),
//   // video_url: z
//   //   .string({ invalid_type_error: 'Required.' })
//   //   .min(1, { message: 'Required.' })
//   //   .url({ message: 'Enter a valid URL' }),
//   video_file: z
//     .any({ required_error: 'Required.' })
//     .refine((val) => val !== undefined && val !== null && val !== '', {
//       message: 'Required.',
//     }),
//       thumbnail: z.any().optional(),

//   // thumbnail: z
//   //   .any({ required_error: 'Required.' })
//   //   .refine((val) => val !== undefined && val !== null && val !== '', {
//   //     message: 'Required.',
//   //   }),

// })
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
  category_id: requiredSelectId('Category'),

  subcategory: z
    .string({ invalid_type_error: 'Required.' })
    .min(1, { message: 'Required.' }),
  subcategory_id: requiredSelectId('Subcategory'),

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
// .refine(
//   (data) => {
//     const baseFilled =
//       typeof data.name === 'string' &&
//       data.name.trim().length > 0 &&
//       typeof data.description === 'string' &&
//       data.description.trim().length > 0 &&
//       typeof data.intensity_level === 'string' &&
//       data.intensity_level.trim().length > 0

//     // If base required fields are not yet filled, don't enforce video requirement
//     if (!baseFilled) return true

//     const hasExistingVideo = !!data.video_url
//     const hasNewVideoFile = data.video_file instanceof File

//     // Once base fields are filled, a video is required – either file OR existing URL
//     return hasExistingVideo || hasNewVideoFile
//   },
//   {
//     message: 'Video is required.',
//     path: ['video_file'], // the error appears under video file field
//   }
// )

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

export type WorkoutSchema = z.infer<typeof formSchema>
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>
