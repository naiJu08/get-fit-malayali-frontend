import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

import CreateAdmin from '../create'

const mockUseNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}))

// We mock react-hook-form to directly execute submit handlers with controlled values.
// This allows us to cover submission branches without relying on FormBuilder wiring.
let mockFormValues: any = {
  name: 'Test Template',
  description: 'Test Description',
  duration_days: 7,
  diet_template_category_id: 1,
  thumbnail: undefined,
}
const mockReset = jest.fn()
const mockSetValue = jest.fn()
const mockGetValues = jest.fn(() => ({}))
jest.mock('react-hook-form', () => ({
  __esModule: true,
  FormProvider: ({ children }: any) => <>{children}</>,
  useForm: () => ({
    reset: mockReset,
    setValue: mockSetValue,
    getValues: mockGetValues,
    handleSubmit:
      (cb: any) =>
      () =>
        cb(mockFormValues),
  }),
}))

const mockEnqueueSnackbar = jest.fn()
jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

const mockCreateMutate = jest.fn()
const mockUpdateMutate = jest.fn()
let mockApiResponse: any = { id: 123 }
jest.mock('../api', () => ({
  useCreateTemplate: (onSuccess: any) => ({
    mutate: (data: any) => {
      mockCreateMutate(data)
      onSuccess?.(mockApiResponse)
    },
    isLoading: false,
  }),
  useUpdateTemplate: (onSuccess: any) => ({
    mutate: (args: any) => {
      mockUpdateMutate(args)
      onSuccess?.(mockApiResponse)
    },
    isLoading: false,
  }),
}))

jest.mock('../../DietTemplateCategories/api', () => {
  const actualModule = jest.requireActual('../../DietTemplateCategories/api')
  return {
    __esModule: true,
    ...actualModule,
    useDietTemplateCategories: () => ({
      data: {
        diet_template_categories: [
          { id: 1, name: 'Weight Loss' },
          { id: 2, name: 'Muscle Gain' },
        ],
      },
    }),
  }
})

jest.mock('../../../components/app/formBuilder', () => {
  return function MockFormBuilder() {
    return <div data-testid="form-builder">Form Builder</div>
  }
})

jest.mock('../../../components/common/drawer/customeSideViewer', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="side-viewer">{children}</div>
  ),
}))

jest.mock('../../../components/common', () => ({
  DialogModal: ({
    isOpen,
    onClose,
    title,
    body,
    onSubmit,
  }: {
    isOpen: boolean
    onClose: () => void
    title: string
    body: React.ReactNode
    onSubmit: () => void
  }) => {
    if (!isOpen) return null
    return (
      <div data-testid="dialog-modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-body">{body}</div>
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
        <button data-testid="modal-submit" onClick={onSubmit}>
          Submit
        </button>
      </div>
    )
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithQueryClient = (
  component: React.ReactElement,
  { queries = createTestQueryClient(), ...renderOptions } = {}
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queries}>{children}</QueryClientProvider>
    </BrowserRouter>
  )
  return render(component, { wrapper: Wrapper, ...renderOptions })
}

const defaultProps = {
  isDrawerOpen: true,
  handleClose: jest.fn(),
  handleRefresh: jest.fn(),
  edit: false,
  viewMode: false,
  setViewMode: jest.fn(),
  setEdit: jest.fn(),
  rowData: null,
  setEditViewIndicator: jest.fn(),
}

describe('DietTemplate Create Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFormValues = {
      name: 'Test Template',
      description: 'Test Description',
      duration_days: 7,
      diet_template_category_id: 1,
      thumbnail: undefined,
    }
    mockApiResponse = { id: 123 }
  })

  it('renders form builder when modal is open', () => {
    renderWithQueryClient(<CreateAdmin {...defaultProps} />)

    expect(screen.getByTestId('form-builder')).toBeInTheDocument()
  })

  it('does not render when isDrawerOpen is false', () => {
    renderWithQueryClient(
      <CreateAdmin {...defaultProps} isDrawerOpen={false} />
    )

    expect(screen.queryByTestId('dialog-modal')).not.toBeInTheDocument()
  })

  it('displays create title in modal header', () => {
    renderWithQueryClient(<CreateAdmin {...defaultProps} edit={false} />)

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Create')
  })

  it('displays edit title in modal header when in edit mode', () => {
    renderWithQueryClient(<CreateAdmin {...defaultProps} edit={true} />)

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit')
  })

  it('calls handleClose when modal close button is clicked', () => {
    const handleClose = jest.fn()

    renderWithQueryClient(
      <CreateAdmin {...defaultProps} handleClose={handleClose} />
    )

    fireEvent.click(screen.getByTestId('modal-close'))

    expect(handleClose).toHaveBeenCalled()
  })

  it('renders dialog modal component', () => {
    renderWithQueryClient(<CreateAdmin {...defaultProps} />)

    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
  })

  it('renders modal body with form builder', () => {
    renderWithQueryClient(<CreateAdmin {...defaultProps} />)

    const modalBody = screen.getByTestId('modal-body')
    expect(within(modalBody).getByTestId('form-builder')).toBeInTheDocument()
  })

  it('has submit button in modal', () => {
    renderWithQueryClient(<CreateAdmin {...defaultProps} />)

    expect(screen.getByTestId('modal-submit')).toBeInTheDocument()
  })

  it('has close button in modal', () => {
    renderWithQueryClient(<CreateAdmin {...defaultProps} />)

    expect(screen.getByTestId('modal-close')).toBeInTheDocument()
  })

  it('handles view mode correctly', () => {
    renderWithQueryClient(
      <CreateAdmin {...defaultProps} viewMode={true} edit={false} />
    )

    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
  })

  it('provides rowData to form when available', () => {
    const testData = {
      id: 1,
      name: 'Test Template',
      description: 'Test Description',
      duration_days: 30,
    }

    renderWithQueryClient(
      <CreateAdmin {...defaultProps} rowData={testData} edit={true} />
    )

    expect(screen.getByTestId('form-builder')).toBeInTheDocument()
  })

  it('submits create and navigates to diet plan on success', async () => {
    renderWithQueryClient(<CreateAdmin {...defaultProps} edit={false} />)

    fireEvent.click(screen.getByTestId('modal-submit'))

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalled()
      expect(mockUseNavigate).toHaveBeenCalledWith('/diet-template/123/diet-plan')
    })
  })

  it('submits update when rowData has id and does not navigate in edit mode', async () => {
    const testData = { id: 55, name: 'Existing', thumbnail_url: 'a/b.png' }
    renderWithQueryClient(
      <CreateAdmin {...defaultProps} rowData={testData} edit={true} />
    )

    fireEvent.click(screen.getByTestId('modal-submit'))

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalled()
      expect(mockUseNavigate).not.toHaveBeenCalled()
    })
  })

  it('covers thumbnail change branches (File, removed, string)', async () => {
    const testData = { id: 99, thumbnail_url: 'https://x/y%20z.png' }
    renderWithQueryClient(
      <CreateAdmin {...defaultProps} rowData={testData} edit={true} />
    )

    // CASE 1: New file uploaded
    mockFormValues = { ...mockFormValues, thumbnail: new File(['x'], 't.png') }
    fireEvent.click(screen.getByTestId('modal-submit'))
    expect(mockUpdateMutate).toHaveBeenCalled()

    // CASE 2: Existing thumbnail removed
    mockUpdateMutate.mockClear()
    mockFormValues = { ...mockFormValues, thumbnail: '' }
    fireEvent.click(screen.getByTestId('modal-submit'))
    expect(mockUpdateMutate).toHaveBeenCalled()

    // CASE 3: Different thumbnail string
    mockUpdateMutate.mockClear()
    mockFormValues = { ...mockFormValues, thumbnail: 'other.png' }
    fireEvent.click(screen.getByTestId('modal-submit'))
    expect(mockUpdateMutate).toHaveBeenCalled()
  })
})
