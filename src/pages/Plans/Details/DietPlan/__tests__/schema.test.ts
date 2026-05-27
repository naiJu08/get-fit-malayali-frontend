import { dietPlanFormSchema } from '../create/schema'

describe('DietPlan schema', () => {
  it('accepts valid payload and transforms numeric fields', () => {
    const res = dietPlanFormSchema.safeParse({
      plan_id: '1',
      day_number: '1',
      day_name: 'Day 1',
      sequence_number: '1',
      meal_time: 'Breakfast',
      meals: [{ meal_id: '10', count: '2', requirement: 'Mandatory' }],
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.plan_id).toBe(1)
      expect(res.data.day_number).toBe(1)
      expect(res.data.sequence_number).toBe(1)
      expect(res.data.meals?.[0]?.meal_id).toBe(10)
      expect(res.data.meals?.[0]?.count).toBe(2)
    }
  })

  it('requires day_number >= 1', () => {
    const res = dietPlanFormSchema.safeParse({
      plan_id: 1,
      day_number: 0,
      day_name: 'Day 0',
      sequence_number: 1,
      meal_time: 'Breakfast',
    })
    expect(res.success).toBe(false)
  })

  it('requires meal when count provided and vice versa', () => {
    const a = dietPlanFormSchema.safeParse({
      plan_id: 1,
      day_number: 1,
      day_name: 'Day 1',
      sequence_number: 1,
      meal_time: 'Breakfast',
      meals: [{ meal_id: 0, count: 2, requirement: 'Optional' }],
    })
    expect(a.success).toBe(false)

    const b = dietPlanFormSchema.safeParse({
      plan_id: 1,
      day_number: 1,
      day_name: 'Day 1',
      sequence_number: 1,
      meal_time: 'Breakfast',
      meals: [{ meal_id: 10, count: 0, requirement: 'Optional' }],
    })
    expect(b.success).toBe(false)
  })

  it('coerces invalid numeric strings to 0 and flags missing meal', () => {
    const res = dietPlanFormSchema.safeParse({
      plan_id: 1,
      day_number: 1,
      day_name: 'Day 1',
      sequence_number: 1,
      meal_time: 'Breakfast',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      meals: [{ meal_id: 'x', count: '2' }],
    })
    expect(res.success).toBe(false)
  })

  it('defaults meals to empty array when omitted', () => {
    const res = dietPlanFormSchema.safeParse({
      plan_id: 1,
      day_number: 1,
      day_name: 'Day 1',
      sequence_number: 1,
      meal_time: 'Breakfast',
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(Array.isArray(res.data.meals)).toBe(true)
      expect(res.data.meals.length).toBe(0)
    }
  })

  it('transforms numeric/empty-string macros and meal item nutrition fields', () => {
    const res = dietPlanFormSchema.safeParse({
      plan_id: '1',
      day_number: '1',
      day_name: 'Day 1',
      sequence_number: '1',
      meal_time: 'Breakfast',
      calories: '',
      total_calories: '100',
      meals: [
        {
          meal_id: '',
          count: '',
          requirement: 'Optional',
          protein: '',
          carbs: '12',
          fat: '',
          fiber: '',
          total_calories: '',
        },
        {
          meal_id: '10',
          count: '2',
          requirement: 'Mandatory',
          protein: '5',
          carbs: '6',
          fat: '7',
          fiber: '8',
          total_calories: '9',
        },
      ],
    })

    expect(res.success).toBe(true)
    if (!res.success) return

    // top-level numeric transforms
    expect(res.data.total_calories).toBe(100)
    expect(res.data.calories).toBe('')

    // toNumberOrZero early-return path via '' (meal_id/count)
    expect(res.data.meals?.[0]?.meal_id).toBe(0)
    expect(res.data.meals?.[0]?.count).toBe(0)

    // meal nutrition fields: '' stays ''
    expect(res.data.meals?.[0]?.protein).toBe('')
    expect(res.data.meals?.[0]?.fat).toBe('')

    // meal nutrition fields: numeric strings become numbers
    expect(res.data.meals?.[0]?.carbs).toBe(12)
    expect(res.data.meals?.[1]?.protein).toBe(5)
    expect(res.data.meals?.[1]?.carbs).toBe(6)
    expect(res.data.meals?.[1]?.fat).toBe(7)
    expect(res.data.meals?.[1]?.fiber).toBe(8)
    expect(res.data.meals?.[1]?.total_calories).toBe(9)
  })
})
