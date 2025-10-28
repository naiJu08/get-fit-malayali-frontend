import { Link } from 'react-router-dom'

// import Icons from '../components/common/icons'
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
      <div className="w-[220px] ps-5 flex justify-between">
            {layoutType === 'sideNav' ? (
          <div
            onClick={() => setExpand(!expand)}
            className="h-6 w-6 fill-grey-medium cursor-pointer"
          >
           
          </div>
        ) : (
          ''
        )}
        <Link to={handleReturnPath()}>
          <div className="flex items-center gap-2 w-auto">
            <img className="h-10 w-auto object-contain" src="/logo-hori.png" alt="Get Fit Malayali" />
          </div>
        </Link>

    
      </div>
      {layoutType === 'headerNav' && <HeaderTab />}
      <div className="flex gap-2 items-center">
     
        <HeaderMenu userData={userData} handleLogout={handleLogout} />
      </div>
    </div>
  )
}

export default HeaderTop
