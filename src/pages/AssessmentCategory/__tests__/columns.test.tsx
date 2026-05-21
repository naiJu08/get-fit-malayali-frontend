import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { getAssessmentCategoryColumns } from '../columns'

const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn((...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    if (msg.includes('ReactDOMTestUtils.act')) return
    originalConsoleError(...args)
  })
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('AssessmentCategory Columns', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns columns array with required properties', () => {
    const columns = getAssessmentCategoryColumns({})
    expect(Array.isArray(columns)).toBe(true)
    expect(columns.length).toBeGreaterThan(0)
    columns.forEach((col) => {
      expect(col).toHaveProperty('title')
      expect(col).toHaveProperty('field')
      expect(col).toHaveProperty('sortable')
      expect(col).toHaveProperty('resizable')
      expect(col).toHaveProperty('isVisible')
    })
  })

  it('renders Name cell as a button when onNameClick provided', () => {
    const onNameClick = jest.fn()
    const columns = getAssessmentCategoryColumns({ onNameClick })
    const nameCol: any = columns.find((c) => c.field === 'name')
    const row = { id: '1', name: 'Health Assessment' }

    const res = nameCol.renderCell(row)
    const { getByRole } = render(<>{res.cell}</>)
    const button = getByRole('button')
    expect(button).toHaveTextContent('Health Assessment')
    fireEvent.click(button)
    expect(onNameClick).toHaveBeenCalledWith(row)
  })

  it('truncates long name values', () => {
    const columns = getAssessmentCategoryColumns({})
    const nameCol: any = columns.find((c) => c.field === 'name')
    const longName = 'A'.repeat(100)
    const res = nameCol.renderCell({ name: longName })
    expect(res.cell).toContain('...')
  })

  it('renders Description cell with truncation', () => {
    const columns = getAssessmentCategoryColumns({})
    const descCol: any = columns.find((c) => c.field === 'description')
    const row = {
      description:
        'A very long description that should be truncated to fit in the cell',
    }

    const res = descCol.renderCell(row)
    expect(res).toHaveProperty('toolTip')
  })

  it('renders Questions count correctly', () => {
    const columns = getAssessmentCategoryColumns({})
    const questionsCol: any = columns.find(
      (c) => c.field === 'assessment_questions'
    )

    const rowWithQuestions = {
      assessment_questions: [
        { id: 1, question_text: 'Q1' },
        { id: 2, question_text: 'Q2' },
        { id: 3, question_text: 'Q3' },
      ],
    }

    const res = questionsCol.renderCell(rowWithQuestions)
    expect(res.cell).toBe(3)
    expect(res.toolTip).toBe('3')
  })

  it('renders Questions count as 0 when no questions', () => {
    const columns = getAssessmentCategoryColumns({})
    const questionsCol: any = columns.find(
      (c) => c.field === 'assessment_questions'
    )

    const rowWithoutQuestions = {}
    const res = questionsCol.renderCell(rowWithoutQuestions)
    expect(res.cell).toBe(0)
  })

  it('renders Status badge as Active', () => {
    const columns = getAssessmentCategoryColumns({})
    const statusCol: any = columns.find((c) => c.field === 'active')

    const activeRow = { active: true }
    const res = statusCol.renderCell(activeRow)
    const { getByText } = render(<>{res.cell}</>)
    getByText('Active')
  })

  it('renders Status badge as Inactive', () => {
    const columns = getAssessmentCategoryColumns({})
    const statusCol: any = columns.find((c) => c.field === 'active')

    const inactiveRow = { active: false }
    const res = statusCol.renderCell(inactiveRow)
    const { getByText } = render(<>{res.cell}</>)
    getByText('Inactive')
  })

  it('handles status from status field when active is not set', () => {
    const columns = getAssessmentCategoryColumns({})
    const statusCol: any = columns.find((c) => c.field === 'active')

    const rowWithStatusField = { status: 'inactive' }
    const res = statusCol.renderCell(rowWithStatusField)
    const { getByText } = render(<>{res.cell}</>)
    getByText('Inactive')
  })
})
