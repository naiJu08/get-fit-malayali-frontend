import { debounce } from 'lodash'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import Icons from '../icons'
import Spinner from '../loader/Spinner'

interface SelectDropdownProps {
  tileItem?: any
  value?: any
  setUpdateCREId?: (id: any) => void
  unAllocate?: boolean
  getData?: (search: string, page: number) => Promise<any>
  disabled?: boolean
  hideSearch?: boolean
  hideLoader?: boolean
}

const DynamicDropdown: React.FC<SelectDropdownProps> = ({
  tileItem,
  value,
  setUpdateCREId,
  getData,
  disabled,
  hideSearch = false,
  hideLoader = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchKey, setSearchKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dropdown, setDropdown] = useState<any[]>([])
  const [menuValue, setMenuValue] = useState(
    tileItem?.value || tileItem?.placeholder || tileItem?.label || ''
  )

  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const handleMenuItemClick = useCallback(
    (item: any) => {
      setUpdateCREId?.(item?.id ?? null)
      setMenuValue(item?.value ?? '')
      setIsOpen(false)
    },
    [setUpdateCREId]
  )

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [handleClickOutside])

  const fetchAddonData = useCallback(
    debounce(async (search: string) => {
      setIsLoading(true)
      if (getData) {
        const res = await getData(search, 1)
        setDropdown(res)
      }
      setIsLoading(false)
    }, 300),
    [getData]
  )

  useEffect(() => {
    if (isOpen) {
      fetchAddonData(searchKey)
    }
  }, [isOpen, searchKey, fetchAddonData])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchKey(e.target.value)
      fetchAddonData(e.target.value)
    },
    [fetchAddonData]
  )
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className={`flex items-center justify-between gap-1 rounded-3xl ${!disabled && 'cursor-pointer'} w-full`}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev)
          }
        }}
      >
        <p className="text-primary text-common font-medium leading-none truncate">
          {menuValue}
        </p>
        {!disabled && (
          <Icons name="drop-arrow" className="tileIconWidth-xs iconBlack" />
        )}
      </div>
      {isOpen && (
        <div className="menuopened">
          <div className="max-h-[240px] overflow-y-auto flex flex-col gap-1">
            <div className="relative">
              {getData && !hideSearch && (
                <input
                  placeholder="Search"
                  className="sticky top-0 outline-none w-full textfield"
                  onChange={handleSearchChange}
                  value={searchKey ?? value}
                />
              )}
              {isLoading && !hideLoader && (
                <div className="absolute top-1.5 text-grey-light right-2 bg-grey-lightAlt grid place-items-center">
                  <Spinner />
                </div>
              )}
            </div>
            {dropdown?.map((item, ind) => (
              <div
                className="menuopened-item"
                key={`${ind}-${item.value}`}
                onClick={() => handleMenuItemClick(item)}
              >
                {item.label ?? item.value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DynamicDropdown
