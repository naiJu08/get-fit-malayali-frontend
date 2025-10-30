import React, { useCallback, useEffect, useState } from 'react'

import { DialogModalProps } from '../../../common/types'
import Icon from '../icons'
import { Button } from '../index'

const DialogModal: React.FC<DialogModalProps> = ({
  isOpen,
  modalId = undefined,
  onClose,
  isCloseIcon = true,
  onSubmit,
  actionLabel,
  disabled = false,
  actionLoader,
  title,
  subTitle,
  body,
  actionBody,
  secondaryAction,
  secondaryActionLabel,
  small = true,
  backdropCancel,
  scrollDisable,
  fromModal,
  className,
  stylelabel,
  headborder,
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
        } `}
        onClick={() => handleOutsideCancel('outside')}
        data-testid="modal-outside"
      >
        <div
          className={`relative mx-auto md:h-auto ${
            small
              ? 'w-[400px] max-w-full'
              : 'modal-small md:w-11/12 lg:w-9/12 xl:w-7/12 2xl:w-6/12'
          }  ${className}`}
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
              shadow-popupShadow
               rounded-xl
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
                  className="absolute top-4 right-2 p-0  bg-transparent text-sm w-8 h-8 ml-auto inline-flex justify-center items-center text-primaryText dark:text-white"
                  data-modal-hide="popup-modal"
                  onClick={() => handleCancel('close')}
                  data-testid="close-icon"
                >
                  <Icon
                    name="close-popup"
                    className="flex items-center justify-center pr-1  text-primaryText"
                    data-testid="button-icon-left"
                  />
                </button>
              )}
              <div className={`p-0 text-left`}>
                <div
                  className={`flex flex-col gap-0.5 p-5  ${!headborder ? '' : 'border-b border-formBorder'}  `}
                >
                  {title && (
                    <h3 className="font-semibold text-l leading-7 text-blackAlt">
                      {title}
                    </h3>
                  )}
                  {subTitle && (
                    <p className=" text-secondary font-medium text-sm ">
                      {subTitle}
                    </p>
                  )}
                  {stylelabel && (
                    <span className="font-medium text-xxs p-1 px-2 rounded-sm bg-primaryAlt w-fit text-primary">
                      {stylelabel}
                    </span>
                  )}
                </div>
                <div className={`flex flex-col  ${small ? 'px-5' : 'px-6'}`}>
                  {body}
                </div>
                {actionBody && (
                  <div className="flex flex-col p-5">{actionBody}</div>
                )}

                {(actionLabel || secondaryActionLabel) && !actionBody && (
                  <div className="flex flex-col p-5">
                    <div
                      className="
                    flex
                    flex-row
                    items-end
                    gap-2
                    w-full
                    justify-end
                  "
                    >
                      {secondaryAction && secondaryActionLabel && (
                        <Button
                          disabled={disabled}
                          label={secondaryActionLabel}
                          onClick={() => handleSecondaryAction()}
                          outlined
                        />
                      )}

                      {actionLabel && (
                        <Button
                          disabled={disabled}
                          isLoading={actionLoader}
                          label={actionLabel}
                          onClick={handleSubmit}
                          primary
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showModal && !fromModal && (
        <div className="opacity-50 fixed inset-0 z-40 bg-black dark:bg-bgWhite"></div>
      )}
    </>
  )
}

export default DialogModal
