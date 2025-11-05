// import { z } from 'zod'

// import noLeadingSpaces from '../../../utilities/noLeadingSpaces'

// export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
// const MAX_FILE_SIZE = 5000000

// const passerror =
//   'Password should contain at least one uppercase letter, one lowercase letter, one digit, and one special character, with a minimum length of eight characters, and must not contain any spaces.'

// export const formSchema = z.object({
//   first_name: z
//     .string({ invalid_type_error: 'Required.' })
//     .min(1, { message: 'Required.' })
//     .refine(noLeadingSpaces, {
//       message: 'Leading spaces are not allowed',
//     }),
//   last_name: z
//     .string({ invalid_type_error: 'Required.' })
//     .min(1, { message: 'Required.' })
//     .refine(noLeadingSpaces, {
//       message: 'Leading spaces are not allowed',
//     }),
//   job_title: z.string().optional(),
//   email: z
//     .string()
//     .min(5, { message: 'Required' }) // Ensure at least 5 characters
//     .superRefine((value, ctx) => {
//       if (value !== '') {
//         // Updated regex to allow '+' in the user part of the email
//         if (!/^[\w-.+]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
//           ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             message: 'Invalid email format.',
//           })
//         }
//       }
//     })
//     .refine(noLeadingSpaces, {
//       message: 'Leading spaces are not allowed',
//     }),

//   // password: z
//   //   .string()
//   //   .regex(new RegExp(/^[^\s]*$/), { message: 'Space not allowed' })
//   //   .regex(new RegExp('.*[A-Z].*'), { message: text })
//   //   .regex(new RegExp('.*[a-z].*'), { message: text })
//   //   .regex(new RegExp('.*\\d.*'), { message: text })
//   //   .regex(new RegExp('.*[`~<>?,./!@#$%^&*()\\-_+="\'|{}\\[\\];:\\\\].*'), {
//   //     message: text,
//   //   })
//   //   .min(8, { message: text })
//   //   .optional(),
//   password: z
//     .string()
//     .optional()
//     .refine((val) => /^[^\s]*$/.test(val as string), {
//       message: 'Space not allowed',
//     })
//     .refine((val) => !val || /^[^\s]*$/.test(val), { message: passerror })
//     .refine((val) => !val || /.*[A-Z].*/.test(val), { message: passerror })
//     .refine((val) => !val || /.*[a-z].*/.test(val), { message: passerror })
//     .refine((val) => !val || /.*\d.*/.test(val), { message: passerror })
//     .refine(
//       (val) => !val || /.*[`~<>?,./!@#$%^&*()\-_=+"'\|{}\[\];:\\].*/.test(val),
//       { message: passerror }
//     )
//     .refine((val) => !val || val.length >= 8, { message: passerror }),

//   // role: z.string().min(1, 'Required').refine(noLeadingSpaces, {
//   //   message: 'Leading spaces are not allowed',
//   // }),
//   role: z.string().optional(),
//   role_id: z.number().optional().nullable(),

//   status: z.string().min(1, 'Required').refine(noLeadingSpaces, {
//     message: 'Leading spaces are not allowed',
//   }),
//   status_id: z.string().optional().nullable(),

//   profile_image_name: z.string().optional().nullable(),
//   profile_image: z
//     .union([z.instanceof(File), z.any()])
//     .refine((file) => !(file instanceof File) || file.size <= MAX_FILE_SIZE, {
//       message: 'Maximum size 5mb',
//     })
//     .refine(
//       (file) =>
//         !(file instanceof File) || ACCEPTED_IMAGE_TYPES.includes(file.type),
//       {
//         message: 'File type not allowed',
//       }
//     )
//     .nullable(),
// })

// export const changePasswordSchema = z.object({
//   new_password: z
//     .string({ required_error: passerror })
//     .regex(new RegExp(/^[^\s]*$/), { message: 'Space not allowed' })
//     .regex(new RegExp('.*[A-Z].*'), {
//       message: passerror,
//     })
//     .regex(new RegExp('.*[a-z].*'), {
//       message: passerror,
//     })
//     .regex(new RegExp('.*\\d.*'), {
//       message: passerror,
//     })
//     .regex(new RegExp('.*[`~<>?,./!@#$%^&*()\\-_+="\'|{}\\[\\];:\\\\].*'), {
//       message: passerror,
//     })
//     .min(8, {
//       message: passerror,
//     }),
// })

// export type AdminSchema = z.infer<typeof formSchema>
// export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>

import { z } from 'zod'

export const planFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Plan name is required')
    .max(100, 'Plan name must be under 100 characters'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().min(5, 'Description is required'),
  duration_days: z.coerce
    .number({
      invalid_type_error: 'Duration must be a number',
    })
    .positive('Duration must be greater than 0'),
})

export type PlanSchema = z.infer<typeof planFormSchema>
