import { fireEvent, render, screen } from '@testing-library/react'
import InactiveUsers from '../InactiveUsers'

const mockEnqueueSnackbar = jest.fn()
const mockNavigate = jest.fn()
const mockRefetch = jest.fn()
const mockSetPageParams = jest.fn()
const mockSetSelectedRows = jest.fn()
const mockUseInactiveUsers = jest.fn()
const mockDeactivateAdmin = jest.fn()
const mockActivateAdmin = jest.fn()
let mockDisableApis = false

jest.mock('../api', () => ({
  get DISABLE_NONLOGIN_APIS() {
    return mockDisableApis
  },
  useInactiveUsers: (...args: any[]) => mockUseInactiveUsers(...args),
  deActivateAdmin: (...args: any[]) => mockDeactivateAdmin(...args),
  activateAdmin: (...args: any[]) => mockActivateAdmin(...args),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../components/common/snackbar', () => {
  const actual = jest.requireActual('../../../components/common/snackbar')
  return {
    ...actual,
    useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
  }
})

jest.mock('../../../store/filterSore/adminUserStore', () => {
  const pageParams = {
    page: 1,
    page_size: 10,
    search: '',
    ordering: '',
    filters: {},
    sortColumn: '',
    sortType: '',
  }
  const storeFn: any = () => ({
    pageParams,
    setPageParams: mockSetPageParams,
    selectedRows: ['1', '2'],
    setSelectedRows: mockSetSelectedRows,
  })
  storeFn.getState = () => ({ pageParams })
  return { useAdminUserFilterStore: storeFn }
})

jest.mock('../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    return (
      <div data-testid="smart-table">
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
          onClick={() => props.handleColumnSort?.('name', 'asc')}
        >
          Sort Name
        </button>
        <button
          type="button"
          onClick={() => props.onSearchChange?.('anna')}
        >
          Search Change
        </button>
        <button type="button" onClick={() => props.onSearch?.('anna')}>
          Search Submit
        </button>
        <button
          type="button"
          onClick={() => props.actionProps?.[0]?.action?.({ id: '42' })}
        >
          View Action
        </button>
        <div>{props.emptyTitle}</div>
        <div>{props.emptySubTitle}</div>
      </div>
    )
  }
})

jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn(() => new Uint8Array([1, 2, 3])),
}))

jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}))

describe('InactiveUsers Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDisableApis = false
    mockRefetch.mockReset()
    mockRefetch.mockResolvedValue(undefined)
    mockDeactivateAdmin.mockResolvedValue({ message: 'Deactivated' })
    mockActivateAdmin.mockResolvedValue({ message: 'Activated' })
  })

  it('shows the disabled build message when apis are disabled', () => {
    mockDisableApis = true
    mockUseInactiveUsers.mockReturnValue({
      data: { items: [], total: 0, current_page: 1 },
      refetch: mockRefetch,
      isFetching: false,
    })

    render(<InactiveUsers />)
    expect(
      screen.getByText('This section is disabled for this build.')
    ).toBeInTheDocument()
  })

  it('shows warning when exporting with no data and wires list actions', () => {
    mockUseInactiveUsers.mockReturnValue({
      data: { items: [], total: 0, current_page: 1 },
      refetch: mockRefetch,
      isFetching: false,
    })

    render(<InactiveUsers />)
    fireEvent.click(screen.getByText(/Download Excel/i))

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'No data available to export',
      { variant: 'warning' }
    )

    fireEvent.click(screen.getByText('Page 2'))
    fireEvent.click(screen.getByText('Rows 20'))
    fireEvent.click(screen.getByText('Sort Name'))
    fireEvent.click(screen.getByText('Search Change'))
    fireEvent.click(screen.getByText('Search Submit'))
    fireEvent.click(screen.getByText('View Action'))
    fireEvent.click(screen.getByText('Client'))
    fireEvent.click(screen.getByText('Nutritionist'))
    fireEvent.click(screen.getByText('Inactive Users'))

    expect(mockNavigate).toHaveBeenCalledWith('/users/42/details')
    expect(mockNavigate).toHaveBeenCalledWith('/users')
    expect(mockNavigate).toHaveBeenCalledWith('/users/nutritionist')
    expect(mockNavigate).toHaveBeenCalledWith('/admin/inactive-users')
  })

  it('exports an excel file when data exists', () => {
    mockUseInactiveUsers.mockReturnValue({
      data: {
        items: [
          {
            id: 1,
            name: 'A',
            email: 'a@a.com',
            phone: '1',
            subscription: { plan_name: 'Starter' },
          },
        ],
        total: 1,
        current_page: 1,
      },
      refetch: mockRefetch,
      isFetching: false,
    })

    render(<InactiveUsers />)
    fireEvent.click(screen.getByText(/Download Excel/i))

    const { saveAs } = jest.requireMock('file-saver')
    expect(saveAs).toHaveBeenCalled()
  })
})
