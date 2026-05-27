import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import PlanDetails from '../index'

const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn((...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    if (msg.includes('ReactDOMTestUtils.act')) return
    originalConsoleError(...args)
  })
})

afterAll(() => {
  console.error = originalConsoleError
})

const mockNavigate = jest.fn()
const mockUseParams = jest.fn(() => ({ id: '1' }))
let mockPathname = '/plans/1'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}))

const mockRefetch = jest.fn()
const mockUsePlan = jest.fn()
jest.mock('../../api', () => ({
  usePlan: (...args: any[]) => mockUsePlan(...args),
}))

jest.mock('../../create', () => {
  return function MockCreatePlan(props: any) {
    return (
      <div data-testid="edit-plan-modal">
        {props.isDrawerOpen ? <span data-testid="edit-open" /> : null}
      </div>
    )
  }
})

jest.mock('../../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>,
}))

jest.mock('../../../../components/app/alertBox/infoBox', () => ({
  __esModule: true,
  default: ({ content }: any) => <div data-testid="info-box">{content}</div>,
}))

// Minimal tab system: renders children for active tab id only
jest.mock('../../../../components/common/tab', () => ({
  TabContainer: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  Tab: ({ id, children }: any) => <div data-testid={`tab-${id}`}>{children}</div>,
}))

jest.mock('../WorkoutPlan', () => () => <div data-testid="workout-tab" />)
jest.mock('../DietPlan', () => () => <div data-testid="diet-tab" />)
jest.mock('../YogaPlan', () => () => <div data-testid="yoga-tab" />)

const mockAssignHandler = jest.fn()
jest.mock('../MeditationPlan', () => {
  const React = require('react')
  return function MockMeditationPlan({ registerAssignCTA }: any) {
    React.useEffect(() => {
      registerAssignCTA?.({ visible: true, handler: mockAssignHandler })
      return () => registerAssignCTA?.(null)
    }, [registerAssignCTA])
    return React.createElement('div', { 'data-testid': 'meditation-tab' })
  }
})

jest.mock('../DetailsInfo', () => {
  return function MockDetailsInfo({ onEdit }: any) {
    return (
      <div data-testid="details-info">
        <button data-testid="edit-btn" onClick={onEdit}>
          Edit
        </button>
      </div>
    )
  }
})

const renderWithProviders = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>)

describe('PlanDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({ id: '1' })
    mockPathname = '/plans/1'
    mockUsePlan.mockReturnValue({
      data: {
        plan: {
          id: 1,
          name: 'Plan',
          yoga_included: true,
          meditation_included: true,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })
  })

  it('renders and opens edit modal from details tab', async () => {
    renderWithProviders(<PlanDetails />)
    expect(screen.getByText('Plan Details')).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByTestId('edit-btn'))
    })
    expect(screen.getByTestId('edit-open')).toBeInTheDocument()
  })

  it('shows Assign button on meditation tab when CTA registered', () => {
    mockPathname = '/plans/1/meditationplan'
    renderWithProviders(<PlanDetails />)
    const assign = screen.getByRole('button', { name: 'Assign' })
    fireEvent.click(assign)
    expect(mockAssignHandler).toHaveBeenCalled()
  })

  it('normalizes /plans/:id/details to /plans/:id', () => {
    mockPathname = '/plans/1/details'
    renderWithProviders(<PlanDetails />)
    expect(mockNavigate).toHaveBeenCalledWith('/plans/1', { replace: true })
  })
})
