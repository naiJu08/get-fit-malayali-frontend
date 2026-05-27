import { yogaPlanFormSchema } from '../create/schema'

describe('YogaPlan schema', () => {
  it('accepts valid payload and coerces numbers', () => {
    const res = yogaPlanFormSchema.safeParse({
      plan_id: '1',
      day_number: '1',
      title: 'Day 1',
      description: '',
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.plan_id).toBe(1)
      expect(res.data.day_number).toBe(1)
    }
  })

  it('rejects invalid day number', () => {
    const res = yogaPlanFormSchema.safeParse({
      plan_id: 1,
      day_number: 0,
      title: 'X',
    })
    expect(res.success).toBe(false)
  })
})

