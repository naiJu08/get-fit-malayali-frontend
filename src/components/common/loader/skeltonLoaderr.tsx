import React from 'react'
import { LoaderProps } from '../../../common/types'

const SkeltonLoader: React.FC<LoaderProps> = () => {
  return (
    <div
      role="status"
      className="max-w-md p-4 space-y-4 border border-gray-200 divide-y divide-gray-200 rounded shadow  dark:divide-gray-700 md:p-6 dark:border-gray-700"
    >
      <div className="grid grid-cols-2 gap-3 items-center justify-between">
        <div className=" grid gap-1 ">
          <div className=" w-10 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div className=" w-auto h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <div className=" grid gap-1 ">
          <div className=" w-10 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div className=" w-auto h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <div className=" grid gap-1 ">
          <div className=" w-10 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div className=" w-auto h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <div className=" grid gap-1 ">
          <div className=" w-10 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div className=" w-auto h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <div className=" grid gap-1 ">
          <div className=" w-10 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div className=" w-auto h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <div className=" grid gap-1 ">
          <div className=" w-10 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div className=" w-auto h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <div className=" grid gap-1 ">
          <div className=" w-10 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div className=" w-auto h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default SkeltonLoader
