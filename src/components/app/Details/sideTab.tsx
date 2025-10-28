import React from 'react'

import { Icon } from '../../common'

type Data = {
  data: any[]
  handleSelect: any
  selectedType: string
  validationErrors?: any[]
}

const SideTab: React.FC<Data> = ({
  data,
  handleSelect,
  selectedType,
  validationErrors,
}) => {
  return (
    <div className=" w-fit min-w-[260px] p-2 sticky top-[150px] 2xl:top-20 rounded-md bg-white">
      <ul className="p-0">
        {data?.map((item, index) => (
          <>
            <li
              key={index}
              className={`p-2 hover:bg-grey-lightHover items-center flex gap-4 justify-between first:mb-4 relative first:after:w-full first:after:h-[1px] first:after:border-b first:after:absolute first:after:-bottom-2 first:after:left-0 rounded-md text-common font-medium text-blackAlt mb-2 cursor-pointer ${
                item.slug === selectedType
                  ? 'bg-grey-lightHover  text-primary'
                  : ''
              }`}
              onClick={() => handleSelect(item)}
            >
              {item.name}
              {!validationErrors?.find((obj) => obj.title === item.slug) &&
                item.slug !== 'feedback' &&
                item.slug !== 'overview' && <Icon name="check-circle" />}
            </li>
            {item.slug === 'confirmation' && (
              <li className="border-b my-1 mb-2 last:hidden "></li>
            )}
          </>
        ))}
      </ul>
    </div>
  )
}

export default SideTab
