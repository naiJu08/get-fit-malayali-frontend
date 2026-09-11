import React from 'react'
import { IconProps } from '../../../common/types'

const LeftArrowIcon: React.FC<IconProps> = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="2em"
      height="2em"
      viewBox="0 0 24 24"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m15 6l-6 6l6 6"
      />
    </svg>
  )
}

export default LeftArrowIcon
