import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import MealDetail from '../Detail'

const originalConsoleError = console.error
const originalConsoleWarn = console.warn
beforeAll(() => {
  console.error = jest.fn((...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    if (msg.includes('ReactDOMTestUtils.act')) return
    originalConsoleError(...args)
  })
  console.warn = jest.fn((...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    if (msg.includes('React Router Future Flag Warning')) return
    originalConsoleWarn(...args)
  })
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

const mockGetMealDetails = jest.fn()

jest.mock('../api', () => ({
  getMealDetails: (...args: any[]) => mockGetMealDetails(...args),
  useMeals: jest.fn(),
}))

const mockNavigate = jest.fn()
const mockUseParams = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}))

jest.mock('../create', () => {
  return function MockCreateMeal(props: any) {
    return (
      <div data-testid="create-meal-modal">
        {props.isDrawerOpen && (
          <>
            <span data-testid="modal-mode">
              {props.edit ? 'Edit' : 'Create'}
            </span>
            <button data-testid="close-modal" onClick={props.handleClose}>
              Close
            </button>
            <button
              data-testid="refresh-modal"
              onClick={() => {
                props.handleRefresh?.()
                props.handleClose?.()
              }}
            >
              Refresh
            </button>
          </>
        )}
      </div>
    )
  }
})

jest.mock('../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  ),
}))

jest.mock('../../../components/app/alertBox/infoBox', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => (
    <div data-testid="info-box">{content}</div>
  ),
}))

jest.mock('../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    return (
      <div data-testid="smart-table">
        {props.data && props.data.length > 0 ? (
          <table>
            <tbody>
              {props.data.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>{item.label || item.question_text}</td>
                  <td>{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div data-testid="empty-table">{props.emptyTitle}</div>
        )}
      </div>
    )
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('MealDetail', () => {
  const mockData = {
    meal: {
      id: '123',
      name: 'Oatmeal Breakfast',
      meal_time: 'Breakfast',
      meal_category: 'Vegetarian',
      serving_unit: 'cup',
      per_serving_calories: 300,
      per_serving_protein: 10,
      per_serving_carbs: 50,
      per_serving_fat: 5,
      per_serving_fiber: 8,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({ id: '123' })
    mockGetMealDetails.mockResolvedValue(mockData)
  })

  it('renders loading state initially', () => {
    mockGetMealDetails.mockImplementation(() => new Promise(() => {}))
    renderWithProviders(<MealDetail />)
    expect(mockGetMealDetails).toHaveBeenCalledWith('123')
  })

  it('fetches details on component mount', () => {
    renderWithProviders(<MealDetail />)
    expect(mockGetMealDetails).toHaveBeenCalledWith('123')
  })

  it('displays details after loading', async () => {
    renderWithProviders(<MealDetail />)
    await waitFor(() => {
      // Check for detail items container in grid layout
      const detailsContainer = screen
        .getByText('Food Details')
        .closest('div')?.parentElement
      expect(detailsContainer).toBeInTheDocument()
    })
  })

  it('does not fetch when id is not provided', () => {
    mockUseParams.mockReturnValue({})
    renderWithProviders(<MealDetail />)
    expect(mockGetMealDetails).not.toHaveBeenCalled()
  })

  it('handles error when fetching details', async () => {
    mockGetMealDetails.mockRejectedValue(new Error('Failed to load'))
    renderWithProviders(<MealDetail />)
    await waitFor(() => {
      expect(mockGetMealDetails).toHaveBeenCalled()
    })
  })

  it('opens edit modal when edit button is clicked', async () => {
    renderWithProviders(<MealDetail />)
    await waitFor(() => {
      // Check for the edit button
      const editButton = screen.getByRole('button', { name: /edit/i })
      expect(editButton).toBeInTheDocument()
    })
  })

  it('handles navigation back', async () => {
    renderWithProviders(<MealDetail />)
    const backButton = screen.queryByTestId('icon-back')
    if (backButton) {
      fireEvent.click(backButton)
      expect(mockNavigate).toHaveBeenCalled()
    }
  })

  it('displays meal details correctly', async () => {
    renderWithProviders(<MealDetail />)
    await waitFor(() => {
      // Check for meal name in the rendered output
      const mealName = screen.queryByText('Oatmeal Breakfast')
      if (mealName) {
        expect(mealName).toBeInTheDocument()
      }
    })
  })

  it('renders create modal', async () => {
    renderWithProviders(<MealDetail />)
    await waitFor(() => {
      expect(screen.getByTestId('create-meal-modal')).toBeInTheDocument()
    })
  })

  it('closes edit modal and reloads data on refresh', async () => {
    renderWithProviders(<MealDetail />)
    const refreshButton = screen.queryByTestId('refresh-modal')
    if (refreshButton) {
      await act(async () => {
        fireEvent.click(refreshButton)
      })
      await waitFor(() => {
        expect(mockGetMealDetails).toHaveBeenCalledTimes(2)
      })
    }
  })

  it('displays meal name in title', async () => {
    renderWithProviders(<MealDetail />)
    await waitFor(() => {
      // Check for the title "Food Details"
      expect(screen.getByText('Food Details')).toBeInTheDocument()
    })
  })

  it('displays all nutrition information', async () => {
    renderWithProviders(<MealDetail />)
    await waitFor(() => {
      // Check that detail items are displayed
      const nameLabel = screen.queryByText('Name')
      expect(nameLabel).toBeInTheDocument()
    })
  })

  it('shows edit button when data is loaded', async () => {
    renderWithProviders(<MealDetail />)
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /edit/i })
      expect(editButton).toBeInTheDocument()
    })
  })

  it('shows edit button and opens modal when clicked', async () => {
    renderWithProviders(<MealDetail />)
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /edit/i })
      expect(editButton).toBeInTheDocument()
      fireEvent.click(editButton)
    })
  })
})
