import DatePicker from 'react-datepicker'

import Icons from '../icons/index'

import 'react-datepicker/dist/react-datepicker.css'

type Props = {
  label?: string
  onChange: (data: any) => void
  value?: any
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  required?: boolean
  error?: any
  placeholder?: string
  selectRange?: boolean
  name?: string
}

const DatePickerConponent = (props: Props) => {
  const {
    label,
    error,
    onChange,
    value,
    maxDate,
    minDate,
    disabled,
    required,
    placeholder,
    selectRange,
    name,
  } = props

  const handleClear = () => {
    const value = selectRange ? [null, null] : null
    onChange({ value, name })
  }
  const handleDatePickerChange = (date: any) => {
    if (date) {
      onChange({ value: date, name: name })
    } else {
      onChange({ value: null, name: name })
    }
  }
  const startDate = Array.isArray(value) ? value[0] : value
  const endDate = Array.isArray(value) ? value[1] : undefined
  return (
    <div className="flex flex-col">
      {label && (
        <label className="labels labelText">
          {required ? (
            <>
              {label}
              <span className="text-required"> * </span>
            </>
          ) : (
            label
          )}
        </label>
      )}

      <div className="relative">
        <DatePicker
          showYearDropdown
          scrollableYearDropdown={true}
          yearDropdownItemNumber={100}
          value={value ? value : ''}
          disabled={disabled}
          data-testid={name}
          maxDate={maxDate}
          minDate={minDate}
          onChange={(date) => handleDatePickerChange(date)}
          placeholderText={placeholder}
          className=" w-full textfield"
          startDate={startDate ? new Date(startDate) : null}
          endDate={endDate ? new Date(endDate) : null}
          selectsRange={selectRange}
          dateFormat="dd/MM/yyyy"
          onKeyDown={(e) => {
            e.preventDefault()
          }}
          popperModifiers={[
            {
              name: 'preventOverflow',
              options: {
                rootBoundary: 'viewport',
                tether: true,
                altAxis: false,
              },
            },
          ]}
        />
        <div className="absolute right-2 flex items-center justify-center gap-1 top-2  bg-transparent">
          {startDate && (
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
      {error && <p className="m-0  text-bgError text-xs">{error}</p>}
    </div>
  )
}

export default DatePickerConponent
