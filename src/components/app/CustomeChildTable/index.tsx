import moment from 'moment'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'

import CustomDatePicker from '../../common/inputs/CustomDatePicker'
import TextArea from '../../common/inputs/TextArea'

interface CustomeChildTableProps {
  tableData: any[]
  onChange: (data: any[]) => void
  minDate: any
  disabled: boolean
  value?: any
  errors?: any
  name?: string
}

const CustomeChildTable: React.FC<CustomeChildTableProps> = ({
  tableData,
  onChange,
  minDate,
  disabled,
  errors,
}) => {
  const [error, setErrors] = useState<string | null>(null)
  const maxLength = 400
  const whoMaxLength = 65

  const { clearErrors } = useFormContext()
  const handleChange = (e: any, ind: number, key: string) => {
    const updatedActions = [...tableData]
    if (e?.target?.value || e?.value) {
      clearErrors(key)
    }
    if (key === 'by_when') {
      const date = e.value ? new Date(e.value) : null
      updatedActions[ind][key] = date ? moment(date).format('YYYY-MM-DD') : ''
    } else if (key === 'who') {
      const value = e.target.value.slice(0, whoMaxLength)
      updatedActions[ind][key] = value

      if (e.target.value?.length > whoMaxLength) {
        setErrors(`Max ${whoMaxLength} Characters`)
      } else {
        setErrors(null)
      }
    } else {
      const value = e.target.value.slice(0, maxLength)
      updatedActions[ind][key] = value

      if (e.target.value?.length > maxLength) {
        setErrors(`Max ${maxLength} Characters`)
      } else {
        setErrors(null)
      }
    }

    onChange(updatedActions)
  }

  const getDate = (date: any) => {
    return date ? moment(date).format('DD-MM-YYYY') : ''
  }
  const getError = () => {
    const keys = ['by_when', 'milestone', 'who']
    let message = ''
    if (errors && Object.keys(errors)?.length > 0) {
      Object.keys(errors)?.forEach((itemKey: any) => {
        if (keys.includes(itemKey)) {
          message = errors[itemKey]?.message
        }
      })
    }
    return message
  }
  const getItemError = (key: string) => {
    let valid = false
    if (errors && Object.keys(errors)?.length > 0) {
      Object.keys(errors)?.forEach((itemKey: any) => {
        if (key.includes(itemKey)) {
          valid = true
        }
      })
    }
    return valid
  }

  return (
    <div className="bg-grey-lightHover p-2 rounded-md">
      <table className="w-full text-xxs font-medium rounded-md border-collapse border border-grey-border align-middle child-table">
        <thead>
          <tr>
            <th className=" text-left px-3 py-2 bg-grey-light border border-grey-border">
              Actions
            </th>
            <th className=" text-left px-3 py-2 bg-grey-light border border-grey-border w-8">
              When
            </th>
            <th className=" text-left px-3 py-2 bg-grey-light border border-grey-border w-44">
              Responsible Person
            </th>
          </tr>
        </thead>
        <tbody className={`${disabled ? 'bg-grey-lightHover ' : 'bg-white'}`}>
          {tableData?.map((item, index) => (
            <tr key={item.id}>
              <td className="border border-grey-border text-left">
                <TextArea
                  id=""
                  disabled={disabled}
                  value={item.milestone}
                  rows={3}
                  errorFlag={
                    index == 0 && getItemError('milestone') ? true : false
                  }
                  onChange={(e) => handleChange(e, index, 'milestone')}
                  name={`milestone`}
                />
              </td>
              <td className="border border-grey-border w-32">
                <CustomDatePicker
                  onChange={(date) => handleChange(date, index, 'by_when')}
                  key={`actions[${index}].by_when`}
                  name={`by_when`}
                  value={item.by_when}
                  disabled={disabled}
                  minDate={minDate}
                  // errors={index == 0 ? errors : undefined}
                  errorFlag={
                    index == 0 && getItemError('by_when') ? true : false
                  }
                  viewValue={getDate(item.by_when)}
                />
              </td>
              <td className="border border-grey-border input-area">
                <TextArea
                  id=""
                  rows={3}
                  disabled={disabled}
                  errorFlag={index == 0 && getItemError('who') ? true : false}
                  value={item.who}
                  onChange={(e) => handleChange(e, index, 'who')}
                  name={`who`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && (
        <div className="text-error text-error-label mt-[1px]">{error}</div>
      )}
      {errors && (
        <div className="text-error text-error-label mt-[1px]">{getError()}</div>
      )}
    </div>
  )
}

export default CustomeChildTable
