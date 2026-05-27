import { planFormSchema } from '../create/schema'

describe('Plans schema', () => {
  it('accepts valid payload and coerces numbers', () => {
    const result = planFormSchema.safeParse({
      name: 'Diabetes Plan',
      category: 'Diabetes',
      description: 'Description',
      duration_days: '30',
      fees: '999',
      yoga_included: true,
      meditation_included: false,
      thumbnail: 'https://example.com/x.png',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.duration_days).toBe(30)
      expect(result.data.fees).toBe(999)
    }
  })

  it('preprocesses category object to name/id', () => {
    const r1 = planFormSchema.safeParse({
      name: 'A Plan',
      category: { name: 'PCOS' },
      description: 'Desc',
      duration_days: 10,
      fees: 100,
      thumbnail: 'x',
    })
    expect(r1.success).toBe(true)
    if (r1.success) expect(r1.data.category).toBe('PCOS')

    const r2 = planFormSchema.safeParse({
      name: 'A Plan',
      category: { id: '78' },
      description: 'Desc',
      duration_days: 10,
      fees: 100,
      thumbnail: 'x',
    })
    expect(r2.success).toBe(true)
    if (r2.success) expect(r2.data.category).toBe('78')
  })

  it('rejects missing required fields', () => {
    const result = planFormSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects zero/negative duration and fees', () => {
    const duration = planFormSchema.safeParse({
      name: 'Plan',
      category: 'A',
      description: 'Desc',
      duration_days: 0,
      fees: 100,
      thumbnail: 'x',
    })
    expect(duration.success).toBe(false)

    const fees = planFormSchema.safeParse({
      name: 'Plan',
      category: 'A',
      description: 'Desc',
      duration_days: 10,
      fees: 0,
      thumbnail: 'x',
    })
    expect(fees.success).toBe(false)
  })
})
