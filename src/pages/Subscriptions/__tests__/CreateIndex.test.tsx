import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CreateAdmin from '../create'

const mockCreateMutate = jest.fn()
const mockUpdateMutate = jest.fn()
const mockReset = jest.fn()
let mockFormValues: any = {}
let mockCreateSuccess: (() => void) | undefined
let mockUpdateSuccess: (() => void) | undefined

jest.mock('react-hook-form', () => ({
  FormProvider: ({ children }: any) => <div data-testid="form-provider">{children}</div>,
  useForm: jest.fn(() => ({
    reset: mockReset,
    handleSubmit: (callback: any) => () => callback(mockFormValues),
  })),
}))

jest.mock('../../../components/common', () => ({
  DialogModal: ({
    isOpen,
    title,
    body,
    onClose,
    onSubmit,
    secondaryAction,
    secondaryActionLabel,
    actionLabel,
    actionLoader,
  }: any) =>
    isOpen ? (
      <section data-testid={`dialog-${String(title).toLowerCase().replace(/\s+/g, '-')}`}>
        <h2>{title}</h2>
        <div data-testid="dialog-body">{body}</div>
        {actionLabel && (
          <button type="button" onClick={onSubmit} data-testid="dialog-submit">
            {actionLoader ? 'Loading' : actionLabel}
          </button>
        )}
        <button type="button" onClick={secondaryAction || onClose} data-testid="dialog-secondary">
          {secondaryActionLabel || 'Close'}
        </button>
        <button type="button" onClick={onClose} data-testid="dialog-close">
          X
        </button>
      </section>
    ) : null,
}))

jest.mock('../../../components/app/alertBox/infoBox', () => {
  const MockInfoBox = ({ content }: { content: string }) => (
    <div data-testid="info-box">{content}</div>
  )

  return MockInfoBox
})

jest.mock('../../../components/app/formBuilder', () => {
  const MockFormBuilder = ({ data, edit, spacing }: any) => (
    <div data-testid="form-builder" data-edit={String(edit)} data-spacing={String(spacing)}>
      {data.map((field: any) => (
        <div data-testid={`field-${field.name}`} key={field.name}>
          {field.label}:{field.type}
          {field.required ? ':required' : ''}
        </div>
      ))}
    </div>
  )

  return MockFormBuilder
})

jest.mock('../../../components/common/drawer/customeSideViewer', () => {
  const MockCustomeSideViewer = ({ headerData, contentData }: any) => (
    <div data-testid="side-viewer">
      <div data-testid="viewer-title">{headerData?.title}</div>
      <div data-testid="viewer-subtitle">{headerData?.subTitle}</div>
      {contentData.map((item: any) => (
        <div data-testid={`viewer-${item.title}`} key={item.title}>
          {item.title}:{Array.isArray(item.value) ? item.value[0]?.value : item.value}
        </div>
      ))}
    </div>
  )

  return MockCustomeSideViewer
})

jest.mock('../../../utilities/format', () => ({
  humanizeDatetime: (value: any) => (value ? `humanized-${value}` : '- -'),
}))

jest.mock('../api', () => ({
  useCreateAdmin: (onSuccess: () => void) => {
    mockCreateSuccess = onSuccess
    return { mutate: mockCreateMutate, isLoading: false }
  },
  useUpdateAdmin: (onSuccess: () => void) => {
    mockUpdateSuccess = onSuccess
    return { mutate: mockUpdateMutate, isLoading: false }
  },
}))

describe('Subscriptions create drawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFormValues = {
      user_id: '42',
      plan_id: { id: '7' },
      start_date: new Date('2026-05-21T00:00:00Z'),
      end_date: new Date('2026-06-21T00:00:00Z'),
      status: { id: '2', name: 'Paused' },
      notes: 'Pause during travel',
    }
    mockCreateSuccess = undefined
    mockUpdateSuccess = undefined
  })

  it('does not render the drawer when closed', () => {
    render(
      <CreateAdmin
        isDrawerOpen={false}
        handleClose={jest.fn()}
      />
    )

    expect(screen.queryByText('Create Subscription')).not.toBeInTheDocument()
  })

  it('renders create form fields and submits a create payload', () => {
    render(
      <CreateAdmin
        isDrawerOpen
        handleClose={jest.fn()}
      />
    )

    expect(screen.getByText('Create Subscription')).toBeInTheDocument()
    expect(screen.getByTestId('form-builder')).toBeInTheDocument()
    expect(screen.getByTestId('field-user_id')).toHaveTextContent(
      'User ID:text:required'
    )
    expect(screen.getByTestId('field-plan_id')).toHaveTextContent(
      'Plan ID:text:required'
    )
    expect(screen.getByTestId('field-status')).toHaveTextContent(
      'Status:custom_select:required'
    )

    fireEvent.click(screen.getByTestId('dialog-submit'))

    expect(mockCreateMutate).toHaveBeenCalledWith({
      subscription: {
        user_id: 42,
        plan_id: 7,
        start_date: '2026-05-21',
        end_date: '2026-06-21',
        status: 2,
        notes: 'Pause during travel',
      },
    })
    expect(mockUpdateMutate).not.toHaveBeenCalled()
  })

  it('converts invalid string ids to zero and defaults missing notes', () => {
    mockFormValues = {
      user_id: 'abc',
      plan_id: { value: 'bad' },
      start_date: '2026-05-21',
      end_date: '2026-06-21',
      status: 'active',
      notes: undefined,
    }

    render(<CreateAdmin isDrawerOpen handleClose={jest.fn()} />)
    fireEvent.click(screen.getByTestId('dialog-submit'))

    expect(mockCreateMutate).toHaveBeenCalledWith({
      subscription: {
        user_id: 0,
        plan_id: 0,
        start_date: '2026-05-21',
        end_date: '2026-06-21',
        status: 0,
        notes: '',
      },
    })
  })

  it('resets edit form from row data and submits an update payload', async () => {
    const rowData = {
      id: 5,
      subscription: {
        user_id: 12,
        plan_id: 13,
        start_date: '2026-05-01',
        end_date: '2026-05-31',
        status: 1,
        notes: 'Existing notes',
      },
    }

    render(
      <CreateAdmin
        isDrawerOpen
        edit
        rowData={rowData}
        handleClose={jest.fn()}
      />
    )

    expect(screen.getByText('Edit Subscription')).toBeInTheDocument()
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith(rowData.subscription)
    })

    fireEvent.click(screen.getByTestId('dialog-submit'))

    expect(mockUpdateMutate).toHaveBeenCalledWith({
      id: 5,
      data: {
        subscription: {
          user_id: 42,
          plan_id: 7,
          start_date: '2026-05-21',
          end_date: '2026-06-21',
          status: 2,
          notes: 'Pause during travel',
        },
      },
    })
    expect(mockCreateMutate).not.toHaveBeenCalled()
  })

  it('resets edit form from flat row data when subscription wrapper is missing', async () => {
    const rowData = {
      id: 6,
      user_id: 22,
      plan_id: 33,
      start_date: '2026-07-01',
      end_date: '2026-07-31',
      status: 0,
      notes: 'Flat notes',
    }

    render(
      <CreateAdmin
        isDrawerOpen
        edit
        rowData={rowData}
        handleClose={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        user_id: 22,
        plan_id: 33,
        start_date: '2026-07-01',
        end_date: '2026-07-31',
        status: 0,
        notes: 'Flat notes',
      })
    })
  })

  it('clears the form and closes from cancel or close actions', () => {
    const handleClose = jest.fn()

    render(<CreateAdmin isDrawerOpen handleClose={handleClose} />)

    fireEvent.click(screen.getByTestId('dialog-secondary'))

    expect(mockReset).toHaveBeenCalledWith({
      user_id: undefined,
      plan_id: undefined,
      start_date: undefined,
      end_date: undefined,
      status: 0,
      notes: '',
    })
    expect(handleClose).toHaveBeenCalled()
  })

  it('refreshes and closes after successful create or update callbacks', () => {
    const handleClose = jest.fn()
    const handleRefresh = jest.fn()

    render(
      <CreateAdmin
        isDrawerOpen
        handleClose={handleClose}
        handleRefresh={handleRefresh}
      />
    )

    mockCreateSuccess?.()

    expect(handleRefresh).toHaveBeenCalled()
    expect(handleClose).toHaveBeenCalled()
    expect(mockReset).toHaveBeenCalledWith({
      user_id: undefined,
      plan_id: undefined,
      start_date: '',
      end_date: '',
      status: 'active',
      notes: '',
    })

    mockUpdateSuccess?.()
    expect(handleRefresh).toHaveBeenCalledTimes(2)
  })

  it('renders view mode with side viewer and no save action', () => {
    const rowData = {
      id: 8,
      plan_name: 'Premium Plan',
      user: {
        username: 'anna@example.com',
        group: { name: 'Customer' },
        last_login: '2026-05-20T10:00:00Z',
        datetime_created: '2026-05-01T10:00:00Z',
        datetime_updated: '2026-05-02T10:00:00Z',
      },
    }

    render(
      <CreateAdmin
        isDrawerOpen
        viewMode
        rowData={rowData}
        handleClose={jest.fn()}
      />
    )

    expect(screen.getByText('Subscription Details')).toBeInTheDocument()
    expect(screen.queryByTestId('dialog-submit')).not.toBeInTheDocument()
    expect(screen.getByTestId('viewer-title')).toHaveTextContent(
      'Subscription #8'
    )
    expect(screen.getByTestId('viewer-subtitle')).toHaveTextContent(
      'Premium Plan'
    )
    expect(screen.getByTestId('viewer-Communications')).toHaveTextContent(
      'anna@example.com'
    )
    expect(screen.getByTestId('viewer-Job Role')).toHaveTextContent('Customer')
    expect(screen.getByTestId('viewer-Last Login')).toHaveTextContent(
      'humanized-2026-05-20T10:00:00Z'
    )
  })
})
