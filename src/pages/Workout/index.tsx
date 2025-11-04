import { QbsTable } from 'qbs-react-grid'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import { checkPermissions } from '../../layout/store'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { handleReturnEmptyMsg } from '../../utilities/validation'
import { getWorkoutDetails, useWorkoutList, DISABLE_NONLOGIN_APIS } from './api'
import { getColumns } from './columns'
import CreateAdmin from './create'

export default function WorkoutMain() {
  const navigate = useNavigate()
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [editViewIndicator, setEditViewIndicator] = useState(false)
  const [viewIndicator, setViewIndicator] = useState(false)

  const params = useParams()

  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { page, per_page, search, ordering, filters } = pageParams
  const searchParams = {
    page: page,
    per_page: per_page,
    search: search,
    ordering: ordering,
    ...filters,
  }

  const { data, refetch, isFetching } = useWorkoutList(searchParams)
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
  const onChangePage = (row: number) => {
    setPageParams({
      ...pageParams,
      page: row,
    })
  }
  const onChangeRowsPerPage = (count: number | string) => {
    setPageParams({
      ...pageParams,
      per_page: Number(count),
      page: 1,
    })
  }
  const onViewAction = async (row: any) => {
    setViewIndicator(true)
    if (row?.id) {
      const data = await getWorkoutDetails(String(row?.id))
      setRowData((data as any)?.workout ?? data)
      setViewMode(true)
      setCreateOpen(true)
    }
  }
  useEffect(() => {
    setColumns(
      getColumns({
        onViewAction: onViewAction,
        onNameClick: (row: any) => navigate(`/workout/${row?.id}`),
      })
    )
  }, [])

  const handleSeach = (key?: string) => {
    setPageParams({
      ...pageParams,
      search: key as string,
      page: 1,
    })
  }

  const handleEdit = async (rowData: any) => {
    if (rowData?.id) {
      const data = await getWorkoutDetails(String(rowData?.id))
      setRowData((data as any)?.workout ?? data)
      setCreateOpen(true)
      setViewMode(false)
      setEdit(true)
    }
  }

  const handleClose = () => {
    setCreateOpen(false)
    setViewMode(false)
    setEdit(false)
    if (viewIndicator && editViewIndicator) {
      setViewIndicator(false)
      setEditViewIndicator(false)
      onViewAction(rowData)
    }
  }

  const handleRefresh = () => {
    refetch()
  }
  const basicData = {
    title: 'Workouts',
    icon: 'user',
  }
  const openDrawer = () => {
    setCreateOpen(true)
    setRowData({})
  }
  const headerProps = {
    actionTitle: 'Create Workout',
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
      {DISABLE_NONLOGIN_APIS ? (
        <div className="p-6">
          <InfoBox content={'This section is disabled for this build.'} />
        </div>
      ) : (
        <>
          <ListingHeader
            data={basicData}
            onActionClick={openDrawer}
            actionProps={headerProps}
            checkPermission={checkPermissions('Employee', 'create')}
          />
          <div className=" p-4">
            <QbsTable
              data={data?.workouts ?? []}
              dataRowKey="id"
              toolbar={true}
              search={true}
              height={
                data?.workouts?.length === 0
                  ? calcWindowHeight(218)
                  : calcWindowHeight(300)
              }
              isLoading={isFetching}
              sortType={pageParams.sortType}
              sortColumn={pageParams.sortColumn}
              handleColumnSort={handleSort}
              emptyTitle="No records to display"
              emptySubTitle={handleReturnEmptyMsg(search)}
              columns={columns}
              pagination={true}
              renderSortIcon={(sortType?: 'asc' | 'desc' | undefined) => {
                return sortType === 'asc' ? (
                  <Icons name="ascending-icon" />
                ) : sortType === 'desc' ? (
                  <Icons name="descending-icon" />
                ) : (
                  <Icons name="qbs-sort-icon" />
                )
              }}
              paginationProps={{
                onPagination: onChangePage,
                total: data?.meta?.total_count ?? 0,
                currentPage: data?.meta?.current_page ?? pageParams?.page ?? 1,
                rowsPerPage: Number(pageParams?.per_page ?? 10),
                onRowsPerPage: onChangeRowsPerPage,
                dropOptions: [10, 20, 30, 50, 100],
              }}
              actionProps={[
                {
                  icon: <Icons name="edit" />,
                  action: (row) => handleEdit(row),
                  title: 'edit',
                  toolTip: 'Edit',
                },
                {
                  icon: <Icons name="eye" />,
                  action: (row) => navigate(`/workout/${row?.id}`),
                  title: 'view',
                  toolTip: 'View Details',
                },
              ]}
              searchValue={pageParams?.search}
              onSearch={handleSeach}
              asyncSearch
              handleSearchValue={(key?: string) => handleSeach(key)}
              columnToggle
            />
          </div>
          <CreateAdmin
            isDrawerOpen={createOpen}
            rowData={rowData}
            edit={edit}
            setViewMode={setViewMode}
            setEdit={setEdit}
            viewMode={viewMode}
            paramsId={params?.id}
            handleClose={handleClose}
            handleRefresh={handleRefresh}
            editViewIndicator={editViewIndicator}
            setEditViewIndicator={setEditViewIndicator}
          />
        </>
      )}
    </div>
  )
}
