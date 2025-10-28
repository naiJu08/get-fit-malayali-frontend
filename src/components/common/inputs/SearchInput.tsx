import React from 'react'
import { SearchProps } from '../../../common/types'
import Icons from '../icons'

export default function SearchInput({
  placeholder,
  handleChange,
  searchValue,
  handleSearch,
}: SearchProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSearch(searchValue)
  }

  return (
    <div className="relative">
      <form onSubmit={(e) => handleSubmit(e)}>
        <input
          className=" input textfield relative pr-1 w-full"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => handleChange(e.target.value)}
        />
        <button
          className="absolute right-1 bottom-1.5 bg-white text-grey-dark"
          onClick={() => handleSearch(searchValue)}
        >
          <Icons name="search" />
        </button>
        {searchValue && (
          <button
            className="absolute right-7 bottom-2 bg-white"
            onClick={() => handleChange('')}
          >
            <Icons name="close" />
          </button>
        )}
      </form>
    </div>
  )
}
