import React from 'react'

import { TextAreaProps } from '../../../common/types'

const TextArea: React.FC<TextAreaProps> = ({
  name,
  id,
  label,
  rows = 5,
  disabled = false,
  fullwidth = true,
  placeholder,
  register,
  value,
  classNames,
  // value = '',
  edited = false,
  fieldEdit = false,
  required = false,
  autoComplete = false,
  autoFocus = false,
  onChange,
  errors,
  maxLength,
  wordCount,
  desc,
  errorFlag,
}) => {
  const getErrors = (err: any) => {
    let errMsg = ''
    if (err.message) {
      errMsg = err?.message
    }
    return errMsg
  }
  const generateClassName = (from: string) => {
    let className = ' '
    switch (from) {
      case 'input':
        className = ` w-full input-area  ${
          fieldEdit ? 'pr-[25px] ' : 'pr-input '
        }`
        if ((errors && errors[name]) || errorFlag) {
          className += ' textfield-error'
        } else {
          if (edited) {
            className += ' textfield-success '
          } else {
            if (fieldEdit) {
              className += ' textfield-editable'
            } else {
              className += ' textfield'
            }
          }
        }
        break
      case 'adorement':
        className += '  absolute right-[0px] bottom-[10px] adorement mr-[1px]'
        break
      default:
        break
    }

    return className
  }
  return (
    <div className={fullwidth ? 'w-full' : 'w-auto'}>
      {label && (
        <div className="leading-none">
          <label className={`labels label-text}`}>
            {label}
            {required ? <span className="text-error"> *</span> : <></>}
          </label>
        </div>
      )}
      <div className="relative flex flex-col justify-end ">
        <div className="resize-icon relative flex flex-col items-center">
          <textarea
            id={id}
            disabled={disabled}
            {...register?.(name, { required })}
            placeholder={placeholder || label}
            rows={rows}
            style={{ minHeight: rows === 3 ? undefined : 100 }}
            value={value}
            data-testid={name}
            autoComplete={autoComplete ? 'on' : 'off'}
            autoFocus={autoFocus}
            className={`${generateClassName('input')}  ${classNames}`}
            onChange={onChange}
            // maxLength={maxLength ? maxLength : 200}
            maxLength={maxLength ?? maxLength}
          />
          <span className="icon-box">
            <svg
              height="18"
              viewBox="0 0 18 18"
              width="18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m14.228 16.227a1 1 0 0 1 -.707-1.707l1-1a1 1 0 0 1 1.416 1.414l-1 1a1 1 0 0 1 -.707.293zm-5.638 0a1 1 0 0 1 -.707-1.707l6.638-6.638a1 1 0 0 1 1.416 1.414l-6.638 6.638a1 1 0 0 1 -.707.293zm-5.84 0a1 1 0 0 1 -.707-1.707l12.477-12.477a1 1 0 1 1 1.415 1.414l-12.478 12.477a1 1 0 0 1 -.707.293z"
                fill="#838383"
              />
            </svg>
          </span>
        </div>
        {desc ? (
          <span className="text-grey-mediumAlt text-xxs mt-1 font-small leading-4 font-medium ">
            {desc}
          </span>
        ) : wordCount && wordCount > 0 ? (
          <span className="text-grey-mediumAlt text-xxs mt-1 font-small leading-4 font-medium">
            Max {wordCount} words
          </span>
        ) : (
          maxLength && (
            <span className="text-grey-mediumAlt text-xxs mt-1 font-small leading-4 font-medium">
              Max {maxLength ? maxLength : 200} Characters
            </span>
          )
        )}
      </div>
      {errors && errors[name] && (
        <div className="text-error text-error-label mt-[1px]">
          {getErrors(errors[name])}
        </div>
      )}
    </div>
  )
}

export default TextArea
