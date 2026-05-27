import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import WorkoutPlanIndex from '../index'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' }),
}))

jest.mock('../../../../../store/filterSore/adminUserStore', () => ({
  useAdminUserFilterStore: () => ({
    pageParams: {
      page: 1,
      per_page: 10,
      search: '',
      ordering: '',
      sortColumn: undefined,
      sortType: undefined,
    },
    setPageParams: jest.fn(),
  }),
}))

jest.mock('../../../../../utilities/parsers', () => ({
  getSortedColumnName: (c: string, d: string) => `${c}_${d}`,
}))

jest.mock('../../../../../utilities/calcHeight', () => ({
  calcWindowHeight: () => 600,
}))

let mockRoleName = 'admin'
jest.mock('../../../../../store/authStore', () => ({
  useAuthStore: (selector: any) =>
    selector({ roleData: { name: mockRoleName } }),
}))

const mockUseWorkoutPlans = jest.fn()
jest.mock('../api', () => ({
  useWorkoutPlans: (...args: any[]) => mockUseWorkoutPlans(...args),
}))

jest.mock('../../../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>,
}))

jest.mock('../../../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    return (
      <div data-testid="smart-table">
        <div data-testid="table-title">{props.title}</div>
        {props.actionProps?.map((a: any, idx: number) => (
          <button
            key={idx}
            data-testid={`action-${String(a.title).toLowerCase()}`}
            onClick={() =>
              a.action({ id: 9, plan_id: 1, title: 'T', day_number: 1 })
            }
          >
            {a.title}
          </button>
        ))}
      </div>
    )
  }
})

jest.mock('../create', () => {
  return function MockWorkoutPlanForm(props: any) {
    return (
      <div data-testid="workout-form">
        {props.isOpen ? <span data-testid="edit-open" /> : null}
      </div>
    )
  }
})

const renderWithProviders = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>)

describe('WorkoutPlanIndex', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRoleName = 'admin'
    mockUseWorkoutPlans.mockReturnValue({
      data: { workout_plans: [{ id: 9, plan_id: 1 }], meta: {} },
      isFetching: false,
    })
  })

  it('shows actions for admin', () => {
    renderWithProviders(<WorkoutPlanIndex planId={1} planName="Workout" />)
    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    expect(screen.getByTestId('action-view')).toBeInTheDocument()
    expect(screen.getByTestId('action-edit')).toBeInTheDocument()
  })

  it('hides actions for nutritionist', () => {
    mockRoleName = 'nutritionist'
    renderWithProviders(<WorkoutPlanIndex planId={1} planName="Workout" />)
    expect(screen.queryByTestId('action-view')).not.toBeInTheDocument()
    expect(screen.queryByTestId('action-edit')).not.toBeInTheDocument()
  })

  it('navigates on view and opens edit modal', async () => {
    renderWithProviders(<WorkoutPlanIndex planId={1} planName="Workout" />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('action-view'))
    })
    expect(mockNavigate).toHaveBeenCalledWith('/plans/1/workout_details/9')

    await act(async () => {
      fireEvent.click(screen.getByTestId('action-edit'))
    })
    expect(screen.getByTestId('edit-open')).toBeInTheDocument()
  })
})
