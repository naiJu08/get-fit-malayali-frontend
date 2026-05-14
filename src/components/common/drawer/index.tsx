import { Drawer } from '@mui/material'
import { useEffect, useRef } from 'react'

import { useThemeStore } from '../../../store/themeStore'
import { debounce } from '../../../utilities/debounce'
import Button from '../buttons/Button'
import Icons from '../icons'

type Props = {
  open: boolean
  handleClose: () => void
  children: React.ReactNode
  className?: string
  title: React.ReactNode
  handleSubmit?: () => void
  handleSaveAndContinue?: () => void
  disableSubmit?: boolean
  actionLabel?: string
  saveAndContinueLabel?: string
  contentBg?: boolean
  hideSubmit?: boolean
  titleBadge?: any
  actionLoader?: boolean
  headerFilter?: any
  headerActionProps?: {
    title?: string
    action: () => void
  }[]
  containerRef?: any
  viewMode?: any
  unmountOnClose?: boolean
  accentHeader?: boolean
}

export default function CustomDrawer(props: Props) {
  const {
    open,
    handleClose,
    children,
    className,
    title,
    handleSubmit,
    handleSaveAndContinue,
    saveAndContinueLabel,
    disableSubmit,
    actionLabel,
    contentBg,
    hideSubmit,
    headerActionProps,
    actionLoader,
    headerFilter,
    containerRef,
    viewMode,
    unmountOnClose,
    accentHeader,
  } = props

  const { isDark } = useThemeStore()
  const handleDebounceSave = debounce(() => {
    handleSaveAndContinue?.()
  }, 1000)

  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        if (viewMode) {
          handleClose()
        }
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, handleClose, viewMode])

  return (
    <div>
      <Drawer
        className={`customDrawer ${
          headerActionProps && headerActionProps?.length > 0
            ? ''
            : 'drawer-zindex '
        } ${isDark ? 'dark' : ''}`}
        anchor="right"
        open={open}
      >
        <div
          ref={drawerRef}
          className={`${className} flex flex-col overflow-auto h-full`}
        >
          <div
            className={` ${
              headerFilter
                ? 'h-[118px] relative p-4 flex flex-col gap-3'
                : accentHeader
                  ? 'h-[78px] p-5'
                  : 'h-[68px] p-5'
            }  relative border-b ${
              accentHeader
                ? 'border-blue-100 bg-blue-50/70 dark:border-divider dark:bg-[#111827]'
                : 'border-divider'
            } `}
          >
            <div className="flex-shrink-1 flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {accentHeader ? (
                  <button
                    type="button"
                    aria-label="Close drawer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-white text-primaryBlue transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    onClick={handleClose}
                  >
                    <div className="h-4 w-4">
                      <Icons name="close" />
                    </div>
                  </button>
                ) : (
                  <div
                    className=" cursor-pointer text-primaryText dark:text-white flex items-center"
                    onClick={handleClose}
                  >
                    <div className="h-4 w-4">
                      <Icons name="close" />
                    </div>
                  </div>
                )}
                <h4 className="text-l font-semibold dark:text-white text-primaryText flex flex-1 items-center min-w-0">
                  {title}
                </h4>
              </div>
              <div className="flex gap-2">
                {headerActionProps &&
                  headerActionProps?.length > 0 &&
                  headerActionProps?.map((item, index) => (
                    <Button
                      key={index}
                      primary={false}
                      outlined
                      label={item?.title}
                      onClick={() => item?.action()}
                    />
                  ))}
              </div>
            </div>
            {headerFilter}
          </div>
          <div
            ref={containerRef}
            className={`overflow-y-auto flex-1 ${
              contentBg
                ? 'p-0'
                : headerActionProps && headerActionProps?.length > 0
                  ? ' py-1 '
                  : 'px-5 py-4 '
            }`}
          >
            {!unmountOnClose || open ? children : null}
          </div>
          <div className="p-5 flex items-center justify-between gap-3 border-t border-divider">
            <div>
              {handleSaveAndContinue && (
                <p
                  className="text-common font-medium text-primaryText dark:text-white cursor-pointer"
                  onClick={() => (actionLoader ? '' : handleDebounceSave())}
                >
                  {saveAndContinueLabel ?? 'Save & Create Another'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="secondaryButton"
                label={
                  handleSubmit || handleSaveAndContinue ? 'Cancel' : 'Close'
                }
                outlined={true}
                onClick={handleClose}
              />
              {handleSubmit && !hideSubmit && (
                <Button
                  className="primaryButton"
                  label={actionLabel ?? 'Save'}
                  onClick={handleSubmit}
                  disabled={disableSubmit}
                  isLoading={actionLoader}
                />
              )}
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
