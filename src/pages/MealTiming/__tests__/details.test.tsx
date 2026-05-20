import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import MealTimingDetails from '../Details'

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

const mockGetMealTimingDetails = jest.fn()

jest.mock('../api', () => ({
  getMealTimingDetails: (...args: any[]) => mockGetMealTimingDetails(...args),
  useMealTimingList: jest.fn(),
  deleteMealTiming: jest.fn(),
  DISABLE_NONLOGIN_APIS: false,
}))

const mockNavigate = jest.fn()
const mockUseParams = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}))

jest.mock('../create', () => {
  return function MockCreateMealTiming(props: any) {
    return (
      <div data-testid="create-mealtiming-modal">
        {props.isDrawerOpen && (
          <>
            <span data-testid="modal-mode">{props.edit ? 'Edit' : 'Create'}</span>
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

const renderWithProviders = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('MealTimingDetails', () => {
  const mockData = {
    meal_timing: {
      id: '123',
      name: 'breakfast',
      time: '08:00 AM',
      sequence_number: 1,
      status: 'active',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({ id: '123' })
    mockGetMealTimingDetails.mockResolvedValue(mockData)
  })

  it('renders loading state initially', async () => {
    mockGetMealTimingDetails.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    )

    await act(async () => {
      renderWithProviders(<MealTimingDetails />)
    })

    expect(screen.getByTestId('info-box')).toHaveTextContent(
      'Loading meal timing details...'
    )
  })

  it('renders error state when API fails', async () => {
    mockGetMealTimingDetails.mockRejectedValue({
      response: { data: { message: 'Failed to load' } },
    })

    await act(async () => {
      renderWithProviders(<MealTimingDetails />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('info-box')).toHaveTextContent('Failed to load')
    })
  })

  it('renders default error message when no specific error', async () => {
    mockGetMealTimingDetails.mockRejectedValue({})

    await act(async () => {
      renderWithProviders(<MealTimingDetails />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('info-box')).toHaveTextContent(
        'Failed to load meal timing'
      )
    })
  })

  it('renders meal timing details successfully', async () => {
    await act(async () => {
      renderWithProviders(<MealTimingDetails />)
    })

    await waitFor(() => {
      expect(screen.getByText('Meal Timing Details')).toBeInTheDocument()
      expect(screen.getByText('Breakfast')).toBeInTheDocument()
      expect(screen.getByText('08:00 AM')).toBeInTheDocument()
      expect(screen.getByText('Sequence Number')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  it('does not render sequence number when empty', async () => {
    mockGetMealTimingDetails.mockResolvedValue({
      meal_timing: {
        ...mockData.meal_timing,
        sequence_number: '',
      },
    })

    await act(async () => {
      renderWithProviders(<MealTimingDetails />)
    })

    await waitFor(() => {
      expect(screen.queryByText('Sequence Number')).not.toBeInTheDocument()
    })
  })

  it('renders sequence number when value is 0', async () => {
    mockGetMealTimingDetails.mockResolvedValue({
      meal_timing: {
        ...mockData.meal_timing,
        sequence_number: 0,
      },
    })

    await act(async () => {
      renderWithProviders(<MealTimingDetails />)
    })

    await waitFor(() => {
      expect(screen.getByText('Sequence Number')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  it('navigates back when back button clicked', async () => {
    await act(async () => {
      renderWithProviders(<MealTimingDetails />)
    })

    await waitFor(() => {
      expect(screen.getByLabelText('Back')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Back'))
    expect(mockNavigate).toHaveBeenCalledWith('/mealtiming')
  })

  it('opens edit drawer when clicking Edit Meal Timing', async () => {
    await act(async () => {
      renderWithProviders(<MealTimingDetails />)
    })

    await waitFor(() => {
      expect(screen.getByText('Edit Meal Timing')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Edit Meal Timing'))
    expect(screen.getByTestId('create-mealtiming-modal')).toBeInTheDocument()
    expect(screen.getByTestId('modal-mode')).toHaveTextContent('Edit')
  })
})
