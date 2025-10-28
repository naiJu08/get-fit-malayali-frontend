import moment from 'moment'
import React, { useEffect, useState } from 'react'

import { Button, Spinner } from '..'
import MenuDropDown from '../../../components/common/customMenuDropdown/MenuDropDown'
// import { useAppStore } from '../../../store/appStore'
import Icons from '../icons'
import { useAppStore } from '../../../store/appStore'
// import { boolean } from 'zod'

type BasicDataProps = {
  title: string | number
  type?: string
  icon?: string
  count?: string | number
  status?: string
}
type ActionProps = {
  id: number
  label: string
  disabled?: boolean
  icon?: string
  isOutlined?: boolean
}
// type MenuItem = {
//   value: string
//   label: string
// }
type headerActionProps = {
  label?: string
  onClick?: () => void
  hidden?: boolean
  disabled?: boolean
  url?: string
}

type headerMenuItems = {
  id?: number
  label?: string
  Action?: () => void
  hidden?: boolean
  menuItems?: any
}
type DetailTileProps = {
  data: BasicDataProps
  onActionClick?: (id: number) => void
  actions?: ActionProps[]
  menuItems?: any
  setUpdateCREId?: any
  handleStatus?: (val: string, sel: any) => void
  statusDropDown?: any
  disabled?: boolean
  disableStatus?: boolean
  unAllocate?: boolean
  headerAction?: headerActionProps
  headerMenuItems?: headerMenuItems[]
  priorityDataDropDown?: any
  crePermission?: boolean
  statusDisabled?: boolean
  detailsData?: any
  handleImageUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const DetailHeader: React.FC<DetailTileProps> = ({
  onActionClick,
  actions,
  data,
  headerMenuItems,
  detailsData,
  handleImageUpload,
}) => {
  const { isLoading } = useAppStore()
  const [profileLoading, SetProfileLoading] = useState<boolean>(true)

  useEffect(() => {
    const intervalId = setTimeout(() => {
      SetProfileLoading(false)
    }, 2000)

    return () => clearTimeout(intervalId)
  }, [])
  // const [logoLoading,SetLogoLoading]=useState<boolean>(false)
  return (
    <>
      {/* {isLoading ? (
        <div className="px-5 py-3 flex justify-between flex-wrap gap-3 items-center bg-primaryThin  border-b">
          <div className="flex items-center w-full">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32"></div>
            <div className="h-2.5 ms-2 bg-gray-300 rounded-full dark:bg-gray-600 w-24"></div>
            <div className="h-2.5 ms-2 bg-gray-300 rounded-full dark:bg-gray-600 w-72"></div>
            <div className="h-2.5 ms-2 bg-gray-300 rounded-full dark:bg-gray-600 w-72"></div>
          </div>
          <div className="flex items-center w-full">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32"></div>
            <div className="h-2.5 ms-2 bg-gray-300 rounded-full dark:bg-gray-600 w-24"></div>
            <div className="h-2.5 ms-2 bg-gray-300 rounded-full dark:bg-gray-600 w-72"></div>
            <div className="h-2.5 ms-2 bg-gray-300 rounded-full dark:bg-gray-600 w-72"></div>
          </div>
        </div>
      ) : ( */}
      <div className="px-5 py-0 flex gap-3 bg-primaryThin items-center border-formBorder  border-b">
        <div className="flex justify-between w-full py-3">
          <div className="flex items-center shrink-0 gap-3  w-3/12">
            {/* <div className="bg-primary border border-formBorder flex items-center justify-center overflow-hidden relative w-12 h-12 rounded-sm group">
                <Icons
                  className="iconWhite w-5 iconSize-large opacity-100 group-hover:opacity-0"
                  name="building-icon"
                />
                <div className="absolute left-0 top-0 w-full h-full opacity-0 group-hover:opacity-100 z-10">
                  <input id="imageUpload" type="file" className="hidden" />
                  <label
                    htmlFor="imageUpload"
                    className="bg-black cursor-pointer bg-opacity-35 w-full h-full absolute left-0 top-0 flex items-center justify-center"
                  >
                    <Icons className="iconWhite iconSize-large" name="upload" />
                  </label>
                </div> 
              </div>*/}
            <div className="bg-transparent shrink-0 border border-formBorder flex items-center justify-center overflow-hidden relative w-12 h-12 rounded-sm group">
              {profileLoading && (
                <div className="absolute top-0 text-grey-light left-0 w-full h-full  bg-grey-lightAlt grid place-items-center ">
                  <Spinner />
                </div>
              )}

              {detailsData?.info?.logo ? (
                <img
                  src={detailsData?.info?.logo}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="bg-primaryAlt text-primary w-full h-full grid place-items-center">
                  <Icons
                    className="opacity-100 group-hover:opacity-0"
                    name="cube-icon"
                  />
                </div>
              )}
              <div className="absolute left-0 top-0 w-full h-full opacity-0 group-hover:opacity-100 z-10">
                <input
                  id="imageUpload"
                  type="file"
                  className="hidden"
                  onChange={(event) => handleImageUpload?.(event)}
                  accept="image/*"
                />
                <label
                  htmlFor="imageUpload"
                  className="bg-black cursor-pointer opacity-35 w-full h-full absolute left-0 top-0 flex items-center justify-center"
                >
                  <Icons className="iconWhite iconSize-large" name="upload" />
                </label>
              </div>
            </div>
            {isLoading ? (
              <div className="grid gap-3">
                <div className="w-40 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                <div className="w-56 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
              </div>
            ) : (
              <div>
                <div className="font-bold text-base text-blackAlt">
                  {data.title}
                </div>
                <div className=" text-grey-medium text-sm font-normal">
                  {data?.status}
                </div>
              </div>
            )}
          </div>
          <div className="flex item-stretch">
            <div className="flex min-w-64 flex-col items-start justify-center px-5 gap-1 border-x border-formBorder">
              <span className="text-grey-medium font-medium text-xxs leading-4">
                Location
              </span>
              {detailsData?.address?.city ? (
                <span className="text-blackAlt font-medium text-sm">
                  {detailsData?.address?.city}
                </span>
              ) : (
                <span className="text-blackAlt font-medium text-sm">--</span>
              )}
            </div>
            <div className="flex min-w-64 flex-col items-start justify-center px-5 gap-1 border-r border-formBorder">
              <span className="text-grey-medium font-medium text-xxs leading-4">
                Accredited On:
              </span>
              <span className="text-blackAlt font-medium text-sm">
                {/* Accreditation/Silver/Gold123 */}
                {detailsData?.info?.last_certification_on
                  ? moment(
                      new Date(detailsData?.info?.last_certification_on)
                    ).format('DD-MM-YYYY')
                  : '--'}
              </span>
            </div>
            <div className="flex min-w-64 flex-col items-start justify-center px-5 gap-1 border-formBorder">
              <span className="text-grey-medium font-medium text-xxs leading-4">
                Expires On:
              </span>
              <span className="text-blackAlt font-medium text-sm">
                {/* dd-mm-yyyy */}
                {detailsData?.info?.expiry_date
                  ? moment(new Date(detailsData?.info?.expiry_date)).format(
                      'DD-MM-YYYY'
                    )
                  : '--'}
              </span>
            </div>
          </div>
          {actions && actions.length > 0 && (
            <div className="flex gap-2 items-center">
              {actions.map((action) => (
                <div key={action.id}>
                  <Button
                    label={action.label}
                    icon={action.icon}
                    disabled={action.disabled}
                    outlined={Boolean(action.isOutlined)}
                    onClick={() => onActionClick?.(action.id)}
                  />
                </div>
              ))}
            </div>
          )}
          {headerMenuItems && headerMenuItems?.length > 0 && (
            <MenuDropDown
              iconName="three_dot"
              headerMenuItems={headerMenuItems}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default DetailHeader
