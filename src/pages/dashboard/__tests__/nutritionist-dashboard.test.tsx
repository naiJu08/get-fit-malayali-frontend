import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import NutritionistDashboardView from '../nutritionist-dashboard'
import { useLayoutStore } from '../../../store/layoutStore'

const mockSetLayoutType = jest.fn()
jest.mock('../../../store/layoutStore', () => ({
  useLayoutStore: () => ({
    setLayoutType: mockSetLayoutType,
  }),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockData = {
  generated_at: '2026-05-26T15:30:00.000Z',
  date_info: {
    range_start: '2026-05-01T00:00:00.000Z',
    range_end: '2026-05-26T00:00:00.000Z',
  },
  nutritionist: {
    name: 'Dr. John Doe',
  },
  clients: {
    total: 25,
    by_status: {
      active: 20,
      suspended: 3,
      deactivated: 2,
    },
    hints: {
      by_status: 'Status list info',
    },
  },
  subscriptions: {
    active_or_paused: 18,
    expiring_soon: 4,
    expiring_within_days: 7,
  },
  alerts: {
    expiring_soon: ['Client A subscription is expiring soon'],
    inactive: ['Client B has been inactive for 7 days'],
    missing_diet_template_today: ['Client C is missing diet plan'],
  },
  engagement: {
    totals: {
      diet_item_completions: 120,
      workout_completions: 90,
      yoga_completions: 30,
      meditation_completions: 25,
    },
    hints: {
      totals: 'Engagement activity metrics',
    },
  },
}

describe('NutritionistDashboardView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets layout type to sideNav on mount', () => {
    render(
      <NutritionistDashboardView
        data={mockData}
        loading={false}
        error={false}
        onRetry={jest.fn()}
      />
    )
    expect(mockSetLayoutType).toHaveBeenCalledWith('sideNav')
  })

  it('renders loading pulses when loading is true', () => {
    const { container } = render(
      <NutritionistDashboardView
        data={mockData}
        loading={true}
        error={false}
        onRetry={jest.fn()}
      />
    )
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(screen.queryByText('Nutritionist Workspace')).not.toBeInTheDocument()
  })

  it('renders error block and handles retry click when error is true', () => {
    const handleRetry = jest.fn()
    render(
      <NutritionistDashboardView
        data={mockData}
        loading={false}
        error={true}
        onRetry={handleRetry}
      />
    )
    expect(screen.getByText('Dashboard unavailable')).toBeInTheDocument()
    
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(handleRetry).toHaveBeenCalled()
  })

  it('renders nutritionist info, clients, active subs count in header', () => {
    render(
      <NutritionistDashboardView
        data={mockData}
        loading={false}
        error={false}
        onRetry={jest.fn()}
      />
    )
    expect(screen.getByText('Nutritionist Workspace')).toBeInTheDocument()
    expect(screen.getByText('Dr. John Doe')).toBeInTheDocument()
    expect(screen.getAllByText('25').length).toBeGreaterThan(0)
    expect(screen.getAllByText('18').length).toBeGreaterThan(0)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0) // Total alerts in header
  })

  it('navigates to appropriate tabs on stat card clicks', () => {
    render(
      <NutritionistDashboardView
        data={mockData}
        loading={false}
        error={false}
        onRetry={jest.fn()}
      />
    )

    // Click clients stat card
    const statCards = document.querySelectorAll('.db-grid-2 > div')
    const clientsCard = statCards[0]
    fireEvent.click(clientsCard)
    expect(mockNavigate).toHaveBeenCalledWith('/users')

    // Click subscriptions stat card
    const subsCard = statCards[1]
    fireEvent.click(subsCard)
    expect(mockNavigate).toHaveBeenCalledWith('/subscriptions')
  })

  it('renders client status breakdowns in client status card', () => {
    render(
      <NutritionistDashboardView
        data={mockData}
        loading={false}
        error={false}
        onRetry={jest.fn()}
      />
    )
    expect(screen.getByText('Client Status')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('suspended')).toBeInTheDocument()
    expect(screen.getByText('deactivated')).toBeInTheDocument()
  })

  it('renders engagement totals details in client engagement card', () => {
    render(
      <NutritionistDashboardView
        data={mockData}
        loading={false}
        error={false}
        onRetry={jest.fn()}
      />
    )
    expect(screen.getByText('Client Engagement')).toBeInTheDocument()
    expect(screen.getByText('Diet')).toBeInTheDocument()
    expect(screen.getByText('Workout')).toBeInTheDocument()
    expect(screen.getByText('Yoga')).toBeInTheDocument()
    expect(screen.getByText('Meditation')).toBeInTheDocument()
  })

  it('renders alerts details in alerts card', () => {
    render(
      <NutritionistDashboardView
        data={mockData}
        loading={false}
        error={false}
        onRetry={jest.fn()}
      />
    )
    expect(screen.getAllByText('Alerts').length).toBeGreaterThan(0)
    expect(screen.getByText('Expiring Soon')).toBeInTheDocument()
    expect(screen.getByText('Inactive Clients')).toBeInTheDocument()
    expect(screen.getByText('Missing Diet Template Today')).toBeInTheDocument()
  })
})
