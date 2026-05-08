// src/pages/Yoga/__tests__/schema.test.ts

import { formSchema, changePasswordSchema, YogaSchema, ChangePasswordSchema } from '../create/schema'

// Mock the noLeadingSpaces utility
jest.mock('../../../utilities/noLeadingSpaces', () => ({
  __esModule: true,
  default: (value: string) => {
    // Simple implementation for testing
    return value === value.trimStart()
  },
}))

describe('Yoga Form Schema', () => {
  describe('formSchema', () => {
    const validFormData: YogaSchema = {
      name: 'Test Yoga',
      description: 'Test Description',
      intensity_level: 'Moderate',
      category: 'basic',
      video_url: 'https://example.com/video.mp4',
      video_file: undefined,
      thumbnail: undefined,
    }

    it('should validate valid form data with video URL', () => {
      const result = formSchema.safeParse(validFormData)
      expect(result.success).toBe(true)
    })

    it('should validate valid form data with video file', () => {
      const formDataWithFile = {
        ...validFormData,
        video_url: '',
        video_file: new File(['test'], 'video.mp4', { type: 'video/mp4' }),
      }
      const result = formSchema.safeParse(formDataWithFile)
      expect(result.success).toBe(true)
    })

    it('should require name field', () => {
      const invalidData = { ...validFormData, name: '' }
      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required.')
      }
    })

    it('should require description field', () => {
      const invalidData = { ...validFormData, description: '' }
      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required.')
      }
    })

    it('should require intensity_level field', () => {
      const invalidData = { ...validFormData, intensity_level: '' }
      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required.')
      }
    })

    it('should require category field', () => {
      const invalidData = { ...validFormData, category: '' }
      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required.')
      }
    })

    it('should reject name with leading spaces', () => {
      const invalidData = { ...validFormData, name: ' Test Yoga' }
      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Leading spaces are not allowed')
      }
    })

    it('should accept name without leading spaces', () => {
      const validData = { ...validFormData, name: 'Test Yoga' }
      const result = formSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require video when all other fields are filled', () => {
      const dataWithoutVideo = {
        name: 'Test Yoga',
        description: 'Test Description',
        intensity_level: 'Moderate',
        category: 'basic',
        video_url: '',
        video_file: undefined,
        thumbnail: undefined,
      }
      const result = formSchema.safeParse(dataWithoutVideo)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Video is required.')
        expect(result.error.issues[0].path).toContain('video_file')
      }
    })

    it('should allow missing video when other required fields are not filled', () => {
      const incompleteData = {
        name: '',
        description: '',
        intensity_level: '',
        category: '',
        video_url: '',
        video_file: undefined,
        thumbnail: undefined,
      }
      const result = formSchema.safeParse(incompleteData)
      expect(result.success).toBe(false)
      // Should fail on required fields, not video requirement
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required.')
        expect(result.error.issues[0].path).toContain('name')
      }
    })

    it('should accept valid video file', () => {
      const dataWithFile = {
        ...validFormData,
        video_url: '',
        video_file: new File(['test'], 'video.mp4', { type: 'video/mp4' }),
      }
      const result = formSchema.safeParse(dataWithFile)
      expect(result.success).toBe(true)
    })

    it('should accept valid thumbnail file', () => {
      const dataWithThumbnail = {
        ...validFormData,
        thumbnail: new File(['test'], 'image.jpg', { type: 'image/jpeg' }),
      }
      const result = formSchema.safeParse(dataWithThumbnail)
      expect(result.success).toBe(true)
    })

    it('should accept empty video_url', () => {
      const dataWithEmptyUrl = {
        ...validFormData,
        video_url: '',
        video_file: new File(['test'], 'video.mp4', { type: 'video/mp4' }),
      }
      const result = formSchema.safeParse(dataWithEmptyUrl)
      expect(result.success).toBe(true)
    })

    it('should accept undefined video_url', () => {
      const dataWithUndefinedUrl = {
        ...validFormData,
        video_url: undefined,
        video_file: new File(['test'], 'video.mp4', { type: 'video/mp4' }),
      }
      const result = formSchema.safeParse(dataWithUndefinedUrl)
      expect(result.success).toBe(true)
    })

    it('should reject invalid video_file format', () => {
      const dataWithInvalidFile = {
        ...validFormData,
        video_url: '',
        video_file: { invalid: 'object' }, // Not a File instance or string
      }
      const result = formSchema.safeParse(dataWithInvalidFile)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid file format')
      }
    })

    it('should accept string video_file (for existing files)', () => {
      const dataWithStringFile = {
        ...validFormData,
        video_url: 'https://example.com/video.mp4', // Keep video_url to satisfy the video requirement
        video_file: 'existing-video.mp4',
      }
      const result = formSchema.safeParse(dataWithStringFile)
      expect(result.success).toBe(true)
    })

    it('should accept null video_file', () => {
      const dataWithNullFile = {
        ...validFormData,
        video_url: 'https://example.com/video.mp4',
        video_file: null,
      }
      const result = formSchema.safeParse(dataWithNullFile)
      expect(result.success).toBe(true)
    })

    it('should accept undefined thumbnail', () => {
      const dataWithUndefinedThumbnail = {
        ...validFormData,
        thumbnail: undefined,
      }
      const result = formSchema.safeParse(dataWithUndefinedThumbnail)
      expect(result.success).toBe(true)
    })

    it('should accept null thumbnail', () => {
      const dataWithNullThumbnail = {
        ...validFormData,
        thumbnail: null,
      }
      const result = formSchema.safeParse(dataWithNullThumbnail)
      expect(result.success).toBe(true)
    })

    it('should handle whitespace-only strings correctly', () => {
      const dataWithWhitespace = {
        name: '   ',
        description: 'Test Description',
        intensity_level: 'Moderate',
        category: 'basic',
        video_url: 'https://example.com/video.mp4',
        video_file: undefined,
        thumbnail: undefined,
      }
      const result = formSchema.safeParse(dataWithWhitespace)
      expect(result.success).toBe(false)
      if (!result.success) {
        // Should fail on leading spaces validation first, not min(1)
        expect(result.error.issues[0].message).toBe('Leading spaces are not allowed')
      }
    })

    it('should validate all intensity levels', () => {
      const intensityLevels = ['Low', 'Moderate', 'High', 'BEGINNER', 'ADVANCED']
      
      intensityLevels.forEach((level) => {
        const data = {
          ...validFormData,
          intensity_level: level,
        }
        const result = formSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should validate all categories', () => {
      const categories = ['basic', 'intermediate', 'advanced', 'BEGINNER', 'EXPERT']
      
      categories.forEach((category) => {
        const data = {
          ...validFormData,
          category,
        }
        const result = formSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should handle maximum length constraints', () => {
      // Test with very long strings (though schema doesn't define max length, this tests general behavior)
      const longName = 'a'.repeat(1000)
      const dataWithLongName = {
        ...validFormData,
        name: longName,
      }
      const result = formSchema.safeParse(dataWithLongName)
      expect(result.success).toBe(true) // Schema doesn't limit length
    })

    it('should provide correct error paths', () => {
      const invalidData = {
        name: '',
        description: '',
        intensity_level: '',
        category: '',
        video_url: '',
        video_file: undefined,
        thumbnail: undefined,
      }
      const result = formSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        // Check that errors are on the correct paths
        const paths = result.error.issues.map(issue => issue.path[0])
        expect(paths).toContain('name')
      }
    })
  })

  describe('changePasswordSchema', () => {
    const validPassword = 'Test123!@'

    it('should validate valid password', () => {
      const result = changePasswordSchema.safeParse({ new_password: validPassword })
      expect(result.success).toBe(true)
    })

    it('should require password', () => {
      const result = changePasswordSchema.safeParse({ new_password: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password should contain')
      }
    })

    it('should reject password without uppercase letter', () => {
      const result = changePasswordSchema.safeParse({ new_password: 'test123!@' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password should contain')
      }
    })

    it('should reject password without lowercase letter', () => {
      const result = changePasswordSchema.safeParse({ new_password: 'TEST123!@' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password should contain')
      }
    })

    it('should reject password without digit', () => {
      const result = changePasswordSchema.safeParse({ new_password: 'TestABC!@' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password should contain')
      }
    })

    it('should reject password without special character', () => {
      const result = changePasswordSchema.safeParse({ new_password: 'Test123ab' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password should contain')
      }
    })

    it('should reject password with spaces', () => {
      const result = changePasswordSchema.safeParse({ new_password: 'Test 123!@' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Space not allowed')
      }
    })

    it('should reject password shorter than 8 characters', () => {
      const result = changePasswordSchema.safeParse({ new_password: 'Test1!' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password should contain')
      }
    })

    it('should accept password with exactly 8 characters', () => {
      const result = changePasswordSchema.safeParse({ new_password: 'Test1!@#' })
      expect(result.success).toBe(true)
    })

    it('should accept password longer than 8 characters', () => {
      const result = changePasswordSchema.safeParse({ new_password: 'TestPassword123!@#' })
      expect(result.success).toBe(true)
    })

    it('should accept various special characters', () => {
      const specialChars = ['!@#$%^&*()', '`~<>?,./|{}[];:\\-_+="\'']
      
      specialChars.forEach((char) => {
        const password = `Test123${char}`
        const result = changePasswordSchema.safeParse({ new_password: password })
        expect(result.success).toBe(true)
      })
    })

    it('should provide correct error message for all requirements', () => {
      const result = changePasswordSchema.safeParse({ new_password: 'weak' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errorMessage = result.error.issues[0].message
        expect(errorMessage).toContain('uppercase letter')
        expect(errorMessage).toContain('lowercase letter')
        expect(errorMessage).toContain('digit')
        expect(errorMessage).toContain('special character')
        expect(errorMessage).toContain('minimum length of eight characters')
      }
    })
  })

  describe('Type Exports', () => {
    it('should export YogaSchema type', () => {
      const testData: YogaSchema = {
        name: 'Test',
        description: 'Test',
        intensity_level: 'Moderate',
        category: 'basic',
        video_url: '',
        video_file: undefined,
        thumbnail: undefined,
      }
      expect(testData).toBeDefined()
    })

    it('should export ChangePasswordSchema type', () => {
      const testData: ChangePasswordSchema = {
        new_password: 'Test123!@',
      }
      expect(testData).toBeDefined()
    })
  })
})
