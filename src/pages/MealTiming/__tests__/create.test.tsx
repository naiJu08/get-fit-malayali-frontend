import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import MealTimingCreate from '../create'

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
const mockUpdateUserMutate = jest.fn()

jest.mock('../api', () => ({
  useCreateMealTiming: () => ({ mutate: mockMutate, isLoading: false }),
  useUpdateMealTiming: () => ({ mutate: mockUpdateMutate, isLoading: false }),
  useUpdateUserMealTiming: () => ({
    mutate: mockUpdateUserMutate,
    isLoading: false,
  }),
}))

jest.mock('moment', () => ({
  __esModule: true,
  default: (value: any) => ({
    format: jest.fn(() => {
      // If input looks like HH:mm or HH:mm:ss, return a deterministic 12h
      if (typeof value === 'string' && value.includes(':')) return '08:00 AM'
      return '08:00:00'
    }),
  }),
}))

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => () => ({})),
}))

jest.mock('react-hook-form', () => ({
  FormProvider: ({ children }: any) => <>{children}</>,
  useForm: () => ({
    reset: jest.fn(),
    handleSubmit:
      (cb: any) =>
      () =>
        cb({
          name: 'Breakfast',
          time: '08:00:00',
          sequence_number: 1,
          status: 'Active',
        }),
  }),
}))

jest.mock('../../../components/app/formBuilder', () => ({
  __esModule: true,
  default: ({ data }: any) => (
    <div data-testid="form-builder">{Array.isArray(data) ? data.length : 0}</div>
  ),
}))

jest.mock('../../../components/common', () => ({
  DialogModal: ({ isOpen, title, onClose, onSubmit, secondaryActionLabel }: any) =>
    isOpen ? (
      <div data-testid="dialog-modal">
        <div data-testid="modal-title">{title}</div>
        <button data-testid="modal-submit" onClick={onSubmit}>
          Submit
        </button>
        <button data-testid="modal-close" onClick={onClose}>
          {secondaryActionLabel}
        </button>
      </div>
    ) : null,
}))

describe('MealTimingCreate', () => {
  const defaultProps = {
    isDrawerOpen: true,
    handleClose: jest.fn(),
    handleRefresh: jest.fn(),
    edit: false,
    viewMode: false,
    rowData: undefined,
    setEdit: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when isDrawerOpen is true', () => {
    render(<MealTimingCreate {...defaultProps} />)
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Create Meal Timing')
  })

  it('calls handleClose when cancel clicked', () => {
    render(<MealTimingCreate {...defaultProps} />)
    fireEvent.click(screen.getByTestId('modal-close'))
    expect(defaultProps.handleClose).toHaveBeenCalled()
  })

  it('submits create payload via useCreateMealTiming', () => {
    render(<MealTimingCreate {...defaultProps} />)
    fireEvent.click(screen.getByTestId('modal-submit'))
    expect(mockMutate).toHaveBeenCalled()
  })

  it('submits update payload via useUpdateMealTiming when edit=true without user linkage', () => {
    render(
      <MealTimingCreate
        {...defaultProps}
        edit={true}
        rowData={{ id: '1', name: 'Breakfast', time: '08:00 AM', status: 'active' }}
      />
    )
    fireEvent.click(screen.getByTestId('modal-submit'))
    expect(mockUpdateMutate).toHaveBeenCalled()
  })

  it('submits user meal timing update via useUpdateUserMealTiming when row has linkage', () => {
    render(
      <MealTimingCreate
        {...defaultProps}
        edit={true}
        rowData={{
          id: '1',
          user_id: 10,
          diet_plan_template_id: 11,
          subscription_id: 12,
          sequence_number: 1,
          meal_time: 'BREAKFAST',
          name: 'Breakfast',
          time: '08:00 AM',
        }}
      />
    )
    fireEvent.click(screen.getByTestId('modal-submit'))
    expect(mockUpdateUserMutate).toHaveBeenCalled()
  })
})
