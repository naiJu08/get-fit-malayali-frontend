import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { FieldViewProps } from '../../../common/types'
import Icons from '../../../components/common/icons'
import { useAppStore } from '../../../store/appStore'

const FormFieldView: React.FC<FieldViewProps> = ({
  label,
  fullwidth = true,
  required = false,
  image = false,
  link,
  value,
  hidden,
  type = 'text',
}) => {
  const { isLoading } = useAppStore()

  const [showMore, setShowMore] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [isClamped, setIsClamped] = useState(false)

  useEffect(() => {
    if (textRef.current) {
      setIsClamped(textRef.current.scrollHeight > textRef.current.clientHeight)
    }
  }, [value])

  const getParsedValue = (val?: string) => {
    if (val) {
      return (
        <>
          <p
            ref={textRef}
            className={`list-wrap break-normal ${showMore ? 'show-more' : 'clamped-text'} `}
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

  return (
    <>
      {hidden ? null : (
        <div className={fullwidth ? 'w-full' : 'w-auto'}>
          {isLoading ? (
            <div className="grid gap-3">
              <div className="w-10 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
              <div className="w-auto h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
            </div>
          ) : (
            <>
              {label && (
                <div className="relative">
                  <label className={`labels label-text`}>
                    {label}
                    {required ? <span className="text-error"> *</span> : null}
                  </label>
                  {type === 'password' && (
                    <button
                      type="button"
                      className="absolute right-2 z-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <Icons name="eye" />
                      ) : (
                        <Icons name="eye-close" />
                      )}
                    </button>
                  )}
                </div>
              )}
              <div className={`relative flex items-center`}>
                {link ? (
                  image ? (
                    <Link
                      to={link}
                      target="_blank"
                      className="font-medium text-sm text-link break-all w-[100px] h-[100px] rounded-md overflow-hidden block"
                    >
                      <img
                        src={link}
                        width={100}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </Link>
                  ) : (
                    <Link
                      to={link}
                      target="_blank"
                      className={`${link ? 'cursor-pointer text-primary' : ''} font-medium text-sm text-link break-all `}
                    >
                      {value ? value : '--'}
                    </Link>
                  )
                ) : (
                  <p className="font-medium text-sm text-blackAlt break-all  ">
                    {type === 'password'
                      ? showPassword
                        ? value
                        : '#####'
                      : type === 'textarea'
                        ? getParsedValue(value)
                        : value
                          ? value
                          : '--'}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
// word-break: break-word
export default FormFieldView
