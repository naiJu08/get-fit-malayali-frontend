import React from 'react'
import { IconProps } from '../../../common/types'

const SupportIcon: React.FC<IconProps> = () => {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="4.15" stroke="" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="9.15" stroke="" strokeWidth="1.2" />
      <path
        d="M18.5 5.5L15.5 8.5M15 15L18.5 18.5M5.5 5.5L8.5 8.5M5.5 18.5L8.5 15.5"
        stroke=""
        strokeWidth="1.2"
      />
    </svg>
  )
}

export default SupportIcon
