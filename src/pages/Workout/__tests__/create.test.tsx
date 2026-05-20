import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'

const mockCreateMutate = jest.fn()
const mockUpdateMutate = jest.fn()
let mockCreateCallback: any

jest.mock('../api', () => ({
  useCreateWorkout: (callback: any) => {
    mockCreateCallback = callback
    return {
      mutate: mockCreateMutate,
      isLoading: false,
      isPending: false,
    }
  },
  useUpdateWorkout: () => ({
    mutate: mockUpdateMutate,
    isLoading: false,
    isPending: false,
  }),
}))

jest.mock('../../../apis/api.helpers', () => ({
  getData: jest.fn(() =>
    Promise.resolve({
      categories: [
        {
          id: 1,
          name: 'strength',
          subcategories: [{ id: 2, name: 'Push' }],
        },
      ],
    })
  ),
}))

jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    CATEGORIES: '/categories',
  },
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      categories: [
        {
          id: 1,
          name: 'strength',
          subcategories: [{ id: 2, name: 'Push' }],
        },
      ],
    },
  }),
}))

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => jest.fn()),
}))

const mockSetValue = jest.fn()
const mockReset = jest.fn()
const mockClearErrors = jest.fn()
const mockSetError = jest.fn()
let mockFormValues: any

jest.mock('react-hook-form', () => ({
  FormProvider: ({ children }: any) => (
    <div data-testid="form-provider">{children}</div>
  ),
  useForm: () => ({
    handleSubmit: (callback: any) => (event?: any) => {
      event?.preventDefault?.()
      return callback(mockFormValues)
    },
    watch: jest.fn((name?: string) =>
      name ? mockFormValues?.[name] : mockFormValues
    ),
    setError: mockSetError,
    clearErrors: mockClearErrors,
    control: { register: jest.fn() },
    formState: { errors: {}, isSubmitting: false },
    reset: mockReset,
    setValue: mockSetValue,
    getValues: jest.fn(() => mockFormValues),
    trigger: jest.fn().mockResolvedValue(true),
  }),
}))

jest.mock('../../../components/common', () => ({
  DialogModal: ({
    isOpen,
    onClose,
    onSubmit,
    title,
    body,
    actionLabel,
    secondaryAction,
    secondaryActionLabel,
  }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="dialog-modal">
        <h2 data-testid="modal-title">{title}</h2>
        <div data-testid="modal-body">{body}</div>
        <button data-testid="modal-submit" onClick={onSubmit}>
          {actionLabel || 'Save'}
        </button>
        <button data-testid="modal-cancel" onClick={secondaryAction || onClose}>
          {secondaryActionLabel || 'Cancel'}
        </button>
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    )
  },
}))

jest.mock('../../../components/app/formBuilder', () => {
  return function MockFormBuilder({ data }: any) {
    return (
      <div data-testid="form-builder">
        {data?.map((field: any) => (
          <div key={field.name} data-testid={`field-${field.name}`}>
            <span>{field.label}</span>
            {field.labelAddon ? (
              <span data-testid={`label-addon-${field.name}`}>
                {field.labelAddon}
              </span>
            ) : null}
            {field.handleDeleteFile ? (
              <button
                data-testid={`delete-file-${field.name}`}
                onClick={field.handleDeleteFile}
                type="button"
              />
            ) : null}
          </div>
        ))}
      </div>
    )
  }
})

jest.mock('../../../components/common/drawer/customeSideViewer', () => {
  return function MockCustomeSideViewer({ headerData }: any) {
    return (
      <div data-testid="side-viewer">Side Viewer: {headerData?.title}</div>
    )
  }
})

jest.mock('../../../components/app/alertBox/infoBox', () => {
  return function MockInfoBox({ content }: any) {
    return <div data-testid="info-box">{content}</div>
  }
})

jest.mock('../../../utilities/format', () => ({
  humanizeDatetime: jest.fn(() => '01-01-2023 12:00 pm'),
}))

jest.mock('moment', () => {
  const mockMoment = jest.fn(() => ({
    format: jest.fn(() => '01-01-2023 12:00 pm'),
  }))
  return {
    __esModule: true,
    default: mockMoment,
  }
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)

describe('CreateWorkout Component', () => {
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
    const mockedMoment = require('moment').default || require('moment')
    mockedMoment.mockImplementation(() => ({
      format: jest.fn(() => '01-01-2023 12:00 pm'),
    }))
    URL.createObjectURL = jest.fn(() => 'blob:workout-video')
    URL.revokeObjectURL = jest.fn()
    mockCreateCallback = undefined
    mockFormValues = {
      name: 'Test Workout',
      description: 'Test Description',
      intensity_level: 'High',
      category_id: 1,
      subcategory_id: 2,
      video_file: 'https://example.com/video.mp4',
      thumbnail: '',
    }
  })

  const renderComponent = (props = {}) =>
    {
      const CreateWorkout = require('../create').default
      return render(
        <TestWrapper>
          <CreateWorkout {...defaultProps} {...props} />
        </TestWrapper>
      )
    }

  it('renders create workout modal', () => {
    renderComponent()

    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    expect(screen.getByTestId('modal-title')).toHaveTextContent(
      'Create Workout'
    )
    expect(screen.getByTestId('form-builder')).toBeInTheDocument()
  })

  it('renders edit workout modal', () => {
    renderComponent({
      edit: true,
      rowData: { id: '1', name: 'Existing Workout' },
    })

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Workout')
  })

  it('renders view mode and switches to edit mode', async () => {
    renderComponent({
      viewMode: true,
      rowData: {
        id: '1',
        user: { first_name: 'Jane', last_name: 'Doe' },
      },
    })

    expect(screen.getByTestId('modal-title')).toHaveTextContent(
      'Workout Details'
    )
    expect(screen.getByTestId('side-viewer')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-submit'))
    })

    expect(defaultProps.setViewMode).toHaveBeenCalledWith(false)
    expect(defaultProps.setEdit).toHaveBeenCalledWith(true)
    expect(defaultProps.setEditViewIndicator).toHaveBeenCalledWith(true)
  })

  it('builds view data with created and updated dates', () => {
    renderComponent({
      viewMode: true,
      rowData: {
        id: '1',
        user: {
          first_name: 'Jane',
          last_name: 'Doe',
          username: 'jane@example.com',
          job_title: 'Coach',
          last_login: '2026-01-01T10:00:00Z',
          datetime_created: '2026-01-01T10:00:00Z',
          datetime_updated: '2026-01-02T10:00:00Z',
          group: { name: 'Trainer' },
        },
      },
    })

    expect(screen.getByTestId('side-viewer')).toHaveTextContent(
      'Side Viewer: Jane Doe'
    )
  })

  it('submits create workout form', async () => {
    renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-submit'))
    })

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalled()
    })
  })

  it('runs success cleanup after create mutation succeeds', async () => {
    mockCreateMutate.mockImplementation(() => mockCreateCallback?.())
    renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-submit'))
    })

    expect(mockReset).toHaveBeenCalled()
    expect(defaultProps.handleRefresh).toHaveBeenCalled()
    expect(defaultProps.handleClose).toHaveBeenCalled()
  })

  it('submits update workout form', async () => {
    renderComponent({
      edit: true,
      rowData: { id: '1', name: 'Existing Workout' },
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-submit'))
    })

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: '1',
        data: expect.any(FormData),
      })
    })
  })

  it('submits uploaded video and thumbnail files', async () => {
    mockFormValues = {
      ...mockFormValues,
      video_file: new File(['video'], 'workout.mp4', { type: 'video/mp4' }),
      thumbnail: new File(['thumb'], 'thumb.jpg', { type: 'image/jpeg' }),
    }

    renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-submit'))
    })

    const formData = mockCreateMutate.mock.calls[0][0] as FormData
    expect(formData.get('video')).toBe(mockFormValues.video_file)
    expect(formData.get('workout[thumbnail]')).toBe(mockFormValues.thumbnail)
  })

  it('sets video error when video is removed', async () => {
    mockFormValues = {
      ...mockFormValues,
      video_file: '',
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

  it('sets subcategory error when selected category has subcategories', async () => {
    mockFormValues = {
      ...mockFormValues,
      subcategory_id: undefined,
    }

    renderComponent()

    expect(screen.getByTestId('field-subcategory')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-submit'))
    })

    expect(mockSetError).toHaveBeenCalledWith(
      'subcategory_id',
      expect.objectContaining({ message: 'Subcategory is required.' })
    )
  })

  it('hydrates edit form values from category and media data', async () => {
    renderComponent({
      edit: true,
      rowData: {
        id: '22',
        name: 'push workout',
        description: 'Existing description',
        intensity_level: 'Low',
        category: {
          id: 2,
          name: 'Push',
          main_category: { id: 1, name: 'Strength' },
        },
        video_url: 'https://example.com/uploads/workout%20video.mp4',
        thumbnail_url: 'https://example.com/uploads/thumb%25image.jpg',
      },
    })

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Push workout',
          category: 'Strength',
          category_id: 1,
          subcategory: 'Push',
          subcategory_id: 2,
          video_file: 'workout video.mp4',
          thumbnail: 'thumbimage.jpg',
        })
      )
    })
  })

  it('clears uploaded file values from form builder controls', async () => {
    renderComponent({
      rowData: {
        thumbnail_url: 'https://example.com/thumb.jpg',
        video_url: 'https://example.com/video.mp4',
      },
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-file-thumbnail'))
      fireEvent.click(screen.getByTestId('delete-file-video_file'))
    })

    expect(mockSetValue).toHaveBeenCalledWith('thumbnail', '')
    expect(mockSetValue).toHaveBeenCalledWith('video_file', '')
    expect(mockSetValue).toHaveBeenCalledWith('video_url', '')
  })

  it('uses existing duration fallback for existing string video', async () => {
    mockFormValues = {
      ...mockFormValues,
      video_file: 'existing-video.mp4',
    }

    renderComponent({
      rowData: {
        duration_minutes: '2.05',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Video duration: 2:05')).toBeInTheDocument()
    })
  })

  it('submits duration from existing video duration fallback', async () => {
    mockFormValues = {
      ...mockFormValues,
      video_file: 'existing-video.mp4',
    }

    renderComponent({
      rowData: {
        duration_minutes: '2.05',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Video duration: 2:05')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-submit'))
    })

    const formData = mockCreateMutate.mock.calls[0][0] as FormData
    expect(formData.get('workout[duration_minutes]')).toBe('2.05')
  })

  it('closes modal and resets form on cancel', async () => {
    renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-cancel'))
    })

    expect(mockReset).toHaveBeenCalled()
    expect(defaultProps.handleClose).toHaveBeenCalled()
  })

  it('does not render when drawer is closed', () => {
    renderComponent({ isDrawerOpen: false })

    expect(screen.queryByTestId('dialog-modal')).not.toBeInTheDocument()
  })
})
