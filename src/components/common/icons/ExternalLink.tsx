import React from 'react'
import { IconProps } from '../../../common/types'
const ExternalLink: React.FC<IconProps> = () => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.25 2.75H2.75C1.7835 2.75 1 3.5335 1 4.5V13.25C1 14.2165 1.7835 15 2.75 15H11.5C12.4665 15 13.25 14.2165 13.25 13.25V9.75M9.75 1H15M15 1V6.25M15 1L6.25 9.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ExternalLink
