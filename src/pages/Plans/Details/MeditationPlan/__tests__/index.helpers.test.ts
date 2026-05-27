import {
  formatMeditationDuration,
  formatMeditationName,
  getMeditationDurationLabel,
  getMeditationEmbedUrl,
  minuteLikeRawToSeconds,
  toPositiveInteger,
} from '../index'

describe('MeditationPlanIndex helpers', () => {
  it('formatMeditationName title-cases and defaults', () => {
    expect(formatMeditationName('hello WORLD')).toBe('Hello World')
    expect(formatMeditationName('')).toBe('Untitled')
  })

  it('toPositiveInteger parses and validates', () => {
    expect(toPositiveInteger('10')).toBe(10)
    expect(toPositiveInteger(0)).toBe(null)
    expect(toPositiveInteger('x')).toBe(null)
  })

  it('minuteLikeRawToSeconds supports mm:ss and decimals', () => {
    expect(minuteLikeRawToSeconds('2:05')).toBe(125)
    expect(minuteLikeRawToSeconds('1.30')).toBe(90)
    expect(minuteLikeRawToSeconds('')).toBe(null)
  })

  it('formatMeditationDuration formats seconds/minutes', () => {
    expect(formatMeditationDuration(45)).toBe('45 sec')
    expect(formatMeditationDuration(60)).toBe('1 min')
    expect(formatMeditationDuration(75)).toBe('1m 15s')
  })

  it('getMeditationDurationLabel prefers seconds fields then minutes', () => {
    expect(getMeditationDurationLabel({ duration_seconds: 30 })).toBe('30 sec')
    expect(getMeditationDurationLabel({ duration_minutes: 2 })).toBe('2 min')
    expect(getMeditationDurationLabel({ duration_minutes: '2:10' })).toBe(
      '2m 10s'
    )
  })

  it('getMeditationEmbedUrl supports common YouTube patterns', () => {
    expect(getMeditationEmbedUrl('')).toBe('')
    expect(getMeditationEmbedUrl('not a url')).toBe('')
    expect(getMeditationEmbedUrl('https://youtu.be/abc')).toBe(
      'https://www.youtube.com/embed/abc'
    )
    expect(getMeditationEmbedUrl('https://youtube.com/watch?v=def')).toBe(
      'https://www.youtube.com/embed/def'
    )
  })
})

