import {
  formSchema,
  editFormSchema,
  changePasswordSchema,
  MeditationSchema,
  ChangePasswordSchema,
} from '../create/schema'

// Mock the noLeadingSpaces utility
jest.mock('../../../utilities/noLeadingSpaces', () => ({
  __esModule: true,
  default: (val: string) => val === val.trim(),
}))

// Define the passerror constant locally since it's not exported from schema
const passerror =
  'Password should contain at least one uppercase letter, one lowercase letter, one digit, and one special character, with a minimum length of eight characters, and must not contain any spaces.'

describe('Meditation Schema Validation', () => {
  describe('formSchema', () => {
    it('should validate correct meditation data', () => {
      const validData = {
        title: 'Test Meditation',
        description: 'Test Description',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
        video_file_label: 'Test Video',
        thumbnail: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      }

      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Test Meditation')
        expect(result.data.description).toBe('Test Description')
        expect(result.data.video_file).toBeDefined()
        expect(result.data.thumbnail).toBeDefined()
      }
    })

    it('should reject data with missing title', () => {
      const invalidData = {
        description: 'Test Description',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('title')
        expect(result.error.issues[0].message).toMatch(/Required/i)
      }
    })

    it('should reject data with empty title', () => {
      const invalidData = {
        title: '',
        description: 'Test Description',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('title')
        expect(result.error.issues[0].message).toMatch(/Required/i)
      }
    })

    it('should reject data with leading spaces in title', () => {
      const invalidData = {
        title: '  Invalid Title',
        description: 'Test Description',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
        thumbnail: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('title')
        expect(result.error.issues[0].message).toBe(
          'Leading spaces are not allowed'
        )
      }
    })

    it('should reject data with missing description', () => {
      const invalidData = {
        title: 'Test Title',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('description')
        expect(result.error.issues[0].message).toMatch(/Required/i)
      }
    })

    it('should reject data with empty description', () => {
      const invalidData = {
        title: 'Test Title',
        description: '',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('description')
        expect(result.error.issues[0].message).toMatch(/Required/i)
      }
    })

    it('should reject data with missing video_file', () => {
      const invalidData = {
        title: 'Test Title',
        description: 'Test Description',
        video_file_label: 'Test Video',
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const videoFileError = result.error.issues.find(
          (issue) => issue.path[0] === 'video_file'
        )
        expect(videoFileError).toBeDefined()
        expect(videoFileError?.message).toMatch(/Required/i)
      }
    })

    it('should reject data with null video_file', () => {
      const invalidData = {
        title: 'Test Title',
        description: 'Test Description',
        video_file: null,
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('video_file')
        expect(result.error.issues[0].message).toMatch(/Required/i)
      }
    })

    it('should reject data with empty string video_file', () => {
      const invalidData = {
        title: 'Test Title',
        description: 'Test Description',
        video_file: '',
      }

      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('video_file')
        expect(result.error.issues[0].message).toMatch(/Required/i)
      }
    })

    it('should accept data with optional fields omitted', () => {
      const validData = {
        title: 'Test Meditation',
        description: 'Test Description',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
      }

      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept data with null optional fields', () => {
      const validData = {
        title: 'Test Meditation',
        description: 'Test Description',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
        thumbnail: null,
        video_file_label: null,
      }

      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept data with undefined optional fields', () => {
      const validData = {
        title: 'Test Meditation',
        description: 'Test Description',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
        thumbnail: undefined,
        video_file_label: undefined,
      }

      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept various file types for video_file', () => {
      const validData = {
        title: 'Test Meditation',
        description: 'Test Description',
        video_file: new Blob(['test content'], { type: 'video/mp4' }),
      }

      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept various file types for thumbnail', () => {
      const validData = {
        title: 'Test Meditation',
        description: 'Test Description',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
        thumbnail: new Blob(['test'], { type: 'image/png' }),
      }

      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('editFormSchema', () => {
    it('should validate correct edit data without video_file', () => {
      const validData = {
        title: 'Updated Meditation',
        description: 'Updated Description',
      }

      const result = editFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Updated Meditation')
        expect(result.data.description).toBe('Updated Description')
      }
    })

    it('should validate correct edit data with video_file', () => {
      const validData = {
        title: 'Updated Meditation',
        description: 'Updated Description',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
        video_file_label: 'Updated Video',
      }

      const result = editFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept data with missing optional fields', () => {
      const validData = {
        title: 'Updated Meditation',
        description: 'Updated Description',
      }

      const result = editFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should still require title in edit mode', () => {
      const invalidData = {
        description: 'Updated Description',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
      }

      const result = editFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('title')
        expect(result.error.issues[0].message).toMatch(/Required/i)
      }
    })

    it('should still require description in edit mode', () => {
      const invalidData = {
        title: 'Updated Meditation',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
      }

      const result = editFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('description')
        expect(result.error.issues[0].message).toMatch(/Required/i)
      }
    })

    it('should handle partial updates correctly', () => {
      const partialData = {
        title: 'Only Title Updated',
      }

      const result = editFormSchema.safeParse(partialData)
      expect(result.success).toBe(false) // Description is required
    })
  })

  describe('changePasswordSchema', () => {
    it('should validate correct password', () => {
      const validPassword = 'SecurePass123!'
      const result = changePasswordSchema.safeParse({
        new_password: validPassword,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.new_password).toBe(validPassword)
      }
    })

    it('should reject password without uppercase letter', () => {
      const invalidPassword = 'lowercase123!'
      const result = changePasswordSchema.safeParse({
        new_password: invalidPassword,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letter')
      }
    })

    it('should reject password without lowercase letter', () => {
      const invalidPassword = 'UPPERCASE123!'
      const result = changePasswordSchema.safeParse({
        new_password: invalidPassword,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('lowercase letter')
      }
    })

    it('should reject password without digit', () => {
      const invalidPassword = 'NoDigitsHere!'
      const result = changePasswordSchema.safeParse({
        new_password: invalidPassword,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('digit')
      }
    })

    it('should reject password without special character', () => {
      const invalidPassword = 'NoSpecialChars123'
      const result = changePasswordSchema.safeParse({
        new_password: invalidPassword,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('special character')
      }
    })

    it('should reject password with spaces', () => {
      const invalidPassword = 'Password 123!'
      const result = changePasswordSchema.safeParse({
        new_password: invalidPassword,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Space not allowed')
      }
    })

    it('should reject password shorter than 8 characters', () => {
      const invalidPassword = 'Short1!'
      const result = changePasswordSchema.safeParse({
        new_password: invalidPassword,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'minimum length of eight characters'
        )
      }
    })

    it('should reject empty password', () => {
      const invalidPassword = ''
      const result = changePasswordSchema.safeParse({
        new_password: invalidPassword,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(passerror)
      }
    })

    it('should accept valid password with all requirements', () => {
      const validPasswords = [
        'ValidPass123!',
        'MySecurePass1@',
        'Complex#Password2',
        'Super$ecure3',
        'Test&Password4',
      ]

      validPasswords.forEach((password) => {
        const result = changePasswordSchema.safeParse({
          new_password: password,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should handle special characters correctly', () => {
      const validPassword = 'Special@Char#123'
      const result = changePasswordSchema.safeParse({
        new_password: validPassword,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Type Inference', () => {
    it('should correctly infer MeditationSchema type', () => {
      const testData: MeditationSchema = {
        title: 'Test',
        description: 'Test Description',
        thumbnail: undefined,
        video_file: undefined,
        video_file_label: undefined,
      }

      expect(typeof testData.title).toBe('string')
      expect(typeof testData.description).toBe('string')
      expect(testData.thumbnail).toBeUndefined()
      expect(testData.video_file).toBeUndefined()
    })

    it('should correctly infer ChangePasswordSchema type', () => {
      const testData: ChangePasswordSchema = {
        new_password: 'SecurePass123!',
      }

      expect(typeof testData.new_password).toBe('string')
      expect(testData.new_password).toBe('SecurePass123!')
    })
  })

  describe('Edge Cases', () => {
    describe('formSchema Edge Cases', () => {
      it('should handle very long titles', () => {
        const longTitle = 'A'.repeat(1000)
        const result = formSchema.safeParse({
          title: longTitle,
          description: 'Test Description',
          video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
        })
        expect(result.success).toBe(true)
      })

      it('should handle very long descriptions', () => {
        const longDescription = 'A'.repeat(5000)
        const result = formSchema.safeParse({
          title: 'Test Title',
          description: longDescription,
          video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
        })
        expect(result.success).toBe(true)
      })

      it('should handle special characters in title', () => {
        const specialTitle = 'Title with émojis 🧘‍♂️ and symbols @#$%'
        const result = formSchema.safeParse({
          title: specialTitle,
          description: 'Test Description',
          video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
        })
        expect(result.success).toBe(true)
      })

      it('should handle unicode characters in description', () => {
        const unicodeDescription =
          'Description with café, résumé, and naïve text'
        const result = formSchema.safeParse({
          title: 'Test Title',
          description: unicodeDescription,
          video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
        })
        expect(result.success).toBe(true)
      })

      it('should handle empty thumbnail as null', () => {
        const result = formSchema.safeParse({
          title: 'Test',
          description: 'Test',
          video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
          thumbnail: null,
        })
        expect(result.success).toBe(true)
      })
    })

    describe('changePasswordSchema Edge Cases', () => {
      it('should handle maximum length password (100 chars)', () => {
        const maxLengthPassword = 'A'.repeat(92) + 'a1!'
        const result = changePasswordSchema.safeParse({
          new_password: maxLengthPassword,
        })
        expect(result.success).toBe(true)
      })

      it('should handle password with multiple special characters', () => {
        const multiSpecialPassword = 'Aa1' + '!@#$%^&*()_+-=[]{}|;:,.<>?'
        const result = changePasswordSchema.safeParse({
          new_password: multiSpecialPassword,
        })
        expect(result.success).toBe(true)
      })

      it('should handle password with all special characters and requirements', () => {
        const allSpecialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?Aa1'
        const result = changePasswordSchema.safeParse({
          new_password: allSpecialPassword,
        })
        expect(result.success).toBe(true)
      })

      it('should handle numeric-only password with requirements', () => {
        const numericPassword = '12345678Aa!'
        const result = changePasswordSchema.safeParse({
          new_password: numericPassword,
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Schema Composition', () => {
    it('should have correct field count for formSchema', () => {
      const shape = formSchema.shape
      const fieldNames = Object.keys(shape)
      expect(fieldNames).toHaveLength(5)
      expect(fieldNames).toContain('title')
      expect(fieldNames).toContain('description')
      expect(fieldNames).toContain('video_file')
      expect(fieldNames).toContain('video_file_label')
      expect(fieldNames).toContain('thumbnail')
    })

    it('should have correct field count for editFormSchema', () => {
      const shape = editFormSchema.shape
      const fieldNames = Object.keys(shape)
      expect(fieldNames).toHaveLength(5)
      expect(fieldNames).toContain('title')
      expect(fieldNames).toContain('description')
      expect(fieldNames).toContain('video_file')
      expect(fieldNames).toContain('video_file_label')
      expect(fieldNames).toContain('thumbnail')
    })

    it('should have correct field count for changePasswordSchema', () => {
      const shape = changePasswordSchema.shape
      const fieldNames = Object.keys(shape)
      expect(fieldNames).toHaveLength(1)
      expect(fieldNames).toContain('new_password')
    })

    it('should share base fields between formSchema and editFormSchema', () => {
      const formFields = Object.keys(formSchema.shape)
      const editFields = Object.keys(editFormSchema.shape)

      // Both should have title and description
      expect(formFields).toContain('title')
      expect(formFields).toContain('description')
      expect(editFields).toContain('title')
      expect(editFields).toContain('description')

      // Both should have same field names
      expect(formFields.sort()).toEqual(editFields.sort())
    })
  })

  describe('Error Message Consistency', () => {
    it('should provide consistent error messages for required fields', () => {
      const requiredFields = ['title', 'description', 'video_file']

      requiredFields.forEach((field) => {
        const result = formSchema.safeParse({})
        expect(result.success).toBe(false)
        if (!result.success) {
          const fieldErrors = result.error.issues.filter(
            (issue) => issue.path[0] === field
          )
          expect(fieldErrors.length).toBeGreaterThan(0)
          fieldErrors.forEach((error) => {
            expect(error.message).toMatch(/required/i)
          })
        }
      })
    })

    it('should provide specific error messages for validation failures', () => {
      const leadingSpacesResult = formSchema.safeParse({
        title: '  Invalid',
        description: 'Test Description',
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
        thumbnail: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      })

      expect(leadingSpacesResult.success).toBe(false)
      if (!leadingSpacesResult.success) {
        const leadingSpaceError = leadingSpacesResult.error.issues.find(
          (issue) => issue.message === 'Leading spaces are not allowed'
        )
        expect(leadingSpaceError).toBeDefined()
        expect(leadingSpaceError?.path[0]).toBe('title')
      }
    })

    it('should have consistent password error messages', () => {
      const result = changePasswordSchema.safeParse({ new_password: 'weak' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(passerror)
      }
    })
  })

  describe('Validation Performance', () => {
    it('should validate quickly with large strings', () => {
      const largeTitle = 'A'.repeat(10000)
      const largeDescription = 'B'.repeat(10000)

      const startTime = performance.now()
      const result = formSchema.safeParse({
        title: largeTitle,
        description: largeDescription,
        video_file: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
      })
      const endTime = performance.now()

      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(100) // Should validate in less than 100ms
    })
  })
})
