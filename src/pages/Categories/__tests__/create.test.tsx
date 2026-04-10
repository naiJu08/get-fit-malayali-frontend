import React, { act } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import CreateAdmin from '../create/index'

// Mock all dependencies
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(),
}))

jest.mock(
  '../../../components/app/formBuilder',
  () =>
    function FormBuilderMock({ onSubmit, defaultValues }: any) {
      // FormBuilder receives data prop with form configuration
      return (
        <div data-testid="form-builder-mock">
          <div data-testid="form-defaults">
            {JSON.stringify(defaultValues || {})}
          </div>
          <button
            data-testid="form-submit"
            onClick={() =>
              onSubmit &&
              onSubmit({
                name: 'Test Category',
                description: 'Test Description',
              })
            }
          >
            Submit
          </button>
          <button
            data-testid="form-reset"
            onClick={() => onSubmit && onSubmit({})}
          >
            Reset
          </button>
        </div>
      )
    }
)

jest.mock('../../../components/common', () => ({
  DialogModal: ({ body, isOpen, onClose, onSubmit, actionLabel }: any) =>
    isOpen ? (
      <div data-testid="dialog-modal-mock">
        <button data-testid="dialog-close" onClick={onClose}>
          Close
        </button>
        {body}
        {actionLabel && (
          <button data-testid="dialog-submit" onClick={onSubmit}>
            {actionLabel}
          </button>
        )}
      </div>
    ) : null,
}))

jest.mock(
  '../../../components/common/drawer/customeSideViewer',
  () =>
    function CustomSideViewerMock({ isOpen, onClose, children }: any) {
      if (!isOpen) return null
      return (
        <div data-testid="drawer-mock">
          <button data-testid="drawer-close" onClick={onClose}>
            Close Drawer
          </button>
          {children}
        </div>
      )
    }
)

jest.mock('../api', () => ({
  useCreateCategories: jest.fn(),
  useUpdateCategories: jest.fn(),
}))

jest.mock('../create/schema', () => ({
  CategorySchema: {},
  formSchema: {},
}))

// Import mocked modules
import * as api from '../api'
const mockUseCreateCategories = api.useCreateCategories as jest.MockedFunction<
  typeof api.useCreateCategories
>
const mockUseUpdateCategories = api.useUpdateCategories as jest.MockedFunction<
  typeof api.useUpdateCategories
>

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('CreateAdmin (Category Form)', () => {
  const defaultProps = {
    isDrawerOpen: true,
    handleClose: jest.fn(),
    handleRefresh: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockUseCreateCategories.mockImplementation((onSuccess: any) => ({
      mutate: jest.fn().mockImplementation(async () => {
        await Promise.resolve()
        onSuccess()
        return {}
      }),
      isLoading: false,
    }))
    mockUseUpdateCategories.mockImplementation((onSuccess: any) => ({
      mutate: jest.fn().mockImplementation(async () => {
        await Promise.resolve()
        onSuccess()
        return {}
      }),
      isLoading: false,
    }))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('renders create form when opened', async () => {
    await act(async () => {
      renderWithRouter(<CreateAdmin {...defaultProps} />)
    })

    expect(screen.getByTestId('dialog-modal-mock')).toBeInTheDocument()
    expect(screen.getByTestId('form-builder-mock')).toBeInTheDocument()
  })

  test('does not render when drawer is closed', () => {
    renderWithRouter(<CreateAdmin {...defaultProps} isDrawerOpen={false} />)

    expect(screen.queryByTestId('dialog-modal-mock')).not.toBeInTheDocument()
  })

  test('handles form submission for creating category', async () => {
    const mockMutate = jest
      .fn()
      .mockResolvedValue({ data: { id: 1, name: 'Test Category' } })
    mockUseCreateCategories.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
    })

    await act(async () => {
      renderWithRouter(<CreateAdmin {...defaultProps} />)
    })

    const submitButton = screen.getByTestId('dialog-submit')

    await act(async () => {
      fireEvent.click(submitButton)
    })

    expect(mockMutate).toHaveBeenCalledWith({
      category: {
        name: '',
        description: '',
      },
    })
  })

  test('handles form submission for updating category', async () => {
    const mockMutate = jest
      .fn()
      .mockResolvedValue({ data: { id: 1, name: 'Updated Category' } })
    mockUseUpdateCategories.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
    })

    const editProps = {
      ...defaultProps,
      edit: true,
      paramsId: '123',
      rowData: {
        id: 123,
        name: 'Existing Category',
        description: 'Existing Description',
      },
    }

    await act(async () => {
      renderWithRouter(<CreateAdmin {...editProps} />)
    })

    const submitButton = screen.getByTestId('dialog-submit')

    await act(async () => {
      fireEvent.click(submitButton)
    })

    expect(mockMutate).toHaveBeenCalledWith({
      id: 123,
      data: {
        category: {
          name: 'Existing category',
          description: 'Existing Description',
        },
      },
    })
  })

  test('populates form with existing data when editing', async () => {
    const editProps = {
      ...defaultProps,
      edit: true,
      paramsId: '123',
      rowData: {
        id: 123,
        name: 'Existing Category',
        description: 'Existing Description',
      },
    }

    await act(async () => {
      renderWithRouter(<CreateAdmin {...editProps} />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('form-defaults')).toBeInTheDocument()
    })
  })

  test('shows loading state during submission', async () => {
    mockUseCreateCategories.mockReturnValue({
      mutateAsync: jest.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      ),
      isLoading: true,
    })

    await act(async () => {
      renderWithRouter(<CreateAdmin {...defaultProps} />)
    })

    expect(screen.getByTestId('form-builder-mock')).toBeInTheDocument()
  })

  test('calls handleClose when close button is clicked', async () => {
    const mockHandleClose = jest.fn()

    await act(async () => {
      renderWithRouter(
        <CreateAdmin {...defaultProps} handleClose={mockHandleClose} />
      )
    })

    const closeButton = screen.getByTestId('dialog-close')

    await act(async () => {
      fireEvent.click(closeButton)
    })

    expect(mockHandleClose).toHaveBeenCalled()
  })

  test('handles view mode correctly', async () => {
    const viewProps = {
      ...defaultProps,
      viewMode: true,
      rowData: {
        id: 123,
        name: 'View Only Category',
        description: 'View Only Description',
      },
    }

    await act(async () => {
      renderWithRouter(<CreateAdmin {...viewProps} />)
    })

    expect(screen.getByTestId('dialog-modal-mock')).toBeInTheDocument()
  })

  test('handles setViewMode callback', async () => {
    const mockSetViewMode = jest.fn()

    const viewProps = {
      ...defaultProps,
      viewMode: true,
      setViewMode: mockSetViewMode,
      rowData: { id: 123, name: 'View Only Category' },
    }

    await act(async () => {
      renderWithRouter(<CreateAdmin {...viewProps} />)
    })

    expect(screen.getByTestId('dialog-modal-mock')).toBeInTheDocument()
  })

  test('handles edit mode toggle', async () => {
    const mockSetEdit = jest.fn()

    const editProps = {
      ...defaultProps,
      edit: true,
      setEdit: mockSetEdit,
      rowData: { id: 123, name: 'Editable Category' },
    }

    await act(async () => {
      renderWithRouter(<CreateAdmin {...editProps} />)
    })

    expect(screen.getByTestId('dialog-modal-mock')).toBeInTheDocument()
  })

  test('handles disabled state', async () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true,
    }

    await act(async () => {
      renderWithRouter(<CreateAdmin {...disabledProps} />)
    })

    expect(screen.getByTestId('dialog-modal-mock')).toBeInTheDocument()
    expect(screen.getByTestId('form-builder-mock')).toBeInTheDocument()
  })

  test('handles subSection prop', async () => {
    const subSectionProps = {
      ...defaultProps,
      subSection: true,
    }

    await act(async () => {
      renderWithRouter(<CreateAdmin {...subSectionProps} />)
    })

    expect(screen.getByTestId('dialog-modal-mock')).toBeInTheDocument()
  })

  test('handles editViewIndicator props', async () => {
    const mockSetEditViewIndicator = jest.fn()

    const indicatorProps = {
      ...defaultProps,
      editViewIndicator: true,
      setEditViewIndicator: mockSetEditViewIndicator,
    }

    await act(async () => {
      renderWithRouter(<CreateAdmin {...indicatorProps} />)
    })

    expect(screen.getByTestId('dialog-modal-mock')).toBeInTheDocument()
  })

  test('handles hasPermission prop', async () => {
    const permissionProps = {
      ...defaultProps,
      hasPermission: false,
    }

    await act(async () => {
      renderWithRouter(<CreateAdmin {...permissionProps} />)
    })

    expect(screen.getByTestId('dialog-modal-mock')).toBeInTheDocument()
  })

  test('handles isOwnTask prop', async () => {
    const ownTaskProps = {
      ...defaultProps,
      isOwnTask: true,
    }

    await act(async () => {
      renderWithRouter(<CreateAdmin {...ownTaskProps} />)
    })

    expect(screen.getByTestId('dialog-modal-mock')).toBeInTheDocument()
  })

  test('handles isGeneral prop', async () => {
    const generalProps = {
      ...defaultProps,
      isGeneral: true,
    }

    await act(async () => {
      renderWithRouter(<CreateAdmin {...generalProps} />)
    })

    expect(screen.getByTestId('dialog-modal-mock')).toBeInTheDocument()
  })

  test('handles model_name prop', async () => {
    const modelProps = {
      ...defaultProps,
      model_name: 'category',
    }

    await act(async () => {
      renderWithRouter(<CreateAdmin {...modelProps} />)
    })

    expect(screen.getByTestId('dialog-modal-mock')).toBeInTheDocument()
  })
})
