import React, { useEffect, useState } from 'react'
import { AiFillCloseCircle } from 'react-icons/ai'

const WebSocketComponent: React.FC = () => {
  const [notifications, setNotifications] = useState<string[]>([])
  const socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL as string)
  const notificationSound = new Audio('/path/to/notification-sound.mp3') // Replace with the actual path

  useEffect(() => {
    socket.addEventListener('message', (event) => {
      const notification = JSON.parse(event.data)
      if (notification.type === 'notification') {
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          notification.message,
        ])

        notificationSound.play()
      }
    })

    return () => {
      socket.close()
    }
    // eslint-disable-next-line
  }, [notificationSound])
  const handleDismiss = (index: number) => {
    const updatedNotifications = [...notifications]
    updatedNotifications.splice(index, 1)
    setNotifications(updatedNotifications)
  }

  return (
    <>
      {notifications.length && (
        <div className="notifications-container">
          <ul className="notifications-list">
            {notifications.map((notification, index) => (
              <li key={index} className="notification-item">
                {notification}
                <button
                  className="dismiss-button"
                  onClick={() => handleDismiss(index)}
                >
                  <AiFillCloseCircle />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

export default WebSocketComponent
