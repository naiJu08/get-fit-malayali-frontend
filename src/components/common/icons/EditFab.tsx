import React from 'react'
import { IconProps } from '../../../common/types'

const EditFabIcon: React.FC<IconProps> = ({ className = '' }) => {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.58824 15H14.5882H7.58824ZM12.5294 6.76471L15 4.29412L11.7059 1L9.23529 3.47059M12.5294 6.76471L4.29412 15H1V11.7059L9.23529 3.47059M12.5294 6.76471L9.23529 3.47059L12.5294 6.76471Z"
        fill="none"
      />
      <path
        d="M7.58824 15H14.5882M12.5294 6.76471L15 4.29412L11.7059 1L9.23529 3.47059M12.5294 6.76471L4.29412 15H1V11.7059L9.23529 3.47059M12.5294 6.76471L9.23529 3.47059"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default EditFabIcon
