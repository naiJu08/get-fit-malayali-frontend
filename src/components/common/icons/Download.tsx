import React from 'react'
import { IconProps } from '../../../common/types'

const DownloadIcon: React.FC<IconProps> = () => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.66675 10.6666L2.66675 11.3333C2.66675 12.4378 3.56218 13.3333 4.66675 13.3333L11.3334 13.3333C12.438 13.3333 13.3334 12.4378 13.3334 11.3333L13.3334 10.6666M10.6667 7.99992L8.00008 10.6666M8.00008 10.6666L5.33341 7.99992M8.00008 10.6666L8.00008 2.66659"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default DownloadIcon
