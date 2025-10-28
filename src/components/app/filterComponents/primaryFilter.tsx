import { AutoComplete } from 'qbs-core'
import { useCallback, useEffect, useState } from 'react'
import {
  AdvanceFilter,
  FilterParams,
  FilterProps,
  PrimaryFilter,
} from '../../../common/types'
import { debounce } from '../../../utilities/debounce'
import Icons from '../../common/icons'
import DatePickerComponent from '../../common/inputs/DatePicker'
import TextField from '../../common/inputs/TextField'
import FilterDropDown from './filterDropDown'
import { Checkbox } from '../../common'

type InputProps = {
  value: string
  desc: string
}
type Props = {
  filterParams: PrimaryFilter[]
  filterProps: FilterProps
  hideClear?: boolean
  handleFilterChange: (value: any, desc: string, objectId: string) => void
  advanceFilter?: AdvanceFilter
  handleFilterDateChange?: (
    value: any,
    desc: string,
    descSecondary?: string
  ) => void
  isPrimary?: boolean
  setAdvanceFilter?: (filter: AdvanceFilter) => void
  handleFilterTextChange?: ({ value, desc }: InputProps) => void
}

export const PrimaryFilterComponent = ({
  filterParams,
  filterProps,
  handleFilterChange,
  advanceFilter,
  isPrimary,
  hideClear = false,
  setAdvanceFilter,
  handleFilterDateChange,
  handleFilterTextChange,
}: Props) => {
  const [inputValue, setInputValue] = useState({ value: '', desc: '' })

  // const handleClearAll = useClearFilter('filter_only')
  // const handleClearAll = useClearFilter('all')
  const handleMultiSelect = (value: any, name: string, id: string) => {
    const ids = value ? value?.map((item: any) => item.id) : ''
    const idsString = ids.join(',')
    const result = {
      id: idsString,
      [name]: value ?? [],
    }
    handleFilterChange(result, name, id)
  }
  const renderAutoSuggestion = (item: PrimaryFilter) => (
    <AutoComplete
      placeholder={item.name}
      desc={item.desc}
      type={'auto_suggestion'}
      descId={item.descId as string}
      paginationEnabled={item.paginationEnabled}
      nextBlock={item.nextBlock ?? undefined}
      value={filterProps ? filterProps[item.desc] : ''}
      getData={item.getData}
      initialLoad={item.initialLoad}
      async={item.async}
      name={item.name}
      onChange={(value: any) =>
        handleFilterChange(value, item.desc, item.objectId as string)
      }
    />
  )
  const renderAutoSuggestionMultiSelect = (item: PrimaryFilter) => (
    <AutoComplete
      placeholder={item.name}
      desc={item.desc}
      type={'auto_suggestion'}
      isMultiple={true}
      selectedItems={filterProps ? (filterProps[item.desc] ?? []) : []}
      descId={item.descId as string}
      paginationEnabled={item.paginationEnabled}
      nextBlock={item.nextBlock ?? undefined}
      value={''}
      getData={item.getData}
      initialLoad={item.initialLoad}
      async={item.async}
      name={item.name}
      onChange={(value: any) =>
        handleMultiSelect(value, item.desc, item.objectId as string)
      }
    />
  )
  const renderCustomSelect = (item: PrimaryFilter) => (
    <AutoComplete
      placeholder={item.name}
      desc={item.desc}
      type={'custom_select'}
      descId={item.descId as string}
      value={filterProps ? filterProps[item.desc] : ''}
      data={item.data}
      name={item.name}
      onChange={(value: any) =>
        handleFilterChange(value, item.desc, item.objectId as string)
      }
    />
  )
  const renderCustomSearchSelect = (item: PrimaryFilter) => (
    <AutoComplete
      placeholder={item.name}
      desc={item.desc}
      type={'custom_search_select'}
      descId={item.descId as string}
      value={filterProps ? filterProps[item.desc] : ''}
      data={item.data}
      name={item.name}
      onChange={(value: any) =>
        handleFilterChange(value, item.desc, item.objectId as string)
      }
    />
  )
  const renderDatePicker = (item: PrimaryFilter) => (
    <DatePickerComponent
      placeholder={item.name}
      name={item.name}
      value={
        filterProps
          ? [filterProps[item.desc], filterProps[item.descSecondary as string]]
          : [null, null]
      }
      onChange={(value: any) =>
        handleFilterDateChange?.(value, item.desc, item.descSecondary)
      }
      selectRange={item?.selectRange}
    />
  )
  const renderTextField = (item: PrimaryFilter) => {
    return (
      <TextField
        placeholder={item.name}
        name={item.name}
        id={item.name}
        value={inputValue?.value ? inputValue?.value : filterProps[item.desc]}
        onChange={(e) => handleChange(e, item.desc)}
      />
    )
  }
  const renderCheckbox = (item: any) => {
    return (
      <div className="relative">
        <div className="flex gap-2">
          <Checkbox
            id={item.name}
            checked={filterProps ? filterProps[item.desc] : false}
            handleChange={(e) => handleCheckChange(e, item)}
          />
          <label htmlFor={item.name} className="text-[14px] leading-[22px]">
            {item.name}
          </label>
        </div>
      </div>
    )
  }
  const handleChange = (e: any, desc: string) => {
    setInputValue({ value: e?.target?.value, desc: desc })
  }
  const handleCheckChange = (e: any, item: any) => {
    handleFilterChange(e.target.checked, item.desc, item.desc)
  }
  const updateFilter = debounce(() => {
    if (inputValue.desc) {
      handleFilterTextChange?.(inputValue)
    }
  }, 1000)

  useEffect(() => {
    updateFilter()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue.value])

  const isAnyFilterSelected = () => {
    let flag = false
    Object.keys(filterProps).forEach((key) => {
      if (typeof filterProps[key] === 'object') {
        if (Array.isArray(filterProps[key])) {
          if (filterProps[key].length) {
            flag = true
          }
        } else if (filterProps[key] instanceof Date) {
          flag = true
        }
      } else {
        if (
          filterProps[key] !== '' &&
          filterProps[key] !== null &&
          filterProps[key] !== undefined
        ) {
          flag = true
        }
      }
    })
    return flag
  }
  const renderFilterByType = (item: PrimaryFilter) => {
    switch (item.type) {
      case 'auto_suggestion':
        return renderAutoSuggestion(item)
      case 'custom_search_select':
        return renderCustomSearchSelect(item)
      case 'custom_select':
        return renderCustomSelect(item)
      case 'date_picker':
        return renderDatePicker(item)
      case 'text_field':
        return renderTextField(item)
      case 'check_box':
        return renderCheckbox(item)
      case 'multi_select':
        return renderAutoSuggestionMultiSelect(item)
      default:
        return null
    }
  }

  const shouldRenderAdvanceFilter = (item: PrimaryFilter) => {
    const detail = advanceFilter?.filterParams.find(
      (items) => items.slug === item.slug && items.isChecked
    )
    return detail ? (
      <div
        className={`${item.hidden ? 'hidden ' : ' '} filter w-56`}
        key={item.slug}
      >
        {renderFilterByType(item)}
      </div>
    ) : (
      <></>
    )
  }

  const handleClear = useCallback(
    (val?: FilterParams) => {
      const clearData = filterParams.find((item) => item.slug === val?.slug)

      if (
        clearData?.type === 'auto_suggestion' ||
        clearData?.type === 'auto_complete'
      ) {
        handleFilterChange({}, clearData.desc, clearData?.objectId as string)
      }
    },
    [handleFilterChange, filterParams]
  )
  return (
    <>
      {filterParams.map((item, index) => {
        if (isPrimary && item.isPrimary) {
          return (
            <div
              className={`${item.hidden ? 'hidden ' : ' '} w-56`}
              key={index}
            >
              {renderFilterByType(item)}
            </div>
          )
        } else if (!isPrimary && !item.isPrimary) {
          return <>{shouldRenderAdvanceFilter(item)}</>
        }
        return null
      })}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-3 filter-container">
        {advanceFilter?.isDetailed && isPrimary && (
          <FilterDropDown
            setAdvanceFilter={setAdvanceFilter}
            handleClear={handleClear}
            advanceFilter={advanceFilter}
          />
        )}

        {isPrimary && !hideClear && isAnyFilterSelected() && (
          <button
            // onClick={() => handleClearAll()}
            className="flex items-center justify-center gap-2 text-sm text-secondary dark:text-white"
          >
            <Icons name="close" className="iconWidthSm" /> Clear filter
          </button>
        )}
      </div>
    </>
  )
}
