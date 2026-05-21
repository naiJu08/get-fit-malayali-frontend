import { formSchema } from '../create/schema'

describe('Subscriptions create schema', () => {
  const validInput = {
    user_id: 10,
    plan_id: 20,
    start_date: '2026-05-21',
    end_date: '2026-06-21',
    status: 1,
    notes: 'Renew monthly',
  }

  it('validates a complete subscription payload', () => {
    const result = formSchema.parse(validInput)

    expect(result).toEqual(validInput)
  })

  it('transforms string ids and status strings to numbers', () => {
    const result = formSchema.parse({
      ...validInput,
      user_id: '42',
      plan_id: '7',
      status: '2',
    })

    expect(result.user_id).toBe(42)
    expect(result.plan_id).toBe(7)
    expect(result.status).toBe(2)
  })

  it('accepts status option objects and uses their id', () => {
    const result = formSchema.parse({
      ...validInput,
      status: { id: '0', name: 'Inactive' },
    })

    expect(result.status).toBe(0)
  })

  it('accepts Date instances for start and end dates', () => {
    const start = new Date('2026-05-21T00:00:00Z')
    const end = new Date('2026-06-21T00:00:00Z')

    const result = formSchema.parse({
      ...validInput,
      start_date: start,
      end_date: end,
      notes: undefined,
    })

    expect(result.start_date).toBe(start)
    expect(result.end_date).toBe(end)
    expect(result.notes).toBeUndefined()
  })

  it.each([
    ['user_id', 0, 'Required.'],
    ['user_id', '', 'Required.'],
    ['user_id', 'abc', 'Required.'],
    ['plan_id', 0, 'Required.'],
    ['plan_id', '', 'Required.'],
    ['plan_id', 'abc', 'Required.'],
  ])('rejects invalid %s value %p', (field, value, message) => {
    const result = formSchema.safeParse({
      ...validInput,
      [field]: value,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]).toEqual(
        expect.objectContaining({
          path: [field],
          message,
        })
      )
    }
  })

  it('rejects empty start and end dates', () => {
    const result = formSchema.safeParse({
      ...validInput,
      start_date: '',
      end_date: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['start_date'],
            message: 'Required.',
          }),
          expect.objectContaining({
            path: ['end_date'],
            message: 'Required.',
          }),
        ])
      )
    }
  })

  it.each([-1, 3, '4', { id: 9, name: 'Unknown' }, { id: 'abc', name: 'Bad' }])(
    'rejects invalid status %p',
    (status) => {
      const result = formSchema.safeParse({
        ...validInput,
        status,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]).toEqual(
          expect.objectContaining({
            path: ['status'],
            message: 'Invalid status',
          })
        )
      }
    }
  )
})
