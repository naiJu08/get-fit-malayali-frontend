import { getDayIndexFromName, getDayNameFromNumber } from '../create'

describe('DietPlan create helpers', () => {
  it('getDayIndexFromName maps known names (case-insensitive)', () => {
    expect(getDayIndexFromName('Sunday')).toBe(0)
    expect(getDayIndexFromName('monday')).toBe(1)
    expect(getDayIndexFromName(undefined)).toBe(null)
    expect(getDayIndexFromName('Notaday')).toBe(null)
  })

  it('getDayNameFromNumber maps day numbers and wraps', () => {
    expect(getDayNameFromNumber(1)).toBe('Sunday')
    expect(getDayNameFromNumber(2)).toBe('Monday')
    expect(getDayNameFromNumber(8)).toBe('Sunday')
    expect(getDayNameFromNumber(0)).toBe('')
    expect(getDayNameFromNumber('x')).toBe('')
  })
})

