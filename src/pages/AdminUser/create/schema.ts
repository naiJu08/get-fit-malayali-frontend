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
    email: z
      .string()
      .min(5, { message: 'Required' })
      .superRefine((value, ctx) => {
        if (value !== '') {
          if (!/^[\w-.+]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Invalid email format.',
            })
          }
        }
      })
      .refine(noLeadingSpaces, { message: 'Leading spaces are not allowed' }),
    password: z
      .string()
      .optional()
      .refine((val) => /^[^\s]*$/.test(val as string), {
        message: 'Space not allowed',
      })
      .refine((val) => !val || /^[^\s]*$/.test(val), { message: passerror })
      .refine((val) => !val || /.*[A-Z].*/.test(val), { message: passerror })
      .refine((val) => !val || /.*[a-z].*/.test(val), { message: passerror })
      .refine((val) => !val || /.*\d.*/.test(val), { message: passerror })
      .refine(
        (val) =>
          !val || /.*[`~<>?,./!@#$%^&*()\-_=+"'\|{}\[\];:\\].*/.test(val),
        { message: passerror }
      )
      .refine((val) => !val || val.length >= 8, { message: passerror }),
    password_confirmation: z.string().optional(),
    phone: z.preprocess(
      (val: unknown) => {
        if (val === null || val === undefined) return ''
        if (typeof val === 'number') return String(val)
        return val
      },
      z
        .string()
        .min(10, { message: 'Phone number must be at least 10 digits.' })
        .max(10, { message: 'Phone number must be at most 10 digits.' })
        .regex(/^[0-9]+$/, { message: 'Only digits are allowed.' })
    ),
    role: z.any(),
    gender: z
      .any()
      .refine((val) => val !== null && val !== undefined && val !== '', {
        message: 'Required.',
      }),
    date_of_birth: z.union([
      z.string().min(1, { message: 'Required.' }),
      z.date({ invalid_type_error: 'Required.' }),
    ]),
    height: z.preprocess(
      (val: unknown) => {
        if (typeof val === 'number') return val
        if (typeof val === 'string') {
          if (!val.trim()) return undefined
          if (/^[0-9]+(\.[0-9]+)?$/.test(val.trim())) return parseFloat(val)
          return NaN
        }
        return val as any
      },
      z
        .number({ invalid_type_error: 'Required.' })
        .refine((v) => !Number.isNaN(v), { message: 'Enter a valid number' })
    ),
    weight: z.preprocess(
      (val: unknown) => {
        if (typeof val === 'number') return val
        if (typeof val === 'string') {
          if (!val.trim()) return undefined
          if (/^[0-9]+(\.[0-9]+)?$/.test(val.trim())) return parseFloat(val)
          return NaN
        }
        return val as any
      },
      z
        .number({ invalid_type_error: 'Required.' })
        .refine((v) => !Number.isNaN(v), { message: 'Enter a valid number' })
    ),
    lifestyle: z.string().optional(),
    goal: z.string().optional(),
    food_preferences: z.string().optional(),
    medical_conditions: z.string().optional(),
    food_allergies: z.string().optional(),
    ethnicity: z.string().optional(),
    status: z.union([z.number(), z.string()]).optional(),
  })
  .refine(
    (data) => {
      if (data.password || data.password_confirmation) {
        return data.password === data.password_confirmation
      }
      return true
    },
    {
      message: 'Passwords do not match',
      path: ['password_confirmation'],
    }
  )

// Nutritionist tab: only Name, Email, Password, Confirm Password, Phone, Role, Gender, and Date of birth are required
export const formSchemaNutritionist = z
  .object({
    name: z
      .string({ invalid_type_error: 'Required.' })
      .min(1, { message: 'Required.' })
      .refine(noLeadingSpaces, { message: 'Leading spaces are not allowed' }),
    email: z
      .string()
      .min(5, { message: 'Required' })
      .superRefine((value, ctx) => {
        if (value !== '') {
          if (!/^[\w-.+]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Invalid email format.',
            })
          }
        }
      })
      .refine(noLeadingSpaces, { message: 'Leading spaces are not allowed' }),
    password: z
      .string({ required_error: passerror })
      .refine((val) => /^[^\s]*$/.test(val as string), {
        message: 'Space not allowed',
      })
      .refine((val) => /.*[A-Z].*/.test(val), { message: passerror })
      .refine((val) => /.*[a-z].*/.test(val), { message: passerror })
      .refine((val) => /.*\d.*/.test(val), { message: passerror })
      .refine(
        (val) => /.*[`~<>?,./!@#$%^&*()\-_=+"'\|{}\[\];:\\].*/.test(val),
        { message: passerror }
      )
      .refine((val) => val.length >= 8, { message: passerror }),
    password_confirmation: z
      .string({ required_error: 'Required.' })
      .min(1, { message: 'Required.' }),
    phone: z.preprocess(
      (val: unknown) => {
        if (val === null || val === undefined) return ''
        if (typeof val === 'number') return String(val)
        return val
      },
      z
        .string()
        .min(10, { message: 'Phone number must be at least 10 digits.' })
        .max(10, { message: 'Phone number must be at most 10 digits.' })
        .regex(/^[0-9]+$/, { message: 'Only digits are allowed.' })
    ),
    role: z.any(),
    gender: z
      .any()
      .refine((val) => val !== null && val !== undefined && val !== '', {
        message: 'Required.',
      }),
    date_of_birth: z.union([
      z.string().min(1, { message: 'Required.' }),
      z.date({ invalid_type_error: 'Required.' }),
    ]),
    // Optional fields for Nutritionist
    height: z.union([z.number(), z.undefined()]).optional(),
    weight: z.union([z.number(), z.undefined()]).optional(),
    lifestyle: z.string().optional(),
    goal: z.string().optional(),
    food_preferences: z.string().optional(),
    medical_conditions: z.string().optional(),
    food_allergies: z.string().optional(),
    ethnicity: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password || data.password_confirmation) {
        return data.password === data.password_confirmation
      }
      return true
    },
    {
      message: 'Passwords do not match',
      path: ['password_confirmation'],
    }
  )

export const formSchemaNutritionistEdit = z
  .object({
    name: z
      .string({ invalid_type_error: 'Required.' })
      .min(1, { message: 'Required.' })
      .refine(noLeadingSpaces, { message: 'Leading spaces are not allowed' }),
    email: z
      .string()
      .min(5, { message: 'Required' })
      .superRefine((value, ctx) => {
        if (value !== '') {
          if (!/^[\w-.+]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Invalid email format.',
            })
          }
        }
      })
      .refine(noLeadingSpaces, { message: 'Leading spaces are not allowed' }),
    password: z
      .string()
      .optional()
      .refine((val) => !val || /^[^\s]*$/.test(val), {
        message: 'Space not allowed',
      })
      .refine((val) => !val || /.*[A-Z].*/.test(val), { message: passerror })
      .refine((val) => !val || /.*[a-z].*/.test(val), { message: passerror })
      .refine((val) => !val || /.*\d.*/.test(val), { message: passerror })
      .refine(
        (val) =>
          !val || /.*[`~<>?,./!@#$%^&*()\-_=+"'\|{}\[\];:\\].*/.test(val),
        { message: passerror }
      )
      .refine((val) => !val || val.length >= 8, { message: passerror }),
    password_confirmation: z.string().optional(),
    phone: z.preprocess(
      (val: unknown) => {
        if (val === null || val === undefined) return ''
        if (typeof val === 'number') return String(val)
        return val
      },
      z
        .string()
        .min(10, { message: 'Phone number must be at least 10 digits.' })
        .max(10, { message: 'Phone number must be at most 10 digits.' })
        .regex(/^[0-9]+$/, { message: 'Only digits are allowed.' })
    ),
    role: z.any(),
    gender: z
      .any()
      .refine((val) => val !== null && val !== undefined && val !== '', {
        message: 'Required.',
      }),
    date_of_birth: z.union([
      z.string().min(1, { message: 'Required.' }),
      z.date({ invalid_type_error: 'Required.' }),
    ]),
    height: z.union([z.number(), z.undefined()]).optional(),
    weight: z.union([z.number(), z.undefined()]).optional(),
    lifestyle: z.string().optional(),
    goal: z.string().optional(),
    food_preferences: z.string().optional(),
    medical_conditions: z.string().optional(),
    food_allergies: z.string().optional(),
    ethnicity: z.string().optional(),
    status: z.union([z.number(), z.string()]).optional(),
  })
  .refine(
    (data) => {
      if (data.password || data.password_confirmation) {
        return data.password === data.password_confirmation
      }
      return true
    },
    {
      message: 'Passwords do not match',
      path: ['password_confirmation'],
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

export type AdminSchema = z.infer<typeof formSchema>
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>
