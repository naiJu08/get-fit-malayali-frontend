import React from 'react'

const FormCardLoader = () => {
  return (
    <div className="w-8/12 lg:w-6/12 2xl:w-5/12  flex flex-col gap-4">
      <div className="w-full p-5 rounded-md bg-white flex flex-col gap-2 items-start">
        <div className=" w-20 h-2 shimmer-animation rounded-full mb-2"></div>
        <div className=" w-full h-2 shimmer-animation rounded-full"></div>
        <div className=" w-full h-2 shimmer-animation rounded-full"></div>
        <div className=" w-96 h-2 shimmer-animation rounded-full"></div>
      </div>
      <div className="w-full p-5 rounded-md bg-white ">
        <div className="flex flex-col gap-2 items-start mb-3">
          <div className=" w-20 h-2 shimmer-animation rounded-full"></div>
          <div className=" w-full h-2 shimmer-animation rounded-full"></div>
          <div className=" w-full h-8 shimmer-animation rounded-sm"></div>
        </div>
        <div className="flex flex-col gap-2 items-start mb-3">
          <div className=" w-20 h-2 shimmer-animation rounded-full"></div>
          <div className=" w-full h-2 shimmer-animation rounded-full"></div>
          <div className=" w-full h-24 shimmer-animation rounded-sm"></div>
        </div>
        <div className="flex flex-col gap-2 items-start mb-3">
          <div className=" w-20 h-2 shimmer-animation rounded-full"></div>
          <div className=" w-full h-2 shimmer-animation rounded-full"></div>
          <div className=" w-full h-8 shimmer-animation rounded-sm"></div>
        </div>
      </div>
      <div className="w-full p-5 rounded-md bg-white ">
        <div className="flex flex-col gap-2 items-start mb-3">
          <div className=" w-20 h-2 shimmer-animation rounded-full"></div>
          <div className=" w-full h-2 shimmer-animation rounded-full"></div>
          <div className=" w-full h-8 shimmer-animation rounded-sm"></div>
        </div>
        <div className="flex flex-col gap-2 items-start mb-3">
          <div className=" w-20 h-2 shimmer-animation rounded-full"></div>
          <div className=" w-full h-2 shimmer-animation rounded-full"></div>
          <div className=" w-full h-24 shimmer-animation rounded-sm"></div>
        </div>
        <div className="flex flex-col gap-2 items-start mb-3">
          <div className=" w-20 h-2 shimmer-animation rounded-full"></div>
          <div className=" w-full h-2 shimmer-animation rounded-full"></div>
          <div className=" w-full h-8 shimmer-animation rounded-sm"></div>
        </div>
      </div>
    </div>
  )
}

export default FormCardLoader
