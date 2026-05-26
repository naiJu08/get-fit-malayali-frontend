import { z } from 'zod'

import noLeadingSpaces from '../../utilities/noLeadingSpaces'

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, { message: 'Required' })
    .email({ message: 'Enter a valid email' }),
  password: z.string().min(1, { message: 'Required' }).refine(noLeadingSpaces, {
    message: 'Leading spaces are not allowed',
  }),
})

export type LoginSchema = z.infer<typeof loginSchema>

export const forgetPasswordSchema = loginSchema.omit({
  password: true,
})

export type ForgetPasswordSchema = z.infer<typeof forgetPasswordSchema>
const text =
  'Password should contain at least one uppercase letter, one lowercase letter, one digit, and one special character, with a minimum length of eight characters, and must not contain any spaces.'
export const resetSchema = z
  .object({
    password: z
      .string()
      .regex(new RegExp(/^[^\s]*$/), { message: 'Space not allowed' })
      .regex(new RegExp('.*[A-Z].*'), { message: text })
      .regex(new RegExp('.*[a-z].*'), { message: text })
      .regex(new RegExp('.*\\d.*'), { message: text })
      .regex(new RegExp('.*[`~<>?,./!@#$%^&*()\\-_+="\'|{}\\[\\];:\\\\].*'), {
        message: text,
      })
      .min(8, { message: text }),
    confirm_password: z.string().min(2, 'Required'),
  })
  .superRefine(({ password, confirm_password }, ctx) => {
    if (confirm_password && password) {
      if (confirm_password !== password) {
        ctx.addIssue({
          code: 'custom',
          message: 'Passwords do not match',
          path: ['confirm_password'],
        })
      }
    }
  })
export const forgotSchema = z
  .object({
    password: z
      .string()
      .regex(new RegExp(/^[^\s]*$/), { message: 'Space not allowed' })
      .regex(new RegExp('.*[A-Z].*'), { message: text })
      .regex(new RegExp('.*[a-z].*'), { message: text })
      .regex(new RegExp('.*\\d.*'), { message: text })
      .regex(new RegExp('.*[`~<>?,./!@#$%^&*()\\-_+="\'|{}\\[\\];:\\\\].*'), {
        message: text,
      })
      .min(8, { message: text }),
    confirm_password: z.string(),
    old_password: z.string().min(1, { message: 'Required' }),
  })
  .superRefine(({ password, confirm_password }, ctx) => {
    if (confirm_password !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirm_password'],
      })
    }
  })

export type ResetPasswordSchema = z.infer<typeof resetSchema>
export type ForgotPasswordSchema = z.infer<typeof forgotSchema>
