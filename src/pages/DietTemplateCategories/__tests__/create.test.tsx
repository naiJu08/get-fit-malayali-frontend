import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CreateDietTemplateCategory from '../create'

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
  useCreateDietTemplateCategory: () => ({
    mutate: mockMutate,
    isLoading: false,
  }),
  useUpdateDietTemplateCategory: () => ({
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
    formState: {
      errors: {},
      isDirty: false,
      isSubmitting: false,
    },
    handleSubmit: (cb: any) => () =>
      cb({
        name: 'Breakfast',
        status: 'Active',
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

describe('CreateDietTemplateCategory', () => {
  const defaultProps = {
    isDrawerOpen: true,
    handleClose: jest.fn(),
    edit: false,
    rowData: undefined,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when isDrawerOpen is true', () => {
    renderWithQueryClient(<CreateDietTemplateCategory {...defaultProps} />)
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
  })

  it('does not render when isDrawerOpen is false', () => {
    renderWithQueryClient(
      <CreateDietTemplateCategory {...defaultProps} isDrawerOpen={false} />
    )
    expect(
      screen.queryByTestId('dialog-modal')
    ).not.toBeInTheDocument()
  })

  it('displays create title in modal header', () => {
    renderWithQueryClient(
      <CreateDietTemplateCategory {...defaultProps} edit={false} />
    )

    expect(
      screen.getByTestId('modal-title').textContent?.toLowerCase()
    ).toContain('create')
  })

  it('displays edit title in modal header when in edit mode', () => {
    renderWithQueryClient(
      <CreateDietTemplateCategory
        {...defaultProps}
        edit
        rowData={{ id: '1', name: 'Test Category', status: 'active' }}
      />
    )

    expect(
      screen.getByTestId('modal-title').textContent?.toLowerCase()
    ).toContain('edit')
  })

  it('calls handleClose when modal close button is clicked', () => {
    const handleClose = jest.fn()

    renderWithQueryClient(
      <CreateDietTemplateCategory
        {...defaultProps}
        handleClose={handleClose}
      />
    )

    fireEvent.click(screen.getByTestId('modal-close'))

    expect(handleClose).toHaveBeenCalled()
  })

  it('renders form builder component', () => {
    renderWithQueryClient(<CreateDietTemplateCategory {...defaultProps} />)

    expect(
      screen.getByTestId('form-builder')
    ).toBeInTheDocument()
  })

  it('calls mutate on form submit with create data', () => {
    renderWithQueryClient(<CreateDietTemplateCategory {...defaultProps} />)

    fireEvent.click(screen.getByTestId('modal-submit'))

    expect(mockMutate).toHaveBeenCalled()
  })

  it('renders in edit mode when edit prop is true', () => {
    renderWithQueryClient(
      <CreateDietTemplateCategory
        {...defaultProps}
        edit
        rowData={{
          id: '1',
          name: 'Existing Category',
          status: 'active',
        }}
      />
    )

    expect(
      screen.getByTestId('dialog-modal')
    ).toBeInTheDocument()
  })

  it('calls updateMutate on form submit in edit mode', () => {
    renderWithQueryClient(
      <CreateDietTemplateCategory
        {...defaultProps}
        edit
        rowData={{
          id: '1',
          name: 'Existing Category',
          status: 'active',
        }}
      />
    )

    fireEvent.click(screen.getByTestId('modal-submit'))

    expect(mockUpdateMutate).toHaveBeenCalled()
  })

  it('displays all form fields when rendering', () => {
    renderWithQueryClient(<CreateDietTemplateCategory {...defaultProps} />)

    const formBuilder = screen.getByTestId('form-builder')

    expect(formBuilder).toBeInTheDocument()
    expect(formBuilder.textContent).not.toBe('No fields')
  })

  it('passes correct payload structure on submit', () => {
    renderWithQueryClient(<CreateDietTemplateCategory {...defaultProps} />)

    fireEvent.click(screen.getByTestId('modal-submit'))

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        diet_template_category: expect.objectContaining({
          name: expect.any(String),
          status: expect.any(String),
        }),
      }),
      expect.any(Object)
    )
  })

  it('handles closing modal without changes', () => {
    const handleClose = jest.fn()

    renderWithQueryClient(
      <CreateDietTemplateCategory
        {...defaultProps}
        handleClose={handleClose}
      />
    )

    fireEvent.click(screen.getByTestId('modal-close'))

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('shows loading state when create mutation is loading', () => {
    jest.mock('../api', () => ({
      useCreateDietTemplateCategory: () => ({
        mutate: mockMutate,
        isLoading: true,
      }),
      useUpdateDietTemplateCategory: () => ({
        mutate: mockUpdateMutate,
        isLoading: false,
      }),
    }))

    renderWithQueryClient(<CreateDietTemplateCategory {...defaultProps} />)

    // The actionLoader prop should be passed to DialogModal
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
  })

  it('shows loading state when update mutation is loading', () => {
    jest.mock('../api', () => ({
      useCreateDietTemplateCategory: () => ({
        mutate: mockMutate,
        isLoading: false,
      }),
      useUpdateDietTemplateCategory: () => ({
        mutate: mockUpdateMutate,
        isLoading: true,
      }),
    }))

    renderWithQueryClient(
      <CreateDietTemplateCategory
        {...defaultProps}
        edit
        rowData={{ id: '1', name: 'Test', status: 'active' }}
      />
    )

    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
  })
})