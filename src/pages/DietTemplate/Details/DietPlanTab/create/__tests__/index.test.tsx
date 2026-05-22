import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'

const mockEnqueueSnackbar = jest.fn()
jest.mock('../../../../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

const mockCreateMutate = jest.fn()
const mockUpdateMutate = jest.fn()
let mockDetailData: any = { diet_plan_template: { duration_days: 7 } }
const mockRefetchDetail = jest.fn()
jest.mock('../../api', () => ({
  __esModule: true,
  useDietPlanDetail: () => ({
    data: mockDetailData,
    refetch: mockRefetchDetail,
  }),
  useCreateDietPlan: () => ({
    mutate: (payload: any, opts?: any) => {
      mockCreateMutate(payload)
      opts?.onSuccess?.()
    },
    isLoading: false,
  }),
  useUpdateDietPlan: () => ({
    mutate: (payload: any, opts?: any) => {
      mockUpdateMutate(payload)
      opts?.onSuccess?.()
    },
    isLoading: false,
  }),
}))

const mockRefetchMeals = jest.fn()
jest.mock('../../../../../Meals/api', () => ({
  useMeals: () => ({
    data: {
      meals: [
        { id: 1, name: 'Oatmeal', serving_unit: 'bowl' },
        { id: 2, name: 'Rice', serving_unit: 'cup' },
      ],
    },
    refetch: mockRefetchMeals,
  }),
}))

let mockMealTimings: any[] = [
  { id: 1, name: 'Breakfast', time: '08:00' },
  { id: 2, name: 'Lunch', time: '13:00' },
]
const mockGetMealTimingDetails = jest.fn()
jest.mock('../../../../../MealTiming/api', () => ({
  useMealTimingList: () => ({
    data: {
      meal_timings: mockMealTimings,
    },
  }),
  getMealTimingDetails: (id: string) => mockGetMealTimingDetails(id),
}))

jest.mock('../../../../../../components/common/buttons/Button', () => {
  return function MockButton(props: any) {
    return (
      <button
        data-testid={`button-${props.label}`}
        disabled={props.disabled}
        onClick={props.onClick}
      >
        {props.label}
      </button>
    )
  }
})

jest.mock('../../../../../../components/common/inputs/ToggleSwitch', () => {
  return function MockToggleSwitch({ checked, onChange, id }: any) {
    return (
      <input
        data-testid={`toggle-${id}`}
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
    )
  }
})

jest.mock('../../../../../../components/common', () => ({
  DialogModal: ({
    isOpen,
    title,
    body,
    actionBody,
    onClose,
    onSubmit,
  }: any) => {
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
        <div data-testid="modal-actions">{actionBody}</div>
      </div>
    )
  },
  TextField: ({ id, value, onChange, disabled }: any) => (
    <input
      data-testid={`textfield-${id}`}
      value={value ?? ''}
      disabled={!!disabled}
      onChange={(e) => onChange?.(e)}
    />
  ),
}))

jest.mock('../../../../../../components/app/formBuilder', () => {
  return function MockFormBuilder({ data }: any) {
    const mealTimeField = Array.isArray(data)
      ? data.find((f: any) => f?.name === 'meal_time')
      : undefined

    return (
      <div data-testid="form-builder">
        <button
          data-testid="formbuilder-select-meal-time"
          onClick={() => {
            const raw = Array.isArray(mealTimeField?.data)
              ? mealTimeField.data[0]
              : undefined
            const value = raw?.value ?? raw?.name ?? raw?.id ?? ''
            const option = raw
              ? { ...raw, id: undefined, value, name: value }
              : undefined
            mealTimeField?.onChange?.(option)
          }}
        >
          SelectMealTime
        </button>
      </div>
    )
  }
})

jest.mock('qbs-core', () => ({
  AutoComplete: ({ name, data, onChange, value }: any) => (
    <div data-testid={`autocomplete-${name}`}>
      <div data-testid={`autocomplete-${name}-value`}>{String(value ?? '')}</div>
      <button
        data-testid={`autocomplete-${name}-select-first`}
        onClick={() => onChange?.(Array.isArray(data) ? data[0] : undefined)}
      >
        SelectFirst
      </button>
    </div>
  ),
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithProviders = (
  component: React.ReactElement,
  { queries = createTestQueryClient(), ...renderOptions } = {}
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queries}>{children}</QueryClientProvider>
  )
  return render(component, { wrapper: Wrapper, ...renderOptions })
}

const defaultProps = {
  isOpen: true,
  handleClose: jest.fn(),
  edit: false,
  planId: '1',
  planDurationDays: 7,
  existingPlans: [],
}

describe('DietPlanForm (create/index.tsx)', () => {
  const DietPlanForm = require('../index').default

  beforeEach(() => {
    jest.clearAllMocks()
    mockDetailData = { diet_plan_template: { duration_days: 7 } }
    mockMealTimings = [
      { id: 1, name: 'Breakfast', time: '08:00' },
      { id: 2, name: 'Lunch', time: '13:00' },
    ]
  })

  it('renders and closes', () => {
    const handleClose = jest.fn()
    renderWithProviders(<DietPlanForm {...defaultProps} handleClose={handleClose} />)

    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('modal-close'))
    expect(handleClose).toHaveBeenCalled()
  })

  it('shows validation snackbar on invalid submit', async () => {
    renderWithProviders(<DietPlanForm {...defaultProps} />)

    fireEvent.click(screen.getByTestId('modal-submit'))

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Day name is required', {
        variant: 'error',
      })
    })
  })

  it('creates diet plan on valid submit and normalizes items payload', async () => {
    const handleClose = jest.fn()
    renderWithProviders(<DietPlanForm {...defaultProps} handleClose={handleClose} />)

    // Pick meal time via FormBuilder mock (drives handleMealTimeChange)
    fireEvent.click(screen.getByTestId('formbuilder-select-meal-time'))

    // Select day name + number
    fireEvent.click(screen.getByTestId('autocomplete-day_name-select-first'))
    fireEvent.click(screen.getByTestId('autocomplete-day_number-select-first'))

    // Select meal for the first row
    fireEvent.click(screen.getByTestId('autocomplete-meals.0.meal_id-select-first'))

    // Set intake quantity to 1
    fireEvent.change(screen.getByTestId('textfield-meals.0.count'), {
      target: { value: '1' },
    })

    fireEvent.click(screen.getByTestId('modal-submit'))

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalled()
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Diet plan created successfully',
        { variant: 'success' }
      )
    })

    const payload = mockCreateMutate.mock.calls[0][0]
    expect(payload?.items?.[0]).toMatchObject({
      meal_id: 1,
      quantity: 1,
      requirement: 'optional',
    })
    expect(handleClose).toHaveBeenCalled()
  })

  it('keeps modal open on \"Submit and Add New\"', async () => {
    const handleClose = jest.fn()
    renderWithProviders(<DietPlanForm {...defaultProps} handleClose={handleClose} />)

    fireEvent.click(screen.getByTestId('formbuilder-select-meal-time'))
    fireEvent.click(screen.getByTestId('autocomplete-day_name-select-first'))
    fireEvent.click(screen.getByTestId('autocomplete-day_number-select-first'))
    fireEvent.click(screen.getByTestId('autocomplete-meals.0.meal_id-select-first'))
    fireEvent.change(screen.getByTestId('textfield-meals.0.count'), {
      target: { value: '1' },
    })

    fireEvent.click(screen.getByTestId('button-Submit and Add New'))

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalled()
    })

    expect(handleClose).not.toHaveBeenCalled()
  })
})
