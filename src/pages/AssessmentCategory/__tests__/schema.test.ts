import { assessmentCategoryFormSchema } from '../create/schema'

jest.mock('../../../utilities/noLeadingSpaces', () => ({
  __esModule: true,
  default: (val: string) => val === val.trim(),
}))

describe('AssessmentCategory Schema Validation', () => {
  it('validates correct data', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: 'Health Assessment',
      description: 'Test assessment',
      status: 'Active',
      assessment_questions: [{ question_text: 'Are you healthy?' }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = assessmentCategoryFormSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      description: 'Test',
      status: 'Active',
      assessment_questions: [{ question_text: 'Q1' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: '',
      status: 'Active',
      assessment_questions: [{ question_text: 'Q1' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects leading spaces in name', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: '  Health Assessment',
      status: 'Active',
      assessment_questions: [{ question_text: 'Q1' }],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Leading spaces are not allowed'
      )
    }
  })

  it('enforces max length on name', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: 'A'.repeat(81),
      status: 'Active',
      assessment_questions: [{ question_text: 'Q1' }],
    })
    expect(result.success).toBe(false)
  })

  it('allows optional description', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: 'Assessment',
      description: '',
      status: 'Active',
      assessment_questions: [{ question_text: 'Q1' }],
    })
    expect(result.success).toBe(true)
  })

  it('enforces max length on description', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: 'Assessment',
      description: 'A'.repeat(256),
      status: 'Active',
      assessment_questions: [{ question_text: 'Q1' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing status', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: 'Assessment',
      assessment_questions: [{ question_text: 'Q1' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty status', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: 'Assessment',
      status: '',
      assessment_questions: [{ question_text: 'Q1' }],
    })
    expect(result.success).toBe(false)
  })

  it('requires at least one assessment question', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: 'Assessment',
      status: 'Active',
      assessment_questions: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing question text', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: 'Assessment',
      status: 'Active',
      assessment_questions: [{ id: 1 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty question text', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: 'Assessment',
      status: 'Active',
      assessment_questions: [{ question_text: '' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects leading spaces in question text', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: 'Assessment',
      status: 'Active',
      assessment_questions: [{ question_text: '  Are you healthy?' }],
    })
    expect(result.success).toBe(false)
  })

  it('enforces max length on question text', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: 'Assessment',
      status: 'Active',
      assessment_questions: [{ question_text: 'A'.repeat(256) }],
    })
    expect(result.success).toBe(false)
  })

  it('allows question with optional id', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: 'Assessment',
      status: 'Active',
      assessment_questions: [
        { question_text: 'Q1' },
        { id: 2, question_text: 'Q2' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('allows multiple questions', () => {
    const result = assessmentCategoryFormSchema.safeParse({
      name: 'Assessment',
      status: 'Active',
      assessment_questions: [
        { question_text: 'Q1' },
        { question_text: 'Q2' },
        { question_text: 'Q3' },
      ],
    })
    expect(result.success).toBe(true)
  })
})
