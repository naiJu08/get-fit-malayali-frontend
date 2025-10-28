import React from 'react'
import { IconProps } from '../../../common/types'

const PaymentIcon: React.FC<IconProps> = () => {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 9.99805H22M11.5483 20.4978H6.43829C2.88829 20.4978 1.98828 19.6178 1.98828 16.1078V7.88782C1.98828 4.70782 2.72831 3.68782 5.51831 3.52782C5.79831 3.51782 6.10829 3.50781 6.43829 3.50781H17.5483C21.0983 3.50781 21.9983 4.38781 21.9983 7.89781V12.3078M6 15.998H10M16.4414 17.9976L17.4314 18.9876L19.5614 17.0176M21.42 20.058C20.73 21.218 19.46 21.998 18 21.998C16.54 21.998 15.27 21.218 14.58 20.058C14.21 19.458 14 18.748 14 17.998C14 15.788 15.79 13.998 18 13.998C20.21 13.998 22 15.788 22 17.998C22 18.748 21.79 19.458 21.42 20.058Z"
        stroke=""
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default PaymentIcon
