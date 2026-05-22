import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

const mockUseNavigate = jest.fn()
let mockedParams: any = { id: '123' }

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockedParams,
  useNavigate: () => mockUseNavigate,
}))

const mockGetDietPlanDetails = jest.fn()
const mockFetchDietPlans = jest.fn()

jest.mock('../../api', () => ({
  getDietPlanDetails: (id: string) => mockGetDietPlanDetails(id),
  fetchDietPlans: (params: any) => mockFetchDietPlans(params),
}))

jest.mock('../../create', () => {
  return function MockDietPlanForm(props: any) {
    if (!props?.isOpen) return null
    return (
      <div data-testid="diet-plan-form">
        <div data-testid="diet-plan-form-edit">{String(!!props.edit)}</div>
        <button
          data-testid="diet-plan-form-close"
          onClick={() => props.handleClose?.()}
        >
          close
        </button>
      </div>
    )
  }
})

jest.mock('../../../../../../components/common/icons', () => {
  return function MockIcons() {
    return <div data-testid="icon-component">Icon</div>
  }
})

jest.mock('../../../../../../components/app/alertBox/infoBox', () => {
  return function MockInfoBox({ content }: { content: string }) {
    return <div data-testid="info-box">{content}</div>
  }
})

const renderComponent = () => {
  const DietPlanDetails = require('../index').default
  const { BrowserRouter } = require('react-router-dom')
  return render(
    <BrowserRouter>
      <DietPlanDetails />
    </BrowserRouter>
  )
}

describe('DietPlanDetails Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedParams = { id: '123' }
    mockGetDietPlanDetails.mockResolvedValue({
      diet_plan: {
        id: '123',
        day_number: 1,
        meal_time: 'Breakfast',
        diet_plan_template_id: 1,
        diet_plan_template_name: 'Template',
        day_name: 'Monday',
      },
    })
    mockFetchDietPlans.mockResolvedValue({
      diet_plans: [{ id: 1, day_number: 1, meal_time: 'Breakfast' }],
    })
  })

  it('renders page header', () => {
    renderComponent()
    expect(screen.getByText('Diet Plan Details')).toBeInTheDocument()
  })

  it('fetches diet plan details on component mount', async () => {
    renderComponent()

    await waitFor(() => {
      expect(mockGetDietPlanDetails).toHaveBeenCalledWith('123')
    })
  })

  it('fetches related diet plans after loading details', async () => {
    renderComponent()

    await waitFor(() => {
      expect(mockFetchDietPlans).toHaveBeenCalled()
    })
  })

  it('handles error when fetching details', async () => {
    mockGetDietPlanDetails.mockRejectedValue(
      new Error('Failed to load diet plan')
    )

    renderComponent()

    await waitFor(() => {
      expect(mockGetDietPlanDetails).toHaveBeenCalled()
    })
  })

  it('does not fetch when id is not provided', () => {
    mockedParams = {}

    renderComponent()

    expect(mockGetDietPlanDetails).not.toHaveBeenCalled()
  })

  it('renders loading state initially', () => {
    mockGetDietPlanDetails.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ diet_plan: {} }), 50)
        )
    )
    renderComponent()
    expect(screen.getByText('Loading diet plan details...')).toBeInTheDocument()
  })

  it('goBack navigates to template with encoded day key when day_number exists', async () => {
    mockGetDietPlanDetails.mockResolvedValue({
      diet_plan: {
        id: '123',
        day_number: 2,
        diet_plan_template_id: 45,
      },
    })

    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    screen.getByRole('button', { name: 'Back' }).click()
    expect(mockUseNavigate).toHaveBeenCalledWith(
      '/diet-template/45/diet-plan?day=number%3A2'
    )
  })

  it('goBack navigates to template with name day key when day_name exists', async () => {
    mockGetDietPlanDetails.mockResolvedValue({
      diet_plan: {
        id: '123',
        day_name: 'My Day',
        diet_plan_template_id: 45,
      },
    })

    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('My Day')).toBeInTheDocument()
    })

    screen.getByRole('button', { name: 'Back' }).click()
    expect(mockUseNavigate).toHaveBeenCalledWith(
      '/diet-template/45/diet-plan?day=name%3Amy%20day'
    )
  })

  it('goBack falls back to history back when templateId missing', async () => {
    mockGetDietPlanDetails.mockResolvedValue({
      diet_plan: { id: '123', day_number: 1 },
    })

    renderComponent()
    await waitFor(() => {
      expect(mockGetDietPlanDetails).toHaveBeenCalled()
    })

    screen.getByRole('button', { name: 'Back' }).click()
    expect(mockUseNavigate).toHaveBeenCalledWith(-1)
  })

  it('goBack navigates to template diet plan when day key cannot be built', async () => {
    mockGetDietPlanDetails.mockResolvedValue({
      diet_plan: {
        id: null,
        diet_plan_template_id: 45,
      },
    })

    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Template Name')).toBeInTheDocument()
    })

    screen.getByRole('button', { name: 'Back' }).click()
    expect(mockUseNavigate).toHaveBeenCalledWith('/diet-template/45/diet-plan')
  })

  it('shows API error message when load fails with response message', async () => {
    mockGetDietPlanDetails.mockRejectedValueOnce({
      response: { data: { message: 'API Error' } },
    })

    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })
  })

  it('does not show edit button when diet plan id is missing', async () => {
    mockGetDietPlanDetails.mockResolvedValue({
      diet_plan: {
        id: null,
        diet_plan_template_id: 1,
        day_number: 1,
      },
    })

    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Diet Plan Details')).toBeInTheDocument()
    })
    expect(screen.queryByText('Edit Diet Plan')).not.toBeInTheDocument()
  })

  it('renders calories breakdown and item nutrition calculations', async () => {
    mockGetDietPlanDetails.mockResolvedValue({
      diet_plan: {
        id: '123',
        diet_plan_template_id: 45,
        diet_plan_template_name: 'Template',
        day_name: 'Monday',
        day_number: 1,
        meal_time: 'Breakfast',
        calories_breakdown: { protein: 10, carbs: 20, fat: 5 },
        items: [
          {
            id: 1,
            meal_name: 'Egg',
            requirement: 'mandatory',
            quantity: 2,
            per_serving: { protein: 10, carbs: 1, fat: 5, fiber: 1 },
          },
          {
            id: 2,
            meal_name: 'Rice',
            requirement: 'optional',
            quantity: 1,
            per_serving: { calories: 100, protein: 2, carbs: 20, fat: 0 },
          },
        ],
      },
    })

    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Calories Summary')).toBeInTheDocument()
      expect(screen.getByText('Meals in this Slot')).toBeInTheDocument()
      expect(screen.getByText('Egg')).toBeInTheDocument()
      expect(screen.getByText('Rice')).toBeInTheDocument()
      expect(screen.getAllByText('Protein').length).toBeGreaterThan(0)
    })
  })

  it('opens edit form and reloads after close', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Edit Diet Plan')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Edit Diet Plan/i }))
    await waitFor(() => {
      expect(screen.getByTestId('diet-plan-form')).toBeInTheDocument()
    })
    expect(screen.getByTestId('diet-plan-form-edit')).toHaveTextContent('true')

    screen.getByTestId('diet-plan-form-close').click()
    await waitFor(() => {
      expect(mockGetDietPlanDetails).toHaveBeenCalledTimes(2)
    })
  })

  it('handles related plans fetch error without breaking', async () => {
    mockFetchDietPlans.mockRejectedValueOnce(new Error('plans failed'))
    renderComponent()

    await waitFor(() => {
      expect(mockGetDietPlanDetails).toHaveBeenCalled()
      expect(mockFetchDietPlans).toHaveBeenCalled()
    })

    expect(screen.getByText('Diet Plan Details')).toBeInTheDocument()
  })
})
