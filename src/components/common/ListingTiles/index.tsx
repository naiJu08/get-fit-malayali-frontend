import React from 'react'

import Button from '../buttons/Button'
// import { Button, Icon } from '..'
import Icons from '../icons'
import ManagedList from './ManagedList'

type BasicDataProps = {
  title: string | number
  icon?: string
}
// type ActionProps = {
//   id: number
//   label: string
//   icon?: string
//   isOutlined?: boolean
// }
type DetailTileProps = {
  data: BasicDataProps
  onActionClick?: () => void
  onHandleExport?: () => void
  actionProps?: any
  showManagedList?: boolean
  groupData?: any
  groupValue?: any
  setGroupNameCode?: any
  permissions?: any
  checkPermission?: boolean
}

const ListingHeader: React.FC<DetailTileProps> = ({
  data,
  onActionClick,
  actionProps,
  showManagedList = false,
  groupData = [],
  groupValue,
  setGroupNameCode,
  checkPermission,
}) => {
  return (
    <div className="px-5 py-3 flex justify-between flex-wrap gap-3 items-center bg-white border-b border-formBorder">
      <div className="flex gap-6">
        <div className="flex items-center flex-wrap gap-5 text-[#222] ">
          <div className="flex items-center gap-1">
            {data?.icon && (
              <div className="w-7 h-7 bg-primary flex  items-center justify-center rounded-lg ">
                <Icons name={data.icon ?? 'title-icon'} />
              </div>
            )}
            <div className="">
              <div className="font-bold text-lg text-primaryText">
                {data.title}
              </div>
            </div>
          </div>
        </div>
        {showManagedList && (
          <div className="flex items-center justify-start">
            <ManagedList
              groupData={groupData}
              selection={groupData?.findIndex(
                (item: any) => item.code === groupValue
              )}
              setGroupNameCode={setGroupNameCode}
            />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <div>
          {/* {checkPermission?.('export') && (
            <>
              {!actionProps?.hideExport && (
                <Button
                  label="Export"
                  icon="upload"
                  outlined={true}
                  onClick={onHandleExport}
                />
              )}
            </>
          )} */}
          {actionProps?.actionCancel && (
            <Button
              label="Cancel"
              outlined={true}
              primary={false}
              onClick={() => actionProps.actionCancel()}
            />
          )}
        </div>
        {/* {checkPermission?.('add') && ( */}
        <>
          {onActionClick && checkPermission && (
            <div>
              <Button
                className="bg-primaryGreen"
                label={actionProps?.actionTitle ?? 'Add New'}
                icon={actionProps?.actionTitle ? 'plus' : 'plus'}
                onClick={onActionClick}
                disabled={actionProps?.disableSubmit}
              />
            </div>
          )}
        </>
        {/* )} */}
      </div>
    </div>
  )
}

export default ListingHeader
