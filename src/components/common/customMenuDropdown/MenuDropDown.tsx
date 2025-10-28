import { useEffect, useRef, useState } from 'react'
import Icons from '../icons'

type Props = {
  iconName: string

  headerMenuItems?: {
    id?: number
    label?: string
    iconName?: any
    isWarning?: any
    Action?: () => void
    hidden?: boolean
    menuItems?: any
  }[]
}

export default function MenuDropDown({ iconName, headerMenuItems }: Props) {
  const [openMenu, setOpenMenu] = useState(false)
  const [menuOrigin, setMenuOrigin] = useState<'top' | 'bottom'>('top')
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const toggleMenu = () => {
    setOpenMenu(!openMenu)
  }
  const handleClose = () => {
    setOpenMenu(false)
  }
  const handleMenuItemClick = (item: any) => {
    item.Action()
    handleClose()
  }
  useEffect(() => {
    if (menuButtonRef.current) {
      const buttonRect = menuButtonRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      if (buttonRect.bottom > windowHeight - buttonRect.top) {
        setMenuOrigin('top')
      } else {
        setMenuOrigin('bottom')
      }
    }
  }, [openMenu])

  return (
    <div
      className="dropdown text-black dark:text-white  dark:bg-[#424242]  bg-white"
      ref={menuRef}
    >
      <button
        className="dropdown-toggle"
        onClick={toggleMenu}
        ref={menuButtonRef}
      >
        <Icons name={iconName} />
      </button>
      {openMenu && (
        <div
          className={`dropdown-menu origin-${menuOrigin} rounded  absolute right-0 mt-2 w-56 z-10   shadow-modalShadow bg-white focus:outline-none dark:bg-[#424242]  dark:text-white `}
        >
          <div className="p-2 bg-white rounded w-full border  border-grey-border shadow-menudropdown  dark:bg-[#424242]  dark:text-white">
            {headerMenuItems?.map((item) => (
              <>
                {!item.hidden && (
                  <a
                    key={item.id}
                    href="#/"
                    className={`p-2 leading-7 hover:bg-background `}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleMenuItemClick(item)
                    }}
                  >
                    <div
                      className={`${
                        item.isWarning
                          ? 'text-error-light'
                          : 'text-black dark:text-white'
                      } text-xxs  flex items-center w-full tracking-[0.24px] font-medium leading-4`}
                    >
                      {item?.iconName && <Icons name={item?.iconName} />}
                      <span className="pl-1.5 ">{item.label}</span>
                    </div>
                  </a>
                )}
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
