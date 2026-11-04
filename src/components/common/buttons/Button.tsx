import React, { useEffect, useRef, useState } from 'react'

import { ButtonDropdownItemProps, ButtonProps } from '../../../common/types'
import Icons from '../icons'
import { ButtonSpinner, Icon } from '../index'

const Button: React.FC<ButtonProps> = ({
  label,
  icon,
  iconAlignment = 'left',
  type = 'button',
  onClick = undefined,
  size = 'sm',
  className = '',
  outlined = false,
  primary = true,
  fullwidth = false,
  isLoading = false,
  disabled = false,
  hidden = false,
  isPrimary = false,
  dropdown = undefined,
  tooltip = '',
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [openDropdown, setOpenDropdown] = useState<boolean>(false)
  // const [loaderBool, setLoaderBool] = useState(false)
  const openDropdownMenu = () => {
    setOpenDropdown(true)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  const generateClassName = () => {
    let genclass = `btn relative`
    if (size === 'sm') {
      genclass += ' h-9 text-sm p-2 min-w-[65px]'
    } else if (size === 'xs') {
      genclass += ' h-7 text-sm px-2 py-0 min-w-[56px] iconWidthSm'
    } else if (size === 'common') {
      genclass += ' text-common px-2 py-1.5 min-w-[56px] iconWidthSm'
    } else {
      genclass += ' h-8 text-sm px-2 py-0 min-w-[56px] iconWidthSm'
    }
    if (primary) {
      genclass += ` ${
        outlined ? 'btn-primary-outlined ' : 'btn-primary shadow-buttonShadow'
      }`
    } else {
      genclass += `${outlined ? 'btn-secondary-outlined ' : 'btn-secondary '}`
    }

    if (fullwidth) {
      genclass += ` w-full`
    }
    if (className) {
      genclass += ` ${className}`
    }
    return genclass
  }
  const handleClick = (e: any) => {
    // setLoaderBool(true)
    onClick?.(e)
    // setTimeout(() => {
    //   setLoaderBool(false)
    // }, 2000)
  }
  const manageDropdownClick = (data: ButtonDropdownItemProps) => {
    setOpenDropdown(false)
    dropdown?.onClick?.(data)
  }
  return (
    <div className="flex ">
      {!hidden && (
        <button
          title={tooltip}
          type={type}
          data-testid={label ? label.toLocaleLowerCase() : ''}
          disabled={disabled || isLoading}
          onClick={
            type !== 'submit'
              ? (primary && !outlined) || isPrimary
                ? handleClick
                : onClick
              : undefined
          }
          className={`relative flex items-center justify-center   ${
            dropdown ? 'rounded-l-[4px] rounded-r-[0]' : 'rounded-[4px]'
          }    ${generateClassName()}`}
        >
          <div className="flex items-center justify-center gap-1   ">
            {!icon && isLoading && (
              <div className="absolute w-full h-full flex items-center justify-center">
                <ButtonSpinner position="center" />
              </div>
            )}
            {icon && iconAlignment === 'left' && (
              <>
                {isLoading ? (
                  <ButtonSpinner />
                ) : (
                  <Icon
                    name={icon}
                    className={`flex items-center justify-center ${
                      outlined ? '' : 'iconWhite'
                    }`}
                    data-testid="button-icon-left"
                  />
                )}
              </>
            )}
            {label ? (
              <div
                className={`  font-medium leading-none	 ${
                  outlined ? 'text-primary' : 'text-bgWhite dark:text-black '
                }`}
              >
                {label}
              </div>
            ) : (
              ''
            )}
            {icon && iconAlignment === 'right' && (
              <>
                {isLoading ? (
                  <ButtonSpinner position="right" />
                ) : (
                  <Icon
                    name={icon}
                    className={`flex items-center justify-center ${
                      outlined ? '' : 'text-white'
                    }`}
                    data-testid="button-icon-right"
                  />
                )}
              </>
            )}
          </div>
        </button>
      )}
      {dropdown && (
        <>
          <div
            ref={menuRef}
            className={` button-dropdown text-black dark:text-white  dark:bg-[#424242]  ml-[1px]`}
          >
            <div className={`${className} button-dropdown-toggle `}>
              <a
                href="#/"
                onClick={openDropdownMenu}
                className={` rounded-full w-10 h-10 p-2 flex justify-center items-center  bg-white border border-formBorder`}
              >
                <Icons name="plus" className="text-base" />
              </a>
            </div>

            {openDropdown && (
              <div
                className={`button-dropdown-menu flex flex-col gap-1 origin-top ${'text-black dark:text-white'} p-2 min-w-[220px] text-xs font-normal   tracking-[0.24px]  rounded-[8px]  absolute right-0 left-auto mt-[20px] top-8 w-auto shadow-modalShadow bg-white  focus:outline-none dark:bg-[#424242]  dark:text-white `}
              >
                <div>
                  {dropdown.items?.map(
                    (item: ButtonDropdownItemProps, index: number) => (
                      <React.Fragment key={index}>
                        {!item.hidden && (
                          <>
                            <div
                              className="flex justify-between   p-2 bg-white hover:bg-cardWrapperBg rounded-sm cursor-pointer"
                              onClick={() => manageDropdownClick(item)}
                            >
                              <div className="flex gap-2">
                                {item.icon && (
                                  <div className="flex items-center">
                                    <Icon
                                      name={item.icon}
                                      className="text-secondary iconWidthSm"
                                    />
                                  </div>
                                )}
                                {item.label && (
                                  <div className="flex items-center text-sm text-primaryText font-medium">
                                    {item.label}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center">
                                <Icon name="plus" className="iconWidthSm" />
                              </div>
                            </div>
                          </>
                        )}
                      </React.Fragment>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Button
