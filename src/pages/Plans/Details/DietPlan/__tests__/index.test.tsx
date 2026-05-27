import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import DietPlanIndex from '../index'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' }),
}))

const mockSetPageParams = jest.fn()
jest.mock('../../../../../store/filterSore/adminUserStore', () => ({
  useAdminUserFilterStore: () => ({
    pageParams: {
      page: 1,
      per_page: 10,
      search: '',
      ordering: '',
      sortColumn: undefined,
      sortType: undefined,
      filters: {},
    },
    setPageParams: mockSetPageParams,
  }),
}))

jest.mock('../../../../../utilities/parsers', () => ({
  getSortedColumnName: (c: string, d: string) => `${c}_${d}`,
}))

jest.mock('../../../../../utilities/calcHeight', () => ({
  calcWindowHeight: () => 600,
}))

jest.mock('../../../../../layout/store', () => ({
  checkPermissions: () => true,
}))

jest.mock('../../../../../store/authStore', () => ({
  useAuthStore: (selector: any) => selector({ roleData: { name: 'admin' } }),
}))

const mockUseDietPlans = jest.fn()
const mockDeleteDietPlan = jest.fn()
jest.mock('../api', () => ({
  useDietPlans: (...args: any[]) => mockUseDietPlans(...args),
  useDeleteDietPlan: () => ({
    mutateAsync: (...args: any[]) => mockDeleteDietPlan(...args),
    isLoading: false,
  }),
}))

jest.mock('../../../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>,
}))

jest.mock('../../../../../components/common/buttons/Button', () => ({
  __esModule: true,
  default: ({ label, onClick }: any) => (
    <button onClick={onClick}>{label}</button>
  ),
}))

jest.mock('../../../../../components/common/modal/ConfirmDeleteModal', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm }: any) =>
    isOpen ? (
      <div data-testid="confirm-delete">
        <button data-testid="confirm-delete-btn" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    ) : null,
}))

jest.mock('../../../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    const sampleRow = {
      id: 7,
      plan_id: 1,
      day_number: 1,
      sequence_number: 1,
      meal_time: 'Breakfast',
      meal_name: '',
      items: [
        { meal_name: 'Egg', requirement: 'mandatory' },
        { meal_name: 'Oats', requirement: 'optional' },
      ],
      effective_total_calories: 123,
    }

    return (
      <div data-testid="smart-table">
        <div data-testid="table-title">{props.title}</div>
        <div data-testid="columns">
          {(props.columns || []).map((c: any, idx: number) => {
            if (!c?.renderCell) return null
            const rendered = c.renderCell(sampleRow)?.cell
            return (
              <div data-testid={`col-${idx}`} key={idx}>
                {rendered}
              </div>
            )
          })}
        </div>
        {props.actionProps?.map((a: any, idx: number) => (
          <button
            key={idx}
            data-testid={`action-${String(a.title).toLowerCase()}`}
            onClick={() =>
              a.action({ id: 7, plan_id: 1, day_number: 1, items: [] })
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
  return function MockDietPlanForm(props: any) {
    return (
      <div data-testid="diet-form">
        {props.isOpen ? (
          <span data-testid={props.edit ? 'edit-open' : 'create-open'} />
        ) : null}
      </div>
    )
  }
})

const renderWithProviders = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>)

describe('DietPlanIndex', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDietPlans.mockReturnValue({
      data: {
        diet_plans: [{ id: 7, plan_id: 1, day_number: 1 }],
        meta: { total_count: 1, current_page: 1, per_page: 10 },
      },
      isFetching: false,
    })
  })

  it('renders table and create button', () => {
    renderWithProviders(<DietPlanIndex planName="Diet Plans" planId={1} />)
    expect(screen.getByTestId('smart-table')).toBeInTheDocument()
    expect(screen.getByText('Create Diet Plan')).toBeInTheDocument()
  })

  it('opens create modal', async () => {
    renderWithProviders(<DietPlanIndex planName="Diet Plans" planId={1} />)
    await act(async () => {
      fireEvent.click(screen.getByText('Create Diet Plan'))
    })
    expect(screen.getByTestId('create-open')).toBeInTheDocument()
  })

  it('navigates on View action', async () => {
    renderWithProviders(<DietPlanIndex planName="Diet Plans" planId={1} />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('action-view'))
    })
    expect(mockNavigate).toHaveBeenCalledWith('/diet_details/7')
  })

  it('opens edit modal on Edit action', async () => {
    renderWithProviders(<DietPlanIndex planName="Diet Plans" planId={1} />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('action-edit'))
    })
    expect(screen.getByTestId('edit-open')).toBeInTheDocument()
  })

  it('confirms delete and calls deleteDietPlan', async () => {
    renderWithProviders(<DietPlanIndex planName="Diet Plans" planId={1} />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('action-delete'))
    })
    expect(screen.getByTestId('confirm-delete')).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-delete-btn'))
    })
    expect(mockDeleteDietPlan).toHaveBeenCalledWith(7)
  })
})
