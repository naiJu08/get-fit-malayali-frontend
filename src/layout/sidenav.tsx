import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import Icons from '../components/common/icons'
import { useLayoutStore } from '../store/layoutStore'
import { router_config } from '../configs/route.config'
import './layout.css'
import { useAuthStore } from '../store/authStore'
import { RouterMenuProps } from '../configs/route.config'
const generateArray = (m: {
  [key: string]: RouterMenuProps
}): RouterMenuProps[] => {
  return Object.keys(m).map((k) => {
    const obj = m[k]
    return { ...obj, slug: k }
  })
}
export default function Sidenav() {
  const [active, setActive] = useState<boolean>(false)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const { expand } = useLayoutStore()
  const navigate = useNavigate()
  const { roleData } = useAuthStore()
  const [sidebarList] = React.useState<RouterMenuProps[]>(
    generateArray(router_config) as RouterMenuProps[]
  )
  const navSubmenu = (index: number, item: any) => {
    setActive(!active)
    setActiveIndex(index)
    // set!expand(!!expand)
    navigate(item?.path)
    // window.open(item.path, '_self')
  }
  // const [sideMenu, setSideMenu] = useState<RouterMenuProps[]>(
  //   generateArray()
  // )

  // const activeMenuItem = sidebarList.find(
  // (item) => item.path && pathname.startsWith(item.path)
  // )
  // const activeSlug = activeMenuItem ? activeMenuItem.slug : null

  const { pathname } = useLocation()

  const checkPermission = (item: any) => {
    return item.permission_slugs?.some((pr: any) => pr === roleData?.name)
  }
  return (
    <div
      className={`sidenav -left-full border-t-0 sm:left-0 duration-300 h-full fixed z-20 border bg-primaryBlue ${!expand ? 'w-20' : 'w-[280px] '}`}
    >
      {/* HEADER  */}
      {/* <div
        className={`flex gap-2.5 fixed z-20 bg-white duration-300 px-5 py-3 border-r border-b ${!expand ? 'w-20' : 'w-[280px] '} `}
      >
        <div className="border w-10 h-10 rounded-md font-medium text-primaryText bg-[#5B58E61F] shrink-0 flex items-center justify-center text-base">
          QB
        </div>
        <div className={`${!expand ? 'hidden ' : ' block'}`}>
          <p className="font-bold text-common line-clamp-1 text-blackAlt">
            Quinoid Business Solutions Privet Limited
          </p>
          <span className="text-xxs text-blackAlt">Branch Name</span>
        </div>
      </div> */}

      {/* MENU LISTS  */}
      <div className="p-4 pt-0 flex flex-col h-full justify-between">
        <ul className="mt-[40px]">
          {/* <li>
              <div className='flex gap-2.5 p-2 transition mb-3 group rounded-sm cursor-pointer bg-primary'>
                <div className="w-5 h-5 stroke-white">
                  
                    <Icons name='dashboard-icon'/>
              </div>
              
                <span className='text-common text-white hidden xl:block'>Dashboard</span>
              </div>
            </li> */}

          {sidebarList.map((item, index) => {
            if (!checkPermission(item)) {
              return null
            }

            /** Determine if menu item is active */
            // const isActive =
            //   activeSlug &&
            //   (activeSlug === item?.slug ||
            //     item?.slugOptions?.includes(activeSlug))
            // const isActiveIndex = active && activeIndex === index
            return (
              <li key={item.id}>
                <Link
                  to={item.path || pathname}
                  onClick={() => navSubmenu(index, item)}
                  className={`flex items-center gap-2.5 p-3 transition-colors duration-200 mb-3 group rounded-md cursor-pointer hover:bg-white/10 ${item.path === pathname ? 'bg-white/20 text-white' : 'text-white'}  ${!expand ? 'justify-center ' : ' justify-start'} ${active && activeIndex === index ? 'text-white' : ''}`}
                >
                  <div
                    className={`w-5 h-5 stroke-white group-hover:stroke-white ${item.path === pathname ? 'stroke-white' : ''}`}
                  >
                    {item.icon ? (
                      <Icons name={item.icon} />
                    ) : (
                      <Icons name="menu-list" />
                    )}
                  </div>

                  <span
                    className={`text-common text-white group-hover:text-white ${item.path === pathname ? 'text-white' : ''} ${!expand ? 'hidden ' : ' block'}`}
                  >
                    {item.label}
                  </span>
                  {item.hasChild && (
                    <div
                      className={`w-4 h-4 ms-auto text-white group-hover:text-white ${item.path === pathname ? 'text-white' : ''} ${!expand ? 'hidden ' : ' block'}`}
                    >
                      <Icons name="drop-arrow" />
                    </div>
                  )}
                </Link>

                {/* {item.hasChild && (
                  <ul
                    className={` overflow-hidden submenu transition-[max-height] ease-in-out duration-700 ${!expand ? 'ps-0' : 'ps-5'} ${(active && activeIndex === index) || verifyChildLink(item.hasChild) ? 'max-h-96' : 'max-h-0'}`}
                  >
                    {item.hasChild?.map((childItem: any, index: number) => (
                      <>
                        {!expand && childItem.path === pathname ? (
                          <li
                            className={`relative before:absolute before:h-[50px] before:w-[8px] before:border before:border-grey-borderAlt before:border-r-0 before:border-t-0 before:-left-[5%] before:-top-[30px] ${!expand ? 'before:hidden' : ''}`}
                          >
                            <div>
                              <div
                                onClick={() => selectedSub(childItem.id)}
                                className={`flex  items-center p-2 transition mb-2  rounded-sm cursor-pointer hover:bg-primary bg-primary ${!expand ? 'justify-center py-3 font-semibold' : 'justify-between '} `}
                              >
                                <span className="text-common  text-bgWhite">
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
                                    onClick={() => selectedSub(index, childItem)}
                                    className={`flex items-center p-2 transition-colors duration-200 mb-3 group rounded-md cursor-pointer hover:bg-white/10 justify-between ${childItem.path === pathname ? 'bg-white/20' : ''}`}
                                  >
                                    <span
                                      className={`text-common text-white group-hover:text-white ${childItem.path === pathname ? 'text-white ' : ''}`}
                                    >
                                      {childItem.label}
                                    </span>
                                    <span
                                      className={`text-common text-white group-hover:text-white ${childItem.path === pathname ? 'text-white ' : ''}`}
                                    >
                                      {childItem.value}
                                    </span>
                                  </div>
                                </div>
                              </li>
                            )}
                          </>
                        )}
                      </>
                    ))}
                  </ul>
                )} */}
              </li>
            )
          })}

          {/* 
            <li>
              <div onClick={navSubmenu} className={`flex items-center gap-2.5 p-2 transition mb-3 group rounded-sm cursor-pointer hover:bg-primary ${active ? "text-primary" : ""}`}>
                <div className={`w-5 h-5 stroke-primaryText group-hover:stroke-white ${active ? "stroke-primary" : ""}`}>
            
                <Icons name='cart-icon'/>
              </div>

                <span className={`hidden xl:block text-primaryText text-common group-hover:text-white ${active ? "text-primary" : ""}`}>Purchases</span>

              
              <div className='w-4 h-4 ms-auto group-hover:text-white hidden xl:block'>
                <Icons name='drop-arrow'/>
              </div>
              </div>

              <ul className={`ps-5 max-h-0 overflow-hidden submenu transition-all ease-in-out duration-500 ${active ? "max-h-96" : ""}`}>
                <li>
                  <div className="flex justify-between items-center p-2 transition mb-3 group rounded-sm cursor-pointer hover:bg-primary">
                    <span className='text-primaryText text-common group-hover:text-white'>Payroll</span>
                    <span className='text-primaryText text-common group-hover:text-white'>12</span>
                  </div>
                </li>
                <li>
                  <div className="flex justify-between items-center p-2 transition mb-3 group rounded-sm cursor-pointer hover:bg-primary">
                    <span className='text-primaryText text-common group-hover:text-white'>Finance</span>
                    <span className='text-primaryText text-common group-hover:text-white'>02</span>
                  </div>
                </li>
                <li>
                  <div className="flex justify-between items-center p-2 transition mb-3 group rounded-sm cursor-pointer hover:bg-primary">
                    <span className='text-primaryText text-common group-hover:text-white'>Performance</span>
                    <span className='text-primaryText text-common group-hover:text-white'>22</span>
                  </div>
                </li>
                
              </ul>

            </li>



            <li>
              <div className='flex gap-2.5 p-2 transition mb-3 group rounded-sm cursor-pointer hover:bg-primary'>
                <div className="w-5 h-5 stroke-primaryText group-hover:stroke-white">
              
                <Icons name='receipt-icon'/>

              </div>
                <span className='text-primaryText text-common group-hover:text-white hidden xl:block'>Receipts</span>
                <span className='text-primaryText text-common group-hover:text-white ms-auto hidden xl:block'>77</span>
              </div>
            </li>

            <li>
              <div className='flex items-center gap-2.5 p-2 transition mb-3 group rounded-sm cursor-pointer hover:bg-primary'>
                <div className="w-5 h-5 stroke-primaryText group-hover:stroke-white">
            
              <Icons name='accounting-icon'/>

              </div>
                <span className='text-primaryText text-common group-hover:text-white hidden xl:block'>Accounting</span>
                <span className='text-primaryText text-common group-hover:text-white ms-auto hidden xl:block'>03</span>
              </div>
            </li>

            <li>
              <div className='flex items-center gap-2.5 p-2 transition mb-3 group rounded-sm cursor-pointer hover:bg-primary'>
                <div className="w-5 h-5 stroke-primaryText group-hover:stroke-white ">
                  <Icons name='building-icon'/>
              </div>
                <span className='text-primaryText text-common group-hover:text-white hidden xl:block'>Banking</span>
                <span className='text-primaryText text-common group-hover:text-white ms-auto hidden xl:block'>12</span>
              </div>
            </li>

            <li>
              <div className='flex items-center gap-2.5 p-2 transition mb-3 group rounded-sm cursor-pointer hover:bg-primary'>
                <div className="w-5 h-5 stroke-primaryText group-hover:stroke-white">
                <Icons name='barchart-icon'/>
              </div>
                <span className='text-primaryText text-common group-hover:text-white hidden xl:block'>Report</span>
                <span className='text-primaryText text-common group-hover:text-white ms-auto hidden xl:block'>32</span>
              </div>
            </li>

            <li>
              <div className='mb-3 border-b border-slate-200'></div>
            </li>

            <li>
              <div className='flex gap-2.5 p-2 transition mb-3 group rounded-sm cursor-pointer hover:bg-primary'>
                <div className="w-5 h-5 stroke-primaryText group-hover:stroke-white">
                <Icons name='check-mark'/>


              </div>
                <span className='text-primaryText text-common group-hover:text-white hidden xl:block'>Tasks</span>
                <span className='text-primaryText text-common group-hover:text-white ms-auto hidden xl:block'>12</span>
              </div>
            </li>

            <li>
              <div className='flex gap-2.5 p-2 transition mb-3 group rounded-sm cursor-pointer hover:bg-primary'>
                <div className="w-5 h-5 stroke-primaryText group-hover:stroke-white">
                
                <Icons name='Activities'/>
              </div>
                <span className='text-primaryText text-common group-hover:text-white hidden xl:block'>Activities</span>
                <span className='text-primaryText text-common group-hover:text-white ms-auto hidden xl:block'>12</span>
              </div>
            </li> */}
        </ul>

        {/* FOOTER  */}
        {/* <div className="h-14 w-full mt-[80px]">
          <img
            src="/images/logo.png"
            className="w-32 block mx-auto"
            alt="Bizpole"
          />
        </div> */}
      </div>
    </div>
  )
}
