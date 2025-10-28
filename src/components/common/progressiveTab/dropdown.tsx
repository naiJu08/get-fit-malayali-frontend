import React, { useEffect, useRef, useState } from 'react'

import Icons from '../icons'
import ReactDOM from 'react-dom'

type MenuProps = {
  id: number
  label: string
  name?: string
  customer_display_name?: string
  state?: boolean
}
type TabDataProps = {
  data: MenuProps[]
  labelName: string
  currentStatus?: any
  isStatic: boolean
  setUpdateStatus?: any
  statusItem?: any
  handleConversion?: (item?: any) => void
  disableStatus?: boolean
}

const ProgressDropdown: React.FC<TabDataProps> = ({
  data,
  labelName,
  currentStatus,
  setUpdateStatus,
  isStatic,
  statusItem,
  handleConversion,
  disableStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [menuValue, setMenuValue] = useState<string>(labelName)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const handleMenuItemClick = (item: any) => {
    setUpdateStatus(item)

    setMenuValue(item.name)
    setIsOpen(false)
  }
  const handleStaticItemClick = () => {
    setUpdateStatus?.(statusItem)
  }
  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])
  const handleMenuLabel = () => {
    if (data?.length === 1) {
      return data.find((item) => item.name === menuValue) ? true : false
    }
  }
  const toggleDropdown = () => {
    if (!isStatic) {
      setIsOpen(!isOpen)

      if (!isOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.top + rect.height,
          left: rect.left,
        })
      }
    }
  }
  const handleScroll = () => {
    setIsOpen(false)
  }

  useEffect(() => {
    const adjustPosition = () => {
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.top + window.scrollY + rect.height,
          left: rect.left + window.scrollX,
        })
      }
    }

    const scrollContainer = document.querySelector('.arrow-steps')
    scrollContainer?.addEventListener('scroll', handleScroll)

    adjustPosition()
    window.addEventListener('resize', adjustPosition)

    return () => {
      scrollContainer?.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', adjustPosition)
    }
  }, [])
  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={
          currentStatus?.code === 'converted'
            ? 'flex items-center justify-center gap-1  '
            : 'flex items-center justify-center gap-1  cursor-pointer'
        }
        onClick={() =>
          handleMenuLabel() && !disableStatus && !isStatic
            ? handleConversion?.()
            : disableStatus
              ? ''
              : isStatic
                ? handleStaticItemClick?.()
                : toggleDropdown()
        }
      >
        <p className=" text-primaryText normal-case text-sm font-medium">
          {menuValue}
        </p>
        {!handleMenuLabel() && !disableStatus && !isStatic && (
          <Icons name="drop-arrow" className="tileIconWidth-xs iconBlack" />
        )}
      </div>
      {isOpen &&
        !isStatic &&
        ReactDOM.createPortal(
          <div
            className="menuopened mt-5"
            style={{
              position: 'absolute',
              zIndex: 1000,
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              maxWidth: 350,
            }}
          >
            {data.map((item) => (
              <>
                {/* {item.state ? ( */}
                {item.id === currentStatus?.id ? (
                  <div className="flex flex-col gap-1" key={item.id}>
                    {/* <div className="w-full h-px  bg-formBorder"></div>  */}
                    <div
                      onClick={() => handleMenuItemClick(item)}
                      className="menuopened-item text-error"
                    >
                      {item.name}
                    </div>
                  </div>
                ) : (
                  <div
                    className="menuopened-item"
                    key={item.id}
                    onClick={() => handleMenuItemClick(item)}
                  >
                    {item.name}
                  </div>
                )}
              </>
            ))}
          </div>,
          document.body
        )}
    </div>
  )
}

export default ProgressDropdown
