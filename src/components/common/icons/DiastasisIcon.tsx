import React from 'react'
import { IconProps } from '../../../common/types'

const DiastasisIcon: React.FC<IconProps> = () => {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#000"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 1.5.7 2.8 1.8 3.7" />
      <path d="M12 2c2.5 0 4.5 2 4.5 4.5 0 1.5-.7 2.8-1.8 3.7" />
      <line x1="12" y1="10" x2="12" y2="22" />
      <path d="M9 14l-2 4" />
      <path d="M15 14l2 4" />
      <path d="M8 18h8" />
      <circle cx="12" cy="13" r="0.5" fill="#000" />
    </svg>
  )
}

export default DiastasisIcon
