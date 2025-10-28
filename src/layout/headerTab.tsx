import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { RouterMenuProps } from '../configs/route.config'
import { useDomainManageStore } from '../store/domainManageStore'
import { generateArray } from './store'

const HeaderTab = () => {
  const [headerMenu] = useState<RouterMenuProps[]>(generateArray())

  const { pathname } = useLocation()

  const verifyChildLink = (childItem: any) => {
    return childItem.path === pathname || pathname.includes(childItem.path)
    // childItem?.find((a: any) => a.path === pathname) ? true : false
  }
  const domainType = useDomainManageStore.getState().domainType
  return (
    <ul className="flex gap-2 text-common text-secondary font-medium header-tab me-auto bg-grey-lightHover p-1 rounded-md">
      {headerMenu.map((item) => (
        <>
          {item.isSidebarMenu && item.permission_slugs.includes(domainType) && (
            <Link to={item?.pathOverride ?? (item.path as string)}>
              <li
                key={item.id}
                className={`py-1 px-2  cursor-pointer hover:text-primary relative rounded-md leading-5  ${verifyChildLink(item) ? 'text-primary drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)] bg-white ' : ''}`}
              >
                {item.label}
              </li>
            </Link>
          )}
        </>
      ))}
      {/* <li className="px-2.5 py-[18px] cursor-pointer">Home</li>
        <li className="px-2.5 py-[18px] cursor-pointer">Accounts</li>
        <li className="px-2.5 py-[18px] cursor-pointer">Leads</li>
        <li className="px-2.5 py-[18px] cursor-pointer">Tab 4</li>
        <li className="px-2.5 py-[18px] cursor-pointer">Tab 5</li>
        <li className="px-2.5 py-[18px] cursor-pointer">Tab 6</li> */}
    </ul>
  )
}

export default HeaderTab
