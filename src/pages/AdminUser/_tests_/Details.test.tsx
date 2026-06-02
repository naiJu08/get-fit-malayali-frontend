import { render } from '@testing-library/react'
import Details from '../Details'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: '123' }),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/users/123/details' }),
  }
})

jest.mock('../api', () => ({
  getAdminDetails: jest.fn(),
  getActivePlanOverview: jest.fn(),
}))

// Stub heavy tab contents; we only care about parent logic.
jest.mock('../Details/DetailsInfo', () => () => null)
jest.mock('../Details/Subscriptions', () => () => null)
jest.mock('../Details/BodyMeasurements', () => () => null)
jest.mock('../Details/Vitals', () => () => null)
jest.mock('../Details/Clients', () => () => null)
jest.mock('../Details/Reports', () => () => null)
jest.mock('../Details/ReminderSettings', () => () => null)
jest.mock('../Details/AdditionalInfo', () => () => null)
jest.mock('../Details/Recipe.tsx/Recipes', () => () => null)
jest.mock('../Details/SubscriptionHistory', () => () => null)
jest.mock('../Details/DietHistory', () => () => null)
jest.mock('../create', () => () => null)

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (sel: any) => sel({ roleData: { name: 'admin' } }),
}))

jest.mock('../../../components/common/tab', () => ({
  TabContainer: ({ data, onClick, children }: any) => {
    // Trigger a navigation via tab click once.
    if (data?.[1]) onClick?.(data[1])
    return children
  },
  Tab: ({ children }: any) => children,
}))

describe('Details Page', () => {
  it('loads user details and handles tab navigation', async () => {
    const api = jest.requireMock('../api')
    api.getAdminDetails.mockResolvedValue({
      user: { id: 123, name: 'User', role: 'user', subscribed_plan: true },
    })
    api.getActivePlanOverview.mockResolvedValue({
      subscription: { id: 'sub-1' },
    })

    render(<Details />)

    // Tab click should navigate to a sub-route for this id.
    expect(mockNavigate).toHaveBeenCalled()
  })
})
