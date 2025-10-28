import React, { useEffect, useRef, useState } from 'react'

import Icons from '../icons'

// interface MenuItem {
//   value: string
//   label: string
// }
interface SelectDropdownProps {
  tileItem?: any
  dropdownMenu?: any
  setUpdateCREId?: any
  unAllocate?: boolean
  getData?: (search: string, page: number) => any
  disabled?: boolean
  slug?: any
}
const DropdownMenu: React.FC<SelectDropdownProps> = ({
  tileItem,
  dropdownMenu = [],
  setUpdateCREId,
  unAllocate,
  slug,
}) => {
  const menuItems = dropdownMenu
  const [isOpen, setIsOpen] = useState(false)
  const [dropdown, setDropdown] = useState<any>(menuItems || [])
  const [menuValue, setMenuValue] = useState(
    tileItem?.value
      ? tileItem?.value
      : (tileItem?.placeholder ?? tileItem?.label)
  )
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // const menuItems: MenuItem[] = [
  //   { value: 'CRE Name1', label: 'CRE Name1' },
  //   { value: 'CRE Name2', label: 'CRE Name2' },
  // ]
  useEffect(() => {
    setDropdown(menuItems)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItems])
  const handleMenuItemClick = (item?: any) => {
    if (slug === 'service_priority') {
      item.slug = slug
      setUpdateCREId?.(item ?? null)
    } else {
      setUpdateCREId?.(item.id ?? null, item)
    }
    setMenuValue(item?.code ?? item?.value ?? '')
    setIsOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateShortLabel = (v?: string) => {
    let shortName = '--'
    if (v && v !== '') {
      const splittedName = v.split(' ')
      if (splittedName?.length >= 2) {
        shortName = `${splittedName[0]?.charAt(0)}${splittedName[1]?.charAt(0)}`
      } else {
        shortName = `${splittedName[0]?.charAt(0)}${splittedName[0]?.charAt(0)}`
      }
    }
    return shortName
  }
  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex items-center gap-1 h-[22px] px-1.5 py-[3px] rounded-3xl bg-white cursor-pointer"
        // onClick={() => {
        //   disabled ? null : setIsOpen(!isOpen)
        // }}
      >
        <div className="w-4 h-4 rounded-full flex items-center justify-center bg-[#bdbdbd] text-white text-[8px] leading-4">
          {generateShortLabel(tileItem?.value || menuValue)}
        </div>
        <p className=" text-secondary normal-case text-xxs leading-4 font-medium">
          {tileItem?.value ? tileItem?.value : menuValue}
        </p>
        <Icons name="drop-arrow" className="tileIconWidth-xs iconBlack" />
      </div>
      {isOpen && (
        <div className="menuopened">
          <div className=" max-h-[300px] overflow-y-auto">
            {dropdown?.map((item: any) => (
              <div
                className="menuopened-item"
                key={item?.code ?? item.value}
                onClick={() => handleMenuItemClick(item)}
              >
                {item?.name ?? item.label ?? item.value}
              </div>
            ))}
          </div>
          {!unAllocate && tileItem?.value !== '--' && menuValue !== '--' && (
            <>
              <div className="w-full h-px bg-formBorder"></div>
              <div
                onClick={() => {
                  handleMenuItemClick()
                }}
                className="menuopened-item text-error"
              >
                Unallocate
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default DropdownMenu
