import { useState, useRef, useEffect } from 'react'
import { AdvanceFilter, FilterParams } from '../../../common/types'
import { Icon } from '../../common'
import Icons from '../../common/icons'
type Props = {
  advanceFilter: AdvanceFilter
  setAdvanceFilter?: (filter: AdvanceFilter) => void
  handleClear?: (val?: FilterParams) => void
}

const FilterDropDown = (props: Props) => {
  const { advanceFilter, setAdvanceFilter, handleClear } = props

  const [showDropdown, setShowDropdown] = useState(false)

  const toggleCheckbox = (index: number) => {
    const newOptions = [...advanceFilter.filterParams]
    if (newOptions[index].isChecked) {
      const selected = newOptions.find((e, ind) => ind === index)
      handleClear?.(selected)
    }
    newOptions[index].isChecked = !newOptions[index].isChecked
    setAdvanceFilter?.({
      ...advanceFilter,
      filterParams: newOptions,
    })
  }
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  return (
    <div className="filter-dropdown" ref={dropdownRef}>
      <button onClick={() => setShowDropdown(!showDropdown)}>
        <Icon className="iconWidthSm" name="plus" />
        More Filter
      </button>

      {showDropdown && (
        <div className="filter-dropdown-content">
          {advanceFilter?.filterParams.map((option, index) => (
            <div
              className={`custom-checkbox-container relative ${
                option.isChecked && 'is-selected'
              }`}
              key={index}
            >
              <div className="custom-checkbox">
                <input
                  type="checkbox"
                  checked={option.isChecked ? true : false}
                  onChange={() => toggleCheckbox(index)}
                  id={`moreFilter-${index}`}
                />

                <label htmlFor={`moreFilter-${index}`}>
                  <Icons name="checkbox-check" className="iconWhite" />
                </label>
              </div>
              <div className="custom-checkbox-value">{option.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FilterDropDown
