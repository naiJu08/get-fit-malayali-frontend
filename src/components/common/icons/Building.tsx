import React from 'react'
import { IconProps } from '../../../common/types'

const BuildingIcon: React.FC<IconProps> = () => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 22 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 8C3 8 2 9 2 11V19C2 21 3 22 5 22H13M5 8H10M5 8V6C5 4.9 5.9 4 7 4H10.11C10.03 4.3 10 4.63 10 5M10 8V19M10 8V5M10 19C10 21 11 22 13 22M10 19V5M13 22H19C21 22 22 21 22 19V5C22 3 21 2 19 2H13C11 2 10 3 10 5M14 8V13M18 8V13M6 13V17M15 17C14.45 17 14 17.45 14 18V22H18V18C18 17.45 17.55 17 17 17H15Z"
        stroke=""
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default BuildingIcon
