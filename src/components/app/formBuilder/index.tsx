import moment from 'moment'
import { AutoComplete } from 'qbs-core'
import React, { useCallback, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormBuilderProps } from '../../../common/types'
import Icons from '../../../components/common/icons'
import FileUpload from '../../common/fileUpload/index'
import Checkbox from '../../common/inputs/Checkbox'
import CustomDatePicker from '../../common/inputs/CustomDatePicker'
import Radio from '../../common/inputs/Radio'
import Textarea from '../../common/inputs/TextArea'
import TextField from '../../common/inputs/TextField'
import CustomeChildTable from '../CustomeChildTable'
import DuplicateListItem from './utils'

interface DuplicateField {
  field: string
  label?: string
  newline?: boolean
}
type Props = {
  data?: any
  edit?: boolean
  duplicates?: any
  updatekey?: string
  getDuplicates?: (field: string, value?: string) => void
  clearDuplicates?: (fieldName: string) => void
  duplicateFields?: { [key: string]: DuplicateField }
  spacing?: boolean
  fromPopup?: boolean
}

const FormBuilder: React.FC<Props> = (props) => {
  const {
    control,
    setValue,
    formState: { errors },
    register,
    watch,
  } = useFormContext()
  const {
    data,
    edit,
    duplicates,
    getDuplicates,
    clearDuplicates,
    updatekey = '1',
    duplicateFields,
    fromPopup,
  } = props
  const [trimValue, setTrimValue] = useState(null)
  const handleChange = useCallback((e: any, field: FormBuilderProps) => {
    setValue(field?.id, e[field.descId as string])
    setValue(field.name, e[field.desc as string], { shouldValidate: true })
    field.handleCallBack?.(e)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleParellelInputChange = useCallback(
    (e: any, field: FormBuilderProps) => {
      setValue(field?.subId as string, e[field.descId as string])
      setValue(field.subName as string, e[field.desc as string], {
        shouldValidate: true,
      })
      field.handleCallBack?.(e)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    []
  )

  const handleMultiChange = useCallback((e: any, field: FormBuilderProps) => {
    setValue(field.name, e, { shouldValidate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const passwordEndAdorement =
    'appearance-none placeholder: relative block w-full pl-3 pr-6 py-2 border border-formBorder textfield'

  const [showPassword, setShowPassword] = useState(false)

  const handleTextChange = useCallback(
    (onChange: any, e: any, field: FormBuilderProps) => {
      const { value } = e.target
      const trimValue = value.trimStart()
      setTrimValue(trimValue)
      if (field.wordCount && field.wordCount > 0) {
        const words = trimValue.split(/\s+/)
        if (words?.length > field.wordCount) {
          const previousValue = e.target.defaultValue.trimStart()
          const previousWords = previousValue.split(/\s+/)

          if (words?.length <= previousWords?.length) {
            onChange(trimValue)
          }
          return
        }
      }

      if (field.type === 'checkbox') {
        onChange(e.target.checked)
        return
      }
      if (field.type === 'radio') {
        onChange(e.target.value)
        return
      }
      if (trimValue) {
        if (field.type === 'number' || field.inputType === 'number') {
          const num = parseFloat(trimValue)
          if (!isNaN(num)) onChange(num)
        } else {
          onChange(trimValue)
        }

        if (field.isDuplicateCheck) {
          getDuplicates?.(field.name, encodeURIComponent(trimValue))
        }
        if (field.toCapitalize) {
          onChange(trimValue.toUpperCase())
        }
      } else {
        const empty = field.type === 'number' ? null : ''
        onChange(empty)
        clearDuplicates?.(field.name)
      }
    },
    [clearDuplicates, getDuplicates]
  )
  const handleBlurChange = (field: FormBuilderProps) => {
    clearDuplicates?.(field.name)
  }
  const handleStyleForPhone = (key: string, field: string) => {
    const style = 'text-primaryText text-xxs leading-4 font-medium'
    return field ? `${style} fieldNameStyle text-error-light` : style
  }
  const handleStyle = (key: string, field: FormBuilderProps) => {
    const style = 'text-primaryText text-xxs leading-4 font-medium'
    return field.name === duplicateFields?.[key]?.field
      ? `${style} fieldNameStyle text-error-light`
      : style
  }

  const handleFileUpload = (value: any, field: FormBuilderProps) => {
    if (field.isMultiple) {
      setValue(field.name, value, {
        shouldValidate: true,
      })
    } else {
      setValue(field.name, value?.target?.files[0] ?? '', {
        shouldValidate: true,
      })
    }
  }
  const getErrors = (err: any) => {
    let errMsg = ''
    if (err.message) {
      errMsg = err?.message
    }
    return errMsg
  }
  //fieldNameStyle
  const renderForm = (field: FormBuilderProps) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <div className="relative">
            <Controller
              name={`${field.name}`}
              control={control}
              key={`${updatekey}${field.name}`}
              render={({ field: { onChange, value } }) => (
                <TextField
                  label={field.label}
                  placeholder={field.placeholder}
                  key={`${updatekey}${field.name}`}
                  id={field.name}
                  onChange={(e) => handleTextChange(onChange, e, field)}
                  value={
                    value !== undefined || value !== '' || value !== null
                      ? value
                      : field.type === 'number'
                        ? null
                        : ''
                  }
                  name={field.name}
                  type={field.type}
                  onBlur={() => {
                    handleBlurChange(field)
                  }}
                  required={field.required}
                  errors={!isEditable() ? errors : ''}
                  disabled={field.disabled ?? isEditable()}
                  hidden={field.hidden}
                  handleAction={field.handleAction}
                  actionLabel={field.actionLabel}
                  toLowercase={field.toLowercase}
                />
              )}
            />
            {duplicates?.[field.name]?.length > 0 && (
              <ul className="duplicate-dropdown-list">
                <li className="p-1 text-xxs leading-4 font-semibold text-secondary bg-transparent hover:bg-transparent">
                  {'Possible Duplicates'}
                </li>

                {duplicates?.[field.name]?.map(
                  (duplicate: any, index: number) => (
                    <DuplicateListItem
                      key={index}
                      duplicate={duplicate}
                      handleStyle={handleStyle}
                      handleStyleForPhone={handleStyleForPhone}
                      fields={duplicateFields}
                      field={field}
                      trimValue={trimValue}
                    />
                  )
                )}
              </ul>
            )}
          </div>
        )
      case 'password':
        return (
          <div className="relative">
            <Controller
              name={`${field.name}`}
              control={control}
              key={`${updatekey}${field.name}`}
              render={({ field: { onChange, value } }) => (
                <>
                  <label className={`labels label-text}`}>
                    {field.label}
                    {field?.required ? (
                      <span className="text-error"> *</span>
                    ) : (
                      <></>
                    )}
                  </label>
                  <div className="relative ">
                    <input
                      id={'password'}
                      type={showPassword ? 'text' : 'password'}
                      required={field.required}
                      className={`${passwordEndAdorement} textfield`}
                      // className={`${passwordEndAdorement} textfield ${
                      //   errors[field.name] ? 'textfield-error' : ''
                      // }`}
                      placeholder={field.placeholder}
                      value={value ?? field.value}
                      onChange={(e) => handleTextChange(onChange, e, field)}
                    />
                    {errors && errors[field.name] && (
                      <div className="text-error text-error-label mt-[1px]">
                        {getErrors(errors[field.name])}
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute right-2 top-2 z-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <Icons name="eye" />
                      ) : (
                        <Icons name="eye-close" />
                      )}
                    </button>
                  </div>
                </>
              )}
            />
          </div>
        )
      case 'textarea':
        return (
          <div className="relative">
            <Controller
              name={`${field.name}`}
              control={control}
              key={`${updatekey}${field.name}`}
              render={({ field: { onChange, value } }) => (
                <Textarea
                  label={field.label}
                  placeholder={field.placeholder}
                  id={field.name}
                  value={value}
                  key={`${updatekey}${field.name}`}
                  name={field.name}
                  onChange={(e) => handleTextChange(onChange, e, field)}
                  required={field.required}
                  errors={!isEditable() ? errors : undefined}
                  disabled={field?.disabled ?? isEditable()}
                  maxLength={field?.maxLength}
                  wordCount={field?.wordCount}
                />
              )}
            />
          </div>
        )
      case 'checkbox':
        return (
          <div className="relative">
            <Controller
              name={`${field.name}`}
              control={control}
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  id={field.name}
                  checked={value}
                  disabled={field?.disabled ?? isEditable()}
                  handleChange={(e) => handleTextChange(onChange, e, field)}
                  errors={!isEditable() ? errors : undefined}
                  name={field.name}
                  required={field.required}
                  hideRequired={field.hideRequired}
                  label={field.label}
                  placeholder={field.placeholder}
                />
              )}
            />
          </div>
        )
      case 'custom_checkbox':
        return (
          <div className="relative">
            <Controller
              name={`${field.name}`}
              control={control}
              render={({ field: { onChange, value } }) => (
                <div className="flex gap-2">
                  <Checkbox
                    id={field.name}
                    checked={value}
                    handleChange={(e) => handleTextChange(onChange, e, field)}
                    disabled={field?.disabled ?? isEditable()}
                  />
                  <label
                    htmlFor={field.name}
                    className="text-blackAlt font-medium text-xxs leading-[2]"
                  >
                    {field.label || field.placeholder}
                  </label>
                </div>
              )}
            />
          </div>
        )

      case 'radio':
        return (
          <div className="relative">
            <Controller
              name={`${field.name}`}
              control={control}
              render={({ field: { onChange, value } }) => {
                return (
                  <div className="flex gap-2">
                    <Radio
                      name={field.name}
                      label={field.label}
                      data={field.data}
                      checked={value}
                      required={field.required}
                      value={watch()[field.name]}
                      disabled={field.disabled || isEditable()}
                      // handleChange={onChange}
                      handleChange={(e) => handleTextChange(onChange, e, field)}
                      errors={!isEditable() ? errors : undefined}
                    />
                    {/* <label htmlFor={field.name}>{field.label}</label> */}
                  </div>
                )
              }}
            />
          </div>
        )
      case 'auto_complete':
        return (
          <div className={`${field.hidden ? 'hidden' : ''}`}>
            <Controller
              name={`${field.name}`}
              control={control}
              key={`${updatekey}${field.name}`}
              render={({ field: { value } }) => (
                <AutoComplete
                  key={`${updatekey}${field.name}`}
                  name={field.name}
                  type="auto_complete"
                  desc={field.desc as string}
                  className={
                    errors[field.name] && !isEditable() ? 'textfield-error' : ''
                  }
                  descId={field.descId as string}
                  onChange={(e) => handleChange(e, field)}
                  value={value}
                  label={field.label}
                  errors={!isEditable() && errors[field.name]}
                  notDataMessage={field.notDataMessage}
                  async={field.async}
                  paginationEnabled={field.paginationEnabled}
                  nextBlock={field.nextBlock ?? undefined}
                  getData={field.getData}
                  data-testid={field.name}
                  initialLoad={field?.initialLoad}
                  placeholder={field.placeholder}
                  disabled={field.disabled ? true : isEditable()}
                  required={field.required}
                  actionLabel={field.actionLabel}
                  handleAction={field.handleAction}
                  // hidden={field.hidden}
                />
              )}
            />
          </div>
        )
      case 'multi_select':
        return (
          <Controller
            name={`${field.name}`}
            control={control}
            key={`${updatekey}${field.name}`}
            render={({}) => (
              <AutoComplete
                key={`${updatekey}${field.name}`}
                name={field.name}
                type="auto_suggestion"
                desc={field.desc as string}
                descId={field.descId as string}
                onChange={(e) => handleMultiChange(e, field)}
                // value={value}
                className={errors[field.name] ? 'textfield-error' : ''}
                selectedItems={field.selectedItems ?? watch()[field.name] ?? []}
                label={field.label}
                errors={errors[field.name]}
                async={field.async}
                paginationEnabled={field.paginationEnabled}
                nextBlock={field.nextBlock ?? undefined}
                notDataMessage={field.notDataMessage}
                getData={field.getData}
                data-testid={field.name}
                initialLoad={field?.initialLoad}
                placeholder={field.placeholder}
                disabled={isEditable()}
                required={field.required}
                actionLabel={field.actionLabel}
                handleAction={field.handleAction}
                isMultiple={field.isMultiple}
              />
            )}
          />
        )
      case 'custom_search_select':
        return (
          <Controller
            name={`${field.name}`}
            control={control}
            key={`${updatekey}${field.name}`}
            render={({ field: { value } }) => (
              <AutoComplete
                key={`${updatekey}${field.name}`}
                notDataMessage={field.notDataMessage}
                name={field.name}
                type="custom_search_select"
                desc={field.desc as string}
                descId={field.descId as string}
                onChange={(e) => handleChange(e, field)}
                value={value}
                className={
                  errors[field.name] && !isEditable() ? 'textfield-error' : ''
                }
                label={field.label}
                data={field?.data}
                errors={!isEditable() ? errors[field.name] : ''}
                data-testid={field.name}
                actionLabel={field.actionLabel}
                handleAction={field.handleAction}
                placeholder={field.placeholder}
                disabled={isEditable()}
                required={field.required}
                initialLoad={field.initialLoad}
              />
            )}
          />
        )
      case 'custom_select':
        return (
          <Controller
            name={`${field.name}`}
            control={control}
            key={`${updatekey}${field.name}`}
            render={({ field: { value } }) => (
              <AutoComplete
                key={`${updatekey}${field.name}`}
                name={field.name}
                type="custom_select"
                className={
                  errors[field.name] && !isEditable() ? 'textfield-error' : ''
                }
                desc={field.desc as string}
                descId={field.descId as string}
                onChange={(e) => handleChange(e, field)}
                value={value}
                label={field.label}
                data-testid={field.name}
                data={field?.data}
                errors={!isEditable() ? errors[field.name] : ''}
                placeholder={field.placeholder}
                notDataMessage={field.notDataMessage}
                required={field.required}
                disabled={field.disabled ? true : isEditable()}
              />
            )}
          />
        )

      case 'date':
        return (
          <Controller
            name={`${field.name}`}
            key={`${updatekey}${field.name}`}
            control={control}
            render={({ field: { value } }) => {
              return (
                <>
                  <CustomDatePicker
                    onChange={(data) =>
                      setValue(field.name, data.value, { shouldValidate: true })
                    }
                    key={`${updatekey}${field.name}`}
                    name={field.name}
                    value={value}
                    viewValue={
                      value && value !== null && value !== '- -'
                        ? moment(value).format('DD-MM-YYYY')
                        : '- -'
                    }
                    placeholder={'DD-MM-YYYY'}
                    label={field.label}
                    errors={!isEditable() ? errors : undefined}
                    fromPopup={fromPopup}
                    maxDate={field.maxDate}
                    minDate={field.minDate}
                    disabled={field?.disabled ?? isEditable()}
                    required={field.required}
                  />
                </>
              )
            }}
          />
        )
      case 'time_only':
        return (
          <Controller
            name={`${field.name}`}
            control={control}
            key={`${updatekey}${field.name}`}
            render={({ field: { value } }) => {
              return (
                <CustomDatePicker
                  onChange={(data) =>
                    setValue(field.name, data.value, { shouldValidate: true })
                  }
                  name={field.name}
                  value={value}
                  key={`${updatekey}${field.name}`}
                  placeholder={'HH:MM:SS'}
                  label={field.label}
                  errors={errors}
                  showTimeSelect
                  showTimeSelectOnly
                  maxDate={field.maxDate}
                  minDate={field.minDate}
                  disabled={field?.disabled ?? isEditable()}
                  required={field.required}
                />
              )
            }}
          />
        )
      case 'file_upload':
        return (
          <Controller
            name={`${field.name}`}
            control={control}
            render={({ field: {} }) => {
              return (
                <>
                  <FileUpload
                    name={`${field.name}`}
                    subName={`${field.subName}`}
                    id={`${field.name}`}
                    key={`${updatekey}${field.name}`}
                    onChange={(value) => handleFileUpload(value, field)}
                    label={field.label ?? ''}
                    value={field.selectedFiles}
                    isMultiple={field.isMultiple}
                    errors={!isEditable() ? errors : undefined}
                    handleDeleteFile={field.handleDeleteFile}
                    supportedExtensions={field?.supportedExtensions ?? ['pdf']}
                    supportedFiles={
                      field.acceptedFiles ?? 'PNG, PDF, JPG, EXCEL, DOC '
                    }
                    sizeLimit={field.fileSize ?? 5}
                    buttonLabel={field.fileUploadLabel ?? 'Browse & Upload'}
                    iconName="cloud-upload"
                    needConfirmation={field.needConfirmation}
                    setAttachmentName={field.setAttachmentName}
                    accept={field.accept}
                    required={field?.required}
                    disabled={field?.disabled ?? isEditable()}
                  />
                </>
              )
            }}
          />
        )
      case 'upload_link':
        return (
          <div className="relative">
            <Controller
              name={`${field.name}`}
              control={control}
              key={`${updatekey}${field.name}`}
              render={({ field: { value } }) => (
                <>
                  <label className={`labels label-text}`}>
                    {field.label}
                    {field?.required ? (
                      <span className="text-error"> *</span>
                    ) : (
                      <></>
                    )}
                  </label>
                  <div className="relative h-8 flex items-center justify-start gap-2 mb-2">
                    <input
                      id={`${updatekey}_upload_link`}
                      type="file"
                      required={field.required}
                      className={`hidden`}
                      placeholder={field.placeholder}
                      // value={value ?? field.value}
                      onChange={(value) => handleFileUpload(value, field)}

                      // onChange={(e) => handleTextChange(onChange, e, field)}
                    />
                    <label
                      htmlFor={`${updatekey}_upload_link`}
                      className=" cursor-pointer text-xxs font-medium hover:opacity-8"
                    >
                      <span className="flex gap-2 bg-primary p-2 rounded-sm text-white">
                        <Icons className=" iconSize-large" name="upload" />
                        {field.placeholder}
                      </span>
                    </label>
                    {field.selectedFiles && (
                      <Icons
                        className="flex items-center h-7 cursor-pointer icon-error"
                        name="table-delete"
                        onClick={field?.handleDeleteFile}
                      />
                    )}
                  </div>
                  {errors && errors[field.name] && (
                    <div className="text-error text-error-label mt-[1px]">
                      {getErrors(errors[field.name])}
                    </div>
                  )}
                  {value && (
                    <div className="w-[100px] h-[100px] overflow-hidden rounded-md">
                      <img
                        className="w-full h-full object-cover"
                        src={
                          typeof value === 'string'
                            ? value
                            : URL.createObjectURL(value)
                        }
                        width={100}
                        alt=""
                      />
                    </div>
                  )}
                </>
              )}
            />
          </div>
        )
      case 'radio_group':
        return (
          <div className={`customRadioButton w-auto`}>
            <label className={`labels label-text`}>{field.label} </label>
            <div className="customRadio-field relative flex items-center gap-4">
              {field.group_data
                ? field?.group_data?.map((group: any) => (
                    <div
                      key={data?.id}
                      className="flex item-center gap-1 my-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={group.value === watch()[field.name as string]}
                        value={group.value}
                        id={group.id}
                        {...register(field.name)}
                      />
                      <label htmlFor={group.id} className="cursor-pointer">
                        {group.label}
                      </label>
                    </div>
                  ))
                : ''}
            </div>
          </div>
        )
      case 'custom_child_table':
        return (
          <Controller
            name={`${field.name}`}
            control={control}
            key={`${updatekey}${field.name}`}
            render={({ field: { onChange, value } }) => (
              <CustomeChildTable
                disabled={field?.disabled ?? isEditable()}
                onChange={onChange}
                value={value}
                tableData={watch()[field.name as string]}
                minDate={field?.minDate}
                errors={!isEditable() ? errors : ''}
                name={`${field.name}`}
              />
            )}
          />
        )
      case 'parellel_input_select':
        return (
          <div className="grid grid-cols-[1fr_1fr] gap-4">
            <div className="relative flex-1">
              <Controller
                name={`${field.name}`}
                control={control}
                key={`${updatekey}${field.name}`}
                render={({ field: { onChange, value } }) => (
                  <TextField
                    label={field.label}
                    placeholder={field.startPlaceholder}
                    key={`${updatekey}${field.name}`}
                    id={field.name}
                    onChange={(e) => handleTextChange(onChange, e, field)}
                    value={
                      value !== undefined || value !== '' || value !== null
                        ? value
                        : field.inputType === 'number'
                          ? null
                          : ''
                    }
                    name={field.name}
                    type={field.inputType}
                    onBlur={() => {
                      handleBlurChange(field)
                    }}
                    required={field.required}
                    errors={errors}
                    disabled={field.disabled ?? isEditable()}
                    hidden={field.hidden}
                    handleAction={field.handleAction}
                    actionLabel={field.actionLabel}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                name={`${field.subName}`}
                control={control}
                key={`${updatekey}${field.subName}`}
                render={({ field: { value } }) => (
                  <AutoComplete
                    key={`${updatekey}${field.subName}`}
                    name={field.subName as string}
                    type="custom_select"
                    className={
                      errors[field.subName as string] && !isEditable()
                        ? 'textfield-error'
                        : ''
                    }
                    desc={field.desc as string}
                    descId={field.descId as string}
                    onChange={(e) => handleParellelInputChange(e, field)}
                    value={value}
                    label={field.label}
                    data-testid={field.subName}
                    data={field?.subData}
                    errors={
                      !isEditable()
                        ? errors[field.subName as string]
                        : undefined
                    }
                    placeholder={field.endPlaceholder}
                    notDataMessage={field.notDataMessage}
                    required={field.required}
                    disabled={field.disabled ?? isEditable()}
                  />
                )}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isEditable = () => {
    return !edit
  }

  return (
    <>
      {props.spacing ? (
        <>
          {data.map((field: FormBuilderProps) => (
            <>
              {!field.hidden && (
                <div
                  className={`col-span-12 md:col-span-${
                    field?.spacing ?? 1
                  } md:col-span-${field?.formSpacing ?? 0}`}
                  key={field.name}
                >
                  {renderForm(field)}
                </div>
              )}
            </>
          ))}
        </>
      ) : (
        <>
          {data.map((field: FormBuilderProps) => (
            <>
              {!field.hidden && <div key={field.name}>{renderForm(field)}</div>}
            </>
          ))}
        </>
      )}
    </>
  )
}

export default FormBuilder
