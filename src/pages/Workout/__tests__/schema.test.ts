import {
  formSchema,
  changePasswordSchema,
  type WorkoutSchema,
  type ChangePasswordSchema,
} from '../create/schema'

jest.mock('../../../utilities/noLeadingSpaces', () => ({
  __esModule: true,
  default: (value: string) => value === value.trimStart(),
}))

const passerror =
  'Password should contain at least one uppercase letter, one lowercase letter, one digit, and one special character, with a minimum length of eight characters, and must not contain any spaces.'

describe('Workout Form Schema', () => {
  describe('formSchema', () => {
    const validFormData: WorkoutSchema = {
      name: 'Test Workout',
      description: 'Test Description',
      intensity_level: 'Moderate',
      category: 'Strength',
      category_id: 1,
      subcategory: 'Upper Body',
      subcategory_id: 2,
      video_url: 'https://example.com/video.mp4',
      video_file: undefined,
      thumbnail: undefined,
    }

    it('should validate valid workout data', () => {
      const result = formSchema.safeParse(validFormData)

      expect(result.success).toBe(true)
    })

    it('should accept category_id from a select option object', () => {
      const result = formSchema.safeParse({
        ...validFormData,
        category_id: { id: '5', name: 'Mobility' },
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category_id).toBe(5)
      }
    })

    it('should require name field', () => {
      const result = formSchema.safeParse({ ...validFormData, name: '' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('name')
        expect(result.error.issues[0].message).toBe('Required.')
      }
    })

    it('should reject name with leading spaces', () => {
      const result = formSchema.safeParse({
        ...validFormData,
        name: ' Test Workout',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('name')
        expect(result.error.issues[0].message).toBe(
          'Leading spaces are not allowed'
        )
      }
    })

    it('should require description field', () => {
      const result = formSchema.safeParse({
        ...validFormData,
        description: '',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('description')
        expect(result.error.issues[0].message).toBe('Required.')
      }
    })

    it('should require intensity_level field', () => {
      const result = formSchema.safeParse({
        ...validFormData,
        intensity_level: '',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('intensity_level')
        expect(result.error.issues[0].message).toBe('Required.')
      }
    })

    it('should require category text field', () => {
      const result = formSchema.safeParse({ ...validFormData, category: '' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('category')
        expect(result.error.issues[0].message).toBe('Required.')
      }
    })

    it('should require category_id field', () => {
      const result = formSchema.safeParse({
        ...validFormData,
        category_id: undefined,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const categoryIdError = result.error.issues.find(
          (issue) => issue.path[0] === 'category_id'
        )
        expect(categoryIdError?.message).toBe('Category is required.')
      }
    })

    it('should allow optional subcategory fields to be omitted', () => {
      const result = formSchema.safeParse({
        ...validFormData,
        subcategory: undefined,
        subcategory_id: undefined,
      })

      expect(result.success).toBe(true)
    })

    it('should accept valid video file', () => {
      const result = formSchema.safeParse({
        ...validFormData,
        video_url: '',
        video_file: new File(['test'], 'video.mp4', { type: 'video/mp4' }),
      })

      expect(result.success).toBe(true)
    })

    it('should accept existing string video file', () => {
      const result = formSchema.safeParse({
        ...validFormData,
        video_file: 'existing-video.mp4',
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid video_file format', () => {
      const result = formSchema.safeParse({
        ...validFormData,
        video_file: { invalid: 'object' },
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const videoFileError = result.error.issues.find(
          (issue) => issue.path[0] === 'video_file'
        )
        expect(videoFileError?.message).toBe('Video is required.')
      }
    })

    it('should accept optional thumbnail values', () => {
      const fileResult = formSchema.safeParse({
        ...validFormData,
        thumbnail: new File(['test'], 'thumbnail.jpg', { type: 'image/jpeg' }),
      })
      const nullResult = formSchema.safeParse({
        ...validFormData,
        thumbnail: null,
      })

      expect(fileResult.success).toBe(true)
      expect(nullResult.success).toBe(true)
    })
  })

  describe('changePasswordSchema', () => {
    it('should validate valid password', () => {
      const validData: ChangePasswordSchema = {
        new_password: 'Password123!',
      }

      const result = changePasswordSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should reject password without uppercase letter', () => {
      const result = changePasswordSchema.safeParse({
        new_password: 'password123!',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(passerror)
      }
    })

    it('should reject password with spaces', () => {
      const result = changePasswordSchema.safeParse({
        new_password: 'Password 123!',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Space not allowed')
      }
    })
  })
})
