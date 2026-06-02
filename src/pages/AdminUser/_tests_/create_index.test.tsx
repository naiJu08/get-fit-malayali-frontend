import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Create from '../create/index'

const mockCreateMutation = jest.fn()
const mockUpdateMutation = jest.fn()
const mockCreateSuccess = { current: () => undefined }
const mockUpdateSuccess = { current: () => undefined }
const mockReset = jest.fn()
const mockSetValue = jest.fn()
const mockSetError = jest.fn()
const mockHandleClose = jest.fn()
const mockHandleRefresh = jest.fn()
const mockSetViewMode = jest.fn()
const mockSetEdit = jest.fn()
const mockSetEditViewIndicator = jest.fn()
const mockValues: Record<string, any> = {}
let mockSubmitDetails: Record<string, any> = {}

const mockMethods = {
  reset: mockReset,
  setValue: mockSetValue,
  setError: mockSetError,
  getValues: jest.fn((name?: string) => (name ? mockValues[name] : mockValues)),
  watch: jest.fn((name: string) => mockValues[name]),
  handleSubmit: (callback: (details: Record<string, any>) => Promise<void>) => () =>
    callback(mockSubmitDetails),
}

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => jest.fn()),
}))

jest.mock('react-hook-form', () => ({
  FormProvider: ({ children }: any) => <>{children}</>,
  useForm: () => mockMethods,
}))

jest.mock('../api', () => ({
  useCreateAdmin: (onSuccess: () => void) => {
    mockCreateSuccess.current = onSuccess
    return { mutateAsync: mockCreateMutation, isLoading: false }
  },
  useUpdateAdmin: (onSuccess: () => void) => {
    mockUpdateSuccess.current = onSuccess
    return { mutateAsync: mockUpdateMutation, isLoading: false }
  },
}))

jest.mock('../../../components/common', () => ({
  DialogModal: ({
    isOpen,
    title,
    body,
    onSubmit,
    onClose,
    secondaryAction,
    actionLabel,
    secondaryActionLabel,
  }: any) =>
    isOpen ? (
      <div>
        <div>{title}</div>
        <div>{body}</div>
        <button type="button" onClick={onSubmit}>
          {actionLabel}
        </button>
        <button type="button" onClick={secondaryAction || onClose}>
          {secondaryActionLabel || 'Close'}
        </button>
      </div>
    ) : null,
}))

jest.mock('../../../components/app/formBuilder', () => ({
  __esModule: true,
  default: ({ data }: any) => (
    <div>
      {data.map((field: any) => {
        field.getData?.()
        return <span key={field.name}>{field.label}</span>
      })}
    </div>
  ),
}))

jest.mock('../../../components/app/alertBox/infoBox', () => ({
  __esModule: true,
  default: ({ content }: any) => <div>{content}</div>,
}))

jest.mock('../../../components/common/drawer/customeSideViewer', () => ({
  __esModule: true,
  default: ({ headerData, contentData }: any) => (
    <div>
      <div>{headerData.title}</div>
      {contentData.map((item: any) => (
        <span key={item.title}>{item.title}</span>
      ))}
    </div>
  ),
}))

jest.mock('../../../utilities/format', () => ({
  humanizeDatetime: () => 'formatted date',
}))

const renderCreate = (props: Record<string, any> = {}) =>
  render(
    <Create
      isDrawerOpen
      handleClose={mockHandleClose}
      handleRefresh={mockHandleRefresh}
      activeRole="user"
      {...props}
    />
  )

describe('Create Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.keys(mockValues).forEach((key) => delete mockValues[key])
    mockSubmitDetails = {}
    mockCreateMutation.mockResolvedValue({ message: 'created' })
    mockUpdateMutation.mockResolvedValue({ message: 'updated' })
    mockMethods.getValues.mockImplementation((name?: string) =>
      name ? mockValues[name] : mockValues
    )
    mockMethods.watch.mockImplementation((name: string) => mockValues[name])
    mockSetValue.mockImplementation((name: string, value: any) => {
      mockValues[name] = value
    })
  })

  it('creates a client with normalized values', async () => {
    mockSubmitDetails = {
      name: 'Test Client',
      email: 'client@example.com',
      password: 'secret',
      password_confirmation: 'secret',
      phone: '9999999999',
      role: 'client',
      gender: 'Female',
      date_of_birth: new Date('2000-01-02'),
      height: '170',
      weight: '65',
      lifestyle: { name: 'Active lifestyle' },
      goal: 'Wellness',
      food_preferences: { id: 'Vegetarian' },
      medical_conditions: [{ name: 'PCOD' }, { name: 'Other' }],
      other_medical_condition: 'Thyroid',
      food_allergies: [{ value: 'Peanuts' }, { id: 'Gluten' }],
      state: 'Kerala',
      ethnicity: 'Indian',
      status: 'Active',
    }

    renderCreate()
    expect(screen.getByText('Create Client')).toBeInTheDocument()
    expect(screen.getByText('Medical Conditions')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(mockCreateMutation).toHaveBeenCalledWith({
        user: expect.objectContaining({
          role: 3,
          gender: 1,
          date_of_birth: '2000-01-02',
          height: 170,
          weight: 65,
          lifestyle: 'Active lifestyle',
          food_preferences: 'Vegetarian',
          medical_conditions: 'PCOD,Thyroid',
          food_allergies: 'Peanuts,Gluten',
          status: 0,
        }),
      })
    })

    mockCreateSuccess.current()
    expect(mockHandleRefresh).toHaveBeenCalled()
    expect(mockHandleClose).toHaveBeenCalled()
  })

  it('prefills and updates an existing nutritionist', async () => {
    mockSubmitDetails = {
      name: 'Nutritionist',
      email: 'nutritionist@example.com',
      phone: '8888888888',
      role_id: { id: '2' },
      gender: { name: 'Other' },
      date_of_birth: '1995-05-05',
      status: { name: 'Inactive' },
    }

    renderCreate({
      activeRole: 'nutritionist',
      edit: true,
      rowData: {
        user: {
          id: 'user-2',
          first_name: 'Test',
          last_name: 'Nutritionist',
          username: 'nutritionist@example.com',
          phone: '8888888888',
          group: { id: 2, name: 'Nutritionist' },
          gender: 'o',
          date_of_birth: '1995-05-05',
          medical_conditions: 'Diabetes,Custom issue',
          food_allergies: ['Gluten'],
          state: 'kerala',
          ethnicity: 'INDIAN',
          status: 'suspended',
        },
      },
    })

    expect(screen.getByText('Edit Nutritionist')).toBeInTheDocument()
    expect(screen.queryByText('Height (cm)')).not.toBeInTheDocument()
    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'Nutritionist',
        gender: 'Other',
        state: 'Kerala',
        ethnicity: 'Indian',
        status: 'Inactive',
      })
    )

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(mockUpdateMutation).toHaveBeenCalledWith({
        id: 'user-2',
        data: {
          user: expect.objectContaining({ role: 2, gender: 2, status: 1 }),
        },
      })
    })
  })

  it('switches from view mode into edit mode', () => {
    renderCreate({
      viewMode: true,
      setViewMode: mockSetViewMode,
      setEdit: mockSetEdit,
      setEditViewIndicator: mockSetEditViewIndicator,
      rowData: {
        user: {
          first_name: 'View',
          last_name: 'Client',
          username: 'view@example.com',
          group: { name: 'Client' },
        },
      },
    })

    expect(screen.getByText('Client Details')).toBeInTheDocument()
    expect(screen.getByText('Communications')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Edit'))

    expect(mockSetViewMode).toHaveBeenCalledWith(false)
    expect(mockSetEdit).toHaveBeenCalledWith(true)
    expect(mockSetEditViewIndicator).toHaveBeenCalledWith(true)
  })

  it('falls back safely for unknown edit role and gender values', () => {
    renderCreate({
      edit: true,
      rowData: {
        user: {
          id: 'user-unknown',
          name: 'Unknown Client',
          role: 99,
          gender: 'unknown',
        },
      },
    })

    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({
        role: '',
        gender: 'unknown',
      })
    )
  })

  it('sets field errors returned by the API', async () => {
    mockSubmitDetails = {
      email: 'used@example.com',
      phone: '1111111111',
      role_id: 3,
      gender: 0,
    }
    mockCreateMutation.mockRejectedValue({
      response: {
        status: 422,
        data: {
          errors: {
            phone: ['Phone has already been taken.'],
            email: ['Email has already been taken.'],
          },
        },
      },
    })

    renderCreate()
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(
        'phone',
        expect.objectContaining({ message: 'Phone has already been taken.' }),
        { shouldFocus: true }
      )
      expect(mockSetError).toHaveBeenCalledWith(
        'email',
        expect.objectContaining({ message: 'Email has already been taken.' }),
        { shouldFocus: false }
      )
    })
  })

  it('shows the custom medical condition field and keeps only None when selected', async () => {
    const { rerender } = renderCreate()
    mockValues.medical_conditions = [{ id: 'Other', name: 'Other' }]
    rerender(
      <Create
        isDrawerOpen
        handleClose={mockHandleClose}
        handleRefresh={mockHandleRefresh}
        activeRole="user"
      />
    )

    expect(
      await screen.findByText('Specify Medical Condition')
    ).toBeInTheDocument()

    mockValues.medical_conditions = [
      { id: 'None', name: 'None' },
      { id: 'PCOD', name: 'PCOD' },
    ]
    rerender(
      <Create
        isDrawerOpen
        handleClose={mockHandleClose}
        handleRefresh={mockHandleRefresh}
        activeRole="user"
      />
    )

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith(
        'medical_conditions',
        [{ id: 'None', name: 'None' }],
        { shouldValidate: true, shouldDirty: true }
      )
    })
  })

  it('closes the medical-conditions dropdown when None is selected with other values', async () => {
    const blurSpy = jest.fn()
    const toggleClick = jest.fn()
    const keydownSpy = jest.fn()
    const container = document.createElement('div')
    container.setAttribute('data-testid', 'medical_conditions')

    const input = document.createElement('input')
    input.blur = blurSpy
    input.addEventListener('keydown', keydownSpy)

    const toggle = document.createElement('button')
    toggle.setAttribute('aria-label', 'toggle')
    toggle.onclick = toggleClick

    const dropdown = document.createElement('div')
    dropdown.className = 'qbs-autocomplete-suggestions'

    container.appendChild(input)
    container.appendChild(toggle)
    container.appendChild(dropdown)
    document.body.appendChild(container)

    mockValues.medical_conditions = [
      { id: 'None', name: 'None' },
      { id: 'PCOD', name: 'PCOD' },
    ]

    const { rerender, unmount } = renderCreate()
    rerender(
      <Create
        isDrawerOpen
        handleClose={mockHandleClose}
        handleRefresh={mockHandleRefresh}
        activeRole="user"
      />
    )

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith(
        'medical_conditions',
        [{ id: 'None', name: 'None' }],
        { shouldValidate: true, shouldDirty: true }
      )
      expect(toggleClick).toHaveBeenCalled()
      expect(blurSpy).toHaveBeenCalled()
      expect(keydownSpy).toHaveBeenCalled()
    })

    unmount()
    document.body.removeChild(container)
  })

  it('uses fallback role and strips Other when no custom medical condition is provided', async () => {
    mockSubmitDetails = {
      name: 'Fallback Client',
      email: 'fallback@example.com',
      phone: '7777777777',
      role: { name: 'client' },
      gender: { id: 'gender', name: 'Male' },
      date_of_birth: '1999-09-09',
      lifestyle: 'Mostly sitting',
      food_preferences: 'Vegan',
      medical_conditions: [{ name: 'Other' }],
      food_allergies: [{ id: 'Shellfish' }],
      status: { id: '0' },
    }

    renderCreate()
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(mockCreateMutation).toHaveBeenCalledWith({
        user: expect.objectContaining({
          role: 3,
          gender: 0,
          lifestyle: 'Mostly sitting',
          food_preferences: 'Vegan',
          medical_conditions: '',
          food_allergies: 'Shellfish',
          status: 0,
        }),
      })
    })
  })

  it('uses the duplicate-email fallback for conflict responses', async () => {
    mockSubmitDetails = { role: 'admin', gender: 'Male' }
    mockCreateMutation.mockRejectedValue({
      response: { status: 409, data: {} },
    })

    renderCreate()
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(
        'email',
        {
          type: 'server',
          message: 'Email has already been taken.',
        },
        { shouldFocus: true }
      )
    })
  })

  it('sets a generic server error when no field matches', async () => {
    mockSubmitDetails = {
      role: { name: 'nutritionist' },
      gender: { id: '1' },
      medical_conditions: [{ name: 'Other' }],
      food_allergies: ['Latex Fruit Syndrome'],
    }
    mockCreateMutation.mockRejectedValue({
      data: { detail: 'Unable to save client.' },
    })

    renderCreate()
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(
        'email',
        {
          type: 'server',
          message: 'Unable to save client.',
        },
        { shouldFocus: true }
      )
    })
  })

  it('extracts nested server field errors from array-based API responses', async () => {
    mockSubmitDetails = {
      email: 'nested@example.com',
      phone: '2222222222',
      role_id: { name: 'nutritionist' },
      gender: { name: 'Female', id: 'gender' },
    }
    mockCreateMutation.mockRejectedValue({
      response: {
        data: {
          error: {
            errors: [
              { contact: [{ phone: ['Phone number is invalid'] }] },
              { email: [{ message: 'Email is already registered' }] },
            ],
          },
        },
      },
    })

    renderCreate()
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(
        'phone',
        expect.objectContaining({ message: 'Phone number is invalid' }),
        { shouldFocus: true }
      )
      expect(mockSetError).toHaveBeenCalledWith(
        'email',
        expect.objectContaining({ message: 'Email is already registered' }),
        { shouldFocus: false }
      )
    })
  })

  it('resets and closes from the cancel action', () => {
    renderCreate()
    fireEvent.click(screen.getByText('Cancel'))

    expect(mockReset).toHaveBeenCalled()
    expect(mockHandleClose).toHaveBeenCalled()
  })
})
