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
  action,
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
    <div className="w-full">
      <div className="flex w-full items-center gap-3 border-b border-formBorder bg-white px-5">
        <div className="tab-scroll flex min-w-0 flex-1 gap-2">
          {data.map((tab: TabItemProps) => (
            <React.Fragment key={tab.id}>
              {!tab.hide && (
                <div
                  className={`relative z-10 w-max border-b-2 p-2.5 text-sm font-medium transition-all duration-100 ${generateClassName(
                    tab
                  )}`}
                  onClick={() => handleClick(tab)}
                >
                  <p className="w-max">{tab.label}</p>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        {action ? <div className="flex-shrink-0 py-2">{action}</div> : null}
      </div>
      {children ? (
        <div>
          <div className="tab-section overflow-hidden rounded py-4">
            <Wrapper activeTab={activeTab}>{children}</Wrapper>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default TabContainer
