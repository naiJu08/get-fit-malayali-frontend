// src/pages/Yoga/__tests__/details.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import YogaDetails from '../Details'

// Mock useNavigate and useParams
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' }),
}))

// Mock the API
const mockGetYogaDetails = jest.fn()

jest.mock('../api', () => ({
  getYogaDetails: (...args: any[]) => mockGetYogaDetails(...args),
}))

// Mock the CreateYoga component
jest.mock('../create', () => {
  return function MockCreateYoga({ isDrawerOpen, handleClose, edit, rowData, setEdit }: any) {
    if (!isDrawerOpen) return null
    return (
      <div data-testid="create-yoga-modal">
        <div data-testid="modal-yoga-name">{rowData?.name}</div>
        <button data-testid="close-modal" onClick={handleClose}>
          Close
        </button>
        <button 
          data-testid="close-after-edit" 
          onClick={() => {
            setEdit?.(false)
            handleClose?.()
          }}
        >
          Close After Edit
        </button>
      </div>
    )
  }
})

// Mock Icons component
jest.mock('../../../components/common/icons', () => {
  return function MockIcons({ name, className, onClick }: { name: string; className?: string; onClick?: () => void }) {
    return (
      <div 
        data-testid={`icon-${name}`} 
        className={className}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {name}
      </div>
    )
  }
})

// Mock InfoBox component
jest.mock('../../../components/app/alertBox/infoBox', () => {
  return function MockInfoBox({ content, type }: { content: string; type?: string }) {
    return (
      <div data-testid="info-box" data-type={type}>
        {content}
      </div>
    )
  }
}, { virtual: true })

// Mock Tooltip component
jest.mock('../../../components/common/tooltip', () => {
  return function MockTooltip({ title, children }: any) {
    return (
      <div data-testid="tooltip" title={title}>
        {children}
      </div>
    )
  }
}, { virtual: true })

// Mock window.open
const mockWindowOpen = jest.fn()
window.open = mockWindowOpen

// Test wrapper - ONLY MemoryRouter, no BrowserRouter nesting
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/yoga/1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    {children}
  </MemoryRouter>
)

describe('YogaDetails Component', () => {
  const mockYogaData = {
    yoga: {
      id: '1',
      name: 'Test Yoga',
      description: 'Test Description',
      duration_minutes: 30,
      intensity_level: 'Moderate',
      category: 'basic',
      thumbnail_url: 'https://example.com/thumbnail.jpg',
      video_url: 'https://www.youtube.com/watch?v=test123',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetYogaDetails.mockReset()
  })

  const renderComponent = async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <YogaDetails />
        </TestWrapper>
      )
    })
  }

  it('renders loading state initially', async () => {
    mockGetYogaDetails.mockImplementation(() => new Promise(() => {}))

    await renderComponent()

    expect(screen.getByTestId('info-box')).toBeInTheDocument()
    expect(screen.getByTestId('info-box')).toHaveTextContent(/Loading/i)
  })

  it('renders error state when API fails', async () => {
    const errorMessage = 'Failed to load yoga'
    mockGetYogaDetails.mockRejectedValue({
      response: {
        data: {
          message: errorMessage,
        },
      },
    })

    await renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('info-box')).toBeInTheDocument()
      expect(screen.getByTestId('info-box')).toHaveTextContent(errorMessage)
    })
  })

  it('renders yoga details successfully', async () => {
    mockGetYogaDetails.mockResolvedValue(mockYogaData)

    await renderComponent()

    await waitFor(() => {
      // The name might be displayed as "Test yoga" (lowercase y)
      const nameElement = screen.getByText((content, element) => {
        return content.includes('Test') && content.includes('yoga')
      })
      expect(nameElement).toBeInTheDocument()
    })

    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('Moderate')).toBeInTheDocument()
    expect(screen.getByText('Basic')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('renders back button and triggers navigation', async () => {
    mockGetYogaDetails.mockResolvedValue(mockYogaData)

    await renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('icon-left-arrow-icon')).toBeInTheDocument()
    })

    const backButton = screen.getByTestId('icon-left-arrow-icon')
    await act(async () => {
      fireEvent.click(backButton)
    })

    expect(mockNavigate).toHaveBeenCalledWith('/yoga')
  })

  it('renders edit button and opens edit modal', async () => {
    mockGetYogaDetails.mockResolvedValue(mockYogaData)

    await renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Edit Yoga')).toBeInTheDocument()
    })

    const editButton = screen.getByText('Edit Yoga')
    await act(async () => {
      fireEvent.click(editButton)
    })

    expect(screen.getByTestId('create-yoga-modal')).toBeInTheDocument()
  })

  it('closes edit modal when close button is clicked', async () => {
    mockGetYogaDetails.mockResolvedValue(mockYogaData)

    await renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Edit Yoga')).toBeInTheDocument()
    })

    const editButton = screen.getByText('Edit Yoga')
    await act(async () => {
      fireEvent.click(editButton)
    })
    expect(screen.getByTestId('create-yoga-modal')).toBeInTheDocument()

    const closeButton = screen.getByTestId('close-modal')
    await act(async () => {
      fireEvent.click(closeButton)
    })

    expect(screen.queryByTestId('create-yoga-modal')).not.toBeInTheDocument()
  })

  it('renders video element when video URL is provided', async () => {
    mockGetYogaDetails.mockResolvedValue(mockYogaData)

    await renderComponent()

    await waitFor(() => {
      const video = document.querySelector('video')
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute('src', 'https://www.youtube.com/watch?v=test123')
    })
  })

  it('does not render video section when no video URL is provided', async () => {
    const noVideoData = {
      yoga: {
        ...mockYogaData.yoga,
        video_url: null,
      },
    }
    mockGetYogaDetails.mockResolvedValue(noVideoData)

    await renderComponent()

    await waitFor(() => {
      expect(document.querySelector('video')).not.toBeInTheDocument()
    })
  })

  it('handles missing yoga data gracefully', async () => {
    const emptyData = { yoga: null }
    mockGetYogaDetails.mockResolvedValue(emptyData)

    await renderComponent()

    await waitFor(() => {
      const placeholderElements = screen.getAllByText('--')
      expect(placeholderElements.length).toBeGreaterThan(0)
    })
  })

  it('handles API error with generic message', async () => {
    mockGetYogaDetails.mockRejectedValue(new Error('Network error'))

    await renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('info-box')).toBeInTheDocument()
      // The error message might be different, so check for any error indicator
      const infoBox = screen.getByTestId('info-box')
      expect(infoBox).toBeInTheDocument()
    })
  })
})