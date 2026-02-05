import { useEffect, useRef, useState } from 'react'

import Icons from '../components/common/icons/index'
// import { router_config } from '../configs/route.config'
import MyProfile from '../pages/profile'
// import MyProfile from '../pages/profile'
import ChangePassword from '../pages/profile/password'

type Props = {
  userData: any
  handleLogout: () => void
}

export default function HeaderMenu({ userData }: Props) {
  const [openMenu, setOpenMenu] = useState(false)
  const [openMyprofile, setOpenMyprofile] = useState(false)
  const [changePassword, setChangePassword] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [viewMode, setViewMode] = useState(false)

  const toggleMenu = () => {
    setOpenMenu(!openMenu)
    // setFranchiseeMenu(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  // const stringToColor = (string: string) => {
  //   let hash = 0
  //   let i

  //   /* eslint-disable no-bitwise */
  //   for (i = 0; i < string?.length; i += 1) {
  //     hash = string?.charCodeAt(i) + ((hash << 5) - hash)
  //   }

  //   let color = '#'

  //   for (i = 0; i < 3; i += 1) {
  //     const value = (hash >> (i * 8)) & 0xff
  //     color += `00${value?.toString(16)}`.slice(-2)
  //   }
  //   /* eslint-enable no-bitwise */

  //   return color
  // }

  // function stringAvatar(name: string) {
  //   if (typeof name !== 'string') {
  //     return { bgcolor: 'defaultColor', name: '?' }
  //   }

  //   const splitName = name.split(' ')

  //   return {
  //     bgcolor: stringToColor(name),
  //     name: splitName
  //       .filter((n) => n) // Filter out any empty strings
  //       .map((n) => n[0].toUpperCase()) // Capitalize the first letter
  //       .slice(0, 2) // Take only the first two elements
  //       .join(''), // Join them together
  //   }
  // }

  // const navigateToProfile = () => {
  //   toggleMenu()
  //   // navigate('/profile')
  //   if (location.pathname !== router_config.USER_PROFILE.path) {
  //     navigate(`${router_config.USER_PROFILE.path}`)
  //   }
  // }

  // const handleChangePassword = () => {
  //   setOpenMenu(false)
  //   setChangePassword(true)
  // }
  const handleClose = () => {
    setChangePassword(false)
  }
  const handleMyProfile = () => {
    setOpenMenu(false)
    setOpenMyprofile(true)
    setViewMode(true)
  }

  return (
    <div
      ref={menuRef}
      className="dropdown text-grey-medium text-common  bg-transparent"
    >
      <div className="dropdown-toggle bg-transparent">
        <div
          onClick={toggleMenu}
          className={`w-8 h-8  flex items-center justify-center border font-medium text-sm border-grey-mediumAlt stroke-grey-strong cursor-pointer rounded-xs`}
        >
          {/* {stringAvatar(userData?.username as string)?.name} */}
          <Icons className="iconSize-large" name={'profile_icon'} />
        </div>
      </div>

      {openMenu && (
        <div
          className={`dropdown-menu flex flex-col gap-1 origin-top ${'text-grey-medium text-common'} p-4 text-sm font-normal   tracking-[0.24px]  rounded-[8px]  absolute right-0 mt-[20px] top-8 w-auto shadow-modalShadow bg-white  focus:outline-none `}
        >
          {/* <div
            className={`p-2 leading-7 hover:bg-background  flex min-w-[300px]  justify-between items-center gap-3 w-max   `}
          >
            <div
              className={`   flex items-center  w-full tracking-[0.24px]  leading-4`}
            >
              <span
                className={`w-10 h-10 rounded-full flex justify-center border items-center bg-[${
                  stringAvatar(userData.name as string)?.bgcolor
                }]`}
              >
                {stringAvatar(userData.name as string)?.name}
              </span>
              <div className=" flex flex-col pl-1.5">
                <span className=" ">{userData.name}</span>
              </div>
            </div>
          </div>
          <div className="h-px w-full bg-formBorder"></div>

          <div
            className={`p-2 leading-7 hover:bg-background cursor-pointer`}
            onClick={() => {
              navigateToProfile()
            }}
          >
            <div
              className={`${'text-grey-medium text-common '}  flex items-center w-full tracking-[0.24px]  leading-4`}
            >
              <Icons name={'profile_icon'} />
              <span className="pl-1.5 ">Manage Profile </span>
            </div>
          </div> */}

          <a
            href="#/"
            className={`p-2 leading-7 hover:bg-background `}
            // onClick={() => navigateToProfile()}
            onClick={() => {
              // navigate('/profile')
              handleMyProfile()
            }}
          >
            <div
              className={`${'text-grey-medium text-common '}  font-medium  flex items-center w-full tracking-[0.24px]  leading-4`}
            >
              <Icons className="iconSize-large" name={'profile_icon'} />

              <span className="pl-1.5 ">{'My Profile'}</span>
            </div>
          </a>

          {/* <a
            href="#/"
            className={`p-2 leading-7 hover:bg-background `}
            onClick={() => {
              handleChangePassword()
            }}
          >
            <div
              className={`${'text-grey-medium text-common '} font-medium   flex items-center w-full tracking-[0.24px]  leading-4`}
            >
              <Icons className="iconSize-large" name={'refresh'} />

              <span className="pl-1.5 ">{'Change Password'}</span>
            </div>
          </a> */}

          {/* <a
            href="#/"
            className={`p-2 leading-7`}
            onClick={() => {
              handleLogout()
            }}
          >
            <div
              className={`${'text-common text-grey-medium '}  font-medium  flex items-center w-full tracking-[0.24px]  leading-4`}
            >
              <Icons className="iconSize-large" name={'logout_icon'} />

              <span className="pl-1.5 ">{'Log out'}</span>
            </div>
          </a> */}
        </div>
      )}
      <ChangePassword
        isOpen={changePassword}
        handleClose={handleClose}
        empId={userData?.id}
      />
      <MyProfile
        isDrawerOpen={openMyprofile}
        setOpenMyprofile={setOpenMyprofile}
        setViewMode={setViewMode}
        viewMode={viewMode}
      />
    </div>
  )
}
