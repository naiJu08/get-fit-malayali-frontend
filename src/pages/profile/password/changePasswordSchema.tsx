import { z } from 'zod'
const passerror =
  'Password should contain at least one uppercase letter, one lowercase letter, one digit, and one special character, with a minimum length of eight characters, and must not contain any spaces.'
export const resetSchema = z
  .object({
    password: z
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
    confirm_password: z.string(),
    old_password: z.string(),
  })
  .refine(
    (data) => {
      if (data.password && data.confirm_password) {
        if (data.password === data.confirm_password) {
          return true
        } else {
          return false
        }
      }
      return true // If either field is empty, treat as valid to avoid pre-emptive error
    },
    {
      message: 'Passwords do not match',
      path: ['confirm_password'],
    }
  )

export type ResetSchema = z.infer<typeof resetSchema>
