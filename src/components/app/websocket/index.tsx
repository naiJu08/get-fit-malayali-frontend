import React, { useEffect, useState } from 'react'

import { useAppStore } from '../../../store/appStore'
import { useAuthStore } from '../../../store/authStore'
import { DialogModal } from '../../common'
import Icons from '../../common/icons/index'
import InfoBox from '../alertBox/infoBox'

const WebSocketComponent: React.FC = () => {
  const [notificationData, setNotificationData] = useState<any>()
  const { openNotification, setOpenNotification } = useAppStore()
  const { franchisee, setFranchisee, impersonating } = useAuthStore()
  const [confirmModal, setOpenConfirmModal] = useState(false)
  // useEffect(() => {
  //   const token = useAuthStore.getState().token
  //   const loc = process.env.REACT_APP_WEBSOCKET_URL

  //   const webSocketEndpoint = `${loc}?Token=${token}`

  //   const client = new WebSocket(webSocketEndpoint)

  //   client.onopen = () => {
  //     console.log('WebSocket Client Connected')
  //   }

  //   client.onmessage = (message: any) => {
  //     setNotificationData(JSON.parse(message.data))
  //     setOpenNotification(true)
  //   }

  //   client.onerror = function (e: any) {
  //     console.log('Connection Error', e)
  //   }

  //   // Socket close Functionality
  //   client.onclose = function () {
  //     setOpenNotification(false)
  //   }

  //   // Cleanup function on component unmount
  //   return () => {
  //     client.close()
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [useAuthStore.getState().token])

  useEffect(() => {
    const token = useAuthStore.getState().token
    const loc = process.env.REACT_APP_WEBSOCKET_URL

    const webSocketEndpoint = `${loc}?Token=${token}`

    const client = new WebSocket(webSocketEndpoint)

    client.onopen = () => {
      const pingInterval = setInterval(() => {
        client.send(JSON.stringify({ type: 'ping' }))
      }, 300000) // 300000 milliseconds = 5 minutes
      client.onclose = () => {
        clearInterval(pingInterval)
      }
    }

    client.onmessage = (message) => {
      setNotificationData(JSON.parse(message.data))
      setOpenNotification(true)
    }

    client.onerror = function (e) {
      console.log('Connection Error', e)
    }

    client.onclose = function () {
      setOpenNotification(false)
    }
    return () => {
      client.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useAuthStore.getState().token])

  const handleNavigate = () => {
    if (notificationData) {
      setOpenConfirmModal(false)
      // const path = switchPath(notificationData?.data)
      // navigate(`${path}`)
    }
  }
  const handleOpenEvent = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (notificationData.data) {
      if (
        notificationData.franchisee &&
        notificationData.franchisee.id !== franchisee.id
      ) {
        setOpenConfirmModal(true)
      } else {
        handleNavigate()
      }
    }
    e.stopPropagation()
  }
  const handleConfirmSwitch = () => {
    setFranchisee(notificationData.franchisee)
    if (notificationData.data) {
      handleNavigate()
    }
  }
  return (
    <>
      {openNotification && (
        <>
          <div
            className=" min-w-[400px] fixed top-5 right-5 flex flex-col items-center bg-white shadow-md border-2 rounded-sm   px-4 py-3 z-1300"
            role="alert"
          >
            <div className="flex justify-between gap-5 items-center w-full">
              <p className=" text-lg font-medium">
                {notificationData?.title ?? 'New notification'}
              </p>
              <span
                className=" cursor-pointer"
                onClick={() => setOpenNotification(false)}
              >
                <Icons name="close" className=" text-sm" />
              </span>
            </div>
            <div
              onClick={(e) => (impersonating ? '' : handleOpenEvent(e))}
              className="flex w-full py-2 items-start gap-2 cursor-pointer"
            >
              <span className=" flex bg-primary text-white border items-start rounded-full p-1 ">
                <Icons name="notify-icon" className="" />
              </span>
              <div>
                <p className=" text-sm max-w-[400px]  line-clamp-3">
                  {notificationData?.content}
                </p>
                <p className=" text-xs text-grey-medium">a few seconds ago</p>
              </div>
            </div>
          </div>
          {confirmModal && (
            <DialogModal
              isOpen={confirmModal}
              onClose={() => setOpenConfirmModal(false)}
              className=" z-1300"
              title={'Are you sure?'}
              onSubmit={() => handleConfirmSwitch()}
              secondaryAction={() => setOpenConfirmModal(false)}
              secondaryActionLabel="No, Cancel"
              actionLabel="Yes, I am"
              body={
                <InfoBox
                  content={`This action requires you to switch to ${notificationData?.franchisee?.franchisee_name}. Are you sure you want to continue viewing the notification details?`}
                />
              }
            />
          )}
        </>
      )}
    </>
  )
}

export default WebSocketComponent
