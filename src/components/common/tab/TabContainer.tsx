import React, { useRef, useEffect } from 'react'

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const isMouseDown = useRef(false)
  const startX = useRef(0)
  const scrollLeftState = useRef(0)
  const hasDragged = useRef(false)

  // Scroll active tab into view on mount or when activeTab changes
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(
        '[data-active="true"]'
      ) as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        })
      }
    }
  }, [activeTab])

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current && e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return
    isMouseDown.current = true
    hasDragged.current = false
    startX.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeftState.current = scrollRef.current.scrollLeft
  }

  const handleMouseLeave = () => {
    isMouseDown.current = false
  }

  const handleMouseUp = () => {
    isMouseDown.current = false
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown.current || !scrollRef.current) return
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.5
    if (Math.abs(walk) > 5) {
      hasDragged.current = true
    }
    scrollRef.current.scrollLeft = scrollLeftState.current - walk
  }

  const generateClassName = (tab: TabItemProps): string => {
    let generatedClassName = 'w-max text-sm leading-6 font-medium shrink-0 '
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
    if (!item.disabled && !hasDragged.current) {
      onClick(item)
    }
  }

  return (
    <div className="w-full">
      <div className="relative flex w-full items-center gap-3 border-b border-formBorder bg-white px-5">
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="tab-scroll flex min-w-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth select-none cursor-grab active:cursor-grabbing"
        >
          {data.map((tab: TabItemProps) => (
            <React.Fragment key={tab.id}>
              {!tab.hide && (
                <div
                  data-active={tab.id === activeTab}
                  className={`relative z-10 w-max shrink-0 border-b-2 p-2.5 text-sm font-medium transition-all duration-100 ${generateClassName(
                    tab
                  )}`}
                  onClick={() => handleClick(tab)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-max">{tab.label}</span>
                    {tab.count !== undefined && tab.count !== null && (
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full ${
                          tab.countBgClass
                            ? tab.countBgClass
                            : tab.id === activeTab
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                    {tab.badge}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        {action ? <div className="flex-shrink-0 py-2">{action}</div> : null}
      </div>
      {children ? (
        <div>
          <div className="tab-section overflow-x-hidden rounded py-4">
            <Wrapper activeTab={activeTab}>{children}</Wrapper>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default TabContainer
