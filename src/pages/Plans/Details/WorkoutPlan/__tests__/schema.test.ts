import { workoutPlanFormSchema } from '../create/schema'

describe('WorkoutPlan schema', () => {
  it('accepts valid payload and transforms ids', () => {
    const res = workoutPlanFormSchema.safeParse({
      plan_id: '1',
      day_number: '2',
      title: 'Day 2',
      description: '',
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.plan_id).toBe(1)
      expect(res.data.day_number).toBe(2)
    }
  })

  it('requires day_number >= 1', () => {
    const res = workoutPlanFormSchema.safeParse({
      plan_id: 1,
      day_number: 0,
      title: 'X',
    })
    expect(res.success).toBe(false)
  })
})

