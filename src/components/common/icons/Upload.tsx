import React from 'react'
import { IconProps } from '../../../common/types'

const UploadIcon: React.FC<IconProps> = () => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.6665 10.6666L2.6665 11.3333C2.6665 12.4379 3.56193 13.3333 4.6665 13.3333L11.3332 13.3333C12.4377 13.3333 13.3332 12.4379 13.3332 11.3333L13.3332 10.6666M10.6665 5.33331L7.99984 2.66665M7.99984 2.66665L5.33317 5.33331M7.99984 2.66665L7.99984 10.6666"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default UploadIcon
