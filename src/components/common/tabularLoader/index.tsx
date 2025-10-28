import React from 'react'
import { LoaderProps } from '../../../common/types'

const TabularLoader: React.FC<LoaderProps> = () => {
  return (
    <div>
      <div className="rounded-md bg-white mb-5 h-[90px] p-4 ps-12 flex flex-col justify-center">
        <div className="w-[250px] h-2.5 shimmer-animation rounded-xs mb-2"></div>
        <div className="max-w-[1100px] w-full h-2.5 shimmer-animation rounded-xs mb-2"></div>
        <div className="max-w-[900px] w-full h-2.5 shimmer-animation rounded-xs mb-2"></div>
      </div>
      <div className="w-full overflow-scroll h-[90vh] bg-white py-5 px-4">
        {/* HEADSECTION */}
        <ul className="flex gap-2 mb-4">
          <li className="w-[200px]  shrink-0"></li>
          <li>
            <span className="shrink-0 h-10 block rounded-sm shimmer-full"></span>
            <ul className="flex gap-2 mt-2">
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
          </li>
          <li>
            <span className="shrink-0 h-10 block rounded-sm  shimmer-full"></span>
            <ul className="flex gap-2 mt-2">
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
          </li>
          <li>
            <span className="shrink-0 h-10 block rounded-sm  shimmer-full"></span>
            <ul className="flex gap-2 mt-2">
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
          </li>
        </ul>
        {/* BODY SECTION  */}
        <ul>
          <li className="mb-3">
            <span className="w-full h-8 rounded-sm shimmer-full block"></span>
            <ul className="flex gap-2 mt-2">
              <li className="w-[200px] h-8  rounded-sm shrink-0"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
          </li>
          <li className="mb-3">
            <span className="w-full h-8 rounded-sm shimmer-full block"></span>
            <ul className="flex gap-2 mt-2">
              <li className="w-[200px] h-8  rounded-sm shrink-0"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
            <ul className="flex gap-2 mt-2">
              <li className="w-[200px] h-8  rounded-sm shrink-0"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
            <ul className="flex gap-2 mt-2">
              <li className="w-[200px] h-8  rounded-sm shrink-0"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
            <ul className="flex gap-2 mt-2">
              <li className="w-[200px] h-8  rounded-sm shrink-0"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
          </li>

          <li className="mb-3">
            <span className="w-full h-8 rounded-sm shimmer-full block"></span>
            <ul className="flex gap-2 mt-2">
              <li className="w-[200px] h-8  rounded-sm shrink-0"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
            <ul className="flex gap-2 mt-2">
              <li className="w-[200px] h-8  rounded-sm shrink-0"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
            <ul className="flex gap-2 mt-2">
              <li className="w-[200px] h-8  rounded-sm shrink-0"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
            <ul className="flex gap-2 mt-2">
              <li className="w-[200px] h-8  rounded-sm shrink-0"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
            <ul className="flex gap-2 mt-2">
              <li className="w-[200px] h-8  rounded-sm shrink-0"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
            <ul className="flex gap-2 mt-2">
              <li className="w-[200px] h-8  rounded-sm shrink-0"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
              <li className="w-[130px] h-8  rounded-sm shrink-0 shimmer-animation"></li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default TabularLoader
