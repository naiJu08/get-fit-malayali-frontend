import React from 'react'
import { IconProps } from '../../../common/types'

const ChatIcon: React.FC<IconProps> = () => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.33333 6.6665H5.34M8 6.6665H8.00667M10.6667 6.6665H10.6733M6 10.6665H3.33333C2.59695 10.6665 2 10.0696 2 9.33317V3.99984C2 3.26346 2.59695 2.6665 3.33333 2.6665H12.6667C13.403 2.6665 14 3.26346 14 3.99984V9.33317C14 10.0696 13.403 10.6665 12.6667 10.6665H9.33333L6 13.9998V10.6665Z"
        stroke="#585858"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ChatIcon
