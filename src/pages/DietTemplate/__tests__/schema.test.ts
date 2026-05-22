import { formSchema, editFormSchema } from '../create/schema'

describe('DietTemplate Form Schema', () => {
  const validData = {
    name: 'Weight Loss Plan',
    description: 'A comprehensive weight loss diet plan',
    duration_days: 30,
    diet_template_category: 'Weight Loss',
    diet_template_category_id: { id: 1, label: 'Weight Loss' },
    thumbnail: undefined,
  }

  describe('formSchema', () => {
    it('should validate valid data', () => {
      const result = formSchema.safeParse(validData)

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.name).toBe('Weight Loss Plan')
        expect(result.data.duration_days).toBe(30)
        expect(result.data.diet_template_category_id).toBe(1)
      }
    })

    it('should fail when name is empty', () => {
      const result = formSchema.safeParse({
        ...validData,
        name: '',
      })

      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toBeDefined()
      }
    })

    it('should fail when name contains leading spaces', () => {
      const result = formSchema.safeParse({
        ...validData,
        name: '  Weight Loss Plan',
      })

      expect(result.success).toBe(false)
    })

    it('should fail when description is empty', () => {
      const result = formSchema.safeParse({
        ...validData,
        description: '',
      })

      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.flatten().fieldErrors.description).toBeDefined()
      }
    })

    it('should fail when duration_days is zero', () => {
      const result = formSchema.safeParse({
        ...validData,
        duration_days: 0,
      })

      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.flatten().fieldErrors.duration_days).toBeDefined()
      }
    })

    it('should fail when duration_days is negative', () => {
      const result = formSchema.safeParse({
        ...validData,
        duration_days: -10,
      })

      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.flatten().fieldErrors.duration_days).toBeDefined()
      }
    })

    it('should convert string duration_days to number', () => {
      const result = formSchema.safeParse({
        ...validData,
        duration_days: '30' as any,
      })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.duration_days).toBe(30)
        expect(typeof result.data.duration_days).toBe('number')
      }
    })

    it('should fail when diet_template_category_id is invalid', () => {
      const result = formSchema.safeParse({
        ...validData,
        diet_template_category_id: undefined,
      })

      expect(result.success).toBe(false)

      if (!result.success) {
        expect(
          result.error.flatten().fieldErrors.diet_template_category_id
        ).toBeDefined()
      }
    })

    it('should extract id from diet_template_category_id object', () => {
      const result = formSchema.safeParse({
        ...validData,
        diet_template_category_id: {
          id: 5,
          name: 'Muscle Gain',
        },
      })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.diet_template_category_id).toBe(5)
      }
    })

    it('should allow optional thumbnail field', () => {
      const result = formSchema.safeParse({
        ...validData,
        thumbnail: undefined,
      })

      expect(result.success).toBe(true)
    })

    it('should allow optional diet_template_category field', () => {
      const result = formSchema.safeParse({
        ...validData,
        diet_template_category: undefined,
      })

      expect(result.success).toBe(true)
    })

    it('should handle large duration_days values', () => {
      const result = formSchema.safeParse({
        ...validData,
        duration_days: 365,
      })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.duration_days).toBe(365)
      }
    })
  })

  describe('editFormSchema', () => {
    it('should validate valid edit data', () => {
      const result = editFormSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should have same validation rules as formSchema', () => {
      const testData = {
        ...validData,
        name: '',
      }

      const formResult = formSchema.safeParse(testData)
      const editResult = editFormSchema.safeParse(testData)

      expect(formResult.success).toBe(editResult.success)
    })
  })
})
