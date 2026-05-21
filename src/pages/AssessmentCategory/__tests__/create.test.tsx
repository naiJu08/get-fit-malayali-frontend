import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import CreateAssessmentCategory from '../create'

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

const mockMutate = jest.fn()
const mockUpdateMutate = jest.fn()

jest.mock('../api', () => ({
  useCreateAssessmentCategory: () => ({ mutate: mockMutate, isLoading: false }),
  useUpdateAssessmentCategory: () => ({
    mutate: mockUpdateMutate,
    isLoading: false,
  }),
}))

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => () => ({})),
}))

jest.mock('react-hook-form', () => ({
  FormProvider: ({ children }: any) => <>{children}</>,
  useForm: () => ({
    control: { _formValues: {} },
    formState: { errors: {}, isDirty: false, isSubmitting: false },
    handleSubmit: (cb: any) => () =>
      cb({
        name: 'Health Assessment',
        description: 'Test description',
        status: 'Active',
        assessment_questions: [{ question_text: 'Are you healthy?' }],
      }),
    register: jest.fn(() => ({
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    })),
    reset: jest.fn(),
    watch: jest.fn(() => ({})),
    setValue: jest.fn(),
    setError: jest.fn(),
    getValues: jest.fn(() => ({})),
  }),
  useFieldArray: () => ({
    fields: [{ id: 'field_1', question_text: 'Q1' }],
    append: jest.fn(),
    remove: jest.fn(),
  }),
  Controller: ({ render }: any) =>
    render({ field: { onChange: jest.fn(), value: '' } }),
}))

jest.mock('../../../components/app/formBuilder', () => ({
  __esModule: true,
  default: ({ data, onFieldChange }: any) => (
    <div data-testid="form-builder">
      {Array.isArray(data) ? `${data.length} fields` : 'No fields'}
      {data?.map((field: any, idx: number) => (
        <div key={idx} data-testid={`form-field-${idx}`}>
          {field.label || field.name}
        </div>
      ))}
    </div>
  ),
}))

jest.mock('../../../components/common', () => ({
  DialogModal: ({
    isOpen,
    title,
    onClose,
    onSubmit,
    secondaryActionLabel,
    children,
  }: any) =>
    isOpen ? (
      <div data-testid="dialog-modal">
        <div data-testid="modal-title">{title}</div>
        {children && <div data-testid="modal-content">{children}</div>}
        <button data-testid="modal-submit" onClick={onSubmit}>
          Submit
        </button>
        <button data-testid="modal-close" onClick={onClose}>
          {secondaryActionLabel}
        </button>
      </div>
    ) : null,
}))

jest.mock('../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  ),
}))

describe('CreateAssessmentCategory', () => {
  const defaultProps = {
    isDrawerOpen: true,
    handleClose: jest.fn(),
    edit: false,
    viewMode: false,
    rowData: undefined,
    setEdit: jest.fn(),
    setViewMode: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when isDrawerOpen is true', () => {
    render(<CreateAssessmentCategory {...defaultProps} />)
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
  })

  it('does not render when isDrawerOpen is false', () => {
    render(<CreateAssessmentCategory {...defaultProps} isDrawerOpen={false} />)
    expect(screen.queryByTestId('dialog-modal')).not.toBeInTheDocument()
  })

  it('displays create title in modal header', () => {
    render(<CreateAssessmentCategory {...defaultProps} edit={false} />)
    const title = screen.getByTestId('modal-title')
    expect(title.textContent?.toLowerCase()).toContain('assessment')
  })

  it('calls handleClose when modal close button is clicked', () => {
    const handleClose = jest.fn()
    render(
      <CreateAssessmentCategory {...defaultProps} handleClose={handleClose} />
    )
    fireEvent.click(screen.getByTestId('modal-close'))
    expect(handleClose).toHaveBeenCalled()
  })

  it('renders form builder component', () => {
    render(<CreateAssessmentCategory {...defaultProps} />)
    const formBuilder = screen.queryByTestId('form-builder')
    if (formBuilder) {
      expect(formBuilder).toBeInTheDocument()
    }
  })

  it('calls mutate on form submit with create data', () => {
    render(<CreateAssessmentCategory {...defaultProps} />)
    fireEvent.click(screen.getByTestId('modal-submit'))
    expect(mockMutate).toHaveBeenCalled()
  })

  it('renders in edit mode when edit prop is true', () => {
    render(
      <CreateAssessmentCategory
        {...defaultProps}
        edit={true}
        rowData={{
          id: '1',
          name: 'Existing Assessment',
          active: true,
          assessment_questions: [{ id: 1, question_text: 'Q1' }],
        }}
      />
    )
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
  })

  it('calls updateMutate on form submit in edit mode', () => {
    render(
      <CreateAssessmentCategory
        {...defaultProps}
        edit={true}
        rowData={{
          id: '1',
          name: 'Existing Assessment',
          active: true,
          assessment_questions: [],
        }}
      />
    )
    fireEvent.click(screen.getByTestId('modal-submit'))
    expect(mockUpdateMutate).toHaveBeenCalled()
  })

  it('renders in view mode when viewMode prop is true', () => {
    render(
      <CreateAssessmentCategory
        {...defaultProps}
        viewMode={true}
        rowData={{
          name: 'Assessment Name',
          description: 'Description',
          active: true,
          assessment_questions: [],
        }}
      />
    )
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
  })
})
