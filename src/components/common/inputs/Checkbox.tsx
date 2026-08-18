import React from 'react'

import { CheckboxProps } from '../../../common/types'

const Checkbox: React.FC<CheckboxProps> = ({
  name,
  id,
  label,
  handleChange = undefined,
  disabled = false,
  checked = false,
  intermediate = false,
  className,
  errors,
  required,
  placeholder,
  hideRequired,
}) => {
  const getErrors = (err: any) => {
    let errMsg = ''
    if (err.message) {
      errMsg = err?.message
    }
    return errMsg
  }

  const errorName: any = name
  return (
    <div className="flex flex-col justify-center">
      <div className="flex gap-2">
        <div
          className={`custom-checkbox ${disabled ? ' opacity-70 cursor-not-allowed' : ''} `}
        >
          <input
            type="checkbox"
            disabled={disabled}
            name={name}
            id={id}
            checked={checked}
            onChange={handleChange}
            className={`custom-checkbox-input ${className}`}
          />
          <label
            htmlFor={id}
            className={`${disabled ? ' opacity-70 cursor-not-allowed' : ''}`}
          >
            <svg
              width="8"
              height="6"
              viewBox="0 0 8 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {intermediate ? (
                <line
                  x1="0"
                  y1="3"
                  x2="8"
                  y2="3"
                  stroke="white"
                  strokeWidth="2"
                />
              ) : (
                <path
                  d="M0 3.21739L2.89883 6L8 1.06994L6.89494 0L2.89883 3.86768L1.09728 2.14745L0 3.21739Z"
                  fill="white"
                />
              )}
            </svg>
          </label>
        </div>
        {required ? (
          <div className="flex gap-3 justify-between w-full items-start">
            <label
              htmlFor={name}
              className="text-blackAlt font-medium text-xxs leading-[1.5]"
            >
              {label || placeholder}
            </label>
            <span
              className={`font-small font-medium leading-[1.5] text-grey-mediumAlt ${hideRequired && 'hidden'}`}
            >
              Required
            </span>
          </div>
        ) : (
          <label
            htmlFor={name}
            className="text-blackAlt font-medium text-xxs leading-[2]"
          >
            {label || placeholder}
          </label>
        )}
      </div>
      {errors && errors[errorName] && (
        <div className="text-error text-error-label mt-[1px]">
          {getErrors(errors[errorName])}
        </div>
      )}
    </div>
  )
}

export default Checkbox
