import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CreateMeal from '../create'

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
  useCreateMeal: () => ({
    mutate: mockMutate,
    isLoading: false,
  }),
  useUpdateMeal: () => ({
    mutate: mockUpdateMutate,
    isLoading: false,
  }),
  useMealCategories: () => ({
    data: {
      meal_categories: [
        { id: 1, name: 'Vegetarian' },
        { id: 2, name: 'Non-Vegetarian' },
      ],
    },
  }),
  useServingUnits: () => ({
    data: {
      serving_units: [
        { id: 1, name: 'cup' },
        { id: 2, name: 'gram' },
      ],
    },
  }),
}))

jest.mock('../../MealTiming/api', () => ({
  useMealTimingList: () => ({
    data: {
      meal_timings: [
        { id: 1, name: 'Breakfast' },
        { id: 2, name: 'Lunch' },
      ],
    },
  }),
}))

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => () => ({})),
}))

jest.mock('react-hook-form', () => ({
  FormProvider: ({ children }: any) => <>{children}</>,
  useForm: () => ({
    control: { _formValues: {} },
    formState: {
      errors: {},
      isDirty: false,
      isSubmitting: false,
    },
    handleSubmit: (cb: any) => () =>
      cb({
        name: 'Oatmeal',
        meal_time: 'Breakfast',
        meal_category_id: 1,
        serving_unit: 'cup',
        per_serving_calories: 300,
        per_serving_protein: 10,
        per_serving_carbs: 50,
        per_serving_fat: 5,
        per_serving_fiber: 8,
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
  Controller: ({ render }: any) =>
    render({
      field: {
        onChange: jest.fn(),
        value: '',
      },
    }),
}))

jest.mock('../../../components/app/formBuilder', () => ({
  __esModule: true,
  default: ({ data }: any) => (
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

// FIXED DialogModal mock
jest.mock('../../../components/common', () => ({
  DialogModal: (props: any) =>
    props.isOpen ? (
      <div data-testid="dialog-modal">
        <div data-testid="modal-title">{props.title}</div>

        <div data-testid="modal-content">
          {props.children}
          {props.body}
          {props.content}
        </div>

        <button
          data-testid="modal-submit"
          onClick={props.onSubmit}
        >
          Submit
        </button>

        <button
          data-testid="modal-close"
          onClick={props.onClose}
        >
          {props.secondaryActionLabel}
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

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithQueryClient = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient()

  return render(
    <QueryClientProvider client={testQueryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('CreateMeal', () => {
  const defaultProps = {
    isDrawerOpen: true,
    handleClose: jest.fn(),
    handleRefresh: jest.fn(),
    edit: false,
    rowData: undefined,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when isDrawerOpen is true', () => {
    renderWithQueryClient(<CreateMeal {...defaultProps} />)
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
  })

  it('does not render when isDrawerOpen is false', () => {
    renderWithQueryClient(
      <CreateMeal {...defaultProps} isDrawerOpen={false} />
    )
    expect(
      screen.queryByTestId('dialog-modal')
    ).not.toBeInTheDocument()
  })

  it('displays create title in modal header', () => {
    renderWithQueryClient(
      <CreateMeal {...defaultProps} edit={false} />
    )

    expect(
      screen.getByTestId('modal-title').textContent?.toLowerCase()
    ).toContain('food')
  })

  it('calls handleClose when modal close button is clicked', () => {
    const handleClose = jest.fn()

    renderWithQueryClient(
      <CreateMeal
        {...defaultProps}
        handleClose={handleClose}
      />
    )

    fireEvent.click(screen.getByTestId('modal-close'))

    expect(handleClose).toHaveBeenCalled()
  })

  it('renders form builder component', () => {
    renderWithQueryClient(<CreateMeal {...defaultProps} />)

    expect(
      screen.getByTestId('form-builder')
    ).toBeInTheDocument()
  })

  it('calls mutate on form submit with create data', () => {
    renderWithQueryClient(<CreateMeal {...defaultProps} />)

    fireEvent.click(screen.getByTestId('modal-submit'))

    expect(mockMutate).toHaveBeenCalled()
  })

  it('renders in edit mode when edit prop is true', () => {
    renderWithQueryClient(
      <CreateMeal
        {...defaultProps}
        edit
        rowData={{
          id: '1',
          name: 'Existing Meal',
          meal_time: 'Breakfast',
          meal_category_id: 1,
          serving_unit: 'cup',
          per_serving_calories: 300,
        }}
      />
    )

    expect(
      screen.getByTestId('dialog-modal')
    ).toBeInTheDocument()
  })

  it('calls updateMutate on form submit in edit mode', () => {
    renderWithQueryClient(
      <CreateMeal
        {...defaultProps}
        edit
        rowData={{
          id: '1',
          name: 'Existing Meal',
          meal_time: 'Breakfast',
          meal_category_id: 1,
          serving_unit: 'cup',
          per_serving_calories: 300,
        }}
      />
    )

    fireEvent.click(screen.getByTestId('modal-submit'))

    expect(mockUpdateMutate).toHaveBeenCalled()
  })

  it('displays all form fields when rendering', () => {
    renderWithQueryClient(<CreateMeal {...defaultProps} />)

    const formBuilder = screen.getByTestId('form-builder')

    expect(formBuilder).toBeInTheDocument()
    expect(formBuilder.textContent).not.toBe('No fields')
  })

  it('passes correct payload structure on submit', () => {
    renderWithQueryClient(<CreateMeal {...defaultProps} />)

    fireEvent.click(screen.getByTestId('modal-submit'))

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        meal: expect.objectContaining({
          name: expect.any(String),
          meal_time: expect.any(String),
        }),
      }),
      expect.any(Object)
    )
  })

  it('handles closing modal without changes', () => {
    const handleClose = jest.fn()

    renderWithQueryClient(
      <CreateMeal
        {...defaultProps}
        handleClose={handleClose}
      />
    )

    fireEvent.click(screen.getByTestId('modal-close'))

    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})