import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import WorkoutDetails from '../Details'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' }),
}))

const mockGetWorkoutDetails = jest.fn()
jest.mock('../api', () => ({
  getWorkoutDetails: (...args: any[]) => mockGetWorkoutDetails(...args),
}))

jest.mock('../create', () => {
  return function MockCreateWorkout({
    isDrawerOpen,
    handleClose,
    handleRefresh,
    rowData,
  }: any) {
    if (!isDrawerOpen) return null
    return (
      <div data-testid="create-workout-modal">
        <div data-testid="modal-workout-name">{rowData?.name}</div>
        <button data-testid="close-modal" onClick={handleClose}>
          Close
        </button>
        <button data-testid="refresh-modal" onClick={handleRefresh}>
          Refresh
        </button>
      </div>
    )
  }
})

jest.mock('../../../components/common/icons', () => {
  return function MockIcons({ name }: { name: string }) {
    return <span data-testid={`icon-${name}`}>{name}</span>
  }
})

jest.mock('../../../components/app/alertBox/infoBox', () => {
  return function MockInfoBox({ content }: { content: string }) {
    return <div data-testid="info-box">{content}</div>
  }
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/workout/1']}>{children}</MemoryRouter>
)

describe('WorkoutDetails Component', () => {
  const mockWorkoutData = {
    workout: {
      id: '1',
      name: 'Push Workout',
      description: 'Upper body strength',
      duration_minutes: '12.30',
      intensity_level: 'Moderate',
      category: {
        name: 'Push',
        main_category: { name: 'Strength' },
      },
      thumbnail_url: 'https://example.com/thumbnail.jpg',
      video_url: 'https://example.com/video.mp4',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetWorkoutDetails.mockReset()
  })

  const renderComponent = async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <WorkoutDetails />
        </TestWrapper>
      )
    })
  }

  it('renders loading state initially', async () => {
    mockGetWorkoutDetails.mockImplementation(() => new Promise(() => {}))

    await renderComponent()

    expect(screen.getByTestId('info-box')).toHaveTextContent(
      'Loading user details...'
    )
  })

  it('renders error state when API fails', async () => {
    mockGetWorkoutDetails.mockRejectedValue({
      response: { data: { message: 'Failed to load workout' } },
    })

    await renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('info-box')).toHaveTextContent(
        'Failed to load workout'
      )
    })
  })

  it('renders workout details successfully', async () => {
    mockGetWorkoutDetails.mockResolvedValue(mockWorkoutData)

    await renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Push workout')).toBeInTheDocument()
    })

    expect(screen.getByText('Upper body strength')).toBeInTheDocument()
    expect(screen.getByText('Moderate')).toBeInTheDocument()
    expect(screen.getByText('Strength')).toBeInTheDocument()
    expect(screen.getByText('Push')).toBeInTheDocument()
    expect(screen.getByText('12.30')).toBeInTheDocument()
  })

  it('renders back button and triggers navigation', async () => {
    mockGetWorkoutDetails.mockResolvedValue(mockWorkoutData)

    await renderComponent()

    await waitFor(() => {
      expect(screen.getByLabelText('Back')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Back'))
    })

    expect(mockNavigate).toHaveBeenCalledWith('/workout')
  })

  it('opens and closes edit modal', async () => {
    mockGetWorkoutDetails.mockResolvedValue(mockWorkoutData)

    await renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Edit Workout')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Edit Workout'))
    })

    expect(screen.getByTestId('create-workout-modal')).toBeInTheDocument()
    expect(screen.getByTestId('modal-workout-name')).toHaveTextContent(
      'Push Workout'
    )

    await act(async () => {
      fireEvent.click(screen.getByTestId('close-modal'))
    })

    expect(screen.queryByTestId('create-workout-modal')).not.toBeInTheDocument()
  })

  it('refreshes details from the edit modal callback', async () => {
    mockGetWorkoutDetails.mockResolvedValue(mockWorkoutData)

    await renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Edit Workout')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Edit Workout'))
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('refresh-modal'))
    })

    expect(mockGetWorkoutDetails).toHaveBeenCalledTimes(2)
  })

  it('renders media previews for valid thumbnail and video urls', async () => {
    mockGetWorkoutDetails.mockResolvedValue(mockWorkoutData)

    await renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Open thumbnail')).toBeInTheDocument()
    })

    expect(screen.getByAltText('Yoga thumbnail')).toHaveAttribute(
      'src',
      'https://example.com/thumbnail.jpg'
    )
    expect(document.querySelector('video')).toHaveAttribute(
      'src',
      'https://example.com/video.mp4'
    )

    await act(async () => {
      fireEvent.error(screen.getByAltText('Yoga thumbnail'))
    })

    expect(screen.getByAltText('Yoga thumbnail')).toHaveStyle({
      display: 'none',
    })
  })

  it('renders supported embedded video providers', async () => {
    const urls = [
      {
        source: 'https://www.youtube.com/watch?v=ABCDEFGHIJK',
        embed: 'https://www.youtube.com/embed/ABCDEFGHIJK',
      },
      {
        source: 'https://vimeo.com/123456',
        embed: 'https://player.vimeo.com/video/123456',
      },
      {
        source: 'https://drive.google.com/file/d/drive-file-id/view',
        embed: 'https://drive.google.com/file/d/drive-file-id/preview',
      },
    ]

    for (const url of urls) {
      mockGetWorkoutDetails.mockResolvedValueOnce({
        workout: {
          ...mockWorkoutData.workout,
          video_url: url.source,
        },
      })

      const { unmount } = render(
        <TestWrapper>
          <WorkoutDetails />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(document.querySelector('iframe')).toHaveAttribute(
          'src',
          url.embed
        )
      })

      unmount()
    }
  })

  it('renders dropbox videos through the raw content URL', async () => {
    mockGetWorkoutDetails.mockResolvedValue({
      workout: {
        ...mockWorkoutData.workout,
        video_url: 'https://www.dropbox.com/s/file-id/workout.mp4?dl=0',
      },
    })

    await renderComponent()

    await waitFor(() => {
      expect(document.querySelector('video')).toHaveAttribute(
        'src',
        'https://dl.dropboxusercontent.com/s/file-id/workout.mp4'
      )
    })
  })

  it('renders urls in detail fields as links', async () => {
    mockGetWorkoutDetails.mockResolvedValue({
      workout: {
        ...mockWorkoutData.workout,
        description: 'https://example.com/description',
      },
    })

    await renderComponent()

    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: 'https://example.com/description' })
      ).toHaveAttribute('href', 'https://example.com/description')
    })
  })

  it('does not render media previews when urls are missing', async () => {
    mockGetWorkoutDetails.mockResolvedValue({
      workout: {
        ...mockWorkoutData.workout,
        thumbnail_url: null,
        video_url: null,
      },
    })

    await renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Push workout')).toBeInTheDocument()
    })

    expect(screen.queryByText('Open thumbnail')).not.toBeInTheDocument()
    expect(document.querySelector('video')).not.toBeInTheDocument()
  })

  it('handles missing workout data gracefully', async () => {
    mockGetWorkoutDetails.mockResolvedValue({ workout: null })

    await renderComponent()

    await waitFor(() => {
      expect(screen.getAllByText('--').length).toBeGreaterThan(0)
    })
  })
})
