import React from 'react'

import { useCurrencyFormat } from '../../../utilities/parsers'

type ActionProps = {
  id: number
  label: string
  icon?: string
  outlined?: boolean
  disabled?: boolean
}

type PageTitleProps = {
  actions?: ActionProps[]
  onActionClick?: (id: number) => void
  data?: any
  isLoading?: boolean
}

const PageTitle: React.FC<PageTitleProps> = ({ data, isLoading }) => {
  const format = useCurrencyFormat
  const handleShowVal = (val: any) => {
    const number = typeof val === 'string' ? parseFloat(val) : val
    return format(number)
  }
  return (
    <>
      {isLoading && (
        <div className="p-4  border-b border-[#D6D8DC] flex  ">
          <div className="flex items-center justify-between w-full">
            <div className=" bg-[#F2F2F2] dark:bg-[#a2a2a2] flex overflow-auto rounded-lg text-sm p-2  gap-3">
              <div className="p-4 flex justify-between flex-wrap gap-3 items-center">
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
            </div>
          </div>
        </div>
      )}
      <>
        {!isLoading && data && data?.length > 0 && (
          <div className="p-4  border-b border-[#D6D8DC] flex  ">
            <div className="flex items-center justify-between w-full">
              <div className=" bg-[#F2F2F2] dark:bg-[#a2a2a2] flex overflow-auto rounded-lg text-sm p-2  gap-3">
                {data?.map((items: any) => (
                  <div
                    className=" p-2 rounded-lg shadow-tileShadow bg-white"
                    key={items.label}
                  >
                    <div className=" font-normal whitespace-nowrap">
                      {items.label}
                    </div>
                    <div className=" flex items-center justify-end text-[#222222] font-bold">
                      {handleShowVal(items.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    </>
  )
}

export default PageTitle
