import React from 'react'

import ProgressDropdown from './dropdown'

interface StatusProps {
  tabs?: any
  currentStatus?: any
  setUpdateStatus?: any
  handleConversion?: () => void
  disableStatus?: boolean
  isStatic?: boolean
}

const ProgressiveTabs: React.FC<StatusProps> = ({
  tabs,
  currentStatus,
  setUpdateStatus,
  handleConversion,
  disableStatus,
  isStatic = false,
}) => {
  const currentStatusPosition = () => {
    return tabs?.findIndex((item: any) => item?.id === currentStatus?.id) || 0
  }
  const handleGroupClass = (ind: number, item: any) => {
    if (!isStatic) {
      const sort = tabs?.find(
        (item: any) => item.id === currentStatus?.group?.id
      )
      if (ind < sort?.sort_order) {
        if (
          item?.id === currentStatus?.group?.id &&
          item.code === 'won_or_lost' &&
          currentStatus?.code !== 'won'
        ) {
          return 'lost'
        } else {
          return 'current'
        }
      }
    } else {
      if (ind <= currentStatusPosition()) {
        return 'current'
      }
    }
  }

  const handleStatus = (item: any) => {
    if (item.id === currentStatus?.group?.id) {
      return currentStatus.name
    } else {
      return item.name
    }
  }

  return (
    <div className="arrow-steps clearfix overflow-x-auto">
      {tabs?.map((item: any, index: number) => (
        // <div className={`step ${item.current && 'current'}`} key={item.id}>
        <div className={`step ${handleGroupClass(index, item)}`} key={item.id}>
          <span>
            <ProgressDropdown
              labelName={handleStatus(item)}
              disableStatus={disableStatus}
              data={item.status}
              statusItem={item}
              isStatic={isStatic}
              handleConversion={handleConversion}
              currentStatus={currentStatus}
              setUpdateStatus={setUpdateStatus}
            />
          </span>
        </div>
      ))}

      {/* <div className="step">
        <span className="text-primaryText normal-case text-sm font-medium">
          Converted
        </span>
      </div> */}
    </div>
  )
}

export default ProgressiveTabs
