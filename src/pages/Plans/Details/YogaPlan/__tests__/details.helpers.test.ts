import {
  formatDurationLabel,
  getYogaDisplayName,
  getYogaDurationLabel,
  minuteLikeRawToSeconds,
  safeStr,
  toPositiveInteger,
} from '../details'

describe('YogaPlan details helpers', () => {
  it('safeStr maps empty values to --', () => {
    expect(safeStr(null)).toBe('--')
    expect(safeStr(undefined)).toBe('--')
    expect(safeStr('')).toBe('--')
    expect(safeStr(0)).toBe('0')
  })

  it('getYogaDisplayName title-cases', () => {
    expect(getYogaDisplayName('hello WORLD')).toBe('Hello World')
    expect(getYogaDisplayName('')).toBe('Untitled')
  })

  it('toPositiveInteger parses and validates', () => {
    expect(toPositiveInteger('10')).toBe(10)
    expect(toPositiveInteger(0)).toBe(null)
    expect(toPositiveInteger('x')).toBe(null)
  })

  it('formatDurationLabel formats seconds/minutes', () => {
    expect(formatDurationLabel(45)).toBe('45 sec')
    expect(formatDurationLabel(60)).toBe('1 min')
    expect(formatDurationLabel(75)).toBe('1m 15s')
  })

  it('minuteLikeRawToSeconds supports mm:ss and decimals', () => {
    expect(minuteLikeRawToSeconds('2:05')).toBe(125)
    expect(minuteLikeRawToSeconds('1.30')).toBe(90)
    expect(minuteLikeRawToSeconds('')).toBe(null)
  })

  it('getYogaDurationLabel prefers seconds fields then minutes', () => {
    expect(getYogaDurationLabel({ duration_seconds: 30 })).toBe('30 sec')
    expect(getYogaDurationLabel({ duration_minutes: 2 })).toBe('2 min')
    expect(getYogaDurationLabel({ duration_minutes: '2:10' })).toBe('2m 10s')
  })
})

