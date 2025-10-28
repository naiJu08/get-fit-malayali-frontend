import React, { useCallback, useEffect, useState } from 'react'
import { ConfirmModalProps } from '../../../common/types'
import Icon from '../icons'
import { Button } from '../index'

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  modalId = undefined,
  onClose,
  isCloseIcon = true,
  topIcon,
  onSubmit,
  actionLabel,
  disabled = false,
  actionLoader,
  title,
  type,
  subTitle,
  body,
  secondaryAction,
  secondaryActionLabel,
  small = true,
  backdropCancel,
  scrollDisable,
  fromModal,
}) => {
  const [showModal, showShowModal] = useState(isOpen)

  const enableScroll = useCallback(() => {
    if (scrollDisable) {
      const body: HTMLBodyElement | null = document.querySelector('body')
      if (body) body.style.overflow = isOpen ? 'hidden' : 'auto'
    }
  }, [isOpen, scrollDisable])

  useEffect(() => {
    showShowModal(isOpen)
    enableScroll()
  }, [enableScroll, isOpen, scrollDisable])

  const handleCancel = useCallback(
    (type: string) => {
      if (disabled && type === 'button') {
        return
      }
      showShowModal(false)
      enableScroll()

      if (onClose) onClose(type, modalId)
    },
    [disabled, enableScroll, onClose, modalId]
  )

  const handleOutsideCancel = useCallback(
    (type: string) => {
      if (!backdropCancel) {
        return
      }
      showShowModal(false)
      enableScroll()
      if (onClose) onClose(type, modalId)
    },
    [backdropCancel, enableScroll, onClose, modalId]
  )

  const handleSecondaryAction = useCallback(() => {
    if (disabled) {
      return
    }
    showShowModal(false)
    enableScroll()
    if (secondaryAction) secondaryAction()
    if (onClose) onClose('button', modalId)
  }, [disabled, enableScroll, secondaryAction, onClose, modalId])

  const updateStyle = useCallback(
    (from: string) => {
      switch (type) {
        case 'success':
          return getSuccessStyle(from)
        default:
          return getConirmationStyle(from)
      }
    },
    [type]
  )

  const getConirmationStyle = (from: string) => {
    switch (from) {
      case 'title':
        return 'py-6 pb-5 text-6xl leading-4 tracking-widest'
      case 'subtitle':
        return 'text-grey-dark text-common leading-7 tracking-wider'
    }
  }
  const getSuccessStyle = (from: string) => {
    switch (from) {
      case 'title':
        return 'py-2 pb-1 text-m font-bold leading-4 tracking-widest'
      case 'subtitle':
        return 'text-grey-dark font-medium text-xxs leading-7 tracking-wider'
    }
  }

  const handleSubmit = useCallback(() => {
    if (disabled) {
      return
    }
    if (onSubmit) onSubmit()
  }, [onSubmit, disabled])

  if (!isOpen) {
    return null
  }
  return (
    <>
      <div
        className={`justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none overscroll-none ${
          !showModal ? 'hidden' : ''
        }`}
        data-testid="modal-backdrop"
        onClick={() => handleOutsideCancel('outside')}
      >
        <div
          className={`relative w-full h-full mx-auto lg:h-auto md:h-auto ${
            small ? 'md:w-2/6 lg:w-2/6 xl:w-2/6' : 'md:w-5/6 lg:w-4/6 xl:w-2/3'
          }`}
        >
          <div
            className={`
            translate
            duration-300
            h-full
            ${showModal ? 'translate-y-0' : 'translate-y-full'}
            ${showModal ? 'opacity-100' : 'opacity-0'}
          `}
          >
            <div
              className="
              translate
              h-full
              lg:h-auto
              md:h-auto
              border-1
              modal-border
              relative
              flex
              flex-col
              w-full
              bg-white
              focus:outline-none
            "
            >
              {isCloseIcon && (
                <button
                  type="button"
                  className="absolute top-4 right-4 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  data-modal-hide="popup-modal"
                  onClick={() => handleCancel('close')}
                  data-testid="close-icon"
                >
                  <Icon
                    name="close-popup"
                    className="flex items-center justify-center pr-1"
                    data-testid="button-icon-left"
                  />
                </button>
              )}
              <div
                className={`p-4 px-10 text-center ${
                  isCloseIcon ? 'pt-10' : 'pt-8'
                }`}
              >
                {topIcon && (
                  <Icon
                    name={topIcon}
                    className="flex items-center justify-center pr-1"
                    data-testid="button-icon-left"
                  />
                )}
                {title && <h3 className={updateStyle('title')}>{title}</h3>}
                {subTitle && (
                  <p className={updateStyle('subtitle')}>{subTitle}</p>
                )}
                {body}
                <div className="flex flex-col gap-1 p-4 pb-6">
                  <div
                    className="
                    flex
                    flex-row
                    items-center
                    gap-1
                    w-full
                    justify-center
                  "
                  >
                    {actionLabel && (
                      <Button
                        disabled={disabled}
                        size="xs"
                        isLoading={actionLoader}
                        label={actionLabel}
                        onClick={handleSubmit}
                        className="inline-flex items-center px-5 text-center mr-1"
                      />
                    )}
                    {secondaryAction && secondaryActionLabel && (
                      <Button
                        disabled={disabled}
                        size="xs"
                        label={secondaryActionLabel}
                        onClick={() => handleSecondaryAction()}
                        outlined
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showModal && !fromModal && (
        <div className="opacity-50 fixed inset-0 z-40 bg-black"></div>
      )}
    </>
  )
}

export default ConfirmModal
