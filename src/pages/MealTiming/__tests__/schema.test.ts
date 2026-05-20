import { mealTimingFormSchema } from '../create/schema'

jest.mock('../../../utilities/noLeadingSpaces', () => ({
  __esModule: true,
  default: (val: string) => val === val.trim(),
}))

describe('MealTiming Schema Validation', () => {
  it('validates correct data', () => {
    const result = mealTimingFormSchema.safeParse({
      name: 'Breakfast',
      time: '08:00',
      sequence_number: 1,
      status: 'Active',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = mealTimingFormSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects leading spaces in name', () => {
    const result = mealTimingFormSchema.safeParse({
      name: '  Breakfast',
      time: '08:00',
      sequence_number: 1,
      status: 'Active',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Leading spaces are not allowed')
    }
  })

  it('coerces sequence_number from string', () => {
    const result = mealTimingFormSchema.safeParse({
      name: 'Breakfast',
      time: '08:00',
      sequence_number: '2',
      status: 'Active',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.sequence_number).toBe(2)
  })

  it('enforces max length on name', () => {
    const result = mealTimingFormSchema.safeParse({
      name: 'A'.repeat(51),
      time: '08:00',
      sequence_number: 1,
      status: 'Active',
    })
    expect(result.success).toBe(false)
  })
})

