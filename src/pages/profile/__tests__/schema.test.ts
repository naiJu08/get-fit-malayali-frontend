import { myProfileSchema, handleReturnSchema } from '../schema'
import { resetSchema } from '../password/changePasswordSchema'

describe('Profile schemas', () => {
  it('validates myProfileSchema basic fields', () => {
    const valid = myProfileSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      username: 'a@b.com',
      job_title: 'Dev',
      phone: '',
      contact_number: '',
      join_date: '2020-01-01',
      assessor_type: '1',
    })

    expect(valid.success).toBe(true)
  })

  it('handleReturnSchema returns appropriate schema for types', () => {
    const adminSchema = handleReturnSchema('Employee')
    const orgSchema = handleReturnSchema('Organisation')
    const assessorSchema = handleReturnSchema('Assessor')

    expect(adminSchema).toBeDefined()
    expect(orgSchema).toBeDefined()
    expect(assessorSchema).toBeDefined()
  })

  it('resetSchema enforces password rules and matching', () => {
    const ok = resetSchema.safeParse({
      password: 'Abcd1234!',
      confirm_password: 'Abcd1234!',
      old_password: 'x',
    })
    expect(ok.success).toBe(true)

    const mismatch = resetSchema.safeParse({
      password: 'Abcd1234!',
      confirm_password: 'Mismatch1!',
      old_password: 'x',
    })
    expect(mismatch.success).toBe(false)
  })

  it('resetSchema rejects passwords with spaces or missing requirements', () => {
    const withSpace = resetSchema.safeParse({
      password: 'Abc 1234!',
      confirm_password: 'Abc 1234!',
      old_password: 'x',
    })
    expect(withSpace.success).toBe(false)

    const missingUpper = resetSchema.safeParse({
      password: 'abcd1234!',
      confirm_password: 'abcd1234!',
      old_password: 'x',
    })
    expect(missingUpper.success).toBe(false)
  })
})
