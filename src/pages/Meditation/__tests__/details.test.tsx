// src/pages/Meditation/__tests__/details.test.tsx

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MeditationDetails from '../Details'

// Create a query client for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// Mock the API module
const mockGetMeditationDetails = jest.fn()

jest.mock('../api', () => ({
  getMeditationDetails: (...args: any[]) => mockGetMeditationDetails(...args),
  useMeditationList: jest.fn(),
  deleteMeditation: jest.fn(),
  DISABLE_NONLOGIN_APIS: false,
}))

// Mock react-router-dom
const mockNavigate = jest.fn()
const mockUseParams = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}))

// Mock CreateMeditation component
jest.mock('../create', () => {
  return function MockCreateMeditation(props: any) {
    return (
      <div data-testid="create-meditation-modal">
        {props.isDrawerOpen && (
          <>
            <span data-testid="modal-mode">
              {props.edit ? 'Edit Mode' : 'Create Mode'}
            </span>
            <button data-testid="close-modal" onClick={props.handleClose}>
              Close
            </button>
            <button
              data-testid="refresh-modal"
              onClick={() => {
                props.handleRefresh()
                props.handleClose()
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

// Mock Icons component
jest.mock('../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  ),
}))

// Mock InfoBox component
jest.mock('../../../components/app/alertBox/infoBox', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => (
    <div data-testid="info-box">{content}</div>
  ),
}))

describe('MeditationDetails', () => {
  const mockMeditationData = {
    meditation: {
      id: '123',
      title: 'morning meditation',
      description: 'Start your day with peace and mindfulness',
      duration_minutes: '10.30',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnail_url: 'https://example.com/thumbnail.jpg',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({ id: '123' })
    mockGetMeditationDetails.mockResolvedValue(mockMeditationData)
    mockNavigate.mockClear()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SnackbarProvider maxSnack={3}>{component}</SnackbarProvider>
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  describe('Initial Render and Loading States', () => {
    it('renders loading state initially', async () => {
      mockGetMeditationDetails.mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      )

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      expect(screen.getByTestId('info-box')).toHaveTextContent(
        'Loading user details...'
      )
    })

    it('renders error state when API fails', async () => {
      const errorMessage = 'Failed to load meditation'
      mockGetMeditationDetails.mockRejectedValue({
        response: { data: { message: errorMessage } },
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByTestId('info-box')).toHaveTextContent(errorMessage)
      })
    })

    it('renders error state with default message when no specific error', async () => {
      mockGetMeditationDetails.mockRejectedValue({})

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByTestId('info-box')).toHaveTextContent(
          'Failed to load user'
        )
      })
    })

    it('renders meditation details successfully', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Meditation Details')).toBeInTheDocument()
        expect(screen.getByText('Morning meditation')).toBeInTheDocument()
        expect(
          screen.getByText('Start your day with peace and mindfulness')
        ).toBeInTheDocument()
        expect(screen.getByText('10.30')).toBeInTheDocument()
      })
    })

    it('displays back button and navigates correctly', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByTestId('icon-left-arrow-icon')).toBeInTheDocument()
      })

      const backButton = screen.getByLabelText('Back')

      await act(async () => {
        fireEvent.click(backButton)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/meditation')
    })

    it('displays edit button when meditation data exists', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Edit Meditation')).toBeInTheDocument()
      })
    })

    it('does not display edit button when no meditation id', async () => {
      mockGetMeditationDetails.mockResolvedValue({ meditation: {} })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.queryByText('Edit Meditation')).not.toBeInTheDocument()
      })
    })
  })

  describe('Detail Items Display', () => {
    it('displays name correctly (with capitalization)', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Morning meditation')).toBeInTheDocument()
      })
    })

    it('displays description correctly', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(
          screen.getByText('Start your day with peace and mindfulness')
        ).toBeInTheDocument()
      })
    })

    it('displays duration correctly', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('10.30')).toBeInTheDocument()
      })
    })

    it('displays thumbnail when URL is valid', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Thumbnail')).toBeInTheDocument()
        const thumbnailImage = screen.getByAltText('Yoga thumbnail')
        expect(thumbnailImage).toBeInTheDocument()
        expect(thumbnailImage).toHaveAttribute(
          'src',
          'https://example.com/thumbnail.jpg'
        )
      })
    })

    it('does not display thumbnail when URL is invalid', async () => {
      mockGetMeditationDetails.mockResolvedValue({
        meditation: {
          ...mockMeditationData.meditation,
          thumbnail_url: '',
        },
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.queryByText('Thumbnail')).not.toBeInTheDocument()
      })
    })

    it('displays video player for YouTube URLs', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Video')).toBeInTheDocument()
        const iframe = document.querySelector('iframe')
        expect(iframe).toBeInTheDocument()
        expect(iframe?.src).toContain('youtube.com/embed')
      })
    })

    it('displays video player for Vimeo URLs', async () => {
      mockGetMeditationDetails.mockResolvedValue({
        meditation: {
          ...mockMeditationData.meditation,
          video_url: 'https://vimeo.com/123456789',
        },
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Video')).toBeInTheDocument()
        const iframe = document.querySelector('iframe')
        expect(iframe).toBeInTheDocument()
        expect(iframe?.src).toContain('player.vimeo.com')
      })
    })

    it('displays video player for Google Drive URLs', async () => {
      mockGetMeditationDetails.mockResolvedValue({
        meditation: {
          ...mockMeditationData.meditation,
          video_url: 'https://drive.google.com/file/d/abc123/view',
        },
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Video')).toBeInTheDocument()
        const iframe = document.querySelector('iframe')
        expect(iframe).toBeInTheDocument()
        expect(iframe?.src).toContain('drive.google.com')
      })
    })

    it('displays video element for direct video URLs', async () => {
      mockGetMeditationDetails.mockResolvedValue({
        meditation: {
          ...mockMeditationData.meditation,
          video_url: 'https://example.com/video.mp4',
        },
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Video')).toBeInTheDocument()
        const video = document.querySelector('video')
        expect(video).toBeInTheDocument()
        expect(video?.src).toBe('https://example.com/video.mp4')
      })
    })

    it('handles video URL with query parameters', async () => {
      mockGetMeditationDetails.mockResolvedValue({
        meditation: {
          ...mockMeditationData.meditation,
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
        },
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        const iframe = document.querySelector('iframe')
        expect(iframe).toBeInTheDocument()
        expect(iframe?.src).toContain('youtube.com/embed/dQw4w9WgXcQ')
      })
    })
  })

  describe('Edit Modal Functionality', () => {
    it('opens edit modal when edit button is clicked', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Edit Meditation')).toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.click(screen.getByText('Edit Meditation'))
      })

      expect(screen.getByTestId('create-meditation-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-mode')).toHaveTextContent('Edit Mode')
    })

    it('closes edit modal when close button is clicked', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Edit Meditation')).toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.click(screen.getByText('Edit Meditation'))
      })

      expect(screen.getByTestId('create-meditation-modal')).toBeInTheDocument()

      await act(async () => {
        fireEvent.click(screen.getByTestId('close-modal'))
      })

      await waitFor(() => {
        const modal = screen.getByTestId('create-meditation-modal')
        expect(modal.children.length).toBe(0)
      })
    })

    it('refreshes data after modal refresh', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Edit Meditation')).toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.click(screen.getByText('Edit Meditation'))
      })

      expect(mockGetMeditationDetails).toHaveBeenCalledTimes(1)

      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-modal'))
      })

      await waitFor(() => {
        expect(mockGetMeditationDetails).toHaveBeenCalledTimes(2)
      })

      await waitFor(() => {
        const modal = screen.getByTestId('create-meditation-modal')
        expect(modal.children.length).toBe(0)
      })
    })
  })

  describe('Data Handling Edge Cases', () => {
    it('handles meditation data directly without nesting', async () => {
      mockGetMeditationDetails.mockResolvedValue({
        id: '123',
        title: 'direct meditation',
        description: 'Direct description',
        duration_minutes: '5.00',
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Direct meditation')).toBeInTheDocument()
        expect(screen.getByText('Direct description')).toBeInTheDocument()
        expect(screen.getByText('5.00')).toBeInTheDocument()
      })
    })

    it('handles missing optional fields', async () => {
      mockGetMeditationDetails.mockResolvedValue({
        meditation: {
          id: '123',
          title: 'minimal meditation',
        },
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Minimal meditation')).toBeInTheDocument()
      })

      await waitFor(() => {
        const dashElements = screen.getAllByText('--')
        expect(dashElements.length).toBeGreaterThan(0)
      })
    })

    it('handles null values gracefully', async () => {
      mockGetMeditationDetails.mockResolvedValue({
        meditation: {
          id: '123',
          title: null,
          description: null,
          duration_minutes: null,
        },
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        const dashElements = screen.getAllByText('--')
        expect(dashElements.length).toBeGreaterThan(0)
      })
    })

    it('handles undefined values gracefully', async () => {
      mockGetMeditationDetails.mockResolvedValue({
        meditation: {
          id: '123',
        },
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        const dashElements = screen.getAllByText('--')
        expect(dashElements.length).toBeGreaterThan(0)
      })
    })

    it('handles empty string values', async () => {
      mockGetMeditationDetails.mockResolvedValue({
        meditation: {
          id: '123',
          title: '',
          description: '',
          duration_minutes: '',
        },
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        const dashElements = screen.getAllByText('--')
        expect(dashElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Thumbnail Error Handling', () => {
    it('handles thumbnail image load error', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        const thumbnailImage = screen.getByAltText('Yoga thumbnail')
        expect(thumbnailImage).toBeInTheDocument()

        fireEvent.error(thumbnailImage)
        expect(thumbnailImage).toHaveStyle('display: none')
      })
    })

    it('displays thumbnail link even if image fails to load', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        const thumbnailLink = screen.getByText('Open thumbnail')
        expect(thumbnailLink).toBeInTheDocument()
        expect(thumbnailLink).toHaveAttribute(
          'href',
          'https://example.com/thumbnail.jpg'
        )
      })
    })
  })

  describe('Video Error Handling', () => {
    it('handles video element error gracefully', async () => {
      mockGetMeditationDetails.mockResolvedValue({
        meditation: {
          ...mockMeditationData.meditation,
          video_url: 'https://example.com/broken-video.mp4',
        },
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        const video = document.querySelector('video')
        expect(video).toBeInTheDocument()

        if (video) {
          fireEvent.error(video)
          expect(screen.getByText('Video')).toBeInTheDocument()
        }
      })
    })

    it('handles invalid video URL formats', async () => {
      mockGetMeditationDetails.mockResolvedValue({
        meditation: {
          ...mockMeditationData.meditation,
          video_url: 'not-a-valid-url',
        },
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.queryByText('Video')).not.toBeInTheDocument()
      })
    })

    it('handles null video URL', async () => {
      mockGetMeditationDetails.mockResolvedValue({
        meditation: {
          ...mockMeditationData.meditation,
          video_url: null,
        },
      })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.queryByText('Video')).not.toBeInTheDocument()
      })
    })
  })

  describe('Responsive Layout', () => {
    it('renders with correct grid layout', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        const gridContainer = document.querySelector('.grid')
        expect(gridContainer).toHaveClass('grid-cols-1 md:grid-cols-2')
      })
    })

    it('applies correct styling to detail items', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        const detailItems = document.querySelectorAll('.border.rounded-lg')
        expect(detailItems.length).toBeGreaterThan(0)
        detailItems.forEach((item) => {
          expect(item).toHaveClass('bg-white')
          expect(item).toHaveClass('p-3')
        })
      })
    })
  })

  describe('URL Parameter Handling', () => {
    it('fetches data when id parameter changes', async () => {
      const { rerender } = await act(async () => {
        return renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(mockGetMeditationDetails).toHaveBeenCalledWith('123')
      })

      mockUseParams.mockReturnValue({ id: '456' })

      await act(async () => {
        rerender(
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <SnackbarProvider maxSnack={3}>
                <MeditationDetails />
              </SnackbarProvider>
            </BrowserRouter>
          </QueryClientProvider>
        )
      })

      await waitFor(() => {
        expect(mockGetMeditationDetails).toHaveBeenCalledWith('456')
      })
    })

    it('does not fetch when id is missing', async () => {
      mockUseParams.mockReturnValue({ id: undefined })

      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockGetMeditationDetails).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        const backButton = screen.getByLabelText('Back')
        expect(backButton).toBeInTheDocument()
      })
    })

    it('has proper heading hierarchy', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        const heading = screen.getByText('Meditation Details')
        expect(heading.tagName).toBe('H1')
        expect(heading).toHaveClass('text-xl', 'font-semibold')
      })
    })

    it('has proper button focus styles', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        const editButton = screen.getByText('Edit Meditation')
        const buttonElement = editButton.closest('button')
        expect(buttonElement).toHaveClass(
          'focus:outline-none',
          'focus:ring-2',
          'focus:ring-primaryGreen/50'
        )
      })
    })
  })

  describe('Integration with CreateMeditation Component', () => {
    it('passes correct props to CreateMeditation modal', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Edit Meditation')).toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.click(screen.getByText('Edit Meditation'))
      })

      expect(screen.getByTestId('create-meditation-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-mode')).toHaveTextContent('Edit Mode')
    })

    it('closes modal and does not refresh if cancel is clicked', async () => {
      await act(async () => {
        renderWithProviders(<MeditationDetails />)
      })

      await waitFor(() => {
        expect(screen.getByText('Edit Meditation')).toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.click(screen.getByText('Edit Meditation'))
      })

      expect(mockGetMeditationDetails).toHaveBeenCalledTimes(1)

      await act(async () => {
        fireEvent.click(screen.getByTestId('close-modal'))
      })

      expect(mockGetMeditationDetails).toHaveBeenCalledTimes(1)
    })
  })
})
