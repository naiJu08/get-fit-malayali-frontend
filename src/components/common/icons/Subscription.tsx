import React from 'react'
import { IconProps } from '../../../common/types'

const SubscriptionIcon: React.FC<IconProps> = () => {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H15C16.1046 4 17 4.89543 17 6V7M19 20C17.8954 20 17 19.1046 17 18V7M19 20C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7H17M13 4H9M7 16H13M7 8H13V12H7V8Z"
        stroke=""
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default SubscriptionIcon
