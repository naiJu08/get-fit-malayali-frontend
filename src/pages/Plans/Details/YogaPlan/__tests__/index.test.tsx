import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import YogaPlanIndex from '../index'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' }),
}))

const mockSetPageParams = jest.fn()
let mockPageParams: any = {
  page: 1,
  per_page: 10,
  search: '',
  ordering: '',
  sortColumn: undefined,
  sortType: undefined,
}
jest.mock('../../../../../store/filterSore/adminUserStore', () => ({
  useAdminUserFilterStore: () => ({
    pageParams: mockPageParams,
    setPageParams: mockSetPageParams,
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

const mockUseYogaPlans = jest.fn()
jest.mock('../api', () => ({
  useYogaPlans: (...args: any[]) => mockUseYogaPlans(...args),
}))

jest.mock('../../../../../components/common/icons', () => ({
  __esModule: true,
  default: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>,
}))

jest.mock('../../../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    // call custom cell renderers to cover column definitions
    const row = { id: 4, plan_id: 1, day_number: 1, title: 'T', description: 'D', exercises_count: 2, total_duration: 10 }
    const renderedCells =
      Array.isArray(props.columns) && props.columns.length
        ? props.columns
            .filter((c: any) => typeof c?.renderCell === 'function')
            .map((c: any, idx: number) => {
              const out = c.renderCell(row)
              return (
                <div key={idx} data-testid={`cell-${c.field}`}>
                  {out?.cell ?? null}
                </div>
              )
            })
        : null

    return (
      <div data-testid="smart-table">
        <div data-testid="table-title">{props.title}</div>
        {renderedCells}
        <input
          data-testid="search-input"
          value={props.searchValue || ''}
          onChange={(e) => props.onSearchChange?.((e.target as any).value)}
        />
        <button data-testid="do-search" onClick={() => props.onSearch?.()}>
          Search
        </button>
        <button
          data-testid="do-sort"
          onClick={() => props.handleColumnSort?.('title', 'asc')}
        >
          Sort
        </button>
        <button
          data-testid="page-2"
          onClick={() => props.paginationProps?.onPagination?.(2)}
        >
          Page2
        </button>
        <button
          data-testid="per-20"
          onClick={() => props.paginationProps?.onRowsPerPage?.(20)}
        >
          Per20
        </button>
        {props.actionProps?.map((a: any, idx: number) => (
          <button
            key={idx}
            data-testid={`action-${String(a.title).toLowerCase()}`}
            onClick={() =>
              a.action({ id: 4, plan_id: 1, day_number: 1, title: 'T' })
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
  return function MockYogaPlanForm(props: any) {
    return (
      <div data-testid="yoga-form">
        {props.isOpen ? <span data-testid="edit-open" /> : null}
      </div>
    )
  }
})

const renderWithProviders = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>)

describe('YogaPlanIndex', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRoleName = 'admin'
    mockPageParams = {
      page: 1,
      per_page: 10,
      search: '',
      ordering: '',
      sortColumn: undefined,
      sortType: undefined,
    }
    mockUseYogaPlans.mockReturnValue({
      data: { yoga_plans: [{ id: 4, plan_id: 1 }], meta: {} },
      isFetching: false,
    })
  })

  it('shows actions for admin', () => {
    renderWithProviders(<YogaPlanIndex planId={1} planName="Yoga" />)
    expect(screen.getByTestId('action-view')).toBeInTheDocument()
    expect(screen.getByTestId('action-edit')).toBeInTheDocument()
  })

  it('hides actions for nutritionist', () => {
    mockRoleName = 'nutritionist'
    renderWithProviders(<YogaPlanIndex planId={1} planName="Yoga" />)
    expect(screen.queryByTestId('action-view')).not.toBeInTheDocument()
    expect(screen.queryByTestId('action-edit')).not.toBeInTheDocument()
  })

  it('navigates on view and opens edit modal', async () => {
    renderWithProviders(<YogaPlanIndex planId={1} planName="Yoga" />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('action-view'))
    })
    expect(mockNavigate).toHaveBeenCalledWith('/plans/1/yoga_details/4')

    await act(async () => {
      fireEvent.click(screen.getByTestId('action-edit'))
    })
    expect(screen.getByTestId('edit-open')).toBeInTheDocument()
  })

  it('updates search/sort/pagination via SmartTable callbacks', async () => {
    renderWithProviders(<YogaPlanIndex planId={1} planName="Yoga" />)

    await act(async () => {
      fireEvent.change(screen.getByTestId('search-input'), {
        target: { value: 'abc' },
      })
      fireEvent.click(screen.getByTestId('do-search'))
      fireEvent.click(screen.getByTestId('do-sort'))
      fireEvent.click(screen.getByTestId('page-2'))
      fireEvent.click(screen.getByTestId('per-20'))
    })

    expect(mockSetPageParams).toHaveBeenCalled()
  })

  it('resets page to 1 on mount when current page is not 1', async () => {
    mockPageParams = { ...mockPageParams, page: 2 }
    renderWithProviders(<YogaPlanIndex planId={1} planName="Yoga" />)
    expect(mockSetPageParams).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    )
  })

  it('day column cell button navigates to details', async () => {
    renderWithProviders(<YogaPlanIndex planId={1} planName="Yoga" />)
    const dayBtn = screen.getByRole('button', { name: '1' })
    await act(async () => {
      fireEvent.click(dayBtn)
    })
    expect(mockNavigate).toHaveBeenCalledWith('/plans/1/yoga_details/4')
  })
})
