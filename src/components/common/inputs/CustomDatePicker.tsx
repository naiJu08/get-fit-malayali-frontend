import DatePicker from 'react-datepicker'
import { FieldErrors } from 'react-hook-form'

import {
  createTimeDateFromString,
  formatTime24Hour,
} from '../../../utilities/parsers'
import Icons from '../icons/index'
import TextField from './TextField'

import 'react-datepicker/dist/react-datepicker.css'

type Props = {
  label?: string
  onChange: (data: any) => void
  value?: any
  viewValue?: any
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  required?: boolean
  errors?: FieldErrors
  placeholder?: string
  selectRange?: boolean
  name: string
  showTimeSelectOnly?: boolean
  showTimeSelect?: boolean
  fromPopup?: boolean
  errorFlag?: boolean
}

const CustomDatePicker = (props: Props) => {
  const {
    label,
    errors,
    onChange,
    value,
    viewValue,
    maxDate,
    minDate,
    disabled,
    required,
    placeholder,
    selectRange,
    name,
    showTimeSelectOnly = false,
    showTimeSelect = false,
    fromPopup = false,
    errorFlag,
  } = props

  const handleClear = () => {
    const value = selectRange ? [null, null] : null
    onChange({ value, name })
  }
  const handleDatePickerChange = (date: any) => {
    if (date) {
      if (showTimeSelectOnly) {
        onChange({ value: formatTime24Hour(date), name: name })
        return false
      }
      const selectedDate = new Date(date)
      selectedDate.setHours(12, 0, 0, 0)
      onChange({ value: selectedDate, name: name })
    } else {
      onChange({ value: null, name: name })
    }
  }
  const getErrors = (err: any) => {
    let errMsg = ''
    if (err.message) {
      errMsg = err?.message
    }
    return errMsg
  }
  const handleSelected = () => {
    if (showTimeSelectOnly) {
      return value ? createTimeDateFromString(value) : null
    } else {
      return value ? new Date(value) : null
    }
  }
  return (
    <div className="flex flex-col">
      {label && (
        <div className=" ">
          <label className={`labels label-text`}>
            {label}
            {required ? <span className="text-error"> *</span> : <></>}
          </label>
        </div>
      )}
      <div className="relative">
        {disabled ? (
          <TextField
            value={viewValue ?? value}
            id="date"
            name={name}
            placeholder={placeholder}
            disabled
          />
        ) : (
          <DatePicker
            showYearDropdown
            scrollableYearDropdown={true}
            yearDropdownItemNumber={100}
            portalId={fromPopup ? 'root-portal' : undefined}
            selected={handleSelected()}
            disabled={disabled}
            maxDate={maxDate}
            minDate={minDate}
            data-testid={name}
            onChange={(date) => handleDatePickerChange(date)}
            placeholderText={placeholder}
            className={` w-full textfield ${errorFlag && 'textfield-error'}`}
            dateFormat={showTimeSelectOnly ? 'HH:mm' : 'dd-MM-yyyy'}
            showTimeSelect={showTimeSelect}
            showTimeSelectOnly={showTimeSelectOnly}
            timeIntervals={15}
            timeFormat="HH:mm"
            timeCaption="Time"
            selectsRange={selectRange}
            customInput={<input value={value} />}
          />
        )}
        <div className="absolute right-2 flex items-center justify-center gap-1 top-2  bg-transparent">
          {value && !disabled && (
            <button
              className="   p-0  w-5 h-5 text-[#757575]"
              onClick={() => handleClear()}
            >
              <Icons name="close" className="w-4 h-4 fill-[#757575]" />
            </button>
          )}
          <span className="   text-[#757575] block">
            <svg
              className="w-4 h-4 fill-[#757575]"
              focusable="false"
              aria-hidden="true"
              viewBox="0 0 24 24"
              data-testid="CalendarIcon"
            >
              <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"></path>
            </svg>
          </span>
        </div>
      </div>
      {errors && errors[name] && (
        <div className="text-error text-error-label mt-[1px]">
          {getErrors(errors[name])}
        </div>
      )}
    </div>
  )
}

export default CustomDatePicker
