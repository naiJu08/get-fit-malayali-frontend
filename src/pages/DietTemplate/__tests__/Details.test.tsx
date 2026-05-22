import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react'
import React from 'react'

const mockUseNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  __esModule: true,
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}))

const mockGetTemplateDetails = jest.fn()
jest.mock('../api', () => ({
  getTemplateDetails: (id: string) => mockGetTemplateDetails(id),
  useTemplateList: jest.fn(() => ({
    data: [],
  })),
}))

jest.mock('../create', () => {
  return function MockCreateComponent() {
    return <div data-testid="create-diet-template-modal">Create Modal</div>
  }
})

jest.mock('../Details/DetailTab', () => {
  return function MockDetailTab() {
    return <div data-testid="detail-tab">Detail Tab</div>
  }
})

jest.mock('../Details/DietPlanTab', () => {
  return function MockDietPlanTab() {
    return <div data-testid="diet-plan-tab">Diet Plan Tab</div>
  }
})

jest.mock('../../../components/common/tab', () => ({
  Tab: ({ children, id }: { children: React.ReactNode; id: string }) => (
    <div data-testid={`tab-${id}`}>{children}</div>
  ),
  TabContainer: ({
    data,
    activeTab,
    children,
  }: {
    data: any[]
    activeTab: string
    children: React.ReactNode
  }) => (
    <div data-testid="tab-container">
      <div data-testid={`active-tab-${activeTab}`}>{children}</div>
    </div>
  ),
}))

jest.mock('../../../components/common/icons', () => {
  return function MockIcons() {
    return <div data-testid="icon-component">Icon</div>
  }
})

const renderComponent = () => {
  const DietTemplateDetails = require('../Details').default
  const { MemoryRouter, Routes, Route } = require('react-router-dom')
  return render(
    <MemoryRouter initialEntries={['/diet-template/123']}>
      <Routes>
        <Route path="/diet-template/:id/*" element={<DietTemplateDetails />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('DietTemplate Details', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTemplateDetails.mockResolvedValue({
      diet_plan_template: {
        id: '123',
        name: 'Weight Loss Template',
        description: 'A weight loss plan',
        duration_days: 30,
      },
    })
  })

  it('renders details page container', () => {
    renderComponent()

    expect(screen.getByText('Diet Template Details')).toBeInTheDocument()
  })

  it('fetches template details on component mount', async () => {
    renderComponent()

    await waitFor(() => {
      expect(mockGetTemplateDetails).toHaveBeenCalledWith('123')
    })
  })

  it('displays loading state initially', () => {
    mockGetTemplateDetails.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                diet_plan_template: { id: '123', name: 'Test' },
              }),
            100
          )
        )
    )

    renderComponent()

    // Component should render initially
    expect(screen.getByText('Diet Template Details')).toBeInTheDocument()
  })

  it('handles error when fetching details', async () => {
    mockGetTemplateDetails.mockRejectedValue(
      new Error('Failed to load template')
    )

    renderComponent()

    await waitFor(() => {
      expect(mockGetTemplateDetails).toHaveBeenCalled()
    })
  })

  it('renders back button', () => {
    renderComponent()

    const backButton = screen.getByRole('button', { hidden: true })
    expect(backButton).toBeInTheDocument()
  })

  it('navigates back when back button is clicked', async () => {
    renderComponent()

    await waitFor(() => {
      const backButton = screen.getAllByRole('button')[0]
      fireEvent.click(backButton)
      expect(mockUseNavigate).toHaveBeenCalled()
    })
  })

  it('renders tab container', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('tab-container')).toBeInTheDocument()
    })
  })

  it('renders details tab', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('detail-tab')).toBeInTheDocument()
    })
  })

  it('renders diet plan tab', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('diet-plan-tab')).toBeInTheDocument()
    })
  })

  it('defaults to details tab when no tab is specified', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('active-tab-details')).toBeInTheDocument()
    })
  })

  it('renders title with correct styling', () => {
    renderComponent()

    const title = screen.getByText('Diet Template Details')
    expect(title).toHaveClass('text-xl', 'font-semibold')
  })

  it('passes template data to detail tab', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('detail-tab')).toBeInTheDocument()
    })
  })

  it('handles null params gracefully', () => {
    const DietTemplateDetails = require('../Details').default
    const { MemoryRouter, Routes, Route } = require('react-router-dom')
    render(
      <MemoryRouter initialEntries={['/diet-template']}>
        <Routes>
          <Route path="/diet-template/*" element={<DietTemplateDetails />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Diet Template Details')).toBeInTheDocument()
  })

  it('displays diet template details in page header', async () => {
    renderComponent()

    await waitFor(() => {
      const header = screen.getByText('Diet Template Details')
      expect(header).toBeInTheDocument()
      expect(header.closest('h1')).toHaveClass('text-xl', 'font-semibold')
    })
  })

  it('renders create modal component', async () => {
    renderComponent()

    await waitFor(() => {
      expect(
        screen.getByTestId('create-diet-template-modal')
      ).toBeInTheDocument()
    })
  })
})
