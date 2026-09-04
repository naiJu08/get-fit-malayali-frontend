import { IconProps } from '../../../common/types'

const HamburgerIcon: React.FC<IconProps> = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="2em"
      height="2em"
      viewBox="0 0 16 16"
    >
      <path
        fill="none"
        stroke="#1072D7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="m2.75 12.25h10.5m-10.5-4h10.5m-10.5-4h10.5"
      />
    </svg>
  )
}

export default HamburgerIcon
