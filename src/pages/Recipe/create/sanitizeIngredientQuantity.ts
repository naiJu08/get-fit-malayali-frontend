// The API accepts whole numbers, simple fractions, and mixed fractions.
export function sanitizeIngredientQuantity(value: string): string | null {
  const trimmed = value
    .trim()
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
  if (!trimmed) return ''

  const fraction = trimmed.match(/^(?:(\d+) )?(\d+)\/(\d+)$/)
  if (fraction) {
    const whole = BigInt(fraction[1] || '0')
    const numerator = BigInt(fraction[2])
    const denominator = BigInt(fraction[3])
    if (denominator === BigInt(0) || whole + numerator === BigInt(0)) {
      return null
    }
    return fraction[1]
      ? `${whole} ${numerator}/${denominator}`
      : `${numerator}/${denominator}`
  }

  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) return null
  const [whole, decimal = ''] = trimmed.split('.')
  const numerator = BigInt((whole || '0') + decimal)
  if (numerator === BigInt(0)) return null
  const denominator = BigInt('1' + '0'.repeat(decimal.length))

  let a = numerator
  let b = denominator
  while (b !== BigInt(0)) {
    const remainder = a % b
    a = b
    b = remainder
  }
  return denominator === a
    ? String(numerator / a)
    : `${numerator / a}/${denominator / a}`
}
