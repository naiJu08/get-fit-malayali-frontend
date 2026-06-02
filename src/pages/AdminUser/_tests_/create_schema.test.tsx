import {
  changePasswordSchema,
  formSchema,
  formSchemaNutritionist,
  formSchemaNutritionistEdit,
} from '../create/schema'

describe('AdminUser create schemas', () => {
  it('validates common fields and password confirmation', () => {
    const base: any = {
      name: 'John',
      email: 'john@example.com',
      phone: '1234567890',
      role: { id: 1, name: 'user' },
      gender: 'male',
      date_of_birth: '2000-01-01',
      height: '170',
      weight: '75',
    }

    // password mismatch should fail
    const bad = formSchema.safeParse({
      ...base,
      password: 'Abcd@1234',
      password_confirmation: 'nope',
    })
    expect(bad.success).toBe(false)

    // match should pass (password optional in this schema)
    const ok = formSchema.safeParse({
      ...base,
      password: 'Abcd@1234',
      password_confirmation: 'Abcd@1234',
    })
    expect(ok.success).toBe(true)
  })

  it('validates nutritionist create password rules', () => {
    const base: any = {
      name: 'Jane',
      email: 'jane@example.com',
      phone: '1234567890',
      role: { id: 2, name: 'nutritionist' },
      gender: 'female',
      date_of_birth: '1999-01-01',
      password: 'Abcd@1234',
      password_confirmation: 'Abcd@1234',
    }

    expect(formSchemaNutritionist.safeParse(base).success).toBe(true)
    expect(
      formSchemaNutritionist.safeParse({ ...base, password: 'short' }).success
    ).toBe(false)
  })

  it('nutritionist edit schema accepts empty password fields', () => {
    const base: any = {
      name: 'Jane',
      email: 'jane@example.com',
      phone: '1234567890',
      role: { id: 2, name: 'nutritionist' },
      gender: 'female',
      date_of_birth: '1999-01-01',
      password: '',
      password_confirmation: '',
    }

    expect(formSchemaNutritionistEdit.safeParse(base).success).toBe(true)
  })

  it('rejects invalid numeric and leading-space inputs in create schema', () => {
    const result = formSchema.safeParse({
      name: ' John',
      email: 'bad-email',
      phone: '12ab',
      role: { id: 1, name: 'user' },
      gender: '',
      date_of_birth: '',
      height: '99',
      weight: '9',
    })

    expect(result.success).toBe(false)
  })

  it('accepts array-style medical and allergy fields', () => {
    const result = formSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      phone: 1234567890,
      role: { id: 1, name: 'user' },
      gender: 'male',
      date_of_birth: new Date('2000-01-01'),
      height: 170,
      weight: '75.5',
      medical_conditions: ['Diabetes', { id: 'Other', name: 'Other' }],
      food_allergies: [{ id: 'Peanuts', name: 'Peanuts' }],
    })

    expect(result.success).toBe(true)
  })

  it('validates change password schema rules', () => {
    expect(changePasswordSchema.safeParse({ new_password: 'short' }).success).toBe(
      false
    )
    expect(
      changePasswordSchema.safeParse({ new_password: 'Abcd@1234' }).success
    ).toBe(true)
  })
})
