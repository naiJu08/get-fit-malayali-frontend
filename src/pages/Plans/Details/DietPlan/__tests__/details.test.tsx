import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import DietPlanDetails from '../details'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '10' }),
}))

jest.mock('../../../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>,
}))

jest.mock('../../../../../components/app/alertBox/infoBox', () => ({
  __esModule: true,
  default: ({ content }: any) => <div data-testid="info-box">{content}</div>,
}))

const mockGetDietPlanDetails = jest.fn()
jest.mock('../api', () => ({
  getDietPlanDetails: (...args: any[]) => mockGetDietPlanDetails(...args),
}))

const renderWithProviders = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>)

describe('DietPlanDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', async () => {
    mockGetDietPlanDetails.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    )

    await act(async () => {
      renderWithProviders(<DietPlanDetails />)
    })
    expect(screen.getByTestId('info-box')).toHaveTextContent(
      'Loading diet plan details...'
    )
  })

  it('renders details and back navigates to plan tab', async () => {
    mockGetDietPlanDetails.mockResolvedValue({
      diet_plan: {
        id: 10,
        plan_id: 5,
        plan_name: 'Plan',
        day_number: 1,
        sequence_number: 1,
        meal_time: 'Breakfast',
        notes: 'Notes',
        calories_breakdown: { protein: 10, carbs: 20, fat: 5, fiber: 2 },
        effective_total_calories: 100,
        items: [
          {
            id: 1,
            meal_name: 'Egg',
            quantity: 2,
            requirement: 'mandatory',
            per_serving: { protein: 1, carbs: 1, fat: 1, fiber: 1, calories: 10 },
          },
        ],
      },
    })

    await act(async () => {
      renderWithProviders(<DietPlanDetails />)
    })

    await waitFor(() => {
      expect(screen.getByText('Diet Plan Details')).toBeInTheDocument()
      expect(screen.getByText('Plan Name')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Back'))
    expect(mockNavigate).toHaveBeenCalledWith('/plans/5/dietplan')
  })

  it('renders error message when API fails', async () => {
    mockGetDietPlanDetails.mockRejectedValue({
      response: { data: { message: 'Failed' } },
    })

    await act(async () => {
      renderWithProviders(<DietPlanDetails />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('info-box')).toHaveTextContent('Failed')
    })
  })

  it('renders items with mandatory/optional/unknown requirement and calorie fallback calc', async () => {
    mockGetDietPlanDetails.mockResolvedValue({
      // response shape without diet_plan wrapper
      plan_id: 5,
      plan_name: '',
      day_number: '',
      sequence_number: 1,
      meal_time: 'Breakfast',
      notes: '',
      // no calories_breakdown -> skip summary section
      items: [
        {
          id: 1,
          meal_name: 'Egg',
          quantity: 2,
          requirement: 'mandatory',
          per_serving: { protein: 1, carbs: 1, fat: 1, fiber: 1, calories: 10 },
        },
        {
          id: 2,
          meal_name: 'Salad',
          quantity: '3',
          requirement: 'optional',
          // no per_serving.calories -> hit fallback calculation
          per_serving: { protein: 2, carbs: 3, fat: 4, fiber: 1 },
        },
        {
          id: 3,
          meal_name: 'Unknown',
          quantity: 1,
          requirement: 'something_else',
          per_serving: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
        },
      ],
    })

    await act(async () => {
      renderWithProviders(<DietPlanDetails />)
    })

    await waitFor(() => {
      expect(screen.getByText('Meals in this Slot')).toBeInTheDocument()
    })

    // requirement labels
    expect(screen.getByText('Mandatory')).toBeInTheDocument()
    expect(screen.getByText('Optional')).toBeInTheDocument()
    expect(screen.getAllByText('--').length).toBeGreaterThan(0)

    // calories fallback: (p*4 + c*4 + f*9 + fi*2) * qty
    // Salad: (2*4 + 3*4 + 4*9 + 1*2) = 58; qty 3 => 174.00
    expect(screen.getByText('174.00')).toBeInTheDocument()
  })
})
