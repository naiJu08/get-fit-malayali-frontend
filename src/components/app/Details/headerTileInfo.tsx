import DynamicDropdown from '../../common/DynamicDropdown'

// import { dropdownData } from '../../../pages/accreditation/details/store'

const HeaderTileInfo = ({ ItemInfo, DropdownItems }: any) => {
  return (
    <div className="flex shrink-0 py-3">
      {ItemInfo.map((child: any, index: number) => (
        <div
          key={index}
          className="px-3 shrink-0 min-w-[190px] border-r border-grey-border first:border-l"
        >
          <span className="text-grey-medium text-xxs font-medium">
            {child.label}
          </span>
          <p className="text-blackAlt text-common font-medium leading-none">
            {child.value}
          </p>
        </div>
      ))}
      <div className="px-3 shrink-0 min-w-[190px] border-grey-border first:border-l">
        {DropdownItems &&
          DropdownItems?.map((child: any) => (
            <>
              {!child.hidden && (
                <div
                  key={child.id}
                  className="flex flex-col items-start justify-center h-full  text-secondary w-full "
                >
                  <span className="text-xxs font-medium">
                    {child.dropdownLabel}
                  </span>
                  <DynamicDropdown
                    tileItem={child}
                    getData={child?.getData}
                    setUpdateCREId={child?.setUpdateCREId}
                    disabled={child?.disabled}
                    value={child?.value}
                  />
                </div>
              )}
            </>
          ))}
      </div>
    </div>
  )
}

export default HeaderTileInfo
