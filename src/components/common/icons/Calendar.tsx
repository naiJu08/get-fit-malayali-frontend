import React from 'react'
import { IconProps } from '../../../common/types'

const CalendarIcon: React.FC<IconProps> = () => {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.71061 6.79867V3.46533M13.3773 6.79867V3.46533M5.87728 10.132H14.2106M4.21061 18.4653H15.8773C16.7978 18.4653 17.5439 17.7191 17.5439 16.7987V6.79867C17.5439 5.87819 16.7978 5.132 15.8773 5.132H4.21061C3.29014 5.132 2.54395 5.87819 2.54395 6.79867V16.7987C2.54395 17.7191 3.29014 18.4653 4.21061 18.4653Z"
        stroke="#313131"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default CalendarIcon
