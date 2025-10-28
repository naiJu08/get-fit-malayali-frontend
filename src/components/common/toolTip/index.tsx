import React from 'react'

const TooltipComponent: React.FC<any> = ({ title, children }) => {
  return (
    <div className="group relative">
      {children}
      <div className="hidden group-hover:block">
        <div className="group absolute -top-12 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center rounded-sm text-center text-sm text-slate-300 before:-top-2">
          <div className="rounded-sm bg-black py-1 px-2">
            <p className="whitespace-nowrap">{title}</p>
          </div>
          <div className="h-0 w-fit border-l-8 border-r-8 border-t-8 border-transparent border-t-black"></div>
        </div>
      </div>
    </div>
  )
}

export default TooltipComponent
