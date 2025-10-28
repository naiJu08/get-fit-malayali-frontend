import React from 'react'
import { FieldErrors } from 'react-hook-form'

type RadioDataProps = {
  radioLabel?: string
  id?: number
  value?: string
  checked?: boolean
}

type RadioProps = {
  data?: RadioDataProps[]
  name: string
  label?: string
  value?: string | number
  checked?: boolean
  disabled?: boolean
  required?: boolean
  fullwidth?: boolean
  handleChange: (data: any) => void
  errors?: FieldErrors
}

const Radio: React.FC<RadioProps> = ({
  name,
  label,
  // value = undefined,
  handleChange,
  required,
  fullwidth,
  data,
  errors,
  value,
  disabled,
}) => {
  const getErrors = (err: any) => {
    let errMsg = ''
    if (err.message) {
      errMsg = err?.message
    }
    return errMsg
  }
  console.log(disabled)
  return (
    <div className={`customRadioButton ${fullwidth ? 'w-full' : 'w-auto'}`}>
      {label && (
        <div className="">
          <label className={`labels label-text`}>
            {label}
            {required ? <span className="text-error"> *</span> : <></>}
          </label>
        </div>
      )}

      <div className="customRadio-field relative flex items-center gap-4">
        {data?.map((item: any) => (
          <div className="flex item-center gap-1 cursor-pointer" key={item.id}>
            <input
              type="radio"
              disabled={item.disabled || disabled}
              name={name}
              value={item.value ?? ''}
              checked={item.value === value}
              id={`radioBtn-${item.id}`}
              onChange={handleChange}
              // onChange={(e) => handleOnChange(e.target.value ?? '')}
            />
            <label
              className={`${!item.disabled && !disabled ? 'cursor-pointer text-blackAlt' : 'text-grey-mediumAlt'} text-xxs `}
              htmlFor={`radioBtn-${item.id}`}
            >
              {item.radioLabel}
            </label>
          </div>
        ))}
        {errors && errors[name] && (
          <div className="text-error text-error-label mt-[1px]">
            {getErrors(errors[name])}
          </div>
        )}
      </div>
    </div>
  )
}

export default Radio
