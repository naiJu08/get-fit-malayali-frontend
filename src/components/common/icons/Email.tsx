import React from 'react'
import { IconProps } from '../../../common/types'

const EmailIcon: React.FC<IconProps> = () => {
  return (
    <svg
      width="16"
      height="17"
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 5.36816L7.2604 8.8751C7.70827 9.17368 8.29173 9.17368 8.7396 8.8751L14 5.36816M3.33333 12.7015H12.6667C13.403 12.7015 14 12.1045 14 11.3682V4.7015C14 3.96512 13.403 3.36816 12.6667 3.36816H3.33333C2.59695 3.36816 2 3.96512 2 4.7015V11.3682C2 12.1045 2.59695 12.7015 3.33333 12.7015Z"
        stroke="#222222"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default EmailIcon
