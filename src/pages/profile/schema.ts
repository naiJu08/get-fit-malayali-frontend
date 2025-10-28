import { z } from 'zod'

import noLeadingSpaces from '../../utilities/noLeadingSpaces'

export const myProfileSchema = z.object({
  // My Profile Information
  first_name: z
    .string({ invalid_type_error: 'Required' })
    .min(1, { message: 'Required' })
    .refine(noLeadingSpaces, {
      message: 'Leading spaces are not allowed',
    }),
  last_name: z
    .string({ invalid_type_error: 'Required' })
    .min(1, { message: 'Required' })
    .refine(noLeadingSpaces, {
      message: 'Leading spaces are not allowed',
    }),
  username: z
    .string()
    .min(1, { message: 'Required' })
    .email({ message: 'Enter a valid email' }),

  // job_title: z
  //   .string({ invalid_type_error: 'Required' })
  //   .min(1, { message: 'Required' })
  //   .refine(noLeadingSpaces, {
  //     message: 'Leading spaces are not allowed',
  //   }),
  job_title: z.string().refine(noLeadingSpaces, {
    message: 'Leading spaces are not allowed',
  }),
  phone: z
    .string()
    .refine(
      (value) =>
        value === '' ||
        /^(\+?\d{1,4}[\s-]?)?(\d{10}|\d{3}[\s-]?\d{3}[\s-]?\d{4}|\d{4}[\s-]?\d{3}[\s-]?\d{3})$/.test(
          value
        ),
      {
        message: 'Invalid phone number.',
      }
    )
    .refine(noLeadingSpaces, {
      message: 'Leading spaces are not allowed',
    }),
  contact_number: z
    .string()
    .refine(
      (value) =>
        value === '' ||
        /^(\+?\d{1,4}[\s-]?)?(\d{10}|\d{3}[\s-]?\d{3}[\s-]?\d{4}|\d{4}[\s-]?\d{3}[\s-]?\d{3})$/.test(
          value
        ),
      {
        message: 'Invalid phone number.',
      }
    )
    .refine(noLeadingSpaces, {
      message: 'Leading spaces are not allowed',
    }),
  organisation: z.string().optional().nullable(),
  job_role: z.string().optional().nullable(),

  join_date: z
    .union([
      z.date({ invalid_type_error: 'Required' }),
      z.string({ invalid_type_error: 'Required' }),
    ])
    .refine((date) => date !== undefined && date !== null && date !== '', {
      message: 'Required',
    }),

  assessor_type_id: z.string().optional().nullable(),
  assessor_type: z
    .string({ invalid_type_error: 'Required' })
    .min(1, { message: 'Required' }),

  description: z.string().optional().nullable(),
})

export type MyProfileSchema = z.infer<typeof myProfileSchema>
const assessorSchema = myProfileSchema.omit({
  contact_number: true,
})
const adminSchema = myProfileSchema.omit({
  description: true,
  assessor_type: true,
  assessor_type_id: true,
  join_date: true,
  job_role: true,
  organisation: true,
  phone: true,
  contact_number: true,
})
const organisationSchema = myProfileSchema.omit({
  description: true,
  assessor_type: true,
  assessor_type_id: true,
  join_date: true,
  job_role: true,
  organisation: true,
  phone: true,
})
export const handleReturnSchema = (type: string) => {
  if (type === 'Employee') {
    return adminSchema
  } else if (type === 'Organisation') {
    return organisationSchema
  } else {
    return assessorSchema
  }
}
