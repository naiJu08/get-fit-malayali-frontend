import React, { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import Icons from '../components/common/icons'
import { useLayoutStore } from '../store/layoutStore'
import { router_config } from '../configs/route.config'
// import './layout.css'
import { useAuthStore } from '../store/authStore'
import { RouterMenuProps } from '../configs/route.config'

interface SidebarMenuProps extends Omit<RouterMenuProps, 'hasChild'> {
  hasChild?: RouterMenuProps[]
}

const ROLE_USER_PATHS = [
  '/users/nutritionist',
  '/users/physiotherapist',
  '/users/yogist',
  '/users/sales',
  '/users/marketing',
]

const generateArray = (m: {
  [key: string]: RouterMenuProps
}): RouterMenuProps[] => {
  return Object.keys(m).map((k) => {
    const obj = m[k]
    return { ...obj, slug: k }
  })
}

const buildMenuHierarchy = (items: RouterMenuProps[]): SidebarMenuProps[] => {
  // 1. Filter only items that should be in the sidebar (or dashboard)
  const menuItems = items.filter(
    (item) => item.isSidebarMenu || item.key === 'dashboard'
  )

  // 2. Identify the root items (items where parent_id is null or parent is not in the sidebar)
  const roots = menuItems.filter((item) => {
    if (item.parent_id === null) return true
    const parentExists = menuItems.some((p) => p.id === item.parent_id)
    return !parentExists
  })

  // 3. Map children to their parent roots
  return roots.map((root) => {
    const children = menuItems.filter((child) => child.parent_id === root.id)
    return {
      ...root,
      hasChild: children.length > 0 ? children : undefined,
    }
  })
}

export default function Sidenav() {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  )
  const { expand, setExpand } = useLayoutStore()
  const navigate = useNavigate()
  const { roleData } = useAuthStore()

  const [sidebarList] = React.useState<SidebarMenuProps[]>(
    buildMenuHierarchy(generateArray(router_config))
  )

  const navSubmenu = (e: React.MouseEvent, item: any) => {
    const visibleChildren = item.hasChild?.filter(checkPermission)
    if (visibleChildren && visibleChildren.length > 0) {
      e.preventDefault()
      setExpandedGroups((prev) => ({
        ...prev,
        [item.label]: !prev[item.label],
      }))
      if (!expand) {
        setExpand(true)
      }
    } else if (item?.path) {
      navigate(item?.path)
    }
  }

  const selectedSub = (index: number, childItem: any) => {
    navigate(childItem.path)
  }

  const { pathname } = useLocation()

  const normalizePath = useCallback((value?: string) => {
    if (!value) return ''
    if (value === '/') return '/'
    return value.replace(/\/+$/, '')
  }, [])

  const pathMatches = useCallback(
    (current: string, candidate?: string) => {
      if (!candidate) return false
      const normalizedCandidate = normalizePath(candidate)
      const normalizedCurrent = normalizePath(current)
      if (!normalizedCandidate) return false

      if (!candidate.includes(':')) {
        if (normalizedCurrent === normalizedCandidate) return true
        return normalizedCurrent.startsWith(`${normalizedCandidate}/`)
      }

      const pattern = `^${normalizedCandidate.replace(/:[^/]+/g, '[^/]+')}$`
      const regex = new RegExp(pattern)
      if (regex.test(normalizedCurrent)) return true

      const base = normalizePath(candidate.split('/:')[0])
      if (base) {
        if (normalizedCurrent === base) return true
        if (normalizedCurrent.startsWith(`${base}/`)) return true
      }

      return false
    },
    [normalizePath]
  )

  const candidatePathsForItem = useCallback((item: RouterMenuProps) => {
    const paths: string[] = []
    if (item.path) paths.push(item.path)
    if (Array.isArray(item.slugOptions)) {
      item.slugOptions.forEach((slugKey) => {
        const slugConfig = router_config?.[slugKey]
        if (slugConfig?.path) paths.push(slugConfig.path)
      })
    }
    return paths
  }, [])

  const isItemActive = useCallback(
    (item: RouterMenuProps | SidebarMenuProps) => {
      const candidates = candidatePathsForItem(item as RouterMenuProps)
      if (
        item.key === 'client-users' &&
        String(roleData?.name || '').toLowerCase() === 'superadmin' &&
        ROLE_USER_PATHS.some((base) => pathMatches(pathname, base))
      ) {
        return false
      }
      return candidates.some((candidate) => pathMatches(pathname, candidate))
    },
    [pathname, candidatePathsForItem, pathMatches, roleData?.name]
  )

  const verifyChildLink = useCallback(
    (children?: RouterMenuProps[]) => {
      if (!children) return false
      return children.some((child) => isItemActive(child))
    },
    [isItemActive]
  )

  const isSubmenuOpen = useCallback(
    (item: SidebarMenuProps) => {
      return !!expandedGroups[item.label]
    },
    [expandedGroups]
  )

  const checkPermission = (item: any) => {
    return item.permission_slugs?.some((pr: any) => pr === roleData?.name)
  }

  // Automatically expand groups that contain the active child when pathname changes
  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = { ...prev }
      let changed = false
      sidebarList.forEach((item) => {
        if (item.hasChild && verifyChildLink(item.hasChild)) {
          if (!next[item.label]) {
            next[item.label] = true
            changed = true
          }
        }
      })
      return changed ? next : prev
    })
  }, [pathname, sidebarList, verifyChildLink])

  return (
    <div
      className={`sidenav -left-full border-t-0 sm:left-0 duration-300 h-full fixed z-20 border bg-primaryBlue ${!expand ? 'w-20' : 'w-[280px]'} overflow-y-auto no-scrollbar`}
    >
      {/* MENU LISTS  */}
      <div className="p-4 pt-0 mb-[60px] flex flex-col min-h-full justify-between">
        <ul className="mt-[40px]">
          {sidebarList.map((item) => {
            if (!checkPermission(item)) {
              return null
            }

            const visibleChildren = item.hasChild?.filter(checkPermission)
            const isActive =
              isItemActive(item) || verifyChildLink(visibleChildren)
            const isOpen = isSubmenuOpen(item)

            return (
              <li key={item.id}>
                <Link
                  to={
                    visibleChildren && visibleChildren.length > 0
                      ? '#'
                      : item.path || pathname
                  }
                  onClick={(e) => navSubmenu(e, item)}
                  className={`flex items-center gap-2.5 p-3 transition-colors duration-200 mb-3 group rounded-md cursor-pointer hover:bg-white/10 ${isActive ? 'bg-white/20 text-white' : 'text-white'} ${!expand ? 'justify-center' : 'justify-start'}`}
                >
                  <div
                    className={`w-5 h-5 stroke-white group-hover:stroke-white ${isActive ? 'stroke-white' : ''}`}
                  >
                    {item.icon ? (
                      <Icons name={item.icon} />
                    ) : (
                      <Icons name="menu-list" />
                    )}
                  </div>

                  <span
                    className={`text-common text-white group-hover:text-white ${isActive ? 'text-white' : ''} ${!expand ? 'hidden' : 'block'}`}
                  >
                    {item.label}
                  </span>
                  {visibleChildren && visibleChildren.length > 0 && (
                    <div
                      className={`w-4 h-4 ms-auto text-white group-hover:text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isActive ? 'text-white' : ''} ${!expand ? 'hidden' : 'block'}`}
                    >
                      <Icons name="drop-arrow" />
                    </div>
                  )}
                </Link>

                {visibleChildren && visibleChildren.length > 0 && (
                  <ul
                    className={`overflow-hidden submenu transition-[max-height] ease-in-out duration-300 ${!expand ? 'ps-0' : 'ps-5'} ${isOpen ? 'max-h-96' : 'max-h-0'}`}
                  >
                    {visibleChildren?.map(
                      (childItem: any, childIdx: number) => (
                        <React.Fragment key={childItem.id}>
                          {!expand && childItem.path === pathname ? (
                            <li
                              className={`relative before:absolute before:h-[50px] before:w-[8px] before:border before:border-grey-borderAlt before:border-r-0 before:border-t-0 before:-left-[5%] before:-top-[30px] ${!expand ? 'before:hidden' : ''}`}
                            >
                              <div>
                                <div
                                  onClick={() =>
                                    selectedSub(childIdx, childItem)
                                  }
                                  className={`flex items-center p-2 transition mb-2 rounded-sm cursor-pointer hover:bg-primary bg-primary ${!expand ? 'justify-center py-3 font-semibold' : 'justify-between'}`}
                                >
                                  <span className="text-common text-bgWhite">
                                    {!expand
                                      ? childItem.label.slice(0, 2)
                                      : childItem.label}
                                  </span>
                                </div>
                                <div className="flex justify-center stroke-primary mb-3">
                                  <Icons name="three_dot_horizontal" />
                                </div>
                              </div>
                            </li>
                          ) : (
                            <>
                              {expand && (
                                <li
                                  className={`relative before:absolute before:h-[50px] before:w-[8px] before:border before:border-grey-borderAlt before:border-r-0 before:border-t-0 before:-left-[5%] before:-top-[30px]`}
                                >
                                  <div>
                                    <div
                                      onClick={() =>
                                        selectedSub(childIdx, childItem)
                                      }
                                      className={`flex items-center p-2 transition-colors duration-200 mb-3 group rounded-md cursor-pointer hover:bg-white/10 justify-between ${isItemActive(childItem) ? 'bg-white/20' : ''}`}
                                    >
                                      <span
                                        className={`text-common text-white group-hover:text-white ${isItemActive(childItem) ? 'text-white' : ''}`}
                                      >
                                        {childItem.label}
                                      </span>
                                      <span
                                        className={`text-common text-white group-hover:text-white ${isItemActive(childItem) ? 'text-white' : ''}`}
                                      >
                                        {childItem.value}
                                      </span>
                                    </div>
                                  </div>
                                </li>
                              )}
                            </>
                          )}
                        </React.Fragment>
                      )
                    )}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
        <div className={`mt-auto pt-3 pb-4 ${!expand ? 'px-2' : 'px-4'}`}>
          <div
            className={`rounded-xl bg-white/[0.07] backdrop-blur-sm border border-white/[0.06] ${!expand ? 'px-2 py-3' : 'px-3.5 py-3'}`}
          >
            {!expand ? (
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[13px] font-bold text-white/90 tracking-wide">
                  ID
                </span>
                <span className="text-[7px] text-white/30 uppercase tracking-widest leading-none">
                  Inovace
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white/90">
                    ID
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-white/40 leading-none mb-1">
                    Developed and Maintained by
                  </p>
                  <p className="text-[11px] font-semibold text-white/80 leading-none truncate">
                    Inovace Digital
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
