import { useEffect, useRef, useState } from 'react'
import React from 'react'

import { Icon } from '..'
// import useParsedValue from '../../../utilities/getTrimmed'
import Spinner from '../loader/Spinner'

// import moment from 'moment'

const CustomeSideViewer = ({
  // rowData,
  headerData,
  contentData,
}: any) => {
  const [profileLoading, SetProfileLoading] = useState<boolean>(true)
  const [showMore, setShowMore] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [isClamped, setIsClamped] = useState(false)

  useEffect(() => {
    const intervalId = setTimeout(() => {
      SetProfileLoading(false)
    }, 2000)

    return () => clearTimeout(intervalId)
  }, [])
  useEffect(() => {
    if (textRef.current) {
      setIsClamped(textRef.current.scrollHeight > textRef.current.clientHeight)
    }
  }, [contentData])
  // const contentDescription = contentData.find((data: any) => {
  //   return data.isHtmlView
  // })
  const getParsedValue = (val?: string) => {
    if (val) {
      return (
        <>
          <p
            ref={textRef}
            className={`list-wrap ${showMore ? 'show-more' : 'clamped-text'} `}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {val}
          </p>
          {isClamped && !showMore && (
            <button
              onClick={() => setShowMore(true)}
              className="text-link cursor-pointer text-primary"
            >
              View More
            </button>
          )}
          {showMore && (
            <button
              onClick={() => setShowMore(false)}
              className="text-link cursor-pointer text-primary"
            >
              View Less
            </button>
          )}
        </>
      )
    }

    return '--'
  }
  // const { parsedValue } = useParsedValue(contentDescription?.value)

  // }

  return (
    <div className="p-5 bg-grey-lightHover rounded-md">
      <div className="flex justify-between items-center pb-4 border-b  gap-3">
        <div className="w-[75px] h-[75px] relative bg-grey-border rounded-md flex items-center justify-center overflow-hidden">
          {profileLoading && (
            <div className="absolute top-0 text-grey-light left-0 w-full h-full  bg-grey-lightAlt grid place-items-center ">
              <Spinner />
            </div>
          )}
          {headerData?.image ? (
            <img
              src={headerData?.image}
              className="w-full h-full object-cover text-xxs "
            />
          ) : (
            <div className="w-8 h-8  flex items-center justify-center ">
              <Icon name="user" className="stroke-white text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h5 className="font-semibold text-blackAlt">
            {headerData?.title ? headerData?.title : '--'}
          </h5>
          <p className="text-xs text-primary font-medium">
            {headerData?.subTitle ? headerData?.subTitle : '--'}
          </p>
        </div>
        <span
          className={`text-xxs ${!headerData?.status && 'hidden'} rounded-md px-3 font-medium py-1 border ${headerData?.status === 'Inactive' ? 'bg-dangerLight text-danger border-dangerBorder' : 'bg-success-light text-success border-success-light border'}`}
        >
          {headerData?.status}
        </span>
      </div>
      {contentData?.map((child: any, index: number) => (
        <div
          key={index}
          className={`flex flex-col gap-1 py-4 ${child?.divide && 'border-b'}`}
        >
          <p className="text-xxs font-medium text-grey-medium">
            {child.title ? child.title : '--'}
          </p>

          {child?.isHtmlView ? (
            <p className="text-common text-blackAlt font-medium">
              {/* {parsedValue} */}
              {getParsedValue(child?.value)}
            </p>
          ) : Array.isArray(child.value) ? (
            child?.value?.map((childeren: any, indexId: number) => (
              <div key={indexId} className="flex gap-1 items-center">
                <Icon name={childeren.icon} />
                <span className="text-common text-blackAlt font-medium">
                  {childeren.value ? childeren.value : '--'}
                </span>
              </div>
            ))
          ) : (
            <p className="text-common text-blackAlt font-medium">
              {child.value ? child.value : '--'}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

export default CustomeSideViewer
