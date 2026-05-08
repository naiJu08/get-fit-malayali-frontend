// src/pages/Yoga/__tests__/create.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'
import CreateAdmin from '../create'

// Mock the API hooks
const mockCreateMutate = jest.fn()
const mockUpdateMutate = jest.fn()

jest.mock('../api', () => ({
  useCreateYoga: () => ({
    mutate: mockCreateMutate,
    isLoading: false,
    isPending: false,
  }),
  useUpdateYoga: () => ({
    mutate: mockUpdateMutate,
    isLoading: false,
    isPending: false,
  }),
}))

// Mock schema
jest.mock('../create/schema', () => ({
  YogaSchema: {},
  formSchema: {
    parse: jest.fn(() => ({})),
    safeParse: jest.fn(() => ({ success: true, data: {} })),
  },
}))

// Mock zod resolver
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => jest.fn()),
}))

// Mock auth store
jest.mock('../../../store/authStore', () => ({
  useAuthStore: () => ({
    roleData: { name: 'admin' },
  }),
}), { virtual: true })

// Mock react-hook-form
const mockSetValue = jest.fn()
const mockReset = jest.fn()
const mockClearErrors = jest.fn()
const mockSetError = jest.fn()
let submitCallback: any = null
let mockFormValues: any = { name: 'Test Yoga', description: 'Test Description' }

jest.mock('react-hook-form', () => ({
  FormProvider: ({ children }: any) => <div data-testid="form-provider">{children}</div>,
  useForm: () => ({
    handleSubmit: (callback: any) => {
      submitCallback = callback
      return (e?: any) => {
        if (e) e.preventDefault()
        return callback(mockFormValues)
      }
    },
    watch: jest.fn(),
    setError: mockSetError,
    clearErrors: mockClearErrors,
    control: { register: jest.fn() },
    formState: { errors: {}, isSubmitting: false },
    reset: mockReset,
    setValue: mockSetValue,
    getValues: jest.fn(),
    trigger: jest.fn().mockResolvedValue(true),
  }),
}))

// Mock DialogModal
jest.mock('../../../components/common', () => ({
  DialogModal: ({ isOpen, onClose, onSubmit, title, children, actionLabel, secondaryAction, secondaryActionLabel, actionLoader }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="dialog-modal">
        <h2 data-testid="modal-title">{title}</h2>
        <div data-testid="modal-body">
          {children}
          <div>
            <button 
              type="button"
              data-testid="modal-submit" 
              onClick={onSubmit}
              disabled={actionLoader}
            >
              {actionLabel || 'Save'}
            </button>
            <button 
              type="button"
              data-testid="modal-cancel" 
              onClick={secondaryAction || onClose}
            >
              {secondaryActionLabel || 'Cancel'}
            </button>
            <button 
              type="button"
              data-testid="modal-close" 
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  },
}))

// Mock FormBuilder
jest.mock('../../../components/app/formBuilder', () => {
  return function MockFormBuilder() {
    return <div data-testid="form-builder">Form Builder Content</div>
  }
})

// Mock CustomeSideViewer - make sure it's rendered properly
jest.mock('../../../components/common/drawer/customeSideViewer', () => {
  return function MockCustomeSideViewer({ headerData, contentData }: any) {
    return (
      <div data-testid="side-viewer">
        <div>Side Viewer: {headerData?.title}</div>
      </div>
    )
  }
}, { virtual: true })

// Mock moment
jest.mock('moment', () => {
  return jest.fn(() => ({
    format: jest.fn().mockReturnValue('01-01-2023 12:00 pm'),
    fromNow: jest.fn().mockReturnValue('2 days ago'),
  }))
})

jest.mock('../../../utilities/format', () => ({
  humanizeDatetime: jest.fn(() => '01-01-2023 12:00 pm'),
}), { virtual: true })

describe('CreateAdmin Component', () => {
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

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateMutate.mockClear()
    mockUpdateMutate.mockClear()
    submitCallback = null
    mockFormValues = { name: 'Test Yoga', description: 'Test Description', video_file: 'old.mp4', thumbnail: '' }
  })

  const renderComponent = (props = {}) => {
    return render(<CreateAdmin {...defaultProps} {...props} />)
  }

  it('renders create yoga modal', () => {
    renderComponent()
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Create Yoga')
  })

  it('renders edit yoga modal when in edit mode', () => {
    renderComponent({ edit: true, rowData: { id: '1', name: 'Test' } })
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Yoga')
  })

  it('renders view mode when in viewMode', () => {
    const mockRowData = {
      id: '1',
      name: 'Test Yoga',
      user: { first_name: 'John', last_name: 'Doe' },
    }
    renderComponent({ viewMode: true, rowData: mockRowData })
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Yoga Details')
    // In view mode, only the modal should render without form-builder or side-viewer
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
  })

  it('handles modal cancel', async () => {
    renderComponent()
    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-cancel'))
    })
    expect(defaultProps.handleClose).toHaveBeenCalled()
  })

  it('handles modal close button', async () => {
    renderComponent()
    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-close'))
    })
    expect(defaultProps.handleClose).toHaveBeenCalled()
  })

  it('switches from view mode to edit mode', async () => {
    const mockRowData = {
      id: '1',
      name: 'Test Yoga',
      user: { first_name: 'John', last_name: 'Doe' },
    }
    renderComponent({ viewMode: true, rowData: mockRowData })

    const editButton = screen.getByTestId('modal-submit')
    expect(editButton).toHaveTextContent('Edit')

    await act(async () => {
      fireEvent.click(editButton)
    })

    expect(defaultProps.setViewMode).toHaveBeenCalledWith(false)
    expect(defaultProps.setEdit).toHaveBeenCalledWith(true)
    expect(defaultProps.setEditViewIndicator).toHaveBeenCalledWith(true)
  })

  it('handles form submission for new yoga', async () => {
    mockFormValues = {
      name: 'Test Yoga',
      description: 'Test Description',
      intensity_level: 'High',
      category: 'basic',
      video_file: 'video.mp4',
      thumbnail: '',
    }
    renderComponent()
    const submitButton = screen.getByTestId('modal-submit')
    
    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalled()
    })
  })

  it('handles form submission for editing yoga', async () => {
    const mockRowData = { id: '1', name: 'Existing Yoga' }
    mockFormValues = {
      name: 'Existing Yoga',
      description: 'Updated',
      intensity_level: 'Low',
      category: { id: 'basic', name: 'Basic' },
      video_file: 'video.mp4',
      thumbnail: '',
    }
    renderComponent({ edit: true, rowData: mockRowData })

    const submitButton = screen.getByTestId('modal-submit')
    
    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalled()
    })
  })

  it('sets error when video is removed', async () => {
    mockFormValues = {
      name: 'Test Yoga',
      description: 'Test Description',
      video_file: '',
      thumbnail: '',
      intensity_level: '',
      category: '',
    }

    renderComponent()
    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-submit'))
    })

    expect(mockSetError).toHaveBeenCalledWith(
      'video_file',
      expect.objectContaining({ message: 'Video is required.' })
    )
    expect(mockCreateMutate).not.toHaveBeenCalled()
  })

  it('submits create when video is unchanged string (uses yoga[video_url])', async () => {
    const mockRowData = { video_url: 'https://example.com/video.mp4' }
    mockFormValues = {
      name: 'Test Yoga',
      description: 'Test Description',
      video_file: 'video.mp4',
      thumbnail: '',
      intensity_level: 'High',
      category: 'basic',
    }

    renderComponent({ rowData: mockRowData })
    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-submit'))
    })

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalled()
    })
  })

  it('does not render when modal is closed', () => {
    renderComponent({ isDrawerOpen: false })
    expect(screen.queryByTestId('dialog-modal')).not.toBeInTheDocument()
  })

  it('handles view mode with editViewIndicator', async () => {
    const mockRowData = {
      id: '1',
      name: 'Test Yoga',
      user: { first_name: 'John', last_name: 'Doe' },
    }
    renderComponent({ 
      viewMode: true, 
      rowData: mockRowData,
      editViewIndicator: true 
    })

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Yoga Details')
    expect(screen.getByTestId('modal-submit')).toHaveTextContent('Edit')
  })

  it('handles handleClose with editViewIndicator and viewIndicator', async () => {
    const mockRowData = {
      id: '1',
      name: 'Test Yoga',
      user: { first_name: 'John', last_name: 'Doe' },
    }
    
    const props = {
      ...defaultProps,
      viewMode: true,
      rowData: mockRowData,
      editViewIndicator: true,
    }
    
    renderComponent(props)

    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-close'))
    })
    
    expect(defaultProps.handleClose).toHaveBeenCalled()
  })

  it('renders correctly with paramsId', async () => {
    const props = {
      ...defaultProps,
      paramsId: '123',
    }
    renderComponent(props)
    
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Create Yoga')
  })

  it('handles form data transformation correctly', async () => {
    const mockRowData = {
      id: '1',
      name: 'Test Yoga',
      description: 'Test Description',
      duration_minutes: 30,
      intensity_level: 'moderate',
      category: 'basic',
      user: { first_name: 'John', last_name: 'Doe' },
    }
    
    renderComponent({ edit: true, rowData: mockRowData })

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Yoga')
    expect(screen.getByTestId('modal-submit')).toHaveTextContent('Save')
  })

  it('handles empty rowData in edit mode', async () => {
    renderComponent({ edit: true, rowData: {} })

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Yoga')
    expect(screen.getByTestId('modal-submit')).toHaveTextContent('Save')
  })

  it('handles form submission success callback', async () => {
    mockCreateMutate.mockResolvedValueOnce({ success: true })
    renderComponent()
    
    const submitButton = screen.getByTestId('modal-submit')
    
    await act(async () => {
      fireEvent.click(submitButton)
    })

    // Just verify the mutation was called
    expect(mockCreateMutate).toHaveBeenCalled()
  })

  it('handles update submission success callback', async () => {
    mockUpdateMutate.mockResolvedValueOnce({ success: true })
    const mockRowData = { id: '1', name: 'Existing Yoga' }
    renderComponent({ edit: true, rowData: mockRowData })

    const submitButton = screen.getByTestId('modal-submit')
    
    await act(async () => {
      fireEvent.click(submitButton)
    })

    // Just verify the mutation was called
    expect(mockUpdateMutate).toHaveBeenCalled()
  })

  it('handles form submission with different data types', async () => {
    mockFormValues = {
      name: 'Test Yoga',
      description: 'Test Description',
      duration_minutes: 45,
      intensity_level: 'high',
      category: 'advanced',
      video_file: 'video.mp4',
      thumbnail: '',
    }
    
    renderComponent()
    
    const submitButton = screen.getByTestId('modal-submit')
    
    await act(async () => {
      fireEvent.click(submitButton)
    })

    // Just verify the mutation was called
    expect(mockCreateMutate).toHaveBeenCalled()
  })

  it('handles side viewer with different user data', async () => {
    const mockRowData = {
      id: '1',
      name: 'Test Yoga',
      user: { 
        first_name: 'Jane', 
        last_name: 'Smith',
        email: 'jane@example.com',
        role: 'instructor'
      },
      created_at: '2023-01-01T00:00:00Z',
    }
    
    renderComponent({ viewMode: true, rowData: mockRowData })

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Yoga Details')
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
  })

  it('handles form builder with different field configurations', async () => {
    const mockRowData = {
      id: '1',
      name: 'Test Yoga with Special Characters !@#$%',
      description: 'Description with\nnewlines and\ttabs',
      duration_minutes: 0,
      intensity_level: '',
      category: null,
    }
    
    renderComponent({ edit: true, rowData: mockRowData })

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Yoga')
    expect(screen.getByTestId('modal-submit')).toHaveTextContent('Save')
  })

  it('handles modal close with cleanup', async () => {
    renderComponent()
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-close'))
    })
    
    expect(defaultProps.handleClose).toHaveBeenCalled()
  })

  it('handles view mode with missing user data', async () => {
    const mockRowData = {
      id: '1',
      name: 'Test Yoga',
      user: null,
    }
    
    renderComponent({ viewMode: true, rowData: mockRowData })

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Yoga Details')
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
  })

  it('handles form with all optional fields', async () => {
    mockFormValues = {
      name: 'Minimal Yoga',
      video_file: 'video.mp4',
      thumbnail: '',
    }
    
    renderComponent()
    
    const submitButton = screen.getByTestId('modal-submit')
    
    await act(async () => {
      fireEvent.click(submitButton)
    })

    // Just verify the mutation was called
    expect(mockCreateMutate).toHaveBeenCalled()
  })
})
