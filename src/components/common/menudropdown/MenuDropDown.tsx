import { useEffect, useRef, useState } from 'react'
import Icons from '../icons'

type Props = {
  iconName: string

  actionDropDown?: {
    title: string
    slug: string
    isWarning?: boolean
    iconName: string
    id: string
  }[]
  handleMenuActions?: (slug: string, rowData?: any) => void
}

export default function MenuDropDown({
  iconName,
  actionDropDown,
  handleMenuActions,
}: Props) {
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

  const handleMenuItemClick = (slug: string) => {
    handleMenuActions?.(slug)
    setOpenMenu(false)
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
          className={`dropdown-menu origin-${menuOrigin} rounded  absolute right-0 mt-2 w-56   shadow-modalShadow bg-white  focus:outline-none dark:bg-[#424242]  dark:text-white `}
        >
          <div className="p-2 bg-white rounded w-full border  border-grey-border shadow-menudropdown  dark:bg-[#424242]  dark:text-white">
            {actionDropDown?.map((item) => (
              <a
                key={item.id}
                href="#/"
                className={`p-2 leading-7 hover:bg-background `}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleMenuItemClick(item.slug)
                }}
              >
                <div
                  className={`${
                    item.isWarning
                      ? 'text-error-light'
                      : 'text-black dark:text-white'
                  } text-xxs  flex items-center w-full tracking-[0.24px] font-medium leading-4`}
                >
                  <Icons name={item.iconName} />
                  <span className="pl-1.5 ">{item.title}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
