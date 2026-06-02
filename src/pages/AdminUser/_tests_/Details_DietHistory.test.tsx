import { render, screen, waitFor } from '@testing-library/react'
import DietHistory from '../Details/DietHistory'

jest.mock('../../../components/app/alertBox/infoBox', () => ({
  __esModule: true,
  default: ({ content }: any) => <div data-testid="info-box">{content}</div>,
}))

jest.mock('../../../apis/api.helpers', () => ({
  getData: jest.fn(),
}))

jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    SUBSCRIPTIONS: '/subscriptions',
  },
}))

describe('DietHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows empty subscription message when subscriptionId is missing', () => {
    render(<DietHistory subscriptionId={null} />)
    expect(
      screen.getByText(/No active subscription found for this user/i)
    ).toBeInTheDocument()
  })

  it('loads and renders diet history table (hides internal columns)', async () => {
    const { getData } = jest.requireMock('../../../apis/api.helpers')
    getData.mockResolvedValue({
      diet_template_history: [
        {
          id: 'h1',
          diet_plan_template_id: 'tpl',
          assigned_by_id: 'admin',
          created_at: '2026-01-01',
          template_name: 'starter',
          assigned_at: '2026-01-02',
          notes: null,
        },
      ],
    })

    render(<DietHistory subscriptionId="sub-1" />)

    expect(screen.getByText(/Loading diet history/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/Loading diet history/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText(/Diet template history/i)).toBeInTheDocument()
    // hidden columns shouldn't appear as headers
    expect(screen.queryByText(/^Id$/i)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Diet plan template id/i)
    ).not.toBeInTheDocument()

    // visible columns should show with formatted headers
    expect(screen.getByText(/Template name/i)).toBeInTheDocument()
    expect(screen.getByText(/Assigned at/i)).toBeInTheDocument()
    // nulls format as '--'
    expect(screen.getByText('--')).toBeInTheDocument()
  })

  it('shows api error message when request fails', async () => {
    const { getData } = jest.requireMock('../../../apis/api.helpers')
    getData.mockRejectedValue({
      response: { data: { message: 'boom' } },
    })

    render(<DietHistory subscriptionId={0} />)

    await waitFor(() => {
      expect(screen.getByTestId('info-box')).toHaveTextContent('boom')
    })
  })
})
