import React from 'react'

import { TabItemProps, TabProps } from '../../../common/types'

// import { checkMultiplePermission } from '../../../configs/permissionGate'
interface WrapperProps {
  children: React.ReactNode
  activeTab: string | number
}
interface ActiveTabProps {
  activeTab: string | number
}
const Wrapper: React.FC<WrapperProps> = ({ children, activeTab }) => {
  return (
    <div className="wrapper">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            activeTab: activeTab,
          } as Partial<ActiveTabProps>)
        }
        return child
      })}
    </div>
  )
}

const TabContainer: React.FC<TabProps> = ({
  data,
  onClick,
  children,

  activeTab,
}) => {
  const generateClassName = (tab: TabItemProps): string => {
    let generatedClassName = 'w-max text-sm leading-6  font-medium '
    if (tab.id === activeTab) {
      generatedClassName +=
        ' text-primary border-primary font-bold cursor-default '
      generatedClassName += tab.bgClass ? `${tab.bgClass}` : 'bg-white'
    } else {
      if (tab.disabled) {
        generatedClassName +=
          ' text-grey-medium cursor-not-allowed border-transparent '
      } else {
        generatedClassName +=
          ' text-grey-medium cursor-pointer border-transparent '
      }
      if (tab.bgClass) generatedClassName += `${tab.bgClass}`
    }
    return generatedClassName
  }
  const handleClick = (item: TabItemProps) => {
    if (!item.disabled) {
      onClick(item)
    }
  }
  return (
    <div className="w-full ">
      <div className="w-full relative border-b border-formBorder  tab-scroll flex px-5 bg-white  gap-2 ">
        {data.map((tab: TabItemProps) => (
          <>
            {/* {checkMultiplePermission(tab?.id as string) && ( */}
            {!tab.hide && (
              <div
                key={tab.id}
                className={` transition-all relative z-20 duration-100 text-sm font-medium p-2.5 ${generateClassName(
                  tab
                )} border-b-2 `}
                onClick={() => {
                  handleClick(tab)
                }}
              >
                <p className="w-max ">{tab.label}</p>
              </div>
            )}
            {/* )} */}
          </>
        ))}
      </div>
      <div className="">
        <div className="tab-section py-4 rounded">
          <Wrapper activeTab={activeTab}>{children}</Wrapper>
        </div>
      </div>
    </div>
  )
}

export default TabContainer
