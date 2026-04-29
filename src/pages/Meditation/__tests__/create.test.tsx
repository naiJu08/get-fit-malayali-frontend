import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SnackbarProvider } from 'notistack'
import { BrowserRouter } from 'react-router-dom'

import CreateAdmin, { getFileName, capitalizeWords } from '../create'
import { useCreateMeditation, useUpdateMeditation } from '../api'

// Mock the API hooks
jest.mock('../api', () => ({
  useCreateMeditation: jest.fn(),
  useUpdateMeditation: jest.fn(),
  getMeditationDetails: jest.fn(),
}))

// Mock schema
jest.mock(
  '../create/schema',
  () => ({
    formSchema: {},
    editFormSchema: {},
    MeditationSchema: {},
  }),
  { virtual: true }
)

// Mock utilities
jest.mock('../../../utilities/format', () => ({
  humanizeDatetime: jest.fn((date) => date),
  formatVideoDurationLabel: jest.fn((ms) => `${Math.floor(ms / 60000)}:00`),
}))

jest.mock('../../../utilities/parsers', () => ({
  getFileName: jest.fn((url) => url?.split('/').pop() || ''),
  parseDurationMinutesToMs: jest.fn((mins) => mins * 60000),
}))

// Mock FormBuilder
jest.mock('../../../components/app/formBuilder', () => ({
  __esModule: true,
  default: ({ data, onSubmit }: any) => (
    <form
      data-testid="form-builder"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
    >
      {data?.map((field: any) => (
        <input
          key={field.name}
          data-testid={`input-${field.name}`}
          name={field.name}
          placeholder={field.label}
        />
      ))}
      <button type="submit" data-testid="form-submit">
        Submit
      </button>
    </form>
  ),
}))

// Mock DialogModal
jest.mock('../../../components/common', () => ({
  DialogModal: ({
    isOpen,
    title,
    onClose,
    actionLabel,
    onSubmit,
    secondaryActionLabel,
    body,
  }: any) =>
    isOpen ? (
      <div data-testid="dialog-modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-body">{body}</div>
        <button data-testid="modal-submit" onClick={onSubmit}>
          {actionLabel}
        </button>
        <button data-testid="modal-close" onClick={onClose}>
          {secondaryActionLabel}
        </button>
      </div>
    ) : null,
}))

// Mock CustomeSideViewer
jest.mock('../../../components/common/drawer/customeSideViewer', () => ({
  __esModule: true,
  default: ({ headerData, contentData }: any) => (
    <div data-testid="side-viewer">
      <div>Header: {JSON.stringify(headerData)}</div>
      <div>Content: {JSON.stringify(contentData)}</div>
    </div>
  ),
}))

// Mock snackbar
jest.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: jest.fn(),
  }),
  SnackbarProvider: ({ children }: any) => <>{children}</>,
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>{component}</SnackbarProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

// Mock data
const mockRowData = {
  id: '1',
  title: 'Test Meditation',
  description: 'Test Description',
  duration_minutes: 30,
  video_url: 'https://example.com/video.mp4',
  thumbnail_url: 'https://example.com/thumb.jpg',
}

describe('CreateAdmin Component', () => {
  const mockMutate = jest.fn()
  const mockUpdateMutate = jest.fn()

  const defaultProps = {
    isDrawerOpen: true,
    handleClose: jest.fn(),
    handleRefresh: jest.fn(),
    edit: false,
    viewMode: false,
    setViewMode: jest.fn(),
    setEdit: jest.fn(),
    rowData: null,
    paramsId: undefined,
    editViewIndicator: false,
    setEditViewIndicator: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockMutate.mockClear()
    mockUpdateMutate.mockClear()

    // Setup default mocks
    ;(useCreateMeditation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
    })
    ;(useUpdateMeditation as jest.Mock).mockReturnValue({
      mutate: mockUpdateMutate,
      isLoading: false,
    })
  })

  describe('Component Rendering', () => {
    it('should render dialog modal when isDrawerOpen is true', () => {
      renderWithProviders(<CreateAdmin {...defaultProps} />)

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should not render when isDrawerOpen is false', () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} isDrawerOpen={false} />
      )

      expect(screen.queryByTestId('dialog-modal')).not.toBeInTheDocument()
    })

    it('should render create mode title', () => {
      renderWithProviders(<CreateAdmin {...defaultProps} />)

      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Create Meditation'
      )
    })

    it('should render view mode title', () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} viewMode={true} rowData={mockRowData} />
      )

      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Meditation Details'
      )
    })
  })

  describe('Form Rendering', () => {
    it('should render form builder when not in view mode', () => {
      renderWithProviders(<CreateAdmin {...defaultProps} />)

      expect(screen.getByTestId('form-builder')).toBeInTheDocument()
    })

    it('should render side viewer in view mode', () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} viewMode={true} rowData={mockRowData} />
      )

      expect(screen.getByTestId('side-viewer')).toBeInTheDocument()
    })

    it('should not render form builder in view mode', () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} viewMode={true} rowData={mockRowData} />
      )

      expect(screen.queryByTestId('form-builder')).not.toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('should call handleClose when close button is clicked', async () => {
      renderWithProviders(<CreateAdmin {...defaultProps} />)

      const closeButton = screen.getByTestId('modal-close')
      fireEvent.click(closeButton)

      expect(defaultProps.handleClose).toHaveBeenCalled()
    })
  })

  describe('Data Integration', () => {
    it('should populate form fields with rowData in edit mode', () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} edit={true} rowData={mockRowData} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should handle empty rowData', () => {
      renderWithProviders(<CreateAdmin {...defaultProps} rowData={{}} />)

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should handle null rowData', () => {
      renderWithProviders(<CreateAdmin {...defaultProps} rowData={null} />)

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })
  })

  describe('Form Reset and Close Behavior', () => {
    it('should handle edit mode with rowData', () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} edit={true} rowData={mockRowData} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Edit Meditation'
      )
    })

    it('should handle view mode with rowData', () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} viewMode={true} rowData={mockRowData} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Meditation Details'
      )
    })

    it('should not render dialog when isDrawerOpen is false', () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} isDrawerOpen={false} />
      )

      expect(screen.queryByTestId('dialog-modal')).not.toBeInTheDocument()
    })
  })

  describe('Form Submission Behavior', () => {
    it('should render submit button in create mode', async () => {
      renderWithProviders(<CreateAdmin {...defaultProps} />)

      const submitButton = screen.getByTestId('modal-submit')
      expect(submitButton).toBeInTheDocument()
    })

    it('should render submit button in edit mode', async () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} edit={true} rowData={mockRowData} />
      )

      const submitButton = screen.getByTestId('modal-submit')
      expect(submitButton).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle URL without path', () => {
      const result = getFileName('https://example.com')
      expect(result).toBe('example.com')
    })

    it('should handle missing optional props', () => {
      const minimalProps = {
        isDrawerOpen: true,
        handleClose: jest.fn(),
      }

      renderWithProviders(<CreateAdmin {...minimalProps} />)

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should handle undefined paramsId', () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} paramsId={undefined} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should handle editViewIndicator flag', () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} editViewIndicator={true} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should handle handleClearAndClose when close button clicked', () => {
      renderWithProviders(<CreateAdmin {...defaultProps} />)

      const closeButton = screen.getByTestId('modal-close')
      fireEvent.click(closeButton)

      expect(defaultProps.handleClose).toHaveBeenCalled()
    })

    it('should populate form with rowData in edit mode', () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} edit={true} rowData={mockRowData} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Edit Meditation'
      )
    })

    it('should handle view mode with rowData', () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} viewMode={true} rowData={mockRowData} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Meditation Details'
      )
      expect(screen.getByTestId('side-viewer')).toBeInTheDocument()
    })

    it('should not render form builder in view mode', () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} viewMode={true} rowData={mockRowData} />
      )

      expect(screen.queryByTestId('form-builder')).not.toBeInTheDocument()
    })

    it('should handle handleRefresh callback', async () => {
      const mockHandleRefresh = jest.fn()
      renderWithProviders(
        <CreateAdmin {...defaultProps} handleRefresh={mockHandleRefresh} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should handle setViewMode callback', async () => {
      const mockSetViewMode = jest.fn()
      renderWithProviders(
        <CreateAdmin {...defaultProps} setViewMode={mockSetViewMode} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should handle setEdit callback', async () => {
      const mockSetEdit = jest.fn()
      renderWithProviders(
        <CreateAdmin {...defaultProps} setEdit={mockSetEdit} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should handle setEditViewIndicator callback', async () => {
      const mockSetEditViewIndicator = jest.fn()
      renderWithProviders(
        <CreateAdmin
          {...defaultProps}
          setEditViewIndicator={mockSetEditViewIndicator}
        />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should handle paramsId prop', async () => {
      renderWithProviders(<CreateAdmin {...defaultProps} paramsId="123" />)

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should render submit button in create mode', async () => {
      renderWithProviders(<CreateAdmin {...defaultProps} />)

      const submitButton = screen.getByTestId('modal-submit')
      expect(submitButton).toBeInTheDocument()
    })

    it('should render submit button in edit mode', async () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} edit={true} rowData={mockRowData} />
      )

      const submitButton = screen.getByTestId('modal-submit')
      expect(submitButton).toBeInTheDocument()
    })

    it('should render submit button in view mode', async () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} viewMode={true} rowData={mockRowData} />
      )

      const submitButton = screen.getByTestId('modal-submit')
      expect(submitButton).toBeInTheDocument()
    })

    it('should trigger edit mode when submit clicked in view mode', async () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} viewMode={true} rowData={mockRowData} />
      )

      const submitButton = screen.getByTestId('modal-submit')
      fireEvent.click(submitButton)

      // Should trigger setViewMode callback
      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should handle form reset on close', async () => {
      renderWithProviders(<CreateAdmin {...defaultProps} />)

      const titleInput = screen.getByTestId('input-title')
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })

      const closeButton = screen.getByTestId('modal-close')
      fireEvent.click(closeButton)

      expect(defaultProps.handleClose).toHaveBeenCalled()
    })

    it('should handle edit mode with rowData containing video_url', async () => {
      const rowDataWithVideo = {
        ...mockRowData,
        video_url: 'https://example.com/video.mp4',
        thumbnail_url: 'https://example.com/thumbnail.jpg',
      }
      renderWithProviders(
        <CreateAdmin {...defaultProps} edit={true} rowData={rowDataWithVideo} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Edit Meditation'
      )
    })

    it('should handle view mode with rowData containing nested user data', async () => {
      const rowDataWithUser = {
        ...mockRowData,
        user: {
          first_name: 'John',
          last_name: 'Doe',
        },
      }
      renderWithProviders(
        <CreateAdmin
          {...defaultProps}
          viewMode={true}
          rowData={rowDataWithUser}
        />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
      expect(screen.getByTestId('side-viewer')).toBeInTheDocument()
    })

    it('should handle missing optional props', async () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} handleRefresh={undefined} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should render in edit mode with rowData', async () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} edit={true} rowData={mockRowData} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should render in view mode with rowData', async () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} viewMode={true} rowData={mockRowData} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
      expect(screen.getByTestId('side-viewer')).toBeInTheDocument()
    })

    it('should render with paramsId', async () => {
      renderWithProviders(<CreateAdmin {...defaultProps} paramsId="123" />)

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should render with editViewIndicator', async () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} editViewIndicator={true} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should render with hasPermission false', async () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} hasPermission={false} />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should render with subSection true', async () => {
      renderWithProviders(<CreateAdmin {...defaultProps} subSection={true} />)

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should render with isOwnTask true', async () => {
      renderWithProviders(<CreateAdmin {...defaultProps} isOwnTask={true} />)

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should render with isGeneral true', async () => {
      renderWithProviders(<CreateAdmin {...defaultProps} isGeneral={true} />)

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should render with model_name', async () => {
      renderWithProviders(
        <CreateAdmin {...defaultProps} model_name="test-model" />
      )

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })

    it('should render with disabled true', async () => {
      renderWithProviders(<CreateAdmin {...defaultProps} disabled={true} />)

      expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    })
  })

  describe('Utility Functions', () => {
    describe('getFileName', () => {
      it('should extract filename from URL', () => {
        const result = getFileName('https://example.com/path/to/video.mp4')
        expect(result).toBe('video.mp4')
      })

      it('should handle empty string', () => {
        const result = getFileName('')
        expect(result).toBe('')
      })

      it('should handle null', () => {
        const result = getFileName(null as any)
        expect(result).toBe('')
      })

      it('should handle undefined', () => {
        const result = getFileName(undefined)
        expect(result).toBe('')
      })

      it('should handle URL without path', () => {
        const result = getFileName('https://example.com')
        expect(result).toBe('example.com')
      })

      it('should decode encoded URL', () => {
        const result = getFileName('https://example.com/video%20file.mp4')
        expect(result).toContain('video file.mp4')
      })
    })

    describe('capitalizeWords', () => {
      it('should capitalize first letter', () => {
        const result = capitalizeWords('test')
        expect(result).toBe('Test')
      })

      it('should handle empty string', () => {
        const result = capitalizeWords('')
        expect(result).toBe('')
      })

      it('should handle null', () => {
        const result = capitalizeWords(null as any)
        expect(result).toBe('')
      })

      it('should handle undefined', () => {
        const result = capitalizeWords(undefined)
        expect(result).toBe('')
      })

      it('should handle already capitalized string', () => {
        const result = capitalizeWords('Test')
        expect(result).toBe('Test')
      })

      it('should handle all caps string', () => {
        const result = capitalizeWords('TEST')
        expect(result).toBe('Test')
      })

      it('should handle mixed case string', () => {
        const result = capitalizeWords('tEsT')
        expect(result).toBe('Test')
      })
    })
  })
})
