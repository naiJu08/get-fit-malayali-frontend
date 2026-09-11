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
          className=" input textfield relative pr-14 w-full"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => handleChange(e.target.value)}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-grey-dark"
          onClick={() => handleSearch(searchValue)}
        >
          <Icons name="search" />
        </button>
        {searchValue && (
          <button
            type="button"
            className="absolute right-10 top-1/2 -translate-y-1/2 bg-white"
            onClick={() => handleChange('')}
          >
            <Icons name="close" />
          </button>
        )}
      </form>
    </div>
  )
}
