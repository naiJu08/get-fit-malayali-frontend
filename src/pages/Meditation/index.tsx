import SmartTable from '../../components/common/table/SmartTable'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import { checkPermissions } from '../../layout/store'
import { useAuthStore } from '../../store/authStore'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { handleReturnEmptyMsg } from '../../utilities/validation'
import {
  getMeditationDetails,
  useMeditationList,
  DISABLE_NONLOGIN_APIS,
  deleteMeditation,
} from './api'
import { getColumns } from './columns'
import CreateAdmin from './create'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'

export default function MeditationMain() {
  const navigate = useNavigate()
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [editViewIndicator, setEditViewIndicator] = useState(false)
  const [viewIndicator, setViewIndicator] = useState(false)
  const [searchDebounce, setSearchDebounce] = useState<any>(null)
  const [deleteMeditationModal, setDeleteMeditationModal] = useState(false)
  const [deleteMeditationId, setDeleteMeditationId] = useState<string>('')
  const [loader, setLoader] = useState(false)
  const { roleData } = useAuthStore()
  const isNutritionist = roleData?.name === 'nutritionist'
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

  const { data, refetch, isFetching } = useMeditationList(searchParams)
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
  // Refetch when filters/pagination/sort/search change (align with Notifications)
  useEffect(() => {
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, per_page, search, ordering, JSON.stringify(filters)])
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
      const data = await getMeditationDetails(String(row?.id))
      setRowData((data as any)?.meditation ?? data)
      setViewMode(true)
      setCreateOpen(true)
    }
  }
  useEffect(() => {
    setColumns(
      getColumns({
        onViewAction: onViewAction,
        onNameClick: !isNutritionist
          ? (row: any) => navigate(`/meditation/${row?.id}`)
          : undefined,
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNutritionist])

  // const handleSeach = (key?: string) => {
  //   setPageParams({
  //     ...pageParams,
  //     search: key as string,
  //     page: 1,
  //   })
  // }

  const handleEdit = async (rowData: any) => {
    if (rowData?.id) {
      const data = await getMeditationDetails(String(rowData?.id))
      setRowData((data as any)?.meditation ?? data)
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
  const handleDeleteMeditation = async () => {
    if (!deleteMeditationId) return
    try {
      setLoader(true)
      await deleteMeditation(String(deleteMeditationId))
      setDeleteMeditationModal(false)
      setDeleteMeditationId('')
      refetch()
    } finally {
      setLoader(false)
    }
  }
  const basicData = {
    title: 'Meditation',
    icon: 'meditation-icon',
  }
  const openDrawer = () => {
    setCreateOpen(true)
    setRowData({})
  }
  const headerProps = {
    actionTitle: 'Create Meditation',
  }
  const handleSort = (orderColumn: any, orderDirection: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }

  const intensityOptions = useMemo(() => ['Moderate', 'High', 'Low'], [])

  const currentIntensity = (filters as any)?.intensity_level || ''
  const onIntensityChange = (val: string) => {
    const newFilters = { ...(filters || {}) }
    if (val) newFilters.intensity_level = val
    else delete (newFilters as any).intensity_level
    setPageParams({ ...pageParams, filters: newFilters, page: 1 })
  }

  const actions: any[] = []

  if (!isNutritionist) {
    actions.push(
      {
        icon: <Icons name="eye" />,
        action: (row: any) => navigate(`/meditation/${row?.id}`),
        title: 'view',
        toolTip: 'View Details',
      },
      {
        icon: <Icons name="edit" />,
        action: (row: any) => handleEdit(row),
        title: 'edit',
        toolTip: 'Edit',
      },
      {
        icon: <Icons name="table-delete" />,
        action: (row: any) => {
          if (!row?.id) return
          setDeleteMeditationId(String(row.id))
          setDeleteMeditationModal(true)
        },
        title: 'delete',
        toolTip: 'Delete',
      }
    )
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
            onActionClick={isNutritionist ? undefined : openDrawer}
            actionProps={headerProps}
            checkPermission={
              !isNutritionist && checkPermissions('Employee', 'create')
            }
          />
          <div className=" p-4">
            <SmartTable
              data={data?.meditations ?? []}
              dataRowKey="id"
              toolbar={true}
              toolbarExtra={
                <div className="flex items-end gap-3">
                  <div className="flex flex-col gap-1 ">
                    <label className="text-xs text-gray-600">Intensity</label>
                    <select
                      className="textfield w-44 "
                      value={currentIntensity}
                      onChange={(e) => onIntensityChange(e.target.value)}
                    >
                      <option value="">All</option>
                      {intensityOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              }
              height={
                (data?.meditations?.length ?? 0) === 0
                  ? calcWindowHeight(218)
                  : calcWindowHeight(150)
              }
              search={true}
              searchValue={pageParams?.search || ''}
              onSearchChange={(val) => {
                setPageParams({ ...pageParams, search: val, page: 1 })
                if (searchDebounce) clearTimeout(searchDebounce)
                const t = setTimeout(() => refetch(), 300)
                setSearchDebounce(t)
              }}
              onSearch={() => refetch()}
              isLoading={isFetching}
              sortType={pageParams.sortType}
              sortColumn={pageParams.sortColumn}
              handleColumnSort={handleSort}
              emptyTitle="No records to display"
              emptySubTitle={handleReturnEmptyMsg(search)}
              columns={columns}
              pagination={true}
              paginationProps={{
                onPagination: onChangePage,
                total: data?.meta?.total_count ?? 0,
                currentPage:
                  typeof data?.meta?.current_page === 'number'
                    ? (data?.meta?.current_page as number)
                    : (pageParams?.page ?? 1),
                rowsPerPage: Number(pageParams?.per_page ?? 10),
                onRowsPerPage: onChangeRowsPerPage,
                totalPages: Math.max(
                  1,
                  Math.ceil(
                    (Number(data?.meta?.total_count ?? 0) || 0) /
                      Number(pageParams?.per_page ?? 10)
                  )
                ),
                dropOptions: [10, 20, 30, 50, 100],
              }}
              actionProps={actions}
              columnToggle
              externalActions={true}
            />
          </div>
          <ConfirmDeleteModal
            isOpen={deleteMeditationModal}
            onClose={() => setDeleteMeditationModal(false)}
            onConfirm={() => handleDeleteMeditation()}
            loading={loader}
            title={'Are you sure?'}
            subTitle={
              'Do you really want to delete this meditation? This process cannot be undone.'
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
          />
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
