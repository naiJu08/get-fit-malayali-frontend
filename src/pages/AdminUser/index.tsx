import { QbsTable } from 'qbs-react-grid'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import ResetPassword from '../../components/app/resetPassword'
import { DialogModal, TextField } from '../../components/common'
import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import { useSnackbarManager } from '../../components/common/snackbar'
import { checkPermissions } from '../../layout/store'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { handleReturnEmptyMsg } from '../../utilities/validation'
import {
  deActivateAdmin,
  getAdminDetails,
  sendAdminInvitation,
  useAdminUser,
} from './api'
import { getColumns } from './columns'
import CreateAdmin from './create'

export default function AdminUser() {
  const [columns, setColumns] = useState<TableColumns[]>([])
  const { enqueueSnackbar } = useSnackbarManager()
  const [deleteItem, setDeleteItem] = useState('')
  const [status, setStatus] = useState('')
  const [deleteModal, setDeleteModal] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [changePassword, setChangePassword] = useState(false)
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
  const [openConfirm, setOpenConfirm] = useState(false)

  const [editViewIndicator, setEditViewIndicator] = useState(false)
  const [viewIndicator, setViewIndicator] = useState(false)
  const [loader, setloader] = useState(false)

  const params = useParams()

  const { pageParams, setPageParams, selectedRows, setSelectedRows } =
    useAdminUserFilterStore()
  const { page, page_size, search, ordering, filters } = pageParams
  const searchParams = {
    page: page,
    page_size: page_size,
    search: search,
    ordering: ordering,
    ...filters,
  }

  const { data, refetch, isFetching } = useAdminUser(searchParams)
  const onChangePage = (row: number) => {
    setPageParams({
      ...pageParams,
      page: row,
    })
  }
  const onChangeRowsPerPage = (count: number | string) => {
    setPageParams({
      ...pageParams,
      page_size: count,
      page: 1,
    })
  }
  const onViewAction = async (row: any) => {
    setViewIndicator(true)
    if (row?.user?.id) {
      const data = await getAdminDetails(row?.user?.id)
      setRowData(data)
      setViewMode(true)
      setCreateOpen(true)
    }
  }
  useEffect(() => {
    setColumns(
      getColumns({
        onViewAction: onViewAction,
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

  const handleDeleteModel = (id: string, username: string, status: string) => {
    setDeleteItem(id)
    setDeleteModal(true)
    setUserName(username)
    setStatus(status)
  }

  const handleSendInvitation = () => {
    setloader(true)
    sendAdminInvitation(deleteItem ?? '')
      .then((res) => {
        enqueueSnackbar(
          res.message ? res.message : 'Invitation Send Successfully',
          {
            variant: 'success',
          }
        )
        setloader(false)
        refetch()
        setOpenConfirm(false)

        setSelectedRows(
          selectedRows?.filter((sel: any) => sel !== deleteItem) || []
        )
      })
      .catch((err: any) => {
        setloader(false)
        enqueueSnackbar(
          err?.response?.data?.error?.message || err?.response?.data?.message,
          { variant: 'error' }
        )
      })
  }

  const handleDeleteAdmin = () => {
    setloader(true)
    deActivateAdmin(deleteItem)
      .then(() => {
        enqueueSnackbar('Status Updated successfully', {
          variant: 'success',
        })
        setloader(false)
        refetch()
        setSelectedRows(
          selectedRows?.filter((sel: string | number) => sel !== deleteItem) ||
            []
        )
        setDeleteModal(false)
      })
      .catch((err) => {
        setloader(false)
        enqueueSnackbar(
          err?.response?.data?.error?.message || err?.response?.data?.message,
          { variant: 'error' }
        )
      })
  }
  const handleEdit = async (rowData: any) => {
    if (rowData?.user?.id) {
      const data = await getAdminDetails(rowData?.user?.id)
      setRowData(data)
      setCreateOpen(true)
      setViewMode(false)
      setEdit(true)
    }
  }
  // const handleAction = () => {
  //   setCreateOpen(true)
  //   setRowData({})
  //   setEdit(false)
  //   setViewMode(false)
  // }
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
    title: 'Administrators',
    icon: 'user',
  }
  const openDrawer = () => {
    setCreateOpen(true)
    setRowData({})
  }
  const headerProps = {
    actionTitle: 'Create Admin',
  }
  const handleSort = (orderColumn: any, orderDirection: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }
  const handleResetPassword = (userId: string, username: string) => {
    setChangePassword(true)
    setUserId(userId)
    setUserName(username)
  }
  const handleOpenInvitation = (id: any) => {
    setDeleteItem(id)
    setOpenConfirm(true)
  }
  return (
    <div>
      <ListingHeader
        data={basicData}
        onActionClick={openDrawer}
        actionProps={headerProps}
        checkPermission={checkPermissions('Employee', 'create')}
      />
      {/* <PageTitle data={data?.total} isLoading={isFetching} /> */}
      <div className=" p-4">
        <QbsTable
          data={data?.items ?? []}
          dataRowKey="id"
          toolbar={true}
          search={true}
          height={
            data?.length === 0 ? calcWindowHeight(218) : calcWindowHeight(300)
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
            total: data?.total,
            currentPage: pageParams?.page,
            rowsPerPage: Number(pageParams?.page_size ?? data?.page_size),
            onRowsPerPage: onChangeRowsPerPage,
            dropOptions: [10, 20, 30, 50, 100],
          }}
          actionProps={[
            // {
            //   icon: <Icons name="eye" />,
            //   action: (row) => onViewAction(row),
            //   title: 'view',
            //   toolTip: 'View',
            // },
            {
              icon: <Icons name="edit" />,
              action: (row) => handleEdit(row),
              title: 'edit',
              toolTip: 'Edit',
            },
            {
              icon: <Icons name="verify" />,
              action: (row) =>
                handleResetPassword(row?.user?.id, row?.user?.username),
              title: 'reset-password',
              toolTip: 'Reset Password',
            },
            {
              title: 'Deactivate',
              action: (rowData) =>
                handleDeleteModel(
                  rowData?.user?.id,
                  rowData?.user?.username,
                  rowData?.user?.status
                ),
              icon: <Icons name="deactivate-icon" />,
              toolTip: 'Deactivate',
              hide: (rowData: any) =>
                rowData?.user?.status == 'Active' ? false : true,
            },
            {
              title: 'Activate',
              action: (rowData) =>
                handleDeleteModel(
                  rowData?.user?.id,
                  rowData?.user?.username,
                  rowData?.user?.status
                ),
              icon: <Icons name="activate-icon" />,
              toolTip: 'Activate',
              hide: (rowData: any) =>
                rowData?.user?.status == 'Inactive' ? false : true,
            },
            // {
            //   title: 'Delete Admin',
            //   action: (rowData) =>
            //     handleDeleteModel(rowData?.user?.id, rowData?.user?.username),
            //   icon: <Icons name="delete" />,
            //   toolTip: 'Delete Admin',
            // },
            {
              title: 'Send Invitation',
              action: (rowData) => handleOpenInvitation(rowData?.user?.id),
              icon: <Icons name="email" />,
              toolTip: 'Send Invitation',
              // hidden: !checkPermission('delete'),
            },
          ]}
          searchValue={pageParams?.search}
          onSearch={handleSeach}
          asyncSearch
          handleSearchValue={(key?: string) => handleSeach(key)}
          columnToggle
          // tableHeaderActions={
          //   <div className="flex gap-2 ">
          //     <Button
          //       onClick={handleAction}
          //       label={'Add New'}
          //       icon="plus"
          //       isPrimary={true}
          //       className="bg-primary"
          //     />
          //   </div>
          // }
        />
      </div>

      <DialogModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        // title={'Delete Admin User'}
        title={
          status == 'Active' ? 'Deactivate Admin User' : 'Activate Admin User'
        }
        onSubmit={() => handleDeleteAdmin()}
        secondaryAction={() => setDeleteModal(false)}
        secondaryActionLabel="Cancel"
        actionLabel={status == 'Active' ? 'Deactivate' : 'Activate'}
        actionLoader={loader}
        className="z-50"
        body={
          <>
            {/* <InfoBox content={'Are you sure to delete this admin user ?'} /> */}
            <p className="pb-4">
              {status == 'Active'
                ? 'Are you sure to deactivate this admin user ?'
                : 'Are you sure to activate this admin user ?'}
            </p>
            <div className="flex flex-col gap-4">
              <div className="w-full flex flex-col gap-2">
                <TextField
                  id="1"
                  name="email"
                  value={userName ?? ''}
                  disabled={true}
                  label={'Admin Email id'}
                />
              </div>
            </div>
          </>
        }
      />
      <ResetPassword
        changePassword={changePassword}
        setChangePassword={setChangePassword}
        userId={userId}
        setUserId={setUserId}
        from={'Admin'}
        userName={userName}
        setUserName={setUserName}
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
      <DialogModal
        isOpen={openConfirm}
        onClose={() => setOpenConfirm(false)}
        title={'Send Invitation'}
        onSubmit={() => handleSendInvitation()}
        secondaryAction={() => setOpenConfirm(false)}
        secondaryActionLabel="Cancel"
        actionLabel="Send"
        actionLoader={loader}
        body={
          <InfoBox content={'Are you sure you want to send the invitation?'} />
        }
      />
    </div>
  )
}
