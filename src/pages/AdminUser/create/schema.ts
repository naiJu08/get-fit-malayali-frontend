import { z } from 'zod'

import noLeadingSpaces from '../../../utilities/noLeadingSpaces'

const passerror =
  'Password should contain at least one uppercase letter, one lowercase letter, one digit, and one special character, with a minimum length of eight characters, and must not contain any spaces.'

const selectLikeOptionSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    label: z.string().optional(),
    value: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough()

const medicalConditionsFieldSchema = z.union([
  z.string(),
  selectLikeOptionSchema,
  z.array(z.union([z.string(), selectLikeOptionSchema])),
])

const foodAllergiesFieldSchema = z.union([
  z.string(),
  selectLikeOptionSchema,
  z.array(z.union([z.string(), selectLikeOptionSchema])),
])

const optionalNumberField = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? value : parsed
  }
  return value
}, z.number().min(10).max(999).optional())

const nameFieldSchema = z
  .string({ invalid_type_error: 'Required.' })
  .min(1, { message: 'Required.' })
  .max(25, { message: 'Name must not exceed 25 characters.' })
  .refine(noLeadingSpaces, { message: 'Leading spaces are not allowed' })

export const formSchema = z
  .object({
    name: nameFieldSchema,
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
    date_of_birth: z.preprocess(
      (val) => (val === null || val === undefined ? '' : val),
      z.union([
        z.string().min(1, { message: 'Required.' }),
        z.date({ invalid_type_error: 'Required.' }),
      ])
    ),
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
        .min(100, { message: 'Height should contain at least 3 digits.' })
        .max(999, { message: 'Height should not exceed 3 digits.' })
        .refine((v: number) => !Number.isNaN(v), {
          message: 'Enter a valid number',
        })
    ),
    weight: z.preprocess(
      (val: unknown) => {
        // Keep numbers as strings so the inner schema always sees a string
        if (typeof val === 'number') return String(val)
        return val
      },
      z
        .string({ invalid_type_error: 'Required.' })
        // Allow only digits with an optional single decimal point while typing
        .refine((val: string) => /^\d*\.?\d*$/.test(val.trim()), {
          message: 'Enter a valid number (e.g., 75.5)',
        })
        // When value is non-empty, enforce numeric range 10–999
        .refine(
          (val: string) => {
            if (!val.trim()) return false
            const num = parseFloat(val)
            return !Number.isNaN(num) && num >= 10 && num <= 999
          },
          {
            message: 'Weight should be between 10 and 999.',
          }
        )
    ),
    lifestyle: z.string().optional(),
    goal: z.string().optional(),
    food_preferences: z.string().optional(),
    medical_conditions: medicalConditionsFieldSchema.optional(),
    other_medical_condition: z.string().optional(),
    food_allergies: foodAllergiesFieldSchema.optional(),
    state: z.string().optional(),
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
    name: nameFieldSchema,
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
    date_of_birth: z.preprocess(
      (val) => (val === null || val === undefined ? '' : val),
      z.union([
        z.string().min(1, { message: 'Required.' }),
        z.date({ invalid_type_error: 'Required.' }),
      ])
    ),
    // Optional fields for Nutritionist
    height: optionalNumberField,
    weight: optionalNumberField,
    lifestyle: z.string().optional(),
    goal: z.string().optional(),
    food_preferences: z.string().optional(),
    medical_conditions: medicalConditionsFieldSchema.optional(),
    other_medical_condition: z.string().optional(),
    food_allergies: foodAllergiesFieldSchema.optional(),
    state: z.string().optional(),
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
    name: nameFieldSchema,
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
    height: optionalNumberField,
    weight: optionalNumberField,
    lifestyle: z.string().optional(),
    goal: z.string().optional(),
    food_preferences: z.string().optional(),
    medical_conditions: medicalConditionsFieldSchema.optional(),
    other_medical_condition: z.string().optional(),
    food_allergies: foodAllergiesFieldSchema.optional(),
    state: z.string().optional(),
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
