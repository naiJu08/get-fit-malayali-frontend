import React from 'react'
import {
  loginSchema,
  forgetPasswordSchema,
  resetSchema,
  forgotSchema,
} from '../schema'

describe('userManagement schema.ts', () => {
  test('loginSchema accepts valid email/password', () => {
    const r = loginSchema.safeParse({
      username: 'a@b.com',
      password: 'Pass123!',
    })
    expect(r.success).toBe(true)
  })

  test('loginSchema rejects invalid email', () => {
    const r = loginSchema.safeParse({ username: 'bad', password: 'p' })
    expect(r.success).toBe(false)
  })

  test('forgetPasswordSchema requires username', () => {
    const r = forgetPasswordSchema.safeParse({ username: '' })
    expect(r.success).toBe(false)
  })

  test('resetSchema enforces rules and matching', () => {
    const r = resetSchema.safeParse({
      password: 'Valid1!',
      confirm_password: 'Valid1!',
    })
    expect(r.success).toBe(false) // too short / missing rules
  })

  test('forgotSchema requires old_password', () => {
    const r = forgotSchema.safeParse({
      password: 'ValidPass123!',
      confirm_password: 'ValidPass123!',
    })
    expect(r.success).toBe(false)
  })
})
