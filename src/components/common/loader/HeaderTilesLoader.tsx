import React from 'react'

const HeaderTilesLoader = () => {
  return (
    <div className="w-full bg-primaryThin px-5">
      <div className="flex justify-between border-b items-center">
        <div className="flex flex-col py-5 gap-2 justify-start flex-1">
          <div className="h-2.5 bg-gray-200 rounded-md dark:bg-gray-700 w-64"></div>
          <div className="h-2.5 bg-gray-200 rounded-md dark:bg-gray-600 w-32"></div>
        </div>
        <div className="hidden ms-auto 2xl:block">
          <div className="divide-x flex">
            <div className="flex flex-col gap-2 justify-start px-2 min-w-[190px]">
              <div className="h-1.5 bg-gray-200 rounded-md dark:bg-gray-700 w-10"></div>
              <div className="h-2 bg-gray-200 rounded-md dark:bg-gray-600 w-24"></div>
            </div>
            <div className="flex flex-col gap-2 justify-start px-2 min-w-[190px]">
              <div className="h-1.5 bg-gray-200 rounded-md dark:bg-gray-700 w-10"></div>
              <div className="h-2 bg-gray-200 rounded-md dark:bg-gray-600 w-24"></div>
            </div>
            <div className="flex flex-col gap-2 justify-start px-2 min-w-[190px]">
              <div className="h-1.5 bg-gray-200 rounded-md dark:bg-gray-700 w-10"></div>
              <div className="h-2 bg-gray-200 rounded-md dark:bg-gray-600 w-24"></div>
            </div>
            <div className="flex flex-col gap-2 justify-start px-2 min-w-[190px]">
              <div className="h-1.5 bg-gray-200 rounded-md dark:bg-gray-700 w-10"></div>
              <div className="h-2 bg-gray-200 rounded-md dark:bg-gray-600 w-24"></div>
            </div>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="h-2.5 bg-gray-200 rounded-md dark:bg-gray-700 w-24"></div>
          <div className="h-2.5 bg-gray-200 rounded-md dark:bg-gray-700 w-24"></div>
        </div>
      </div>
      <div className="2xl:hidden border-b boreder-grey-border ">
        <div className="divide-x flex">
          <div className="flex flex-col gap-2 justify-start py-5 px-2 min-w-[190px]">
            <div className="h-1.5 bg-gray-200 rounded-md dark:bg-gray-700 w-10"></div>
            <div className="h-2 bg-gray-200 rounded-md dark:bg-gray-600 w-24"></div>
          </div>
          <div className="flex flex-col gap-2 justify-start py-5 px-2 min-w-[190px]">
            <div className="h-1.5 bg-gray-200 rounded-md dark:bg-gray-700 w-10"></div>
            <div className="h-2 bg-gray-200 rounded-md dark:bg-gray-600 w-24"></div>
          </div>
          <div className="flex flex-col gap-2 justify-start py-5 px-2 min-w-[190px]">
            <div className="h-1.5 bg-gray-200 rounded-md dark:bg-gray-700 w-10"></div>
            <div className="h-2 bg-gray-200 rounded-md dark:bg-gray-600 w-24"></div>
          </div>
          <div className="flex flex-col gap-2 justify-start py-5 px-2 min-w-[190px]">
            <div className="h-1.5 bg-gray-200 rounded-md dark:bg-gray-700 w-10"></div>
            <div className="h-2 bg-gray-200 rounded-md dark:bg-gray-600 w-24"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeaderTilesLoader
