import { AutoComplete } from 'qbs-core'
import { useEffect, useRef, useState } from 'react'

//import {
//   clearAllNotification,
//   deleteNotification,
//   markAllNotificationasRead,
//   markNotifcationAsRead,
//   markNotificationAsUnread,
// } from '../apis/common.apis'
import InfoBox from '../components/app/alertBox/infoBox'
import CustomDrawer from '../components/common/drawer/index'
import DialogModal from '../components/common/modal/DialogModal'
import NotificationItem from './notifications/NotificationItem'
import NotificationLoader from './notifications/notificationLoader'
// import { switchPath } from './switchPath'

export default function NotificationList({
  open,
  handleClose,
  notificationData,
  getNotification,
  isLoading,
  setNotificationFilter,
  notificationFilter,
  hasMore,
  setNotificationSearch,
  setNotificationData,
  setHasMore,
  franchiseeData,
}: any) {
  const [deleteModal, setDeleteModal] = useState(false)
  const [openConfirmModal, setOpenConfirmModal] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionLoader] = useState(false)
  const [openAllRead, setOpenAllRead] = useState(false)
  // const handleRead = (
  //   row: any,
  //   e?: React.MouseEvent<HTMLSpanElement, MouseEvent>
  // ) => {
  //   if (e) e?.stopPropagation()

  //   const api =
  //     row?.status === 'unread'
  //       ? markNotifcationAsRead
  //       : markNotificationAsUnread
  //   api(row?.id).then((res: any) => {
  //     if (res) getNotification()
  //   })
  // }
  // const handleNavigate = () => {
  //   if (rowData) {
  //     setOpenConfirmModal(false)
  //     handleClose(false)
  //     handleRead(rowData, undefined)
  //     const path = switchPath(rowData?.data)
  //     navigate(`${path}`)
  //   }
  // }
  const handleOpenEvent = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // if (item.data) {
    //   setRowData(item)
    //   if (item.franchisee && item.franchisee.id !== franchisee.id) {
    //     setOpenConfirmModal(true)
    //   } else {
    //     // handleNavigate()
    //   }
    // }
    e.stopPropagation()
  }
  const handleClear = () => {
    setDeleteModal(true)
  }
  // const handleClearNotification = () => {
  //   setActionLoader(true)
  //   clearAllNotification().then(() => {
  //     enqueueSnackbar('Notification cleared successfully', {
  //       variant: 'success',
  //     })
  //     setDeleteModal(false)
  //     getNotification()
  //     setActionLoader(false)
  //   })
  // }
  // const navigate = useNavigate()
  // const handleConfirmSwitch = () => {
  //   setFranchisee(rowData.franchisee)
  //   if (rowData.data) {
  //     handleNavigate()
  //   }
  // }
  const handleDelete = () => {
    // setOpenConfirmModal(true)
    setDeleteOpen(true)
  }
  // const handleDeleteNotication = () => {
  //   setActionLoader(true)
  //   deleteNotification({ notification_id: deleteIds })
  //     .then(() => {
  //       enqueueSnackbar('Notification item deleted successfully', {
  //         variant: 'success',
  //       })
  //       setDeleteOpen(false)
  //       getNotification()
  //       setActionLoader(false)
  //     })
  //     .catch((err) => {
  //       enqueueSnackbar(err.response.data.error, { variant: 'error' })
  //     })
  // }
  // const handleMArkAllRead = () => {
  //   setActionLoader(true)

  //   markAllNotificationasRead()
  //     .then(() => {
  //       enqueueSnackbar('Notifications marked as read', {
  //         variant: 'success',
  //       })
  //       setOpenAllRead(false)
  //       getNotification()
  //       setActionLoader(false)
  //     })
  //     .catch((err) => {
  //       enqueueSnackbar(err.response.data.error, { variant: 'error' })
  //     })
  // }
  const handleMArkAll = () => {
    setOpenAllRead(true)
  }
  const handleFilterChange = (value: any) => {
    setNotificationSearch((prevState: any) => ({
      ...prevState,
      page: 1,
    }))
    setHasMore(false)
    setNotificationData([])
    setNotificationFilter(value?.id)
  }

  const containerRef = useRef<HTMLDivElement>(null) // Create a ref for the scroll container

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current

      // Check if the user has scrolled to the bottom
      if (scrollTop + clientHeight >= scrollHeight - 10 && !isLoading) {
        // Assuming getNotification is supposed to fetch more data
        getNotification()
      }
    }

    const scrollContainer = containerRef.current
    scrollContainer?.addEventListener('scroll', handleScroll)
    return () => scrollContainer?.removeEventListener('scroll', handleScroll)
  }, [containerRef?.current?.scrollHeight, getNotification, isLoading])

  return (
    <div>
      <CustomDrawer
        className="formDrawer w-[500px]"
        open={open}
        handleClose={() => handleClose(false)}
        title="Notifications"
        // containerRef={containerRef}
        headerFilter={
          <div className=" ">
            <AutoComplete
              name="name"
              desc="name"
              data={franchiseeData}
              type="custom_select"
              value={notificationFilter?.name}
              onChange={(value) => handleFilterChange(value)}
              label=""
              placeholder="Select franchisee"
              descId={'id'}
            />
          </div>
        }
        headerActionProps={
          notificationData?.length > 0
            ? [
                {
                  title: 'Clear All',
                  action: handleClear,
                },
                {
                  title: 'Mark All as Read',
                  action: handleMArkAll,
                },
              ]
            : undefined
        }
      >
        <div
          className="flex flex-col h-full w-full relative overflow-auto "
          ref={containerRef}
        >
          {isLoading && !hasMore ? (
            <div
              className={`flex flex-col items-center justify-between w-full ${
                isLoading && 'gap-2'
              } `}
            >
              {[...Array(5)]?.map((ind) => (
                <NotificationLoader key={ind} />
              ))}
            </div>
          ) : (
            <>
              {notificationData?.map((item: any) => (
                <NotificationItem
                  key={item.id}
                  handleDelete={handleDelete}
                  item={item}
                  // handleRead={handleRead}
                  handleOpenEvent={handleOpenEvent}
                />
              ))}
              {isLoading && hasMore && (
                <div className=" relative bottom-3">
                  <NotificationLoader />
                </div>
              )}
              {notificationData?.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  No data found
                </div>
              )}
            </>
          )}
        </div>
      </CustomDrawer>
      <DialogModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        className=" z-1300"
        title={'Are you sure?'}
        // onSubmit={() => handleClearNotification()}
        secondaryAction={() => setDeleteModal(false)}
        secondaryActionLabel="No, Cancel"
        actionLoader={actionLoader}
        actionLabel="Yes, I am"
        body={
          <InfoBox
            content={
              'This will clear all the notifications from the list. Are you sure you want to continue?'
            }
          />
        }
      />
      <DialogModal
        isOpen={openAllRead}
        onClose={() => setOpenAllRead(false)}
        className=" z-1300"
        title={'Are you sure?'}
        // onSubmit={() => handleMArkAllRead()}
        secondaryAction={() => setOpenAllRead(false)}
        secondaryActionLabel="No, Cancel"
        actionLabel="Yes, I am"
        actionLoader={actionLoader}
        body={<InfoBox content={'This will mark all notifications as read.'} />}
      />
      <DialogModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={'Are you sure?'}
        // onSubmit={() => handleDeleteNotication()}
        className=" z-1300"
        secondaryAction={() => setDeleteOpen(false)}
        secondaryActionLabel="No, Cancel"
        actionLoader={actionLoader}
        actionLabel="Yes, I am"
        body={
          <InfoBox
            content={
              'Deleting this item is an irreversible action. Are you sure you want to proceed with the deletion?'
            }
          />
        }
      />
      <DialogModal
        isOpen={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        className=" z-1300"
        title={'Are you sure?'}
        // onSubmit={() => handleConfirmSwitch()}
        secondaryAction={() => setOpenConfirmModal(false)}
        secondaryActionLabel="No, Cancel"
        actionLabel="Yes, I am"
        body={
          <InfoBox
            content={`This action requires you to switch to . Are you sure you want to continue viewing the notification details?`}
          />
        }
      />
    </div>
  )
}
