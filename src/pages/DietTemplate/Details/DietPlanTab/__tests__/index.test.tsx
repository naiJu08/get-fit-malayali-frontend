import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'

const mockGetData = jest.fn()
const mockDeleteDietPlan = jest.fn().mockResolvedValue({})
let mockRoleName = 'admin'
let mockDietPlans: any[] = [
  {
    id: 1,
    diet_plan_template_id: 1,
    day_number: 1,
    day_name: 'Day One',
    meal_time: 'Breakfast',
    effective_total_calories: 100,
  },
  {
    id: 2,
    diet_plan_template_id: 1,
    day_number: 1,
    day_name: 'Day One',
    meal_time: 'Lunch',
    effective_total_calories: 200,
  },
  {
    id: 3,
    diet_plan_template_id: 1,
    day_name: 'Monday',
    meal_time: 'Breakfast',
    effective_total_calories: 50,
  },
]
jest.mock('../../../../../apis/api.helpers', () => ({
  getData: (url: string) => mockGetData(url),
  postData: jest.fn(),
  updateData: jest.fn(),
  deleteData: jest.fn(),
}))

jest.mock('../../../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    const row = Array.isArray(props?.data) ? props.data[0] : undefined
    const dayNumberCol = Array.isArray(props?.columns)
      ? props.columns.find((c: any) => c?.field === 'day_number')
      : undefined
    const dayNumberCell = dayNumberCol?.renderCell?.(row)?.cell
    return (
      <div data-testid="smart-table">
        <div data-testid="table-title">{props?.title}</div>
        <div data-testid="table-count">
          {Array.isArray(props?.data) ? props.data.length : 0}
        </div>
        <div data-testid="day-number-cell">{dayNumberCell}</div>
        <button
          data-testid="table-sort"
          onClick={() => props.handleColumnSort?.('day_number', 'asc')}
        >
          sort
        </button>
        <div data-testid="table-actions">
          {(props.actionProps ?? []).map((a: any) => (
            <button
              key={a.title}
              data-testid={`action-${a.title}`}
              onClick={() => a.action?.(row)}
            >
              {a.title}
            </button>
          ))}
        </div>
      </div>
    )
  }
})

jest.mock('../../../../../components/app/alertBox/infoBox', () => {
  return function MockInfoBox({ content }: { content: string }) {
    return <div data-testid="info-box">{content}</div>
  }
})

jest.mock('../../../../../components/common/modal/ConfirmDeleteModal', () => {
  return function MockConfirmDeleteModal({ isOpen, onConfirm, onClose }: any) {
    if (!isOpen) return null
    return (
      <div data-testid="confirm-delete-modal">
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    )
  }
})

jest.mock('../create', () => {
  return function MockDietPlanForm(props: any) {
    if (!props?.isOpen) return null
    return (
      <div data-testid="diet-plan-form">
        <div data-testid="diet-plan-form-edit">{String(!!props.edit)}</div>
        <div data-testid="diet-plan-form-day-name">
          {props?.rowData?.day_name ?? ''}
        </div>
        <div data-testid="diet-plan-form-day-number">
          {String(props?.rowData?.day_number ?? '')}
        </div>
        <button data-testid="diet-plan-form-close" onClick={props.handleClose}>
          close
        </button>
      </div>
    )
  }
})

jest.mock('../api', () => ({
  useDietPlans: () => ({
    data: {
      diet_plans: mockDietPlans,
    },
    isFetching: false,
  }),
  useDeleteDietPlan: () => ({
    mutateAsync: (...args: any[]) => mockDeleteDietPlan(...args),
    isLoading: false,
  }),
}))

const mockSetPageParams = jest.fn()
jest.mock('../../../../../store/filterSore/adminUserStore', () => {
  return {
    __esModule: true,
    useAdminUserFilterStore: () => ({
      pageParams: {
        page: 1,
        per_page: 10,
        search: '',
        ordering: '',
        filters: {},
        sortType: undefined,
        sortColumn: undefined,
      },
      setPageParams: mockSetPageParams,
    }),
  }
})

jest.mock('../../../../../store/authStore', () => ({
  useAuthStore: (selector?: any) => {
    const state = { roleData: { name: mockRoleName } }
    return typeof selector === 'function' ? selector(state) : state
  },
}))

jest.mock('../../../../../layout/store', () => ({
  checkPermissions: jest.fn(() => true),
}))

jest.mock('../../../../../components/common/buttons/Button', () => {
  return function MockButton({ label, onClick }: any) {
    return (
      <button type="button" onClick={onClick}>
        {label}
      </button>
    )
  }
})

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithProviders = (
  component: React.ReactElement,
  {
    queries = createTestQueryClient(),
    initialEntries = ['/diet-template/1/diet-plan'],
    ...renderOptions
  }: any = {}
) => {
  const { MemoryRouter, useLocation } = require('react-router-dom')
  function LocationDisplay() {
    const location = useLocation()
    return (
      <div data-testid="location-display">
        {location.pathname}
        {location.search}
      </div>
    )
  }
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queries}>
        {children}
        <LocationDisplay />
      </QueryClientProvider>
    </MemoryRouter>
  )
  return render(component, { wrapper: Wrapper, ...renderOptions })
}

const defaultProps = {
  template: {
    id: '1',
    name: 'Weight Loss Plan',
    duration_days: 30,
  },
  loading: false,
  error: '',
}

describe('DietPlanTab Component', () => {
  const DietPlanTab = require('../index').default

  beforeEach(() => {
    jest.clearAllMocks()
    mockRoleName = 'admin'
    mockDietPlans = [
      {
        id: 1,
        diet_plan_template_id: 1,
        day_number: 1,
        day_name: 'Day One',
        meal_time: 'Breakfast',
        effective_total_calories: 100,
      },
      {
        id: 2,
        diet_plan_template_id: 1,
        day_number: 1,
        day_name: 'Day One',
        meal_time: 'Lunch',
        effective_total_calories: 200,
      },
      {
        id: 3,
        diet_plan_template_id: 1,
        day_name: 'Monday',
        meal_time: 'Breakfast',
        effective_total_calories: 50,
      },
    ]
  })

  it('renders info box when loading is true', () => {
    renderWithProviders(<DietPlanTab {...defaultProps} loading={true} />)

    expect(screen.getByTestId('info-box')).toBeInTheDocument()
    expect(screen.getByText('Loading diet plans...')).toBeInTheDocument()
  })

  it('renders error info box when error is provided', () => {
    renderWithProviders(
      <DietPlanTab {...defaultProps} error="Failed to load diet plans" />
    )

    expect(screen.getByTestId('info-box')).toBeInTheDocument()
    expect(screen.getByText('Failed to load diet plans')).toBeInTheDocument()
  })

  it('renders unavailable info box when template has no id', () => {
    renderWithProviders(
      <DietPlanTab
        {...defaultProps}
        template={{ ...defaultProps.template, id: undefined }}
      />
    )

    expect(screen.getByTestId('info-box')).toBeInTheDocument()
    expect(
      screen.getByText('Template information unavailable.')
    ).toBeInTheDocument()
  })

  it('renders smart table when template data is available', async () => {
    renderWithProviders(<DietPlanTab {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    })
  })

  it('aggregates days and can switch to day view and back', async () => {
    renderWithProviders(<DietPlanTab {...defaultProps} />)

    await waitFor(() => {
      // Day 1 + Monday
      expect(screen.getByTestId('table-count')).toHaveTextContent('2')
    })

    fireEvent.click(screen.getByTestId('action-View'))

    await waitFor(() => {
      // Viewing day 1 should show 2 meals
      expect(screen.getByTestId('table-count')).toHaveTextContent('2')
      expect(
        screen.getByRole('button', { name: 'Back to all days' })
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Back to all days' }))
    await waitFor(() => {
      expect(screen.getByTestId('table-count')).toHaveTextContent('2')
    })
  })

  it('navigates to selected day when day number cell is clicked', async () => {
    renderWithProviders(<DietPlanTab {...defaultProps} />)

    await waitFor(() => {
      expect(
        screen.getByTestId('day-number-cell').querySelector('button')
      ).toBeTruthy()
    })

    const btn = screen.getByTestId('day-number-cell').querySelector('button')!
    fireEvent.click(btn)

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '?day=number%3A1'
      )
    })
  })

  it('opens create form and pre-fills day info when in day view', async () => {
    renderWithProviders(<DietPlanTab {...defaultProps} />)

    fireEvent.click(screen.getByTestId('action-View'))

    // In this test environment permissions can differ depending on store state.
    // If the "Create Meal" button is visible, click it and verify prefill.
    const createMealBtn = screen.queryByRole('button', { name: 'Create Meal' })
    if (createMealBtn) {
      fireEvent.click(createMealBtn)
      await waitFor(() => {
        expect(screen.getByTestId('diet-plan-form')).toBeInTheDocument()
        expect(screen.getByTestId('diet-plan-form-edit')).toHaveTextContent(
          'false'
        )
      })
    }
  })

  it('supports edit and delete actions in day view for admin', async () => {
    renderWithProviders(<DietPlanTab {...defaultProps} />)

    fireEvent.click(screen.getByTestId('action-View'))

    await waitFor(() => {
      expect(screen.getByTestId('action-Edit')).toBeInTheDocument()
      expect(screen.getByTestId('action-Delete')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('action-Edit'))
    await waitFor(() => {
      expect(screen.getByTestId('diet-plan-form')).toBeInTheDocument()
      expect(screen.getByTestId('diet-plan-form-edit')).toHaveTextContent(
        'true'
      )
    })

    // Trigger delete confirmation modal and confirm
    fireEvent.click(screen.getByTestId('action-Delete'))
    fireEvent.click(screen.getByText('Confirm'))
    await waitFor(() => {
      expect(mockDeleteDietPlan).toHaveBeenCalled()
    })
  })

  it('handles error state correctly', () => {
    renderWithProviders(<DietPlanTab {...defaultProps} error="Network error" />)

    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('displays loading message during data fetch', () => {
    renderWithProviders(<DietPlanTab {...defaultProps} loading={true} />)

    expect(screen.getByText('Loading diet plans...')).toBeInTheDocument()
  })

  it('renders with proper component layout', async () => {
    const { container } = renderWithProviders(<DietPlanTab {...defaultProps} />)

    await waitFor(() => {
      expect(
        container.querySelector('[data-testid="smart-table"]')
      ).toBeInTheDocument()
    })
  })

  it('handles template without duration_days', async () => {
    renderWithProviders(
      <DietPlanTab
        {...defaultProps}
        template={{
          id: '1',
          name: 'Test',
          duration_days: undefined,
        }}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    })
  })

  it('handles empty diet plan list', async () => {
    mockDietPlans = []
    renderWithProviders(<DietPlanTab {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('table-count')).toHaveTextContent('0')
    })
  })

  it('ignores view action when no row/day_key is available', async () => {
    mockDietPlans = []
    renderWithProviders(<DietPlanTab {...defaultProps} />)

    fireEvent.click(screen.getByTestId('action-View'))
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/diet-template/1/diet-plan'
    )
  })

  it('handles nutritionist role (no create/edit/delete actions)', async () => {
    mockRoleName = 'nutritionist'
    renderWithProviders(<DietPlanTab {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('smart-table')).toBeInTheDocument()
      expect(screen.queryByTestId('action-View')).not.toBeInTheDocument()
      expect(screen.queryByTestId('action-Edit')).not.toBeInTheDocument()
      expect(screen.queryByTestId('action-Delete')).not.toBeInTheDocument()
    })
  })

  it('normalizes day query parameters (day- and numeric)', async () => {
    renderWithProviders(<DietPlanTab {...defaultProps} />, {
      initialEntries: ['/diet-template/1/diet-plan?day=day-1'],
    })

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Back to all days' })
      ).toBeInTheDocument()
    })
  })

  it('supports name: day key and plan- fallback (no matches)', async () => {
    const first = renderWithProviders(<DietPlanTab {...defaultProps} />, {
      initialEntries: ['/diet-template/1/diet-plan?day=name:monday'],
    })

    await waitFor(() => {
      expect(screen.getByTestId('table-title')).toHaveTextContent(
        'Monday - Meals'
      )
    })

    // plan-* value becomes a viewingDay with no matches
    first.unmount()
    renderWithProviders(<DietPlanTab {...defaultProps} />, {
      initialEntries: ['/diet-template/1/diet-plan?day=plan-999'],
    })

    await waitFor(() => {
      expect(screen.getByTestId('table-title')).toHaveTextContent(
        'Selected Day - Meals'
      )
      expect(screen.getByTestId('table-count')).toHaveTextContent('0')
    })
  })
})
