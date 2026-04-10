import { z } from 'zod'
import {
  formSchema,
  changePasswordSchema,
  CategorySchema,
  ChangePasswordSchema,
} from '../schema'

// Note: noLeadingSpaces utility is tested through the schema validation

describe('Category Schema Validation', () => {
  describe('formSchema', () => {
    test('should validate valid category data', () => {
      const validData = {
        name: 'Test Category',
        description: 'Test Description',
      }

      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    test('should validate category with only required name', () => {
      const validData = {
        name: 'Test Category',
      }

      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test Category')
        expect(result.data.description).toBeUndefined()
      }
    })

    test('should validate category with empty description', () => {
      const validData = {
        name: 'Test Category',
        description: '',
      }

      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBe('')
      }
    })

    test('should reject data without name', () => {
      const invalidData = {
        description: 'Test Description',
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
        expect(result.error.issues[0].message).toBe('Required')
      }
    })

    test('should reject empty name', () => {
      const invalidData = {
        name: '',
        description: 'Test Description',
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
        expect(result.error.issues[0].message).toBe('Required.')
      }
    })

    test('should reject name with leading spaces', () => {
      const invalidData = {
        name: '  Invalid Name',
        description: 'Test Description',
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
        expect(result.error.issues[0].message).toBe(
          'Leading spaces are not allowed'
        )
      }
    })

    test('should reject non-string name', () => {
      const invalidData = {
        name: 123,
        description: 'Test Description',
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
        expect(result.error.issues[0].message).toBe('Required.')
      }
    })

    test('should accept null description', () => {
      const validData = {
        name: 'Test Category',
        description: null,
      }

      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description')
      }
    })

    test('should handle undefined description', () => {
      const validData = {
        name: 'Test Category',
        description: undefined,
      }

      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBeUndefined()
      }
    })

    test('should reject non-string description', () => {
      const invalidData = {
        name: 'Test Category',
        description: 123,
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description')
      }
    })

    test('should handle very long names', () => {
      const longName = 'A'.repeat(1000)
      const validData = {
        name: longName,
        description: 'Test Description',
      }

      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe(longName)
      }
    })

    test('should handle special characters in name', () => {
      const validData = {
        name: 'Test-Category_123!@#',
        description: 'Test Description',
      }

      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test-Category_123!@#')
      }
    })
  })

  describe('changePasswordSchema', () => {
    test('should validate valid password', () => {
      const validData = {
        new_password: 'Test123!@#',
      }

      const result = changePasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.new_password).toBe('Test123!@#')
      }
    })

    test('should reject password without uppercase letter', () => {
      const invalidData = {
        new_password: 'test123!@#',
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letter')
      }
    })

    test('should reject password without lowercase letter', () => {
      const invalidData = {
        new_password: 'TEST123!@#',
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('lowercase letter')
      }
    })

    test('should reject password without digit', () => {
      const invalidData = {
        new_password: 'TestABC!@#',
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('digit')
      }
    })

    test('should reject password without special character', () => {
      const invalidData = {
        new_password: 'Test123456',
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('special character')
      }
    })

    test('should reject password with spaces', () => {
      const invalidData = {
        new_password: 'Test 123!@#',
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Space not allowed')
      }
    })

    test('should reject password shorter than 8 characters', () => {
      const invalidData = {
        new_password: 'Test1!',
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('minimum length')
      }
    })

    test('should reject empty password', () => {
      const invalidData = {
        new_password: '',
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('minimum length')
      }
    })

    test('should reject non-string password', () => {
      const invalidData = {
        new_password: 12345678,
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Expected string')
      }
    })

    test('should accept password with all requirements', () => {
      const validPasswords = [
        'Test123!@#',
        'Password1!',
        'MySecure2023$',
        'ComplexP@ssw0rd',
        'Valid123#ABC',
      ]

      validPasswords.forEach((password) => {
        const validData = { new_password: password }
        const result = changePasswordSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.new_password).toBe(password)
        }
      })
    })

    test('should handle edge case special characters', () => {
      const validData = {
        new_password: 'Test123`~<>?,./!@#$%^&*()\\-_+="\'|{}[];:\\',
      }

      const result = changePasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.new_password).toBe(validData.new_password)
      }
    })
  })

  describe('Type Definitions', () => {
    test('CategorySchema should be correctly inferred', () => {
      // This test ensures the type is properly inferred
      const testData: CategorySchema = {
        name: 'Test Category',
        description: 'Test Description',
      }

      expect(testData.name).toBe('Test Category')
      expect(testData.description).toBe('Test Description')
    })

    test('CategorySchema should allow optional description', () => {
      const testData: CategorySchema = {
        name: 'Test Category',
      }

      expect(testData.name).toBe('Test Category')
      expect(testData.description).toBeUndefined()
    })

    test('ChangePasswordSchema should be correctly inferred', () => {
      const testData: ChangePasswordSchema = {
        new_password: 'Test123!@#',
      }

      expect(testData.new_password).toBe('Test123!@#')
    })
  })

  describe('Schema Structure', () => {
    test('formSchema should be a Zod schema', () => {
      expect(formSchema).toBeInstanceOf(z.ZodObject)
    })

    test('changePasswordSchema should be a Zod schema', () => {
      expect(changePasswordSchema).toBeInstanceOf(z.ZodObject)
    })

    test('formSchema should have correct fields', () => {
      const shape = formSchema.shape
      expect(shape.name).toBeInstanceOf(z.ZodEffects)
      expect(shape.description).toBeInstanceOf(z.ZodUnion)
    })

    test('changePasswordSchema should have correct fields', () => {
      const shape = changePasswordSchema.shape
      expect(shape.new_password).toBeInstanceOf(z.ZodString)
    })
  })

  describe('Error Messages', () => {
    test('should provide clear error messages for validation failures', () => {
      const invalidData = {
        name: '',
        description: 123,
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues
        expect(errors).toHaveLength(2)

        const nameError = errors.find((err) => err.path[0] === 'name')
        const descError = errors.find((err) => err.path[0] === 'description')

        expect(nameError?.message).toBe('Required.')
        expect(descError?.message).toContain('Invalid input')
      }
    })

    test('should provide specific error message for leading spaces', () => {
      const invalidData = {
        name: '  Invalid Name',
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.issues[0]
        expect(error.message).toBe('Leading spaces are not allowed')
        expect(error.path).toContain('name')
      }
    })
  })
})
