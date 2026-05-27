import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

import CreatePlan from '../create'

const mockCreateMutate = jest.fn()
const mockUpdateMutate = jest.fn()
const mockUsePlan = jest.fn()
const mockInvalidateQueries = jest.fn()

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({
    invalidateQueries: (...args: any[]) => mockInvalidateQueries(...args),
  }),
}))

jest.mock('../api', () => ({
  useCreatePlan: () => ({ mutate: mockCreateMutate, isLoading: false }),
  useUpdatePlan: () => ({ mutate: mockUpdateMutate, isLoading: false }),
  usePlan: (...args: any[]) => mockUsePlan(...args),
}))

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => () => ({})),
}))

const mockSetError = jest.fn()
const mockClearErrors = jest.fn()
jest.mock('react-hook-form', () => ({
  FormProvider: ({ children }: any) => <>{children}</>,
  useForm: () => ({
    reset: jest.fn(),
    setError: mockSetError,
    clearErrors: mockClearErrors,
    handleSubmit:
      (cb: any) =>
      () =>
        cb({
          name: 'Plan A',
          category: 'Diabetes',
          description: 'Desc',
          duration_days: 30,
          fees: 1000,
          yoga_included: false,
          meditation_included: true,
          thumbnail: 'https://example.com/x.png',
        }),
    watch: (key: string) => (key === 'meditation_included' ? true : false),
    setValue: jest.fn(),
  }),
}))

jest.mock('../../../components/app/formBuilder', () => ({
  __esModule: true,
  default: () => <div data-testid="form-builder" />,
}))

jest.mock('../../../components/common/inputs/ToggleSwitch', () => ({
  __esModule: true,
  default: ({ id, checked, onChange }: any) => (
    <button
      data-testid={`toggle-${id}`}
      onClick={() => onChange(!checked)}
      type="button"
    >
      {checked ? 'on' : 'off'}
    </button>
  ),
}))

jest.mock('../../../components/common', () => ({
  DialogModal: ({ isOpen, title, onClose, onSubmit }: any) =>
    isOpen ? (
      <div data-testid="dialog-modal">
        <div data-testid="modal-title">{title}</div>
        <button data-testid="submit" onClick={onSubmit}>
          Submit
        </button>
        <button data-testid="close" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}))

describe('CreatePlan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePlan.mockReturnValue({ data: undefined })
  })

  it('renders when open', () => {
    render(<CreatePlan isDrawerOpen={true} handleClose={jest.fn()} />)
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
  })

  it('submits create plan via useCreatePlan', () => {
    render(<CreatePlan isDrawerOpen={true} handleClose={jest.fn()} />)
    fireEvent.click(screen.getByTestId('submit'))
    expect(mockCreateMutate).toHaveBeenCalled()
  })

  it('submits update plan when edit=true and rowData.plan.id present', () => {
    render(
      <CreatePlan
        isDrawerOpen={true}
        handleClose={jest.fn()}
        edit={true}
        rowData={{ plan: { id: 99, name: 'Old' } }}
      />
    )
    fireEvent.click(screen.getByTestId('submit'))
    expect(mockUpdateMutate).toHaveBeenCalled()
  })
})

