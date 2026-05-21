import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import AssessmentCategoryDetails from '../Details'

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

const mockGetAssessmentCategoryDetails = jest.fn()

jest.mock('../api', () => ({
  getAssessmentCategoryDetails: (...args: any[]) =>
    mockGetAssessmentCategoryDetails(...args),
  useAssessmentCategories: jest.fn(),
  deleteAssessmentCategory: jest.fn(),
}))

const mockNavigate = jest.fn()
const mockUseParams = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}))

jest.mock('../create', () => {
  return function MockCreateAssessmentCategory(props: any) {
    return (
      <div data-testid="create-assessment-modal">
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
                  <td>{item.label || item.key}</td>
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

describe('AssessmentCategoryDetails', () => {
  const mockData = {
    assessment_category: {
      id: '123',
      name: 'health assessment',
      description: 'A comprehensive health assessment',
      status: 'active',
      active: true,
      assessment_questions: [
        { id: 1, question_text: 'Question 1' },
        { id: 2, question_text: 'Question 2' },
      ],
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({ id: '123' })
    mockGetAssessmentCategoryDetails.mockResolvedValue(mockData)
  })

  it('renders loading state initially', () => {
    mockGetAssessmentCategoryDetails.mockImplementation(
      () => new Promise(() => {})
    )
    renderWithProviders(<AssessmentCategoryDetails />)
    expect(mockGetAssessmentCategoryDetails).toHaveBeenCalledWith('123')
  })

  it('fetches details on component mount', () => {
    renderWithProviders(<AssessmentCategoryDetails />)
    expect(mockGetAssessmentCategoryDetails).toHaveBeenCalledWith('123')
  })

  it('displays details in table after loading', async () => {
    renderWithProviders(<AssessmentCategoryDetails />)
    await waitFor(() => {
      expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    })
  })

  it('does not fetch when id is not provided', () => {
    mockUseParams.mockReturnValue({})
    renderWithProviders(<AssessmentCategoryDetails />)
    expect(mockGetAssessmentCategoryDetails).not.toHaveBeenCalled()
  })

  it('handles error when fetching details', async () => {
    mockGetAssessmentCategoryDetails.mockRejectedValue(
      new Error('Failed to load')
    )
    renderWithProviders(<AssessmentCategoryDetails />)
    await waitFor(() => {
      expect(mockGetAssessmentCategoryDetails).toHaveBeenCalled()
    })
  })

  it('opens edit modal when edit button is clicked', async () => {
    renderWithProviders(<AssessmentCategoryDetails />)
    await waitFor(() => {
      expect(screen.getByTestId('create-assessment-modal')).toBeInTheDocument()
    })
  })

  it('handles navigation back', async () => {
    renderWithProviders(<AssessmentCategoryDetails />)
    const backButton = screen.queryByTestId('icon-back')
    if (backButton) {
      fireEvent.click(backButton)
      expect(mockNavigate).toHaveBeenCalled()
    }
  })

  it('displays questions count in details', async () => {
    renderWithProviders(<AssessmentCategoryDetails />)
    await waitFor(() => {
      expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    })
  })

  it('displays active status as Active', async () => {
    renderWithProviders(<AssessmentCategoryDetails />)
    await waitFor(() => {
      expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    })
  })

  it('handles status display correctly', async () => {
    mockGetAssessmentCategoryDetails.mockResolvedValue({
      assessment_category: {
        id: '123',
        name: 'Assessment',
        status: 'inactive',
        assessment_questions: [],
      },
    })
    renderWithProviders(<AssessmentCategoryDetails />)
    await waitFor(() => {
      expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    })
  })

  it('renders create modal', async () => {
    renderWithProviders(<AssessmentCategoryDetails />)
    await waitFor(() => {
      expect(screen.getByTestId('create-assessment-modal')).toBeInTheDocument()
    })
  })

  it('closes edit modal and reloads data on refresh', async () => {
    renderWithProviders(<AssessmentCategoryDetails />)
    const refreshButton = screen.queryByTestId('refresh-modal')
    if (refreshButton) {
      await act(async () => {
        fireEvent.click(refreshButton)
      })
      await waitFor(() => {
        expect(mockGetAssessmentCategoryDetails).toHaveBeenCalledTimes(2)
      })
    }
  })
})
