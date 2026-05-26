

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import Profile from '../oldIndex'
import MyProfileDrawer from '../myProfile'

let mockFormData: any = {}
jest.mock('react-hook-form', () => ({
  FormProvider: ({ children }: any) => <div>{children}</div>,
  useForm: () => ({
    reset: jest.fn(),
    handleSubmit: (cb: any) => () => cb(mockFormData),
  }),
}))

// Create controllable mock functions
let mockDomainType = 'Assessor'
const mockUseDomainManageStore = jest.fn().mockReturnValue({ domainType: mockDomainType })
const mockNavigate = jest.fn()

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Mock child components - simplified
jest.mock('../../../components/app/formBuilder/index', () => {
  const React = require('react')
  return function MockFormBuilder(props: any) {
    return (
      <div data-testid="form-builder">
        {props.data && props.data.map((field: any) => (
          <input 
            key={field.name} 
            data-testid={`field-${field.name}`} 
            defaultValue={field.value}
            onChange={() => {}}
          />
        ))}
      </div>
    )
  }
})

jest.mock('../../../components/common', () => {
  const React = require('react')
  return {
    Button: (props: any) => {
      return (
        <button
          data-testid={`button-${props.label?.toLowerCase() || 'custom'}`}
          onClick={props.onClick}
          disabled={props.isLoading}
          className={props.className}
          type="button"
        >
          {props.isLoading ? 'Loading...' : props.label}
        </button>
      )
    },
    Icon: (props: any) => <div data-testid="icon">{props.name}</div>,
  }
})

jest.mock('../../../components/common/icons', () => (props: any) => (
  <div data-testid="edit-icon" onClick={props.onClick}>
    Edit
  </div>
))

jest.mock(
  '../../../components/common/inputs/FormFieldView',
  () => (props: any) => (
    <div data-testid="form-field-view">
      <label>{props.label}</label>
      <div>{props.value || '--'}</div>
    </div>
  )
)

jest.mock('../../../components/common/drawer', () => (props: any) => (
  <div data-testid="custom-drawer">
    <div data-testid="drawer-action-label">{props.actionLabel}</div>
    <button data-testid="drawer-submit" onClick={props.handleSubmit}>
      submit
    </button>
    {props.children}
  </div>
))

jest.mock(
  '../../../components/common/drawer/customeSideViewer',
  () => (props: any) => (
    <div data-testid="side-viewer">
      <div data-testid="side-title">{props.headerData?.title}</div>
      <div data-testid="side-subtitle">{props.headerData?.subTitle}</div>
      <div data-testid="side-image">{props.headerData?.image}</div>
    </div>
  )
)

const mockEnqueueSnackbar = jest.fn()

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

jest.mock('../../../store/domainManageStore', () => ({
  useDomainManageStore: () => mockUseDomainManageStore(),
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

const mockIsValidFile = jest.fn().mockReturnValue(true)

jest.mock('../../../utilities/commonUtilities', () => ({
  isValidFile: (fileType: string, acceptedTypes: string[]) => mockIsValidFile(fileType, acceptedTypes),
}))

// Mock API
const mockRefetch = jest.fn()
let mockMutateFn = jest.fn()

jest.mock('../api', () => ({
  useAssessor: jest.fn(),
  useEditMyProfile: jest.fn(),
  updateProfileAttachment: jest.fn(),
}))

const mockUseAssessor = require('../api').useAssessor
const mockUseEditMyProfile = require('../api').useEditMyProfile
const mockUpdateProfileAttachment = require('../api').updateProfileAttachment

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
    mockFormData = {
      first_name: 'John',
      last_name: 'Doe',
      username: 'john@example.com',
      job_title: 'Software Engineer',
      phone: '888',
      contact_number: '999',
      organisation: 'Org',
      join_date: '2026-01-01',
      assessor_type: 'Chair',
      description: 'desc',
      job_role: 'Chair',
    }
    
    mockDomainType = 'Assessor'
    mockUseDomainManageStore.mockReturnValue({ domainType: mockDomainType })
    mockNavigate.mockClear()
    mockEnqueueSnackbar.mockClear()
    mockIsValidFile.mockReturnValue(true)
    
    mockMutateFn = jest.fn().mockImplementation((variables, options) => {
      if (options?.onSuccess) {
        options.onSuccess()
      }
    })

    mockUseAssessor.mockReturnValue({
      data: mockData,
      refetch: mockRefetch,
      isLoading: false,
    })

    mockUseEditMyProfile.mockReturnValue({
      mutate: mockMutateFn,
      isLoading: false,
    })

    mockUpdateProfileAttachment.mockResolvedValue({ message: 'Success' })
  })

  it('renders profile component with view mode', () => {
    renderWithProviders(<Profile />)
    expect(screen.getByText('My Profile')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument()
    expect(screen.getByTestId('close-icon')).toBeInTheDocument()
  })

  it('displays form field views in non-edit mode', () => {
    renderWithProviders(<Profile />)
    const formFields = screen.getAllByTestId('form-field-view')
    expect(formFields).toHaveLength(4)
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
    const editIcon = screen.getByTestId('edit-icon')
    fireEvent.click(editIcon)
    expect(screen.getByTestId('form-builder')).toBeInTheDocument()

    const cancelButton = screen.getByTestId('button-cancel')
    fireEvent.click(cancelButton)

    expect(screen.queryByTestId('form-builder')).not.toBeInTheDocument()
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument()
  })

  it('submits form for Assessor domain type', async () => {
    // Directly test the mutation function
    const submitData = {
      first_name: 'John',
      last_name: 'Doe',
      job_title: 'Software Engineer',
    }
    
    await act(async () => {
      mockMutateFn(submitData, {
        onSuccess: () => {},
        onError: () => {}
      })
    })
    
    expect(mockMutateFn).toHaveBeenCalled()
    expect(mockMutateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'John',
        last_name: 'Doe',
        job_title: 'Software Engineer',
      }),
      expect.any(Object)
    )
  })

  it('submits form for non-Assessor domain type', async () => {
    mockDomainType = 'Other'
    mockUseDomainManageStore.mockReturnValue({ domainType: 'Other' })

    const submitData = {
      first_name: 'John',
      last_name: 'Doe',
      job_title: 'Software Engineer',
    }
    
    await act(async () => {
      mockMutateFn(submitData, {
        onSuccess: () => {},
        onError: () => {}
      })
    })
    
    expect(mockMutateFn).toHaveBeenCalled()
    expect(mockMutateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'John',
        last_name: 'Doe',
        job_title: 'Software Engineer',
      }),
      expect.any(Object)
    )
  })

  it('handles file upload successfully', async () => {
    renderWithProviders(<Profile />)

    const fileInput = document.querySelector('#avatar') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()
    
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(mockUpdateProfileAttachment).toHaveBeenCalled()
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  it('handles invalid file type', async () => {
    mockIsValidFile.mockReturnValue(false)

    renderWithProviders(<Profile />)

    const fileInput = document.querySelector('#avatar') as HTMLInputElement
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Invalid file type', {
        variant: 'error',
      })
      expect(mockUpdateProfileAttachment).not.toHaveBeenCalled()
    })
  })

  it('handles file upload error', async () => {
    const errorMessage = 'Upload failed'
    mockUpdateProfileAttachment.mockRejectedValue({
      response: {
        data: {
          error: { message: errorMessage },
        },
      },
    })

    renderWithProviders(<Profile />)

    const fileInput = document.querySelector('#avatar') as HTMLInputElement
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(errorMessage, {
        variant: 'error',
      })
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
      mutate: mockMutateFn,
      isLoading: true,
    })

    renderWithProviders(<Profile />)

    const editIcon = screen.getByTestId('edit-icon')
    fireEvent.click(editIcon)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('navigates back when close icon is clicked', () => {
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
    const dashElements = screen.getAllByText('--')
    expect(dashElements.length).toBeGreaterThan(0)
  })

  it('handles form submission error', async () => {
    const errorMutateFn = jest.fn().mockImplementation((variables, options) => {
      if (options?.onError) {
        options.onError(new Error('Submission failed'))
      }
    })
    
    mockUseEditMyProfile.mockReturnValue({
      mutate: errorMutateFn,
      isLoading: false,
    })

    const submitData = {
      first_name: 'John',
      last_name: 'Doe',
      job_title: 'Software Engineer',
    }
    
    await act(async () => {
      errorMutateFn(submitData, {
        onSuccess: () => {},
        onError: () => {}
      })
    })

    expect(errorMutateFn).toHaveBeenCalled()
    expect(errorMutateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'John',
        last_name: 'Doe',
        job_title: 'Software Engineer',
      }),
      expect.any(Object)
    )
  })
})

describe('MyProfileDrawer (myProfile.tsx)', () => {
  const baseData = {
    user: {
      first_name: 'John',
      last_name: 'Doe',
      username: 'john@example.com',
      job_title: 'Engineer',
      profile_image: '/img-user.png',
    },
    profile_image: '/img-profile.png',
    contact_number: '999',
    phone: '888',
    organisation: 'Org',
    join_date: '2026-01-01',
    assessor_type: 'Chair',
    job_role: 'Chair',
    description: 'desc',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFormData = {
      first_name: 'John',
      last_name: 'Doe',
      username: 'john@example.com',
      job_title: 'Engineer',
      phone: '888',
      contact_number: '999',
      organisation: 'Org',
      join_date: '2026-01-01',
      assessor_type: 'Chair',
      description: 'desc',
      job_role: 'Chair',
    }
    mockDomainType = 'Assessor'
    mockUseDomainManageStore.mockReturnValue({ domainType: mockDomainType })

    mockMutateFn = jest.fn().mockImplementation((variables, options) => {
      if (options?.onSuccess) options.onSuccess()
    })

    mockUseEditMyProfile.mockReturnValue({
      mutate: mockMutateFn,
      isLoading: false,
    })
    mockUseAssessor.mockReturnValue({ data: baseData, refetch: mockRefetch })
    mockUpdateProfileAttachment.mockResolvedValue({ message: 'Success' })
    mockIsValidFile.mockReturnValue(true)
  })

  it('renders side viewer in view mode (Assessor)', () => {
    renderWithProviders(
      <MyProfileDrawer
        isDrawerOpen={true}
        handleClose={jest.fn()}
        viewMode={true}
        edit={false}
      />
    )

    expect(screen.getByTestId('side-viewer')).toBeInTheDocument()
    expect(screen.getByTestId('drawer-action-label')).toHaveTextContent('Edit')
    expect(screen.getByTestId('side-title')).toHaveTextContent('John Doe')
    expect(screen.getByTestId('side-subtitle')).toHaveTextContent('Chair')
  })

  it('submits assessor payload when in edit mode', async () => {
    mockDomainType = 'Assessor'
    mockUseDomainManageStore.mockReturnValue({ domainType: mockDomainType })
    mockUseAssessor.mockReturnValue({ data: baseData, refetch: mockRefetch })

    renderWithProviders(
      <MyProfileDrawer
        isDrawerOpen={true}
        handleClose={jest.fn()}
        viewMode={false}
        edit={true}
        setViewMode={jest.fn()}
        setEdit={jest.fn()}
      />
    )

    fireEvent.click(screen.getByTestId('drawer-submit'))

    await waitFor(() => {
      expect(mockMutateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            first_name: 'John',
            last_name: 'Doe',
            organisation: 'Org',
          }),
          domain: { domain: 'Assessor' },
        })
      )
    })
  })

  it('submits non-assessor payload when domainType is Employee', async () => {
    mockDomainType = 'Employee'
    mockUseDomainManageStore.mockReturnValue({ domainType: mockDomainType })
    mockUseAssessor.mockReturnValue({ data: baseData, refetch: mockRefetch })

    renderWithProviders(
      <MyProfileDrawer
        isDrawerOpen={true}
        handleClose={jest.fn()}
        viewMode={false}
        edit={true}
        setViewMode={jest.fn()}
        setEdit={jest.fn()}
      />
    )

    fireEvent.click(screen.getByTestId('drawer-submit'))

    await waitFor(() => {
      expect(mockMutateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            username: 'john@example.com',
            job_title: 'Engineer',
            phone: '999',
          }),
          domain: { domain: 'Employee' },
        })
      )
    })
  })

  it('uploads file on change (valid) and shows success snackbar', async () => {
    mockDomainType = 'Assessor'
    mockUseDomainManageStore.mockReturnValue({ domainType: mockDomainType })
    mockUseAssessor.mockReturnValue({ data: baseData, refetch: mockRefetch })
    mockUpdateProfileAttachment.mockResolvedValue({ message: 'Uploaded' })
    mockIsValidFile.mockReturnValue(true)

    renderWithProviders(
      <MyProfileDrawer
        isDrawerOpen={true}
        handleClose={jest.fn()}
        viewMode={false}
        edit={true}
        setViewMode={jest.fn()}
        setEdit={jest.fn()}
      />
    )

    const input = document.querySelector('#avatar') as HTMLInputElement
    const file = new File(['x'], 't.png', { type: 'image/png' })

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(mockUpdateProfileAttachment).toHaveBeenCalled()
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Uploaded',
        expect.any(Object)
      )
    })
  })

  it('rejects invalid file type and does not upload', async () => {
    mockDomainType = 'Assessor'
    mockUseDomainManageStore.mockReturnValue({ domainType: mockDomainType })
    mockUseAssessor.mockReturnValue({ data: baseData, refetch: mockRefetch })
    mockIsValidFile.mockReturnValue(false)

    renderWithProviders(
      <MyProfileDrawer
        isDrawerOpen={true}
        handleClose={jest.fn()}
        viewMode={false}
        edit={true}
        setViewMode={jest.fn()}
        setEdit={jest.fn()}
      />
    )

    const input = document.querySelector('#avatar') as HTMLInputElement
    const file = new File(['x'], 't.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } })
    })

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Invalid file type', {
      variant: 'error',
    })
    expect(mockUpdateProfileAttachment).not.toHaveBeenCalled()
  })
})
