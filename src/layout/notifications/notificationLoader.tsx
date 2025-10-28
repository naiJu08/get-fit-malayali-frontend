import React from 'react'

export default function NotificationLoader() {
  return (
    <div className=" dark:bg-[#a2a2a2] flex  overflow-auto rounded-lg text-sm w-full p-4 items-start gap-2 border-b pb-4">
      <div className="p-2 flex justify-between flex-wrap gap-3 items-center w-full">
        <div className="flex items-center justify-between w-full">
          <div className="h-2.5    bg-gray-200 rounded-full dark:bg-gray-700 w-32"></div>
          <div className="h-2.5    bg-gray-200 rounded-full dark:bg-gray-700 w-32"></div>
        </div>
        <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-72"></div>
        <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-[350px]"></div>
        {/* <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48"></div> */}
        <div className="flex items-center gap-3 w-full">
          <div className="h-2.5    bg-gray-200 rounded-full dark:bg-gray-700 w-32"></div>
          <div className="h-2.5    bg-gray-200 rounded-full dark:bg-gray-700 w-32"></div>
          <div className="h-2.5    bg-gray-200 rounded-full dark:bg-gray-700 w-32"></div>

          <div className="h-2.5    bg-gray-200 rounded-full dark:bg-gray-700 w-32"></div>
        </div>
        <div className="flex items-center justify-between w-full">
          <div className="h-2.5    bg-gray-200 rounded-full dark:bg-gray-700 w-32"></div>
          <div className="h-2.5    bg-gray-200 rounded-full dark:bg-gray-700 w-32"></div>
        </div>
      </div>
    </div>
  )
}
