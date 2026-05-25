import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import Profile from '../oldIndex'
// import Profile from '../'

// Mock child components
jest.mock('../../../components/app/formBuilder/index', () => (props: any) => (
  <div data-testid="form-builder">
    {props.data.map((field: any) => (
      <input key={field.name} data-testid={`field-${field.name}`} />
    ))}
  </div>
))

jest.mock('../../../components/common', () => ({
  Button: (props: any) => (
    <button
      data-testid={`button-${props.label?.toLowerCase() || 'custom'}`}
      onClick={props.onClick}
      disabled={props.isLoading}
      className={props.className}
    >
      {props.isLoading ? 'Loading...' : props.label}
    </button>
  ),
  Icon: (props: any) => <div data-testid="icon">{props.name}</div>,
}))

jest.mock('../../../components/common/icons', () => (props: any) => (
  <div data-testid="edit-icon" onClick={props.onClick}>
    Edit
  </div>
))

jest.mock('../../../components/common/inputs/FormFieldView', () => (props: any) => (
  <div data-testid="form-field-view">
    <label>{props.label}</label>
    <div>{props.value}</div>
  </div>
))

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: jest.fn(),
  }),
}))

jest.mock('../../../store/domainManageStore', () => ({
  useDomainManageStore: jest.fn(() => ({ domainType: 'Assessor' })),
}))

jest.mock('../../../store/filterSore/assessorStore', () => ({
  useAssessorFilterStore: () => ({
    pageParams: {
      page: 1,
      page_size: 10,
      search: '',
      ordering: '',
      filters: {},
    },
  }),
}))

jest.mock('../../../utilities/commonUtilities', () => ({
  isValidFile: jest.fn(() => true),
}))

// Mock API
const mockRefetch = jest.fn()
const mockMutate = jest.fn()
const mockUpdateProfileAttachment = jest.fn()

jest.mock('../api', () => ({
  useAssessor: jest.fn(),
  useEditMyProfile: jest.fn(),
  updateProfileAttachment: (...args: any[]) => mockUpdateProfileAttachment(...args),
}))

const mockUseAssessor = require('../api').useAssessor
const mockUseEditMyProfile = require('../api').useEditMyProfile

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  })

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </BrowserRouter>
  )
}

describe('Profile Component', () => {
  const mockData = {
    user: {
      first_name: 'John',
      last_name: 'Doe',
      username: 'john@example.com',
      job_title: 'Software Engineer',
      profile_image: '/images/profile.jpg',
      is_admin: false,
      is_operations_head: false,
    },
    contact_number: '1234567890',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockUseAssessor.mockReturnValue({
      data: mockData,
      refetch: mockRefetch,
      isLoading: false,
    })
    
    mockUseEditMyProfile.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
    })
    
    mockUpdateProfileAttachment.mockResolvedValue({ message: 'Success' })
  })

  it('renders profile component with view mode', () => {
    renderWithProviders(<Profile />)
    
    expect(screen.getByText('My Profile')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument()
    expect(screen.getByTestId('close-icon')).toBeInTheDocument()
  })

  it('displays form field views in non-edit mode', () => {
    renderWithProviders(<Profile />)
    
    const formFields = screen.getAllByTestId('form-field-view')
    expect(formFields).toHaveLength(4)
    expect(screen.getByText('First Name')).toBeInTheDocument()
    expect(screen.getByText('Last Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Job Role')).toBeInTheDocument()
  })

  it('switches to edit mode when edit icon is clicked', () => {
    renderWithProviders(<Profile />)
    
    const editIcon = screen.getByTestId('edit-icon')
    fireEvent.click(editIcon)
    
    expect(screen.getByTestId('form-builder')).toBeInTheDocument()
    expect(screen.getByTestId('button-cancel')).toBeInTheDocument()
    expect(screen.getByTestId('button-save')).toBeInTheDocument()
  })

  it('cancels editing and resets form when cancel button is clicked', () => {
    renderWithProviders(<Profile />)
    
    // Enter edit mode
    const editIcon = screen.getByTestId('edit-icon')
    fireEvent.click(editIcon)
    
    // Verify edit mode is active
    expect(screen.getByTestId('form-builder')).toBeInTheDocument()
    
    // Click cancel
    const cancelButton = screen.getByTestId('button-cancel')
    fireEvent.click(cancelButton)
    
    // Should return to view mode
    expect(screen.queryByTestId('form-builder')).not.toBeInTheDocument()
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument()
  })

  it('submits form for Assessor domain type', async () => {
    renderWithProviders(<Profile />)
    
    // Enter edit mode
    const editIcon = screen.getByTestId('edit-icon')
    fireEvent.click(editIcon)
    
    // Submit form
    const saveButton = screen.getByTestId('button-save')
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        input: {
          first_name: 'John',
          last_name: 'Doe',
          job_role: 'Software Engineer',
        },
        domain: { domain: 'Assessor' },
      })
    })
  })

  it('submits form for non-Assessor domain type', async () => {
    // Override domain type
    jest.spyOn(require('../../../store/domainManageStore'), 'useDomainManageStore')
      .mockReturnValue({ domainType: 'Other' })
    
    renderWithProviders(<Profile />)
    
    // Enter edit mode
    const editIcon = screen.getByTestId('edit-icon')
    fireEvent.click(editIcon)
    
    // Submit form
    const saveButton = screen.getByTestId('button-save')
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        input: {
          first_name: 'John',
          last_name: 'Doe',
          username: 'john@example.com',
          job_title: 'Software Engineer',
        },
        domain: { domain: 'Other' },
      })
    })
  })

  it('handles file upload successfully', async () => {
    const { isValidFile } = require('../../../utilities/commonUtilities')
    isValidFile.mockReturnValue(true)
    
    renderWithProviders(<Profile />)
    
    const fileInput = screen.getByLabelText('', { selector: 'input[type=file]' })
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(mockUpdateProfileAttachment).toHaveBeenCalled()
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  it('handles invalid file type', async () => {
    const { isValidFile } = require('../../../utilities/commonUtilities')
    isValidFile.mockReturnValue(false)
    
    const { enqueueSnackbar } = require('../../../components/common/snackbar').useSnackbarManager()
    
    renderWithProviders(<Profile />)
    
    const fileInput = screen.getByLabelText('', { selector: 'input[type=file]' })
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(enqueueSnackbar).toHaveBeenCalledWith('Invalid file type', { variant: 'error' })
      expect(mockUpdateProfileAttachment).not.toHaveBeenCalled()
    })
  })

  it('handles file upload error', async () => {
    const { isValidFile } = require('../../../utilities/commonUtilities')
    isValidFile.mockReturnValue(true)
    
    const errorMessage = 'Upload failed'
    mockUpdateProfileAttachment.mockRejectedValue({
      response: {
        data: {
          error: { message: errorMessage },
        },
      },
    })
    
    const { enqueueSnackbar } = require('../../../components/common/snackbar').useSnackbarManager()
    
    renderWithProviders(<Profile />)
    
    const fileInput = screen.getByLabelText('', { selector: 'input[type=file]' })
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(enqueueSnackbar).toHaveBeenCalledWith(errorMessage, { variant: 'error' })
    })
  })

  it('displays admin tag when user is admin', () => {
    const adminData = {
      ...mockData,
      user: {
        ...mockData.user,
        is_admin: true,
      },
    }
    
    mockUseAssessor.mockReturnValue({
      data: adminData,
      refetch: mockRefetch,
    })
    
    renderWithProviders(<Profile />)
    
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('displays operations head tag when user is operations head', () => {
    const opsHeadData = {
      ...mockData,
      user: {
        ...mockData.user,
        is_operations_head: true,
      },
    }
    
    mockUseAssessor.mockReturnValue({
      data: opsHeadData,
      refetch: mockRefetch,
    })
    
    renderWithProviders(<Profile />)
    
    expect(screen.getByText('Operations Head')).toBeInTheDocument()
  })

  it('handles loading state for save button', () => {
    mockUseEditMyProfile.mockReturnValue({
      mutate: mockMutate,
      isLoading: true,
    })
    
    renderWithProviders(<Profile />)
    
    const editIcon = screen.getByTestId('edit-icon')
    fireEvent.click(editIcon)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('navigates back when close icon is clicked', () => {
    const mockNavigate = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate')
      .mockReturnValue(mockNavigate)
    
    renderWithProviders(<Profile />)
    
    const closeButton = screen.getByTestId('close-icon')
    fireEvent.click(closeButton)
    
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('displays default values when data is not available', () => {
    mockUseAssessor.mockReturnValue({
      data: {
        user: {
          first_name: null,
          last_name: null,
          username: null,
          job_title: null,
        },
      },
      refetch: mockRefetch,
    })
    
    renderWithProviders(<Profile />)
    
    expect(screen.getByText('--')).toBeInTheDocument()
  })

  it('handles form submission error', async () => {
    mockMutate.mockImplementation((_, options) => {
      options?.onError?.()
    })
    
    renderWithProviders(<Profile />)
    
    const editIcon = screen.getByTestId('edit-icon')
    fireEvent.click(editIcon)
    
    const saveButton = screen.getByTestId('button-save')
    fireEvent.click(saveButton)
    
    // Component should still be in edit mode after error
    expect(screen.getByTestId('form-builder')).toBeInTheDocument()
  })
})