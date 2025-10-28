import React from 'react'

import { TextFieldProps } from '../../../common/types'

const TextField: React.FC<TextFieldProps> = ({
  name,
  id,
  label,
  type = 'text',
  disabled = false,
  fullwidth = true,
  placeholder,
  totalCount,
  adorement,
  register,
  edited = false,
  fieldEdit = false,
  required = false,
  autoComplete = false,
  autoFocus = false,
  tabularForm = false,
  onChange,
  errors,
  value,
  ref,
  onBlur,
  hidden,
  actionLabel,
  handleAction,
  disableAction,
  isTotal,
  handleDisableAction,
  allowPositiveOnly,
  errorFlag,
  toLowercase,
}) => {
  const getErrors = (err: any) => {
    let errMsg = ''
    if (err.message) {
      errMsg = err?.message
    }
    return errMsg
  }

  const generateClassName = (from: string) => {
    let className = ''
    switch (from) {
      case 'input':
        className = ` w-full input ${toLowercase ? 'lowercase placeholder:normal-case' : ''} ${
          fieldEdit || adorement ? 'pr-[75px] ' : 'pr-input '
        }`
        // ` w-full input ${
        //   fieldEdit || adorement ? 'pr-[75px] ' : 'pr-input '
        // }`
        if ((errors && errors[name]) || errorFlag) {
          className += 'textfield textfield-error'
        } else {
          if (edited) {
            className += ' textfield-success '
          } else {
            if (fieldEdit) {
              className += ' textfield-editable'
            } else if (isTotal && disabled) {
              className += ' textfield bg-[#FFD6B02B]  text-black font-normal '
            } else if (tabularForm && disabled) {
              className += ' textfield bg-cardWrapperBg  text-black font-normal'
            } else if (totalCount && disabled) {
              className += ' textfield bg-purpleLight  text-black font-normal'
            } else {
              className += ' textfield'
            }
          }
        }
        break
      case 'adorement':
        className += '  absolute right-0 adorement mr-[1px]'
        break
      default:
        break
    }
    return className
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e?.target.value

    if (type === 'number' && allowPositiveOnly) {
      if (
        inputValue === '' ||
        inputValue === '0' ||
        /^[1-9]\d*$/.test(inputValue)
      ) {
        onChange?.(e)
      }
    } else {
      onChange?.(e)
    }
  }
  return (
    <div
      className={` ${fullwidth ? 'w-full' : 'w-auto'} ${
        hidden ? 'hidden' : ''
      }`}
    >
      {label && (
        <div className="flex justify-between items-center">
          <label className={`labels label-text`}>
            {label}
            {required ? <span className="text-error"> *</span> : <></>}
          </label>
          {actionLabel && (
            <button
              className={'action_label cursor-pointer'}
              onClick={handleAction}
            >
              {actionLabel}
            </button>
          )}
          {disableAction && (
            <div className="toggle-switch">
              <input
                className="toggle-input"
                onChange={(e) => handleDisableAction?.(e.target.checked)}
                id={name}
                type="checkbox"
                checked={!disabled}
                name={name}
              />
              <label className="toggle-label" htmlFor={name}></label>
            </div>
          )}
        </div>
      )}
      <div className="relative flex items-center ">
        <input
          id={id}
          disabled={disabled}
          {...register?.(name, { required })}
          value={value ?? ''}
          onChange={handleChange}
          ref={ref}
          placeholder={placeholder || label}
          onBlur={onBlur}
          type={type}
          data-testid={id ?? name}
          autoComplete={autoComplete ? 'on' : 'off'}
          autoFocus={autoFocus}
          className={generateClassName('input')}
          hidden={hidden}
        />
      </div>
      {errors && errors[name] && (
        <div className="text-error text-error-label mt-[1px]">
          {getErrors(errors[name])}
        </div>
      )}
    </div>
  )
}

export default TextField
