import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SubscriptionHistory from '../Details/SubscriptionHistory'

const mockNavigate = jest.fn()
const mockReload = jest.fn()
const mockUseUserSubscriptionHistory = jest.fn()
let mockUserId = 'user-1'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: mockUserId }),
  useNavigate: () => mockNavigate,
}))

jest.mock('../api', () => ({
  useUserSubscriptionHistory: (...args: any[]) =>
    mockUseUserSubscriptionHistory(...args),
}))

jest.mock('../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    return (
      <div data-testid="smart-table">
        <button
          type="button"
          onClick={() => props.onSearchChange?.('pro')}
        >
          Change Search
        </button>
        <button type="button" onClick={() => props.onSearch?.('pro')}>
          Submit Search
        </button>
        <button
          type="button"
          onClick={() => props.paginationProps?.onPagination?.(2)}
        >
          Page 2
        </button>
        <button
          type="button"
          onClick={() => props.paginationProps?.onRowsPerPage?.(20)}
        >
          Rows 20
        </button>
        <button
          type="button"
          onClick={() => props.handleColumnSort?.('plan_name', 'desc')}
        >
          Sort Desc
        </button>
        <button
          type="button"
          onClick={() => props.columns?.[0]?.rowClick?.({ id: 'sub-123' })}
        >
          Open Subscription
        </button>
        {props.columns?.map((column: any) => {
          const rendered = column.renderCell?.({
            id: 'sub-123',
            plan_name: 'Starter',
            plan_category: 'Weight Loss',
            plan_duration_days: 30,
            plan_fees: 99,
            start_date: '2026-01-01',
            end_date: '2026-02-01',
            status: 'paused',
            days_remaining: 12,
          })
          return (
            <div key={column.field ?? column.title}>
              <span>{column.title}</span>
              <span>{rendered?.toolTip ?? ''}</span>
            </div>
          )
        })}
      </div>
    )
  }
})

jest.mock('../../../utilities/calcHeight', () => ({
  calcWindowHeight: () => 400,
}))

describe('SubscriptionHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUserId = 'user-1'
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    })
  })

  it('shows a missing-id message', () => {
    mockUserId = ''
    mockUseUserSubscriptionHistory.mockReturnValue({
      data: null,
      isFetching: false,
      error: null,
    })
    render(<SubscriptionHistory />)

    expect(screen.getByText('User ID is required')).toBeInTheDocument()
  })

  it('shows loading and error states', () => {
    mockUseUserSubscriptionHistory.mockReturnValue({
      data: null,
      isFetching: true,
      error: null,
    })
    const { rerender } = render(<SubscriptionHistory />)

    expect(
      screen.getByText('Loading subscription history...')
    ).toBeInTheDocument()

    mockUseUserSubscriptionHistory.mockReturnValue({
      data: null,
      isFetching: false,
      error: new Error('boom'),
    })
    rerender(<SubscriptionHistory />)

    expect(
      screen.getByText('Failed to load subscription history')
    ).toBeInTheDocument()
    fireEvent.click(screen.getByText('Retry'))
    expect(mockReload).toHaveBeenCalled()
  })

  it('renders summary data, wires table handlers, and navigates from a row click', async () => {
    mockUseUserSubscriptionHistory.mockReturnValue({
      data: {
        subscription_history: [{ id: 'sub-123', plan_name: 'Starter' }],
        summary: {
          total_subscriptions: 7,
          active_subscriptions: 3,
        },
      },
      isFetching: false,
      error: null,
    })

    render(<SubscriptionHistory />)

    expect(screen.getByText('Total Subscriptions')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Paused')).toBeInTheDocument()
    expect(screen.getByText('30 days')).toBeInTheDocument()
    expect(screen.getByText('$99')).toBeInTheDocument()
    expect(screen.getAllByText('01/01/2026')[0]).toBeInTheDocument()

    fireEvent.click(screen.getByText('Change Search'))
    fireEvent.click(screen.getByText('Submit Search'))
    fireEvent.click(screen.getByText('Page 2'))
    fireEvent.click(screen.getByText('Rows 20'))
    fireEvent.click(screen.getByText('Sort Desc'))
    fireEvent.click(screen.getByText('Open Subscription'))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/subscriptions/sub-123')
    })
  })
})
