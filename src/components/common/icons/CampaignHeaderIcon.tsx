import React from 'react'
import { IconProps } from '../../../common/types'

const CampaignHeaderIcon: React.FC<IconProps> = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1.5em"
      height="1.5em"
      viewBox="0 0 24 24"
    >
      <path d="M0 0h24v24H0z" fill="none" />
      <path
        fill="none"
        stroke="#605555"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m3 18l9-6.462L3 6zh18V6l-9 5.538"
      />
    </svg>
  )
}

export default CampaignHeaderIcon
