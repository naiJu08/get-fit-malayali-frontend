import { resetSchema, ResetSchema } from '../changePasswordSchema'

describe('resetSchema - ChangePassword Schema', () => {
  describe('password field validations', () => {
    it('should reject password with spaces', () => {
      const data: ResetSchema = {
        password: 'Pass word@123',
        confirm_password: 'Pass word@123',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const passwordError = result.error.issues.find((err) => err.path.includes('password'))
        expect(passwordError?.message).toContain('Space not allowed')
      }
    })

    it('should reject password without uppercase letter', () => {
      const data: ResetSchema = {
        password: 'password@123',
        confirm_password: 'password@123',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject password without lowercase letter', () => {
      const data: ResetSchema = {
        password: 'PASSWORD@123',
        confirm_password: 'PASSWORD@123',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject password without digit', () => {
      const data: ResetSchema = {
        password: 'Password@abc',
        confirm_password: 'Password@abc',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject password without special character', () => {
      const data: ResetSchema = {
        password: 'Password123',
        confirm_password: 'Password123',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject password shorter than 8 characters', () => {
      const data: ResetSchema = {
        password: 'Pass@12',
        confirm_password: 'Pass@12',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept valid password with all requirements', () => {
      const data: ResetSchema = {
        password: 'ValidPass@123',
        confirm_password: 'ValidPass@123',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept password with various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '-', '_', '+', '=', '`', '~']
      specialChars.forEach((char) => {
        const data: ResetSchema = {
          password: `ValidPass${char}123`,
          confirm_password: `ValidPass${char}123`,
          old_password: 'OldPass@123',
        }
        const result = resetSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('password confirmation matching', () => {
    it('should reject passwords that do not match', () => {
      const data: ResetSchema = {
        password: 'ValidPass@123',
        confirm_password: 'ValidPass@124',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const confirmError = result.error.issues.find((err) => err.path.includes('confirm_password'))
        expect(confirmError?.message).toContain('Passwords do not match')
      }
    })

    it('should accept matching passwords', () => {
      const data: ResetSchema = {
        password: 'ValidPass@123',
        confirm_password: 'ValidPass@123',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow empty confirm_password when password is empty', () => {
      const data: ResetSchema = {
        password: '',
        confirm_password: '',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      // Should pass the refine check (returns true for empty fields)
      // but will fail the individual field validations if they require non-empty
      expect(result.success).toBe(false) // Fails because password is required
    })
  })

  describe('complete validation scenarios', () => {
    it('should validate all fields are required', () => {
      const data = {
        password: 'ValidPass@123',
        confirm_password: 'ValidPass@123',
        // old_password is missing
      } as any
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(false) // old_password is required
    })

    it('should accept complete valid reset schema', () => {
      const validData: ResetSchema = {
        old_password: 'OldPassword@123',
        password: 'NewPassword@456',
        confirm_password: 'NewPassword@456',
      }
      const result = resetSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.password).toBe('NewPassword@456')
        expect(result.data.confirm_password).toBe('NewPassword@456')
        expect(result.data.old_password).toBe('OldPassword@123')
      }
    })

    it('should reject when multiple validations fail', () => {
      const data: ResetSchema = {
        password: 'pass', // Too short, no uppercase, no digit, no special char
        confirm_password: 'different', // Doesn't match
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should reject password with only minimum length and missing other requirements', () => {
      const data: ResetSchema = {
        password: 'abcdefgh',
        confirm_password: 'abcdefgh',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept password at exactly 8 characters when all requirements met', () => {
      const data: ResetSchema = {
        password: 'Pass@123',
        confirm_password: 'Pass@123',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept password with mixed special characters', () => {
      const data: ResetSchema = {
        password: 'Pass@#$%123',
        confirm_password: 'Pass@#$%123',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept password with numbers at various positions', () => {
      const data: ResetSchema = {
        password: '1Password@23',
        confirm_password: '1Password@23',
        old_password: 'OldPass@123',
      }
      const result = resetSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('type inference', () => {
    it('should correctly infer ResetSchema type from resetSchema', () => {
      const testData: ResetSchema = {
        password: 'ValidPass@123',
        confirm_password: 'ValidPass@123',
        old_password: 'OldPass@123',
      }
      expect(testData.password).toBeDefined()
      expect(testData.confirm_password).toBeDefined()
      expect(testData.old_password).toBeDefined()
    })
  })
})
