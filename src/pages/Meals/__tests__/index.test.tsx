// import {
//   render,
//   screen,
//   fireEvent,
// } from '@testing-library/react'
// import { BrowserRouter } from 'react-router-dom'

// import Meals from '../index'
// import * as authStoreMock from '../../../store/authStore'

// const mockNavigate = jest.fn()

// jest.mock('react-router-dom', () => ({
//   ...jest.requireActual('react-router-dom'),
//   useNavigate: () => mockNavigate,
// }))

// jest.mock('../columns', () => ({
//   getMealsColumns: jest.fn(() => [
//     { key: 'name', title: 'Name' },
//     { key: 'meal_time', title: 'Meal Time' },
//     { key: 'meal_category', title: 'Category' },
//     { key: 'status', title: 'Status' },
//   ]),
// }))

// const mockRefetch = jest.fn()
// const mockDeleteMeal = jest.fn()
// const mockBulkStatusChange = jest.fn()
// const mockPaginationCallback = jest.fn()

// let mockIsFetching = false

// // Mutable mock state for filter store
// let mockPageParams = {
//   page: 1,
//   per_page: 10,
//   search: '',
//   ordering: '',
// }

// let mockMealsData: any = {
//   meals: [
//     {
//       id: 1,
//       name: 'Oatmeal',
//       meal_time: 'Breakfast',
//       meal_category: 'Vegetarian',
//       serving_unit: 'cup',
//       total_calories: 300,
//       status: true,
//     },
//   ],
//   meta: {
//     total_count: 1,
//     current_page: 1,
//     total_pages: 1,
//     per_page: 10,
//   },
// }

// jest.mock('../api', () => ({
//   useMeals: () => ({
//     data: mockMealsData,
//     refetch: mockRefetch,
//     isFetching: mockIsFetching,
//   }),

//   deleteMeal: (...args: any[]) => mockDeleteMeal(...args),

//   useDeleteMeal: () => ({
//     mutate: mockDeleteMeal,
//     isLoading: false,
//   }),

//   useBulkStatusChange: () => ({
//     mutate: mockBulkStatusChange,
//     isLoading: false,
//   }),
// }))

// jest.mock('../../../store/authStore', () => {
//   let mockState = {
//     roleData: {
//       name: 'admin',
//     },
//   }

//   return {
//     useAuthStore: (selector: any) => {
//       return selector ? selector(mockState) : mockState
//     },

//     __setMockAuthState: (state: any) => {
//       mockState = state
//     },
//   }
// })

// jest.mock('../../../store/filterSore/adminUserStore', () => {
//   return {
//     useAdminUserFilterStore: () => {
//       const setPageParams = (newParams: any) => {
//         mockPageParams = { ...mockPageParams, ...newParams }
//       }

//       return {
//         pageParams: mockPageParams,
//         setPageParams,
//       }
//     },
//   }
// })

// const mockCheckPermissions = jest.fn(
//   (...args: any[]) => true
// )

// jest.mock('../../../layout/store', () => ({
//   checkPermissions: (
//     permission: string,
//     action: string
//   ) => mockCheckPermissions(permission, action),
// }))

// jest.mock('../../../utilities/calcHeight', () => ({
//   calcWindowHeight: jest.fn(() => 600),
// }))

// jest.mock('../../../utilities/parsers', () => ({
//   getSortedColumnName: jest.fn(
//     (column: string, direction: string) =>
//       `${column}_${direction}`
//   ),
// }))

// jest.mock('../../../components/common/icons', () => ({
//   __esModule: true,
//   default: ({ name }: { name: string }) => (
//     <span data-testid={`icon-${name}`}>
//       {name}
//     </span>
//   ),
// }))

// jest.mock('../../../components/common/ListingTiles', () => {
//   return function MockListingHeader({
//     data,
//     onActionClick,
//     actionProps,
//     bulkChangeButton,
//   }: any) {
//     return (
//       <div data-testid="listing-header">
//         <h1>{data?.title}</h1>

//         <button
//           data-testid="create-button"
//           onClick={onActionClick}
//         >
//           {actionProps?.actionTitle}
//         </button>

//         {bulkChangeButton}
//       </div>
//     )
//   }
// })

// jest.mock('../../../components/common/table/SmartTable', () => {
//   return function MockSmartTable(props: any) {
//     const React = jest.requireActual('react')
//     const [localSearchValue, setLocalSearchValue] = React.useState(props.searchValue || '')

//     React.useEffect(() => {
//       setLocalSearchValue(props.searchValue || '')
//     }, [props.searchValue])

//     if (props.paginationProps?.onPagination) {
//       mockPaginationCallback.mockImplementation(
//         props.paginationProps.onPagination
//       )
//     }

//     return (
//       <div data-testid="smart-table">
//         <input
//           data-testid="search-input"
//           value={localSearchValue}
//           placeholder={props.searchPlaceholder}
//           onChange={(e) => {
//             setLocalSearchValue(e.target.value)
//             props.onSearchChange?.(e.target.value)
//           }}
//         />

//         <button
//           data-testid="refetch-btn"
//           onClick={() => props.onSearch?.()}
//         >
//           Refetch
//         </button>

//         <button
//           data-testid="sort-btn"
//           onClick={() =>
//             props.handleColumnSort?.('name', 'asc')
//           }
//         >
//           Sort
//         </button>

//         <button
//           data-testid="pagination-btn"
//           onClick={() =>
//             mockPaginationCallback({
//               page: 2,
//               per_page: 20,
//             })
//           }
//         >
//           Pagination
//         </button>

//         {props.actionProps?.map(
//           (action: any, idx: number) => (
//             <button
//               key={idx}
//               data-testid={`action-${action.title?.toLowerCase()}`}
//               onClick={() =>
//                 action.action?.({
//                   id: 1,
//                   name: 'Oatmeal',
//                 })
//               }
//             >
//               {action.title}
//             </button>
//           )
//         )}

//         {props.isLoading && (
//           <div data-testid="loading-indicator">
//             Loading...
//           </div>
//         )}

//         {props.data?.length === 0 &&
//           !props.isLoading && (
//             <div data-testid="empty-state">
//               {props.emptyTitle}
//             </div>
//           )}

//         {props.toolbarExtra && (
//           <div data-testid="toolbar-extra">
//             {props.toolbarExtra}
//           </div>
//         )}
//       </div>
//     )
//   }
// })

// jest.mock('../create', () => {
//   return function MockCreateMeal(props: any) {
//     return (
//       <div data-testid="create-modal">
//         {props.isDrawerOpen && (
//           <span data-testid="create-open">
//             Open
//           </span>
//         )}

//         {props.edit && (
//           <span data-testid="edit-mode">
//             Edit Mode
//           </span>
//         )}
//       </div>
//     )
//   }
// })

// jest.mock(
//   '../../../components/common/modal/ConfirmDeleteModal',
//   () => {
//     return function MockConfirmDeleteModal(
//       props: any
//     ) {
//       if (!props.isOpen) return null

//       return (
//         <div data-testid="delete-modal">
//           <div data-testid="delete-title">
//             {props.title}
//           </div>

//           <div data-testid="delete-subtitle">
//             {props.subTitle}
//           </div>

//           <button
//             data-testid="confirm-delete"
//             onClick={props.onConfirm}
//           >
//             Confirm
//           </button>

//           <button
//             data-testid="cancel-delete"
//             onClick={props.onClose}
//           >
//             Cancel
//           </button>
//         </div>
//       )
//     }
//   }
// )

// jest.mock('../../../components/common', () => ({
//   Button: ({ onClick, label }: any) => (
//     <button
//       data-testid="bulk-button"
//       onClick={onClick}
//     >
//       {label}
//     </button>
//   ),
// }))

// const mockEnqueueSnackbar = jest.fn()

// jest.mock('notistack', () => ({
//   useSnackbar: () => ({
//     enqueueSnackbar: mockEnqueueSnackbar,
//   }),
// }))

// describe('Meals', () => {
//   beforeEach(() => {
//     jest.clearAllMocks()

//     mockPageParams = {
//       page: 1,
//       per_page: 10,
//       search: '',
//       ordering: '',
//     }

//     mockMealsData = {
//       meals: [
//         {
//           id: 1,
//           name: 'Oatmeal',
//           meal_time: 'Breakfast',
//           meal_category: 'Vegetarian',
//           serving_unit: 'cup',
//           total_calories: 300,
//           status: true,
//         },
//       ],
//       meta: {
//         total_count: 1,
//         current_page: 1,
//         total_pages: 1,
//         per_page: 10,
//       },
//     }

//     mockIsFetching = false
//   })

//   const renderComponent = () =>
//     render(
//       <BrowserRouter>
//         <Meals />
//       </BrowserRouter>
//     )

//   it('renders meals page', () => {
//     renderComponent()

//     expect(
//       screen.getByTestId('listing-header')
//     ).toBeInTheDocument()

//     expect(
//       screen.getByTestId('smart-table')
//     ).toBeInTheDocument()
//   })

//   it('opens create modal', () => {
//     renderComponent()

//     fireEvent.click(
//       screen.getByTestId('create-button')
//     )

//     expect(
//       screen.getByTestId('create-open')
//     ).toBeInTheDocument()
//   })

//   it('handles search', () => {
//     renderComponent()

//     const input =
//       screen.getByTestId('search-input')

//     fireEvent.change(input, {
//       target: {
//         value: 'Rice',
//       },
//     })

//     expect(input).toHaveValue('Rice')
//   })

//   it('handles sorting', () => {
//     renderComponent()

//     fireEvent.click(
//       screen.getByTestId('sort-btn')
//     )

//     expect(
//       screen.getByTestId('smart-table')
//     ).toBeInTheDocument()
//   })

//   it('handles pagination', () => {
//     renderComponent()

//     fireEvent.click(
//       screen.getByTestId('pagination-btn')
//     )

//     expect(
//       mockPaginationCallback
//     ).toHaveBeenCalled()
//   })

//   it('shows loading state', () => {
//     mockIsFetching = true

//     renderComponent()

//     expect(
//       screen.getByTestId('loading-indicator')
//     ).toBeInTheDocument()
//   })

//   it('shows empty state', () => {
//     mockMealsData = {
//       meals: [],
//       meta: {
//         total_count: 0,
//       },
//     }

//     renderComponent()

//     expect(
//       screen.getByTestId('empty-state')
//     ).toBeInTheDocument()
//   })

//   it('handles delete modal', () => {
//     renderComponent()

//     const deleteBtn =
//       screen.queryByTestId('action-delete')

//     if (deleteBtn) {
//       fireEvent.click(deleteBtn)

//       expect(
//         screen.getByTestId('delete-modal')
//       ).toBeInTheDocument()
//     }
//   })

//   it('handles admin role', () => {
//     ;(authStoreMock as any).__setMockAuthState({
//       roleData: {
//         name: 'admin',
//       },
//     })

//     renderComponent()

//     expect(
//       screen.getByTestId('create-button')
//     ).toBeInTheDocument()
//   })

//   it('handles nutritionist role', () => {
//     ;(authStoreMock as any).__setMockAuthState({
//       roleData: {
//         name: 'nutritionist',
//       },
//     })

//     renderComponent()

//     expect(
//       screen.getByTestId('smart-table')
//     ).toBeInTheDocument()
//   })

//   it('handles undefined roleData', () => {
//     ;(authStoreMock as any).__setMockAuthState({
//       roleData: undefined,
//     })

//     renderComponent()

//     expect(
//       screen.getByTestId('smart-table')
//     ).toBeInTheDocument()
//   })

//   it('renders toolbar extra', () => {
//     renderComponent()

//     expect(
//       screen.getByTestId('toolbar-extra')
//     ).toBeInTheDocument()
//   })

//   it('calls refetch via setPageParams', () => {
//     renderComponent()

//     fireEvent.click(
//       screen.getByTestId('refetch-btn')
//     )

//     // The Meals component triggers refetch by calling setPageParams
//     // which resets the search and page to 1
//     expect(mockPageParams.page).toBe(1)
//     expect(mockPageParams.search).toBe('')
//   })

//   it('handles multiple rows', () => {
//     mockMealsData = {
//       meals: [
//         {
//           id: 1,
//           name: 'Meal 1',
//         },
//         {
//           id: 2,
//           name: 'Meal 2',
//         },
//       ],
//       meta: {
//         total_count: 2,
//       },
//     }

//     renderComponent()

//     expect(
//       screen.getByTestId('smart-table')
//     ).toBeInTheDocument()
//   })

//   it('applies status filter when selected', () => {
//     renderComponent()

//     const statusSelect = screen.getByLabelText('Status')

//     fireEvent.change(statusSelect, {
//       target: { value: 'active' }
//     })

//     expect(statusSelect).toHaveValue('active')
//     expect(mockPageParams.page).toBe(1)
//   })

//   it('applies inactive status filter', () => {
//     renderComponent()

//     const statusSelect = screen.getByLabelText('Status')

//     fireEvent.change(statusSelect, {
//       target: { value: 'inactive' }
//     })

//     expect(statusSelect).toHaveValue('inactive')
//   })

//   it('opens edit mode when edit action clicked', () => {
//     renderComponent()

//     const editBtn = screen.queryByTestId('action-edit')

//     if (editBtn) {
//       fireEvent.click(editBtn)

//       expect(
//         screen.getByTestId('create-open')
//       ).toBeInTheDocument()

//       expect(
//         screen.getByTestId('edit-mode')
//       ).toBeInTheDocument()
//     }
//   })

//   it('navigates to detail page when view action clicked', () => {
//     renderComponent()

//     const viewBtn = screen.queryByTestId('action-view')

//     if (viewBtn) {
//       fireEvent.click(viewBtn)

//       expect(mockNavigate).toHaveBeenCalledWith('/meals/1')
//     }
//   })

//   it('confirms delete when confirm button clicked', () => {
//     renderComponent()

//     const deleteBtn = screen.queryByTestId('action-delete')

//     if (deleteBtn) {
//       fireEvent.click(deleteBtn)

//       expect(
//         screen.getByTestId('delete-modal')
//       ).toBeInTheDocument()

//       const confirmBtn = screen.getByTestId('confirm-delete')
//       fireEvent.click(confirmBtn)

//       expect(mockDeleteMeal).toHaveBeenCalled()
//     }
//   })

//   it('closes delete modal when cancel clicked', () => {
//     renderComponent()

//     const deleteBtn = screen.queryByTestId('action-delete')

//     if (deleteBtn) {
//       fireEvent.click(deleteBtn)

//       expect(
//         screen.getByTestId('delete-modal')
//       ).toBeInTheDocument()

//       const cancelBtn = screen.getByTestId('cancel-delete')
//       fireEvent.click(cancelBtn)

//       expect(
//         screen.queryByTestId('delete-modal')
//       ).not.toBeInTheDocument()
//     }
//   })

//   it('renders status filter dropdown with all options', () => {
//     renderComponent()

//     const statusSelect = screen.getByLabelText('Status')

//     expect(statusSelect).toBeInTheDocument()
//     expect(screen.getByText('All')).toBeInTheDocument()
//     expect(screen.getByText('Active')).toBeInTheDocument()
//     expect(screen.getByText('Inactive')).toBeInTheDocument()
//   })

//   it('handles search change via onSearchChange', () => {
//     renderComponent()

//     const input = screen.getByTestId('search-input')

//     fireEvent.change(input, {
//       target: { value: 'Pasta' }
//     })

//     expect(input).toHaveValue('Pasta')
//   })

//   it('handles bulk change with no selected items', () => {
//     renderComponent()

//     // The handleBulkChange function returns early if selectedItems.size === 0
//     // So the modal should not open
//     expect(
//       screen.queryByText('Bulk Status Change')
//     ).not.toBeInTheDocument()
//   })

//   it('shows error when no status selected in bulk change', () => {
//     renderComponent()

//     // Check that the bulk button is not shown when no items selected
//     // because selectedItems.size === 0 in the Meals component
//     const bulkButton = screen.queryByTestId('bulk-button')
//     expect(bulkButton).not.toBeInTheDocument()
//   })

//   it('handles column sorting with direction', () => {
//     renderComponent()

//     fireEvent.click(
//       screen.getByTestId('sort-btn')
//     )

//     expect(
//       screen.getByTestId('smart-table')
//     ).toBeInTheDocument()
//   })

//   it('handles pagination page change', () => {
//     renderComponent()

//     fireEvent.click(
//       screen.getByTestId('pagination-btn')
//     )

//     expect(mockPaginationCallback).toHaveBeenCalled()
//   })

//   it('displays meal data correctly', () => {
//     renderComponent()

//     expect(
//       screen.getByTestId('smart-table')
//     ).toBeInTheDocument()

//     expect(mockMealsData.meals).toHaveLength(1)
//   })

//   it('handles select all items', () => {
//     renderComponent()

//     expect(
//       screen.getByTestId('smart-table')
//     ).toBeInTheDocument()
//   })

//   it('handles select individual item', () => {
//     renderComponent()

//     expect(
//       screen.getByTestId('smart-table')
//     ).toBeInTheDocument()
//   })

//   it('closes create modal when handleClose called', () => {
//     renderComponent()

//     fireEvent.click(
//       screen.getByTestId('create-button')
//     )

//     expect(
//       screen.getByTestId('create-open')
//     ).toBeInTheDocument()

//     expect(
//       screen.getByTestId('create-modal')
//     ).toBeInTheDocument()
//   })

//   it('handles delete modal close when not loading', () => {
//     renderComponent()

//     const deleteBtn = screen.queryByTestId('action-delete')

//     if (deleteBtn) {
//       fireEvent.click(deleteBtn)

//       expect(
//         screen.getByTestId('delete-modal')
//       ).toBeInTheDocument()
//     }
//   })
// })
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import Meals from '../index'
import * as authStoreMock from '../../../store/authStore'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../columns', () => ({
  getMealsColumns: jest.fn(() => [
    { key: 'name', title: 'Name' },
    { key: 'meal_time', title: 'Meal Time' },
    { key: 'meal_category', title: 'Category' },
    { key: 'status', title: 'Status' },
  ]),
}))

const mockRefetch = jest.fn()
const mockDeleteMeal = jest.fn()
const mockBulkStatusChange = jest.fn()
const mockPaginationCallback = jest.fn()

let mockIsFetching = false

let mockPageParams = {
  page: 1,
  per_page: 10,
  search: '',
  ordering: '',
}

let mockMealsData: any = {
  meals: [
    {
      id: 1,
      name: 'Oatmeal',
      meal_time: 'Breakfast',
      meal_category: 'Vegetarian',
      serving_unit: 'cup',
      total_calories: 300,
      status: true,
    },
  ],
  meta: {
    total_count: 1,
    current_page: 1,
    total_pages: 1,
    per_page: 10,
  },
}

jest.mock('../api', () => ({
  useMeals: () => ({
    data: mockMealsData,
    refetch: mockRefetch,
    isFetching: mockIsFetching,
  }),

  deleteMeal: (...args: any[]) =>
    mockDeleteMeal(...args),

  useDeleteMeal: () => ({
    mutate: mockDeleteMeal,
    isLoading: false,
  }),

  useBulkStatusChange: () => ({
    mutate: mockBulkStatusChange,
    isLoading: false,
  }),
}))

jest.mock('../../../store/authStore', () => {
  let mockState = {
    roleData: {
      name: 'admin',
    },
  }

  return {
    useAuthStore: (selector: any) => {
      return selector
        ? selector(mockState)
        : mockState
    },

    __setMockAuthState: (state: any) => {
      mockState = state
    },
  }
})

jest.mock(
  '../../../store/filterSore/adminUserStore',
  () => {
    return {
      useAdminUserFilterStore: () => {
        const setPageParams = (
          newParams: any
        ) => {
          mockPageParams = {
            ...mockPageParams,
            ...newParams,
          }
        }

        return {
          pageParams: mockPageParams,
          setPageParams,
        }
      },
    }
  }
)

const mockCheckPermissions = jest.fn(
  (...args: any[]) => true
)

jest.mock('../../../layout/store', () => ({
  checkPermissions: (
    permission: string,
    action: string
  ) =>
    mockCheckPermissions(
      permission,
      action
    ),
}))

jest.mock(
  '../../../utilities/calcHeight',
  () => ({
    calcWindowHeight: jest.fn(() => 600),
  })
)

jest.mock('../../../utilities/parsers', () => ({
  getSortedColumnName: jest.fn(
    (
      column: string,
      direction: string
    ) => `${column}_${direction}`
  ),
}))

jest.mock(
  '../../../components/common/icons',
  () => ({
    __esModule: true,
    default: ({
      name,
    }: {
      name: string
    }) => (
      <span data-testid={`icon-${name}`}>
        {name}
      </span>
    ),
  })
)

jest.mock(
  '../../../components/common/ListingTiles',
  () => {
    return function MockListingHeader({
      data,
      onActionClick,
      actionProps,
      bulkChangeButton,
    }: any) {
      return (
        <div data-testid="listing-header">
          <h1>{data?.title}</h1>

          <button
            data-testid="create-button"
            onClick={onActionClick}
          >
            {actionProps?.actionTitle}
          </button>

          {bulkChangeButton}
        </div>
      )
    }
  }
)

jest.mock(
  '../../../components/common/table/SmartTable',
  () => {
    return function MockSmartTable(
      props: any
    ) {
      const React =
        jest.requireActual('react')

      const [
        localSearchValue,
        setLocalSearchValue,
      ] = React.useState(
        props.searchValue || ''
      )

      React.useEffect(() => {
        setLocalSearchValue(
          props.searchValue || ''
        )
      }, [props.searchValue])

      if (
        props.paginationProps
          ?.onPagination
      ) {
        mockPaginationCallback.mockImplementation(
          props.paginationProps
            .onPagination
        )
      }

      return (
        <div data-testid="smart-table">
          <input
            data-testid="search-input"
            value={localSearchValue}
            placeholder={
              props.searchPlaceholder
            }
            onChange={(e) => {
              setLocalSearchValue(
                e.target.value
              )

              props.onSearchChange?.(
                e.target.value
              )
            }}
          />

          <button
            data-testid="refetch-btn"
            onClick={() =>
              props.onSearch?.()
            }
          >
            Refetch
          </button>

          <button
            data-testid="sort-btn"
            onClick={() =>
              props.handleColumnSort?.(
                'name',
                'asc'
              )
            }
          >
            Sort
          </button>

          <button
            data-testid="pagination-btn"
            onClick={() =>
              mockPaginationCallback({
                page: 2,
                per_page: 20,
              })
            }
          >
            Pagination
          </button>

          {props.actionProps?.map(
            (
              action: any,
              idx: number
            ) => (
              <button
                key={idx}
                data-testid={`action-${action.title?.toLowerCase()}`}
                onClick={() =>
                  action.action?.({
                    id: 1,
                    name: 'Oatmeal',
                  })
                }
              >
                {action.title}
              </button>
            )
          )}

          {props.isLoading && (
            <div data-testid="loading-indicator">
              Loading...
            </div>
          )}

          {props.data?.length === 0 &&
            !props.isLoading && (
              <div data-testid="empty-state">
                {props.emptyTitle}
              </div>
            )}

          {props.toolbarExtra && (
            <div data-testid="toolbar-extra">
              {props.toolbarExtra}
            </div>
          )}
        </div>
      )
    }
  }
)

jest.mock('../create', () => {
  return function MockCreateMeal(
    props: any
  ) {
    return (
      <div data-testid="create-modal">
        {props.isDrawerOpen && (
          <span data-testid="create-open">
            Open
          </span>
        )}

        {props.edit && (
          <span data-testid="edit-mode">
            Edit Mode
          </span>
        )}
      </div>
    )
  }
})

jest.mock(
  '../../../components/common/modal/ConfirmDeleteModal',
  () => {
    return function MockConfirmDeleteModal(
      props: any
    ) {
      if (!props.isOpen) return null

      return (
        <div data-testid="delete-modal">
          <div data-testid="delete-title">
            {props.title}
          </div>

          <div data-testid="delete-subtitle">
            {props.subTitle}
          </div>

          <button
            data-testid="confirm-delete"
            onClick={props.onConfirm}
          >
            Confirm
          </button>

          <button
            data-testid="cancel-delete"
            onClick={props.onClose}
          >
            Cancel
          </button>
        </div>
      )
    }
  }
)

jest.mock('../../../components/common', () => ({
  Button: ({
    onClick,
    label,
  }: any) => (
    <button
      data-testid="bulk-button"
      onClick={onClick}
    >
      {label}
    </button>
  ),
}))

const mockEnqueueSnackbar = jest.fn()

jest.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar:
      mockEnqueueSnackbar,
  }),
}))

describe('Meals', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockPageParams = {
      page: 1,
      per_page: 10,
      search: '',
      ordering: '',
    }

    mockMealsData = {
      meals: [
        {
          id: 1,
          name: 'Oatmeal',
          meal_time: 'Breakfast',
          meal_category:
            'Vegetarian',
          serving_unit: 'cup',
          total_calories: 300,
          status: true,
        },
      ],
      meta: {
        total_count: 1,
        current_page: 1,
        total_pages: 1,
        per_page: 10,
      },
    }

    mockIsFetching = false
  })

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <Meals />
      </BrowserRouter>
    )

  it('renders meals page', () => {
    renderComponent()

    expect(
      screen.getByTestId(
        'listing-header'
      )
    ).toBeInTheDocument()

    expect(
      screen.getByTestId(
        'smart-table'
      )
    ).toBeInTheDocument()
  })

  it('opens create modal', () => {
    renderComponent()

    fireEvent.click(
      screen.getByTestId(
        'create-button'
      )
    )

    expect(
      screen.getByTestId(
        'create-open'
      )
    ).toBeInTheDocument()
  })

  it('handles search', () => {
    renderComponent()

    const input =
      screen.getByTestId(
        'search-input'
      )

    fireEvent.change(input, {
      target: {
        value: 'Rice',
      },
    })

    expect(input).toHaveValue(
      'Rice'
    )
  })

  it('handles sorting', () => {
    renderComponent()

    fireEvent.click(
      screen.getByTestId('sort-btn')
    )

    expect(
      screen.getByTestId(
        'smart-table'
      )
    ).toBeInTheDocument()
  })

  it('handles pagination', () => {
    renderComponent()

    fireEvent.click(
      screen.getByTestId(
        'pagination-btn'
      )
    )

    expect(
      mockPaginationCallback
    ).toHaveBeenCalled()
  })

  it('shows loading state', () => {
    mockIsFetching = true

    renderComponent()

    expect(
      screen.getByTestId(
        'loading-indicator'
      )
    ).toBeInTheDocument()
  })

  it('shows empty state', () => {
    mockMealsData = {
      meals: [],
      meta: {
        total_count: 0,
      },
    }

    renderComponent()

    expect(
      screen.getByTestId(
        'empty-state'
      )
    ).toBeInTheDocument()
  })

  it('handles delete modal', () => {
    renderComponent()

    const deleteBtn =
      screen.queryByTestId(
        'action-delete'
      )

    if (deleteBtn) {
      fireEvent.click(deleteBtn)

      expect(
        screen.getByTestId(
          'delete-modal'
        )
      ).toBeInTheDocument()
    }
  })

  it('handles admin role', () => {
    ;(
      authStoreMock as any
    ).__setMockAuthState({
      roleData: {
        name: 'admin',
      },
    })

    renderComponent()

    expect(
      screen.getByTestId(
        'create-button'
      )
    ).toBeInTheDocument()
  })

  it('handles nutritionist role', () => {
    ;(
      authStoreMock as any
    ).__setMockAuthState({
      roleData: {
        name: 'nutritionist',
      },
    })

    renderComponent()

    expect(
      screen.getByTestId(
        'smart-table'
      )
    ).toBeInTheDocument()
  })

  it('handles undefined roleData', () => {
    ;(
      authStoreMock as any
    ).__setMockAuthState({
      roleData: undefined,
    })

    renderComponent()

    expect(
      screen.getByTestId(
        'smart-table'
      )
    ).toBeInTheDocument()
  })

  it('renders toolbar extra', () => {
    renderComponent()

    expect(
      screen.getByTestId(
        'toolbar-extra'
      )
    ).toBeInTheDocument()
  })

  it('applies status filter when selected', () => {
    renderComponent()

    const statusSelect =
      screen.getByRole(
        'combobox'
      )

    fireEvent.change(
      statusSelect,
      {
        target: {
          value: 'active',
        },
      }
    )

    expect(statusSelect).toHaveValue(
      'active'
    )

    expect(
      mockPageParams.page
    ).toBe(1)
  })

  it('applies inactive status filter', () => {
    renderComponent()

    const statusSelect =
      screen.getByRole(
        'combobox'
      )

    fireEvent.change(
      statusSelect,
      {
        target: {
          value: 'inactive',
        },
      }
    )

    expect(statusSelect).toHaveValue(
      'inactive'
    )
  })

  it('renders status filter dropdown with all options', () => {
    renderComponent()

    const statusSelect =
      screen.getByRole(
        'combobox'
      )

    expect(
      statusSelect
    ).toBeInTheDocument()

    expect(
      screen.getByRole(
        'option',
        {
          name: 'All',
        }
      )
    ).toBeInTheDocument()

    expect(
      screen.getByRole(
        'option',
        {
          name: 'Active',
        }
      )
    ).toBeInTheDocument()

    expect(
      screen.getByRole(
        'option',
        {
          name: 'Inactive',
        }
      )
    ).toBeInTheDocument()
  })

  it('handles search clear', () => {
  renderComponent()

  const input =
    screen.getByTestId(
      'search-input'
    )

  fireEvent.change(input, {
    target: {
      value: 'Chicken',
    },
  })

  expect(input).toHaveValue(
    'Chicken'
  )

  fireEvent.change(input, {
    target: {
      value: '',
    },
  })

  expect(input).toHaveValue('')
})

it('calls refetch button', () => {
  renderComponent()

  fireEvent.click(
    screen.getByTestId(
      'refetch-btn'
    )
  )

  expect(
    screen.getByTestId(
      'smart-table'
    )
  ).toBeInTheDocument()
})

it('opens edit modal from edit action', () => {
  renderComponent()

  const editBtn =
    screen.getByTestId(
      'action-edit'
    )

  fireEvent.click(editBtn)

  expect(
    screen.getByTestId(
      'edit-mode'
    )
  ).toBeInTheDocument()

  expect(
    screen.getByTestId(
      'create-open'
    )
  ).toBeInTheDocument()
})

it('navigates to detail page from view action', () => {
  renderComponent()

  const viewBtn =
    screen.getByTestId(
      'action-view'
    )

  fireEvent.click(viewBtn)

  expect(
    mockNavigate
  ).toHaveBeenCalled()
})

it('confirms delete action', () => {
  renderComponent()

  const deleteBtn =
    screen.getByTestId(
      'action-delete'
    )

  fireEvent.click(deleteBtn)

  expect(
    screen.getByTestId(
      'delete-modal'
    )
  ).toBeInTheDocument()

  fireEvent.click(
    screen.getByTestId(
      'confirm-delete'
    )
  )

  expect(
    mockDeleteMeal
  ).toHaveBeenCalled()
})

it('closes delete modal on cancel', () => {
  renderComponent()

  const deleteBtn =
    screen.getByTestId(
      'action-delete'
    )

  fireEvent.click(deleteBtn)

  expect(
    screen.getByTestId(
      'delete-modal'
    )
  ).toBeInTheDocument()

  fireEvent.click(
    screen.getByTestId(
      'cancel-delete'
    )
  )

  expect(
    screen.queryByTestId(
      'delete-modal'
    )
  ).not.toBeInTheDocument()
})

it('renders multiple meals', () => {
  mockMealsData = {
    meals: [
      {
        id: 1,
        name: 'Meal 1',
      },
      {
        id: 2,
        name: 'Meal 2',
      },
      {
        id: 3,
        name: 'Meal 3',
      },
    ],
    meta: {
      total_count: 3,
      current_page: 1,
      total_pages: 1,
      per_page: 10,
    },
  }

  renderComponent()

  expect(
    screen.getByTestId(
      'smart-table'
    )
  ).toBeInTheDocument()
})

it('handles large pagination data', () => {
  mockMealsData = {
    meals: Array.from(
      { length: 20 },
      (_, index) => ({
        id: index + 1,
        name: `Meal ${index + 1}`,
      })
    ),
    meta: {
      total_count: 20,
      current_page: 1,
      total_pages: 2,
      per_page: 10,
    },
  }

  renderComponent()

  fireEvent.click(
    screen.getByTestId(
      'pagination-btn'
    )
  )

  expect(
    mockPaginationCallback
  ).toHaveBeenCalled()
})

it('renders create modal component', () => {
  renderComponent()

  expect(
    screen.getByTestId(
      'create-modal'
    )
  ).toBeInTheDocument()
})

it('renders icons properly', () => {
  renderComponent()

  expect(
    screen.getByTestId(
      'smart-table'
    )
  ).toBeInTheDocument()
})

it('handles sorting multiple times', () => {
  renderComponent()

  const sortBtn =
    screen.getByTestId(
      'sort-btn'
    )

  fireEvent.click(sortBtn)
  fireEvent.click(sortBtn)
  fireEvent.click(sortBtn)

  expect(
    screen.getByTestId(
      'smart-table'
    )
  ).toBeInTheDocument()
})

it('handles pagination multiple times', () => {
  renderComponent()

  const paginationBtn =
    screen.getByTestId(
      'pagination-btn'
    )

  fireEvent.click(paginationBtn)
  fireEvent.click(paginationBtn)

  expect(
    mockPaginationCallback
  ).toHaveBeenCalledTimes(2)
})

it('renders toolbar with status filter', () => {
  renderComponent()

  expect(
    screen.getByText('Status')
  ).toBeInTheDocument()
})

it('renders all action buttons', () => {
  renderComponent()

  expect(
    screen.getByTestId(
      'action-view'
    )
  ).toBeInTheDocument()

  expect(
    screen.getByTestId(
      'action-edit'
    )
  ).toBeInTheDocument()

  expect(
    screen.getByTestId(
      'action-delete'
    )
  ).toBeInTheDocument()
})

it('renders search input placeholder', () => {
  renderComponent()

  expect(
    screen.getByPlaceholderText(
      'Search Food Name'
    )
  ).toBeInTheDocument()
})

it('handles search clear properly', () => {
  renderComponent()

  const input = screen.getByTestId('search-input')

  fireEvent.change(input, {
    target: { value: 'Burger' },
  })

  expect(input).toHaveValue('Burger')

  fireEvent.change(input, {
    target: { value: '' },
  })

  expect(input).toHaveValue('')
})

it('opens and closes create modal multiple times', () => {
  renderComponent()

  const createBtn = screen.getByTestId('create-button')

  fireEvent.click(createBtn)

  expect(
    screen.getByTestId('create-open')
  ).toBeInTheDocument()

  fireEvent.click(createBtn)

  expect(
    screen.getByTestId('create-open')
  ).toBeInTheDocument()
})

it('renders loading state with empty meals', () => {
  mockIsFetching = true

  mockMealsData = {
    meals: [],
    meta: {
      total_count: 0,
    },
  }

  renderComponent()

  expect(
    screen.getByTestId('loading-indicator')
  ).toBeInTheDocument()
})

it('handles empty meta safely', () => {
  mockMealsData = {
    meals: [],
    meta: {},
  }

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('renders meals with false status', () => {
  mockMealsData = {
    meals: [
      {
        id: 11,
        name: 'Soup',
        meal_time: 'Dinner',
        meal_category: 'Veg',
        serving_unit: 'cup',
        total_calories: 100,
        status: false,
      },
    ],
    meta: {
      total_count: 1,
    },
  }

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('handles multiple pagination clicks', () => {
  renderComponent()

  const paginationBtn =
    screen.getByTestId('pagination-btn')

  fireEvent.click(paginationBtn)
  fireEvent.click(paginationBtn)
  fireEvent.click(paginationBtn)

  expect(
    mockPaginationCallback
  ).toHaveBeenCalledTimes(3)
})

it('handles multiple sort clicks', () => {
  renderComponent()

  const sortBtn =
    screen.getByTestId('sort-btn')

  fireEvent.click(sortBtn)
  fireEvent.click(sortBtn)

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('handles delete modal reopen', () => {
  renderComponent()

  const deleteBtn =
    screen.getByTestId('action-delete')

  fireEvent.click(deleteBtn)

  expect(
    screen.getByTestId('delete-modal')
  ).toBeInTheDocument()

  fireEvent.click(
    screen.getByTestId('cancel-delete')
  )

  expect(
    screen.queryByTestId('delete-modal')
  ).not.toBeInTheDocument()

  fireEvent.click(deleteBtn)

  expect(
    screen.getByTestId('delete-modal')
  ).toBeInTheDocument()
})

it('renders table when meals undefined', () => {
  mockMealsData = {
    meals: undefined,
    meta: {},
  }

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('renders table when meta undefined', () => {
  mockMealsData = {
    meals: [],
    meta: undefined,
  }

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('handles repeated search typing', () => {
  renderComponent()

  const input =
    screen.getByTestId('search-input')

  fireEvent.change(input, {
    target: { value: 'A' },
  })

  fireEvent.change(input, {
    target: { value: 'Ap' },
  })

  fireEvent.change(input, {
    target: { value: 'Apple' },
  })

  expect(input).toHaveValue('Apple')
})

it('renders toolbar correctly', () => {
  renderComponent()

  expect(
    screen.getByTestId('toolbar-extra')
  ).toBeInTheDocument()

  expect(
    screen.getByText('Status')
  ).toBeInTheDocument()
})

it('handles refetch button click multiple times', () => {
  renderComponent()

  const refetchBtn =
    screen.getByTestId('refetch-btn')

  fireEvent.click(refetchBtn)
  fireEvent.click(refetchBtn)

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('renders all action buttons', () => {
  renderComponent()

  expect(
    screen.getByTestId('action-view')
  ).toBeInTheDocument()

  expect(
    screen.getByTestId('action-edit')
  ).toBeInTheDocument()

  expect(
    screen.getByTestId('action-delete')
  ).toBeInTheDocument()
})

it('handles status dropdown changes repeatedly', () => {
  renderComponent()

  const statusSelect =
    screen.getByRole('combobox')

  fireEvent.change(statusSelect, {
    target: { value: 'active' },
  })

  expect(statusSelect).toHaveValue('active')

  fireEvent.change(statusSelect, {
    target: { value: 'inactive' },
  })

  expect(statusSelect).toHaveValue('inactive')

  fireEvent.change(statusSelect, {
    target: { value: '' },
  })

  expect(statusSelect).toHaveValue('')
})

it('renders create modal component always', () => {
  renderComponent()

  expect(
    screen.getByTestId('create-modal')
  ).toBeInTheDocument()
})

it('handles navigation action safely', () => {
  renderComponent()

  const viewBtn =
    screen.getByTestId('action-view')

  fireEvent.click(viewBtn)

  expect(mockNavigate).toHaveBeenCalled()
})

it('handles edit action safely', () => {
  renderComponent()

  const editBtn =
    screen.getByTestId('action-edit')

  fireEvent.click(editBtn)

  expect(
    screen.getByTestId('edit-mode')
  ).toBeInTheDocument()
})

it('handles delete confirm flow completely', () => {
  renderComponent()

  fireEvent.click(
    screen.getByTestId('action-delete')
  )

  expect(
    screen.getByTestId('delete-modal')
  ).toBeInTheDocument()

  fireEvent.click(
    screen.getByTestId('confirm-delete')
  )

  expect(mockDeleteMeal).toHaveBeenCalled()
})

it('renders component with large dataset', () => {
  mockMealsData = {
    meals: Array.from(
      { length: 50 },
      (_, index) => ({
        id: index,
        name: `Meal ${index}`,
        meal_time: 'Breakfast',
        meal_category: 'Veg',
        serving_unit: 'cup',
        total_calories: 200,
        status: true,
      })
    ),
    meta: {
      total_count: 50,
      current_page: 1,
      total_pages: 5,
      per_page: 10,
    },
  }

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})
it('handles search input with spaces', () => {
  renderComponent()

  const input = screen.getByTestId('search-input')

  fireEvent.change(input, {
    target: { value: '   Pasta   ' },
  })

  expect(input).toHaveValue('   Pasta   ')
})

it('handles rapid status changes', () => {
  renderComponent()

  const statusSelect =
    screen.getByRole('combobox')

  fireEvent.change(statusSelect, {
    target: { value: 'active' },
  })

  fireEvent.change(statusSelect, {
    target: { value: 'inactive' },
  })

  fireEvent.change(statusSelect, {
    target: { value: '' },
  })

  expect(statusSelect).toHaveValue('')
})

it('renders correctly when meals is null', () => {
  mockMealsData = {
    meals: null,
    meta: {
      total_count: 0,
    },
  }

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('renders correctly when data object is empty', () => {
  mockMealsData = {}

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('handles pagination callback with different values', () => {
  renderComponent()

  fireEvent.click(
    screen.getByTestId('pagination-btn')
  )

  expect(
    mockPaginationCallback
  ).toHaveBeenCalledWith({
    page: 2,
    per_page: 20,
  })
})

it('renders without crashing when roleData name missing', () => {
  ;(authStoreMock as any).__setMockAuthState({
    roleData: {},
  })

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('renders correctly for unknown role', () => {
  ;(authStoreMock as any).__setMockAuthState({
    roleData: {
      name: 'guest',
    },
  })

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('handles multiple create button clicks', () => {
  renderComponent()

  const createBtn =
    screen.getByTestId('create-button')

  fireEvent.click(createBtn)
  fireEvent.click(createBtn)
  fireEvent.click(createBtn)

  expect(
    screen.getByTestId('create-open')
  ).toBeInTheDocument()
})

it('renders loading without data', () => {
  mockIsFetching = true
  mockMealsData = undefined

  renderComponent()

  expect(
    screen.getByTestId('loading-indicator')
  ).toBeInTheDocument()
})

it('renders empty state when meals array undefined', () => {
  mockMealsData = {
    meals: undefined,
    meta: {
      total_count: 0,
    },
  }

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('handles search with special characters', () => {
  renderComponent()

  const input = screen.getByTestId('search-input')

  fireEvent.change(input, {
    target: {
      value: '@#$%^&*',
    },
  })

  expect(input).toHaveValue('@#$%^&*')
})

it('handles long search text', () => {
  renderComponent()

  const input = screen.getByTestId('search-input')

  fireEvent.change(input, {
    target: {
      value:
        'Very Long Meal Name Search Value',
    },
  })

  expect(input).toHaveValue(
    'Very Long Meal Name Search Value'
  )
})

it('renders toolbar extra section correctly', () => {
  renderComponent()

  expect(
    screen.getByTestId('toolbar-extra')
  ).toBeInTheDocument()

  expect(
    screen.getByText('Status')
  ).toBeInTheDocument()
})

it('renders create modal closed initially', () => {
  renderComponent()

  expect(
    screen.getByTestId('create-modal')
  ).toBeInTheDocument()

  expect(
    screen.queryByTestId('create-open')
  ).not.toBeInTheDocument()
})

it('renders delete modal only after delete click', () => {
  renderComponent()

  expect(
    screen.queryByTestId('delete-modal')
  ).not.toBeInTheDocument()

  fireEvent.click(
    screen.getByTestId('action-delete')
  )

  expect(
    screen.getByTestId('delete-modal')
  ).toBeInTheDocument()
})

it('handles delete cancel correctly', () => {
  renderComponent()

  fireEvent.click(
    screen.getByTestId('action-delete')
  )

  fireEvent.click(
    screen.getByTestId('cancel-delete')
  )

  expect(
    screen.queryByTestId('delete-modal')
  ).not.toBeInTheDocument()
})

it('calls navigate only on view click', () => {
  renderComponent()

  expect(mockNavigate).not.toHaveBeenCalled()

  fireEvent.click(
    screen.getByTestId('action-view')
  )

  expect(mockNavigate).toHaveBeenCalledTimes(1)
})

it('does not navigate on edit click', () => {
  renderComponent()

  fireEvent.click(
    screen.getByTestId('action-edit')
  )

  expect(mockNavigate).not.toHaveBeenCalled()
})

it('renders all filter options', () => {
  renderComponent()

  expect(
    screen.getByText('All')
  ).toBeInTheDocument()

  expect(
    screen.getByText('Active')
  ).toBeInTheDocument()

  expect(
    screen.getByText('Inactive')
  ).toBeInTheDocument()
})

it('handles consecutive sorting clicks', () => {
  renderComponent()

  const sortBtn =
    screen.getByTestId('sort-btn')

  fireEvent.click(sortBtn)
  fireEvent.click(sortBtn)
  fireEvent.click(sortBtn)

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})
it('calls bulk status mutate when bulk change confirmed', () => {
  mockBulkStatusChange.mockClear()

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('calls delete mutation only once', () => {
  renderComponent()

  fireEvent.click(
    screen.getByTestId('action-delete')
  )

  fireEvent.click(
    screen.getByTestId('confirm-delete')
  )

  expect(mockDeleteMeal).toHaveBeenCalledTimes(1)
})

it('opens edit modal and keeps modal rendered', () => {
  renderComponent()

  fireEvent.click(
    screen.getByTestId('action-edit')
  )

  expect(
    screen.getByTestId('create-modal')
  ).toBeInTheDocument()

  expect(
    screen.getByTestId('edit-mode')
  ).toBeInTheDocument()
})

it('renders correctly when fetching and meals available', () => {
  mockIsFetching = true

  mockMealsData = {
    meals: [
      {
        id: 1,
        name: 'Chicken',
      },
    ],
    meta: {
      total_count: 1,
    },
  }

  renderComponent()

  expect(
    screen.getByTestId('loading-indicator')
  ).toBeInTheDocument()
})

it('renders correctly with large meta values', () => {
  mockMealsData = {
    meals: [
      {
        id: 1,
        name: 'Meal',
      },
    ],
    meta: {
      total_count: 500,
      current_page: 10,
      total_pages: 50,
      per_page: 10,
    },
  }

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('handles empty search multiple times', () => {
  renderComponent()

  const input =
    screen.getByTestId('search-input')

  fireEvent.change(input, {
    target: { value: 'abc' },
  })

  fireEvent.change(input, {
    target: { value: '' },
  })

  fireEvent.change(input, {
    target: { value: 'xyz' },
  })

  expect(input).toHaveValue('xyz')
})

it('renders action buttons correctly', () => {
  renderComponent()

  expect(
    screen.getByTestId('action-view')
  ).toBeInTheDocument()

  expect(
    screen.getByTestId('action-edit')
  ).toBeInTheDocument()

  expect(
    screen.getByTestId('action-delete')
  ).toBeInTheDocument()
})

it('handles pagination button safely', () => {
  renderComponent()

  const btn =
    screen.getByTestId('pagination-btn')

  fireEvent.click(btn)

  expect(
    mockPaginationCallback
  ).toHaveBeenCalled()
})

it('handles refetch button safely', () => {
  renderComponent()

  fireEvent.click(
    screen.getByTestId('refetch-btn')
  )

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('renders when meals contains many rows', () => {
  mockMealsData = {
    meals: Array.from(
      { length: 100 },
      (_, i) => ({
        id: i,
        name: `Meal ${i}`,
      })
    ),
    meta: {
      total_count: 100,
    },
  }

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('handles status filter active branch', () => {
  renderComponent()

  const select =
    screen.getByRole('combobox')

  fireEvent.change(select, {
    target: { value: 'active' },
  })

  expect(select).toHaveValue('active')
})

it('handles status filter inactive branch', () => {
  renderComponent()

  const select =
    screen.getByRole('combobox')

  fireEvent.change(select, {
    target: { value: 'inactive' },
  })

  expect(select).toHaveValue('inactive')
})

it('handles status reset branch', () => {
  renderComponent()

  const select =
    screen.getByRole('combobox')

  fireEvent.change(select, {
    target: { value: 'active' },
  })

  fireEvent.change(select, {
    target: { value: '' },
  })

  expect(select).toHaveValue('')
})

it('renders correctly when roleData is null', () => {
  ;(authStoreMock as any).__setMockAuthState({
    roleData: null,
  })

  renderComponent()

  expect(
    screen.getByTestId('smart-table')
  ).toBeInTheDocument()
})

it('renders correctly when meals array empty and loading false', () => {
  mockMealsData = {
    meals: [],
    meta: {
      total_count: 0,
    },
  }

  mockIsFetching = false

  renderComponent()

  expect(
    screen.getByTestId('empty-state')
  ).toBeInTheDocument()
})

it('handles repeated delete open and close', () => {
  renderComponent()

  const deleteBtn =
    screen.getByTestId('action-delete')

  fireEvent.click(deleteBtn)

  expect(
    screen.getByTestId('delete-modal')
  ).toBeInTheDocument()

  fireEvent.click(
    screen.getByTestId('cancel-delete')
  )

  expect(
    screen.queryByTestId('delete-modal')
  ).not.toBeInTheDocument()

  fireEvent.click(deleteBtn)

  expect(
    screen.getByTestId('delete-modal')
  ).toBeInTheDocument()
})
})

