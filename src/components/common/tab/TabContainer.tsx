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
    let generatedClassName = 'w-max text-sm leading-6 font-medium '
    if (tab.id === activeTab) {
      generatedClassName += ' text-primary font-bold cursor-default '
      generatedClassName += tab.activeClass
        ? `${tab.activeClass} `
        : tab.bgClass
          ? `${tab.bgClass} `
          : 'bg-white '
      generatedClassName += tab.activeBorderClass
        ? `${tab.activeBorderClass} `
        : 'border-primary '
    } else {
      if (tab.disabled) {
        generatedClassName += ' text-grey-medium cursor-not-allowed '
      } else {
        generatedClassName += ' text-grey-medium cursor-pointer '
      }
      generatedClassName += tab.inactiveClass
        ? `${tab.inactiveClass} `
        : tab.bgClass
          ? `${tab.bgClass} `
          : ''
      generatedClassName += tab.inactiveBorderClass
        ? `${tab.inactiveBorderClass} `
        : 'border-transparent '
    }
    return generatedClassName.trimEnd()
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
                className={` transition-all relative z-10 duration-100 text-sm font-medium p-2.5 ${generateClassName(
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
        <div className="tab-section py-4 rounded overflow-hidden">
          <Wrapper activeTab={activeTab}>{children}</Wrapper>
        </div>
      </div>
    </div>
  )
}

export default TabContainer
