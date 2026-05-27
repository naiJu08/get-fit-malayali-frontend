import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import YogaPlanDetails from '../details'

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: () => ({ data: { categories: [] } }),
  }
})

const mockNavigate = jest.fn()
const mockSetSearchParams = jest.fn()
let mockInitialSearchParams: URLSearchParams = new URLSearchParams()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '2' }),
  useSearchParams: () => [mockInitialSearchParams, mockSetSearchParams],
}))

jest.mock('../../../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>,
}))

jest.mock('../../../../../components/app/alertBox/infoBox', () => ({
  __esModule: true,
  default: ({ content }: any) => <div data-testid="info-box">{content}</div>,
}))

jest.mock('../../../../../components/common/drawer', () => ({
  __esModule: true,
  default: ({
    open,
    children,
    title,
    handleSubmit,
    disableSubmit,
    hideSubmit,
    handleClose,
  }: any) => {
    if (!open) return null
    return (
      <div data-testid="drawer">
        <div data-testid="drawer-title">{title}</div>
        <div data-testid="drawer-open">{children}</div>
        {handleClose ? (
          <button data-testid="drawer-close" onClick={handleClose}>
            Close
          </button>
        ) : null}
        {handleSubmit && !hideSubmit ? (
          <button
            data-testid="drawer-submit"
            disabled={!!disableSubmit}
            onClick={handleSubmit}
          >
            Submit
          </button>
        ) : null}
      </div>
    )
  },
}))

jest.mock('../../../../../components/common/tab/Tab', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="tab">{children}</div>,
}))

jest.mock('../../../../../components/common', () => ({
  TabContainer: ({ children, data, onClick }: any) => (
    <div data-testid="tabs">
      {(data || []).map((t: any) => (
        <button
          key={t.id}
          data-testid={`tab-btn-${t.id}`}
          onClick={() => onClick?.(t)}
        >
          {t.label}
        </button>
      ))}
      {children}
    </div>
  ),
}))

jest.mock('../../../../Yoga/api', () => ({
  useYogaList: (...args: any[]) => (global as any).__mockUseYogaList(...args),
}))

jest.mock('../../../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: jest.fn() }),
}))

jest.mock('../../../../../store/authStore', () => ({
  useAuthStore: (selector: any) => selector({ roleData: { name: 'admin' } }),
}))

const mockGetYogaPlanDetails = jest.fn()
const mockAddYogaExercisesAsync = jest.fn()
const mockAddYogaExerciseAsync = jest.fn()
jest.mock('../api', () => ({
  getYogaPlanDetails: (...args: any[]) => mockGetYogaPlanDetails(...args),
  useAddYogaExercise: () => ({ mutateAsync: mockAddYogaExerciseAsync }),
  useAddYogaExercises: () => ({ mutateAsync: mockAddYogaExercisesAsync }),
}))

jest.mock('../create', () => (props: any) => (
  <div data-testid="yoga-form">
    {props.isOpen ? <span data-testid="edit-open" /> : null}
    {props.onSuccess ? (
      <button data-testid="trigger-success" onClick={() => props.onSuccess({})}>
        ok
      </button>
    ) : null}
  </div>
))

const renderWithProviders = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>)

describe('YogaPlanDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInitialSearchParams = new URLSearchParams()
    mockAddYogaExercisesAsync.mockResolvedValue({ message: 'ok' } as any)
    mockAddYogaExerciseAsync.mockResolvedValue({ message: 'ok' } as any)

    ;(global as any).__mockUseYogaList = jest.fn(() => ({
      data: {
        yogas: [
          {
            id: 11,
            name: 'pose a',
            video_url: 'https://youtu.be/abc',
            intensity: 'high',
            duration_seconds: 45,
            yoga_category: 'basic',
          },
          {
            id: 12,
            name: 'pose b',
            video_url: 'https://youtube.com/watch?v=def',
            intensity: 'low',
            duration_minutes: 2,
            yoga_category: 'advanced',
          },
        ],
      },
      isFetching: false,
    }))
  })

  it('shows loading state', async () => {
    mockGetYogaPlanDetails.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    )

    await act(async () => {
      renderWithProviders(<YogaPlanDetails />)
    })

    expect(screen.getAllByTestId('info-box')[0]).toHaveTextContent(
      'Loading yoga plan details...'
    )
  })

  it('renders header and back navigates to plan tab', async () => {
    mockGetYogaPlanDetails.mockResolvedValue({
      yoga_plan: { id: 2, plan_id: 9, plan_name: 'Plan 9' },
    })

    await act(async () => {
      renderWithProviders(<YogaPlanDetails />)
    })

    await waitFor(() => {
      expect(screen.getByText(/Yoga Plan Details/)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Back'))
    expect(mockNavigate).toHaveBeenCalledWith('/plans/9/yogaplan')
  })

  it('shows error state when details fetch fails', async () => {
    mockGetYogaPlanDetails.mockRejectedValue({
      response: { data: { message: 'Failed to load' } },
    })

    await act(async () => {
      renderWithProviders(<YogaPlanDetails />)
    })

    await waitFor(() => {
      expect(
        screen.getAllByTestId('info-box').some((n) =>
          n.textContent?.includes('Failed to load')
        )
      ).toBe(true)
    })
  })

  it('renders assign tab and opens assign drawer', async () => {
    mockInitialSearchParams = new URLSearchParams({ tab: 'assign' })
    mockGetYogaPlanDetails.mockResolvedValue({
      yoga_plan: {
        id: 2,
        plan_id: 9,
        plan_name: 'Plan 9',
        title: 'Day 1',
        day_number: 1,
        exercises_count: 2,
        total_duration: 10,
        description: 'Desc',
        exercises: [
          {
            id: 1,
            yoga_id: 11,
            sequence_number: 1,
            video_url: 'https://youtu.be/abc',
            title: 'Pose A',
            duration_seconds: 45,
            intensity: 'high',
          },
          {
            id: 2,
            yoga_id: 12,
            sequence_number: 2,
            video_url: 'https://youtube.com/watch?v=def',
            title: 'Pose B',
            duration_minutes: 2,
            intensity: 'low',
          },
        ],
      },
    })

    await act(async () => {
      renderWithProviders(<YogaPlanDetails />)
    })

    await waitFor(() => {
      expect(screen.getByText(/Yoga Plan Details/)).toBeInTheDocument()
      expect(screen.getByText('Assign')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Assign'))
    })

    expect(screen.getAllByTestId('drawer-open').length).toBeGreaterThan(0)
  })

  it('assign flow: select all -> next -> confirm posts via useAddYogaExercises', async () => {
    mockInitialSearchParams = new URLSearchParams({ tab: 'assign' })
    mockGetYogaPlanDetails.mockResolvedValue({
      yoga_plan: {
        id: 2,
        plan_id: 9,
        plan_name: 'Plan 9',
        title: 'Day 1',
        day_number: 1,
        exercises: [],
      },
    })

    await act(async () => {
      renderWithProviders(<YogaPlanDetails />)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Assign'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('drawer-title')).toHaveTextContent('Assign Yoga')
    })

    // select all visible yogas from mocked useYogaList
    await act(async () => {
      fireEvent.click(screen.getByText('Select All'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('drawer-submit')).not.toBeDisabled()
    })

    // next -> opens review drawer
    await act(async () => {
      fireEvent.click(screen.getByTestId('drawer-submit'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('drawer-title')).toHaveTextContent(
        'Review & Order Exercises'
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('drawer-submit'))
    })

    expect(mockAddYogaExercisesAsync).toHaveBeenCalled()
  })

  it('switches tabs via TabContainer', async () => {
    mockGetYogaPlanDetails.mockResolvedValue({
      yoga_plan: { id: 2, plan_id: 9, plan_name: 'Plan 9', exercises: [] },
    })

    await act(async () => {
      renderWithProviders(<YogaPlanDetails />)
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('tab-btn-assign'))
    })
    expect(mockSetSearchParams).toHaveBeenCalledWith({ tab: 'assign' })

    await act(async () => {
      fireEvent.click(screen.getByTestId('tab-btn-details'))
    })
    expect(mockSetSearchParams).toHaveBeenCalledWith({})
  })

  it('covers video duration capture and embed/url branches', async () => {
    // force HTMLMediaElement.duration to be stable for loadedmetadata
    Object.defineProperty(HTMLMediaElement.prototype, 'duration', {
      configurable: true,
      get: () => 75,
    })

    mockInitialSearchParams = new URLSearchParams({ tab: 'assign' })
    mockGetYogaPlanDetails.mockResolvedValue({
      yoga_plan: {
        id: 2,
        plan_id: 9,
        plan_name: 'Plan 9',
        title: 'Day 1',
        day_number: 1,
        exercises: [
          // invalid youtube URL -> new URL throws -> catch -> embed=''
          { id: 1, yoga_id: 11, video_url: 'https://youtube.com/watch?v=%' },
          // non-youtube URL -> embed='' -> <video />
          { id: 2, yoga_id: 12, video_url: 'https://example.com/v.mp4' },
        ],
      },
    })

    await act(async () => {
      renderWithProviders(<YogaPlanDetails />)
    })

    // trigger metadata load on the rendered video
    const videos = document.querySelectorAll('video')
    expect(videos.length).toBeGreaterThan(0)
    await act(async () => {
      fireEvent.loadedMetadata(videos[0] as any)
    })

    // duration label should appear using videoDurations path (75s => 1m 15s)
    await waitFor(() => {
      expect(screen.getByText('1m 15s')).toBeInTheDocument()
    })
  })

  it('changes category to trigger auto select effect, toggles selection, and hits fallback assign', async () => {
    mockInitialSearchParams = new URLSearchParams({ tab: 'assign' })
    mockAddYogaExercisesAsync.mockRejectedValueOnce(new Error('bulk fails'))
    mockGetYogaPlanDetails.mockResolvedValue({
      yoga_plan: { id: 2, plan_id: 9, plan_name: 'Plan 9', exercises: [] },
    })

    await act(async () => {
      renderWithProviders(<YogaPlanDetails />)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Assign'))
    })

    const categorySelect = screen.getByRole('combobox') as HTMLSelectElement
    await act(async () => {
      fireEvent.change(categorySelect, { target: { value: 'basic' } })
    })

    // effect should re-run yoga list with category filter applied
    expect((global as any).__mockUseYogaList).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'basic' })
    )

    // click a card to toggle selection (non-input target)
    await act(async () => {
      fireEvent.click(screen.getByText('Pose A'))
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('drawer-submit'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('drawer-title')).toHaveTextContent(
        'Review & Order Exercises'
      )
    })

    // drag drop smoke + confirm triggers fallback addYogaExerciseAsync
    const draggables = Array.from(
      document.querySelectorAll('[draggable=\"true\"]')
    ) as HTMLElement[]
    if (draggables.length >= 1) {
      await act(async () => {
        fireEvent.dragStart(draggables[0])
        fireEvent.dragOver(draggables[0])
        fireEvent.drop(draggables[0])
      })
    }

    await act(async () => {
      fireEvent.click(screen.getByTestId('drawer-submit'))
    })

    await waitFor(() => {
      expect(mockAddYogaExerciseAsync).toHaveBeenCalled()
    })
  })

  it('opens edit plan modal and fires success callback', async () => {
    mockGetYogaPlanDetails.mockResolvedValue({
      yoga_plan: { id: 2, plan_id: 9, plan_name: 'Plan 9', exercises: [] },
    })

    await act(async () => {
      renderWithProviders(<YogaPlanDetails />)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Edit Plan'))
    })
    expect(screen.getByTestId('edit-open')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByTestId('trigger-success'))
    })
  })
})
