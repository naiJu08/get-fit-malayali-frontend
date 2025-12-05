import { useEffect, useState } from 'react'
import { TableColumns } from '../../common/types'
import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { getSortedColumnName } from '../../utilities/parsers'
import { useRecipes } from './api'
import { getRecipeColumns } from './columns'
import { useLocation, useNavigate } from 'react-router-dom'
import CreateRecipe from './create'
import { checkPermissions } from '../../layout/store'
import SmartTable from '../../components/common/table/SmartTable'
import { calcWindowHeight } from '../../utilities/calcHeight'

export default function Recipe() {
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [formKey, setFormKey] = useState<string>('')
  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { page, per_page, search, ordering } = pageParams
  const searchParams = {
    page,
    per_page: Number(per_page ?? 10),
    search,
    ordering,
  }

  const headerProps = { actionTitle: 'Create Recipe' }
  const openDrawer = () => {
    setFormKey(`create-${Date.now()}`)
    setCreateOpen(true)
  }
  const handleRefresh = () => {
    setPageParams({ ...pageParams, page: 1 })
  }

  const openEdit = (row: any) => {
    setRowData(row)
    setEdit(true)
    setFormKey(`edit-${row?.id ?? 'x'}-${Date.now()}`)
    setCreateOpen(true)
  }

  const { data, isFetching } = useRecipes(searchParams)

  useEffect(() => {
    setColumns(
      getRecipeColumns((row: any) => {
        navigate(`/recipe/${row?.id}`)
      })
    )
  }, [])
  useEffect(() => {
    setPageParams({
      ...pageParams,
      page: 1,
      search: '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, setPageParams])
  // Clamp page to valid range when meta changes
  useEffect(() => {
    const totalPages = data?.meta?.total_pages
    if (typeof totalPages === 'number' && totalPages > 0) {
      if ((pageParams?.page ?? 1) > totalPages) {
        setPageParams({ ...pageParams, page: totalPages })
      } else if ((pageParams?.page ?? 1) < 1) {
        setPageParams({ ...pageParams, page: 1 })
      }
    } else if ((pageParams?.page ?? 1) < 1) {
      setPageParams({ ...pageParams, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.meta?.total_pages])

  const onChangePage = (pageNumber: number) => {
    setPageParams({ ...pageParams, page: pageNumber })
  }
  const onChangeRowsPerPage = (count: number | string) => {
    setPageParams({ ...pageParams, per_page: Number(count), page: 1 })
  }

  const handleSort = (orderColumn: any, orderDirection: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }

  return (
    <div>
      <ListingHeader
        data={{ title: 'Recipes', icon: 'recipe' }}
        onActionClick={openDrawer}
        actionProps={headerProps}
        checkPermission={checkPermissions('Employee', 'create')}
      />
      <div className="p-4">
        <SmartTable
          data={data?.recipes ?? []}
          dataRowKey="id"
          toolbar
          height={
            data?.recipes?.length === 0
              ? calcWindowHeight(218)
              : calcWindowHeight(150)
          }
          // search
          isLoading={isFetching}
          sortType={pageParams.sortType}
          sortColumn={pageParams.sortColumn}
          handleColumnSort={handleSort}
          emptyTitle="No records to display"
          columns={columns}
          pagination
          actionProps={[
            {
              icon: <Icons name="eye" />,
              action: (row: any) => navigate(`/recipe/${row?.id}`),
              title: 'view',
              toolTip: 'View',
            },

            {
              icon: <Icons name="edit" />,
              action: (row: any) => openEdit(row),
              title: 'edit',
              toolTip: 'Edit',
            },
          ]}
          paginationProps={{
            onPagination: onChangePage,
            total: data?.meta?.total_count ?? 0,
            currentPage:
              typeof data?.meta?.current_page === 'number'
                ? (data?.meta?.current_page as number)
                : (pageParams?.page ?? 1),
            rowsPerPage: Number(
              pageParams?.per_page ?? data?.meta?.per_page ?? 10
            ),
            onRowsPerPage: onChangeRowsPerPage,
            dropOptions: [10, 20, 30, 50, 100],
          }}
          searchValue={pageParams?.search}
          onSearchChange={(val: string) =>
            setPageParams({ ...pageParams, search: val })
          }
          onSearch={(key?: string) =>
            setPageParams({ ...pageParams, search: String(key ?? ''), page: 1 })
          }
          columnToggle
          externalActions={true}
        />
      </div>
      <CreateRecipe
        key={formKey}
        isDrawerOpen={createOpen}
        handleClose={() => {
          setCreateOpen(false)
          setEdit(false)
          setRowData(undefined)
          setFormKey('')
        }}
        handleRefresh={handleRefresh}
        edit={edit}
        rowData={rowData}
        formKey={formKey}
      />
    </div>
  )
}

//
