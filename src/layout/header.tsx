import { useState } from 'react'

import ThemeSwitcher from '../components/common/themeswitcher'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import HeaderMenu from './headerMenu'
import { themes } from './store'
import { useClearFilter } from '../store/filterSore/clearStore'

function stringToColor(string: string) {
  let hash = 0
  let i

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash)
  }

  let color = '#'

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff
    color += `00${value?.toString(16)}`.slice(-2)
  }
  /* eslint-enable no-bitwise */

  return color
}

export function stringAvatar(name: string) {
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: `${name?.split(' ')[0][0]}${name?.split(' ')[1][0]}`,
  }
}

export default function Header() {
  const {
    clearAuthenticated,
    userData,
    impersonating,
    setImpersonating,
    setActualUser,
  } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const handleClear = useClearFilter()

  // const [notificationSearch, setNotificationSearch] = useState({
  //   page_size: 30,
  //   page: 1,
  // })
  const toggle = () => {
    setIsOpen((old) => !old)
  }
  const transClass = isOpen ? 'flex' : 'hidden'
  // const [notificationData, setNotificationData] = useState<any>([])
  // const [notificationCount, setNotificationCount] = useState<number>(0)
  // const [notificationFilter, setNotificationFilter] = useState<any>()
  const handleLogout = () => {
    setActualUser({})
    setImpersonating(false)
    localStorage.setItem('shouldReload', 'false')
    clearAuthenticated()
    handleClear()
  }

  // const requestCache = new Map()

  // const getNotification = async (key?: boolean) => {
  //   const cacheKey = JSON.stringify({
  //     franchisee_id: notificationFilter,
  //     ...notificationSearch,
  //     page: key ? 1 : notificationSearch.page,
  //   })
  //   if (
  //     isLoading ||
  //     requestCache.get(cacheKey) ||
  //     (!hasMore && notificationSearch.page !== 1)
  //   )
  //     return

  //   setIsLoading(true)
  //   requestCache.set(cacheKey, true)

  //   try {
  //     const { data } = await getNotificationList({
  //       franchisee_id: notificationFilter,
  //       ...notificationSearch,
  //       page: key ? 1 : notificationSearch.page,
  //     })
  //     setNotificationCount(data.count)
  //     if (data.results?.length > 0) {
  //       setNotificationData((prevItems: any) => [...prevItems, ...data.results])
  //     } else {
  //       setNotificationData([])
  //     }

  //     const hasMoreItems = data.next !== null
  //     setHasMore(hasMoreItems)

  //     if (hasMoreItems) {
  //       setNotificationSearch((prevState) => ({
  //         ...prevState,
  //         page: prevState.page + 1,
  //       }))
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch notifications:', error)
  //   } finally {
  //     setIsLoading(false)
  //     requestCache.delete(cacheKey)
  //   }
  // }

  // useEffect(() => {
  //   getNotification()
  // }, [notificationFilter, openNotification])

  // const handleNotificationClose = () => {
  //   // setNotificationFilter(undefined)
  //   // setNotificationData([])
  //   setHasMore(false)
  //   // setNotificationSearch({ page: 1, page_size: 30 })
  //   setIsDrawerOpen(false)
  // }
  // const handleOpenNotification = () => {
  //   // setNotificationData([])
  //   setIsDrawerOpen(!isDrawerOpen)
  // }

  const onSelectTheme = (selection: string) => {
    setTheme(selection)
    toggle()
  }

  return (
    <>
      <header
        className={`${
          impersonating ? 'bg-primary grid-cols-3  ' : 'bg-white grid-cols-2'
        } dark:bg-gray-700 dark:text-white   text-gray-700 grid border-b border-divider py-3 px-4  z-10 h-16`}
      >
        <div className="flex  gap-3 items-center justify-end col-span-2">
          {/* <span
            onClick={() => handleOpenNotification()}
            className={`relative flex flex-col items-center border rounded-full p-2 cursor-pointer ${
              impersonating && ' bg-white'
            } ${notificationCount > 0 && '  border-primary'}`}
          >
            <Icons name="notify-icon" />
            {notificationCount > 0 && (
              <div className="absolute top-0 right-0  transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px]  rounded-full h-5 w-5 flex items-center justify-center">
                {notificationCount > 99 ? '99+' : notificationCount}
              </div>
            )}
          </span> */}
          {/* <div className="customDropButton"></div> */}
          <>
            <div className="relative">
              <div
                className="hover:bg-primaryAlt bg-primary h-9 w-9 rounded-full cursor-pointer"
                onClick={toggle}
              />
              <div
                className={`absolute top-9 z-30 w-[100px] right-0 flex flex-col py-4 dark:bg-black bg-white shadow-2xl border border-primary rounded-md ${transClass}`}
              >
                {themes.map((item) => (
                  <span
                    key={item.theme}
                    className={`${theme === item.theme ? 'text-primary' : ''} hover:bg-zinc-300 hover:text-zinc-500 px-4 py-1 cursor-pointer`}
                    onClick={() => {
                      onSelectTheme(item.theme)
                    }}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
            {isOpen ? (
              <div
                className="fixed top-0 right-0 bottom-0 left-0 z-20 "
                onClick={toggle}
              ></div>
            ) : (
              <></>
            )}
          </>
          <div className=" w-9 h-9 flex items-center justify-center">
            <ThemeSwitcher />
          </div>

          <HeaderMenu userData={userData} handleLogout={handleLogout} />
        </div>
      </header>

      {/* {isDrawerOpen && (
        <NotificationList
          handleClose={handleNotificationClose}
          open={isDrawerOpen}
          notificationData={notificationData}
          getNotification={() => console.log('d')}
          setNotificationFilter={setNotificationFilter}
          setNotificationData={setNotificationData}
          notificationFilter={notificationFilter}
          isLoading={isLoading}
          setHasMore={setHasMore}
          franchiseeData={franchiseeData}
          hasMore={hasMore}
          setIsloading={setIsLoading}
          notificationCount={notificationCount}
          setNotificationSearch={setNotificationSearch}
        />
      )} */}
    </>
  )
}
