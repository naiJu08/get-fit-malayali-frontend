import { Link } from 'react-router-dom'

import Icons from '../components/common/icons'
import { useAuthStore } from '../store/authStore'
import { useDomainManageStore } from '../store/domainManageStore'
import { useAccreditationFilterStore } from '../store/filterSore/accreditationStore'
import { useAdminUserFilterStore } from '../store/filterSore/adminUserStore'
import { useAssessorFilterStore } from '../store/filterSore/assessorStore'
import { useClearFilter } from '../store/filterSore/clearStore'
import { useOrganisationFilterStore } from '../store/filterSore/OrganisationStore'
import { useLayoutStore } from '../store/layoutStore'
import HeaderMenu from './headerMenu'
import HeaderTab from './headerTab'

const HeaderTop = () => {
  const { layoutType, expand, setExpand } = useLayoutStore()
  const handleClear = useClearFilter()

  const {
    clearAuthenticated,
    userData,
    // impersonating,
    setImpersonating,
    setActualUser,
  } = useAuthStore()

  const handleLogout = () => {
    useAdminUserFilterStore.getState().resetStore()
    useAssessorFilterStore.getState().resetStore()
    useOrganisationFilterStore.getState().resetStore()
    useAccreditationFilterStore.getState().resetStore()

    setActualUser({})
    setImpersonating(false)
    localStorage.clear()
    handleClear()
    localStorage.setItem('shouldReload', 'false')
    clearAuthenticated()
  }
  const { domainType } = useDomainManageStore()
  const handleReturnPath = () => {
    if (domainType === 'Organisation') {
      return '/myorganisation/profile'
    } else if (domainType === 'Assessor') {
      return '/assessors'
    } else {
      return '/admin-user'
    }
  }
  return (
    <div className="h-[64px] fixed w-full top-0 left-0 z-30 flex items-center justify-between bg-white border-formBorder border-b pe-5">
      <div className="w-[175px] ps-5 flex justify-between">
        <Link to={handleReturnPath()}>
          <div className="flex items-center gap-2 w-[135px]">
            <img className=" h-9" src="/images/logo-horizontal-new.png" />
          </div>
        </Link>

        {layoutType === 'sideNav' ? (
          <div
            onClick={() => setExpand(!expand)}
            className="h-6 w-6 fill-grey-medium cursor-pointer"
          >
            <Icons name="menu" />
          </div>
        ) : (
          ''
        )}
      </div>
      {layoutType === 'headerNav' && <HeaderTab />}
      <div className="flex gap-2 items-center">
        {/* <form className="flex gap-2 relative header-search" action="#">
          <Icons className="absolute left-2 top-2.5 h-6 w-6" name="search" />
          <input
            type="search"
            className="border border-divider ps-7 py-1.5 text-common rounded-sm outline-0 w-[210px] placeholder:italic"
            placeholder="Search"
          />
          <button className="w-8 h-8  flex items-center justify-center text-white cursor-pointer rounded-xs bg-primary">
            <Icons name="plus" />
          </button>
        </form>
        <button className="w-8 h-8  flex items-center justify-center border border-grey-mediumAlt stroke-grey-strong cursor-pointer rounded-xs">
          <Icons
            className="transition durtaion-600 iconSize-base  hover:rotate-180"
            name="settings"
          />
        </button> */}
        {/* <button className="w-8 h-8  flex items-center justify-center border border-grey-mediumAlt stroke-grey-strong cursor-pointer rounded-xs">
          <Icons
            onClick={() => navigate('/profile')}
            className="transition durtaion-600 iconSize-base  hover:scale-110"
            name="user"
          />
        </button> */}
        {/* <button className="w-8 h-8  flex items-center justify-center border border-grey-mediumAlt stroke-grey-strong cursor-pointer rounded-xs">
          <Icons name="notify-icon" className="iconSize-base" />
          </button> */}
        {/* <span className="absolute text-white text-xxs bg-notificationClr px-1 top-1 right-3 rounded-full">
            15
          </span> */}
        <HeaderMenu userData={userData} handleLogout={handleLogout} />
      </div>
    </div>
  )
}

export default HeaderTop
