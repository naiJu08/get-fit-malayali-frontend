import React from 'react'

import { TextFieldProps } from '../../../common/types'

const resolveFieldError = (errors: any, name: string) => {
  if (!errors || !name || typeof errors !== 'object') return undefined
  if (errors[name]) return errors[name]

  if (!name.includes('.')) return undefined

  return name.split('.').reduce((acc, segment) => {
    if (acc == null) return undefined

    if (Array.isArray(acc)) {
      const index = Number(segment)
      if (Number.isNaN(index)) {
        return acc[segment as any]
      }
      return acc[index]
    }

    return acc ? acc[segment] : undefined
  }, errors)
}

const TextField: React.FC<TextFieldProps> = ({
  name,
  id,
  label,
  type = 'text',
  disabled = false,
  fullwidth = true,
  placeholder,
  maxLength,
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
  digitsOnly,
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

  const fieldError = resolveFieldError(errors, name)
  const hasError = Boolean(fieldError) || Boolean(errorFlag)
  const errorMessage = fieldError ? getErrors(fieldError) : ''

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
        if (hasError) {
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

    if (digitsOnly) {
      if (!/^\d*$/.test(inputValue)) return
      if (maxLength && inputValue.length > maxLength) return
      onChange?.(e)
      return
    }

    if (maxLength && inputValue.length > maxLength) return

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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (digitsOnly) {
      const allowedKeys = [
        'Backspace',
        'Delete',
        'ArrowLeft',
        'ArrowRight',
        'Tab',
        'Home',
        'End',
      ]
      if (allowedKeys.includes(e.key)) return
      if (!/[0-9]/.test(e.key)) {
        e.preventDefault()
      }
      return
    }

    if (!allowPositiveOnly) return
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Home',
      'End',
    ]
    if (allowedKeys.includes(e.key)) return
    const isNumber = /[0-9]/.test(e.key)
    const isDot = e.key === '.'
    const target = e.target as HTMLInputElement
    if (!isNumber && !isDot) {
      e.preventDefault()
      return
    }
    if (isDot && target.value.includes('.')) {
      e.preventDefault()
      return
    }
  }
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (digitsOnly) {
      const paste = e.clipboardData.getData('text')
      if (!/^\d*$/.test(paste)) {
        e.preventDefault()
        return
      }
      const target = e.target as HTMLInputElement
      const selectedLength =
        (target.selectionEnd ?? 0) - (target.selectionStart ?? 0)
      const nextLength = target.value.length - selectedLength + paste.length
      if (maxLength && nextLength > maxLength) {
        e.preventDefault()
      }
      return
    }

    if (maxLength) {
      const target = e.target as HTMLInputElement
      const selectedLength =
        (target.selectionEnd ?? 0) - (target.selectionStart ?? 0)
      const nextLength =
        target.value.length -
        selectedLength +
        e.clipboardData.getData('text').length
      if (nextLength > maxLength) {
        e.preventDefault()
      }
      return
    }

    if (!allowPositiveOnly) return
    const paste = e.clipboardData.getData('text')
    if (!/^[0-9]*\.?[0-9]*$/.test(paste)) {
      e.preventDefault()
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
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          ref={ref}
          placeholder={placeholder || label}
          onBlur={onBlur}
          type={type}
          maxLength={maxLength}
          inputMode={digitsOnly ? 'numeric' : undefined}
          data-testid={id ?? name}
          autoComplete={autoComplete ? 'on' : 'off'}
          autoFocus={autoFocus}
          className={generateClassName('input')}
          hidden={hidden}
        />
      </div>
      {fieldError && (
        <div className="text-error text-error-label mt-[1px]">
          {errorMessage}
        </div>
      )}
    </div>
  )
}

export default TextField
