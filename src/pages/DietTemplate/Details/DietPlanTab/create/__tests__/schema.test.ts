import { dietPlanFormSchema } from '../schema'

describe('DietPlanTab Form Schema', () => {
  const validData = {
    diet_plan_template_id: 1,
    day_number: 1,
    day_name: 'Monday',
    sequence_number: 1,
    meal_time: 'Breakfast',
    meal_time_time: '08:00 AM',
    notes: 'Test notes',
    protein: '25',
    carbs: '50',
    fat: '15',
    fiber: '5',
    total_calories: '400',
    meals: [
      {
        meal_id: 1,
        count: 1,
        requirement: 'Mandatory',
      },
    ],
  }

  describe('dietPlanFormSchema', () => {
    it('should validate valid data', () => {
      const result = dietPlanFormSchema.safeParse(validData)

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.diet_plan_template_id).toBe(1)
        expect(result.data.day_number).toBe(1)
        expect(result.data.meal_time).toBe('Breakfast')
      }
    })

    it('should convert string day_number to number', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        day_number: '5' as any,
      })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.day_number).toBe(5)
        expect(typeof result.data.day_number).toBe('number')
      }
    })

    it('should fail when day_number is less than 1', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        day_number: 0,
      })

      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.flatten().fieldErrors.day_number).toBeDefined()
      }
    })

    it('should fail when day_name is empty', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        day_name: '',
      })

      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.flatten().fieldErrors.day_name).toBeDefined()
      }
    })

    it('should fail when meal_time is empty', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        meal_time: '',
      })

      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.flatten().fieldErrors.meal_time).toBeDefined()
      }
    })

    it('should allow optional meal_time_time', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        meal_time_time: undefined,
      })

      expect(result.success).toBe(true)
    })

    it('should allow optional notes', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        notes: undefined,
      })

      expect(result.success).toBe(true)
    })

    it('should convert numeric strings to numbers for nutrition fields', () => {
      const result = dietPlanFormSchema.safeParse(validData)

      expect(result.success).toBe(true)

      if (result.success) {
        expect(typeof result.data.protein).toBe('number')
        expect(typeof result.data.carbs).toBe('number')
        expect(typeof result.data.fat).toBe('number')
      }
    })

    it('should allow empty string for optional numeric fields', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        protein: '',
        carbs: '',
        fat: '',
        fiber: '',
        total_calories: '',
      })

      expect(result.success).toBe(true)
    })

    it('should fail meal validation when meal_id > 0 but count is 0', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        meals: [
          {
            meal_id: 1,
            count: 0,
            requirement: 'Mandatory',
          },
        ],
      })

      expect(result.success).toBe(false)
    })

    it('should pass meal validation when meal_id and count are both valid', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        meals: [
          {
            meal_id: 1,
            count: 2,
            requirement: 'Mandatory',
          },
        ],
      })

      expect(result.success).toBe(true)
    })

    it('should handle sequence_number conversion', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        sequence_number: '3' as any,
      })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.sequence_number).toBe(3)
      }
    })

    it('should convert diet_plan_template_id to number', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        diet_plan_template_id: '5' as any,
      })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.diet_plan_template_id).toBe(5)
      }
    })

    it('should validate requirement field as enum', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        meals: [
          {
            meal_id: 1,
            count: 1,
            requirement: 'Mandatory',
          },
        ],
      })

      expect(result.success).toBe(true)
    })

    it('should support Optional requirement', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        meals: [
          {
            meal_id: 1,
            count: 1,
            requirement: 'Optional',
          },
        ],
      })

      expect(result.success).toBe(true)
    })

    it('should handle negative day_number', () => {
      const result = dietPlanFormSchema.safeParse({
        ...validData,
        day_number: -1,
      })

      expect(result.success).toBe(false)
    })
  })
})
