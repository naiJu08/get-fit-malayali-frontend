import React, { useRef } from 'react'

import { Button } from '../../common'
// import InfoBox from '../alertBox/infoBox'
import FormBuilder from '../formBuilder'

// import { ListItemButton } from '@mui/material'

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

type RadioDataProps = {
  radioLabel?: string
  id?: number
  value?: string | boolean
  checked?: boolean
  disabled?: boolean
}

type FormItem = {
  title?: string
  smalltitle?: string
  titleContent?: string
  subtitle?: string
  startSubtitle?: string
  endSubtitle?: string
  startSubContent?: string
  endSubContent?: string
  subtitleContent?: string
  input?: string
  placeholder?: string
  startPlaceholder?: string
  endPlaceholder?: string
  container?: boolean
  child?: any[]
  isEdit?: boolean
  hide?: boolean
  required?: boolean
  parallelFields?: boolean
  hideRequireStatus?: boolean
  hiddenrequire?: boolean
  inputData?: RadioDataProps[]
  lastUpdate?: string
  value?: any
  name?: any
  disabled?: boolean
  itemKey?: string
}

type Props = {
  data: FormItem[]
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>
  isEdit: boolean
  handleSubmit: (item: any) => void
  handleClose: () => void
  setSubSectionKey?: (item: any) => void
  subSectionKey?: string
  setWarningPopup?: any
  setAreOnSamePage?: any
  setSwitchItem?: any
  warningPopup?: boolean
  showSubmitAndBlock?: boolean
  selectedItem?: string
  handleLoader: () => boolean
  isSubmittedToPanel?: any
}

const FormCard = ({
  data,
  setIsEdit,
  isEdit,
  handleSubmit,
  handleClose,
  setSubSectionKey,
  subSectionKey,
  setWarningPopup,
  setAreOnSamePage,
  setSwitchItem,
  showSubmitAndBlock,
  selectedItem,
  warningPopup,
  handleLoader,

  isSubmittedToPanel,
}: Props) => {
  const editForm = (item: any) => {
    setSwitchItem(item)
    if (isEdit) {
      setAreOnSamePage(true)
      setWarningPopup(true)
    } else {
      setIsEdit(true)
      if (item.itemKey) setSubSectionKey?.(item.itemKey)
    }
  }
  const divContRef = useRef<HTMLDivElement | null>(null)
  const parentDivRef = useRef<HTMLDivElement>(null)
  const shouldBeHidden = (item: any) => {
    const isFeedbackOrInternalOrExternal =
      selectedItem === 'feedback' ||
      item.itemKey === 'internal' ||
      item.itemKey === 'external'
    return isFeedbackOrInternalOrExternal
      ? !isSubmittedToPanel
      : !showSubmitAndBlock
  }
  return (
    <>
      {data?.map((item, index) => (
        <div
          ref={parentDivRef}
          key={index}
          className={`bg-white border border-grey-light rounded-md w-full relative ${item.hide && 'hidden'}`}
        >
          {!item.hide && (
            <>
              <div
                ref={divContRef}
                className={`flex justify-between items-center px-5 py-3 border-grey-light border-b ${isEdit && item.itemKey == subSectionKey && !warningPopup && 'sticky top-[132px] rounded-t 2xl:top-[70px]  bg-white z-[15] '}`}
              >
                <div>
                  <h4
                    className={`text-xs text-blackAlt font-medium leading-none ${!item.title ? 'hidden' : ''}`}
                  >
                    {item.title}
                  </h4>
                  <span
                    className={`font-small font-medium mt-1 ${item.smalltitle ? 'block' : 'hidden'} `}
                  >
                    {item.smalltitle}
                  </span>
                </div>

                {item.isEdit &&
                  (item.itemKey || subSectionKey ? (
                    <>
                      {isEdit && item.itemKey == subSectionKey ? (
                        <div className="flex items-center gap-2 ">
                          <Button
                            label="Cancel"
                            size="xs"
                            outlined
                            // onClick={editForm}
                            disabled={handleLoader()}
                            onClick={handleClose}
                          />
                          <Button
                            label="Save"
                            isLoading={handleLoader()}
                            size="xs"
                            onClick={handleSubmit}
                          />
                        </div>
                      ) : (
                        <div className="p-1 cursor-pointer">
                          <Button
                            label={`Edit ${
                              item.title === 'Continuing Target' ||
                              item.title === 'New Target'
                                ? 'Target'
                                : item.title === 'Confirmation'
                                  ? 'Confirmation Data'
                                  : item.title === 'Declaration'
                                    ? 'Declaration Data'
                                    : item.title
                            }`}
                            primary
                            size="xs"
                            onClick={() => editForm(item)}
                            hidden={shouldBeHidden(item)}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {isEdit ? (
                        <div className="flex items-center gap-2 ">
                          <Button
                            label="Cancel"
                            size="xs"
                            outlined
                            // onClick={editForm}
                            disabled={handleLoader()}
                            onClick={handleClose}
                          />
                          <Button
                            label="Save"
                            size="xs"
                            isLoading={handleLoader()}
                            onClick={handleSubmit}
                          />
                        </div>
                      ) : (
                        <div className="p-1 cursor-pointer">
                          <Button
                            label="Edit"
                            outlined
                            size="xs"
                            onClick={() => editForm(item)}
                            hidden={!showSubmitAndBlock}
                          />
                        </div>
                      )}
                    </>
                  ))}
              </div>
              <div className="py-3 px-5">
                {isEdit ? (
                  <>
                    <div
                      className={`mb-4 ${!item.titleContent ? 'hidden' : ''}`}
                    >
                      <p className="text-xxs text-grey-medium mb-4 ">
                        {item.titleContent}
                      </p>
                    </div>
                    <div>
                      <FormBuilder
                        data={[
                          {
                            name: item.name,
                            placeholder: item.placeholder,
                            type: item.input,
                            required: item.required,
                            disabled: item.disabled,
                          },
                        ]}
                        // edit={isEdit && item.itemKey == subSectionKey}
                        edit={
                          item.itemKey
                            ? item.itemKey === subSectionKey && isEdit
                            : isEdit
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p
                      className={`text-xxs text-grey-medium mb-4 ${!item.titleContent ? 'hidden' : ''}`}
                    >
                      {item.titleContent}
                    </p>

                    <div>
                      <FormBuilder
                        data={[
                          {
                            name: item.name,
                            placeholder: item.placeholder,
                            type: item.input,
                            required: item.required,
                            disabled: item.disabled,
                          },
                        ]}
                        // edit={isEdit && item.itemKey == subSectionKey}
                        edit={
                          item.itemKey
                            ? item.itemKey === subSectionKey && isEdit
                            : isEdit
                        }
                      />
                    </div>
                  </>
                )}

                {item.child?.map((children, indexKey) => (
                  <>
                    {children?.hidden ? (
                      ''
                    ) : (
                      <div key={indexKey} className="mb-5">
                        {children.parallelFields ? (
                          <div className="flex flex-col justify-center gap-1">
                            <div className="flex gap-4 items-start">
                              <div className=" flex-1 w-full shrink-0">
                                <div className="flex justify-between items-center gap-4">
                                  <h4
                                    className={`text-xxs text-blackAlt font-medium mb-1 ${!children.startSubTitle ? 'hidden' : ''}`}
                                  >
                                    {children.startSubTitle}
                                  </h4>
                                  <span
                                    className={`font-small font-medium text-grey-mediumAlt ${children.hideRequireStatus && 'hidden'}`}
                                  >
                                    {children.required
                                      ? 'Required'
                                      : 'Optional'}
                                  </span>
                                </div>
                                <p
                                  className={`text-xxs text-grey-medium mb-2 ${!children.startSubContent ? 'hidden' : ''}`}
                                >
                                  {children.startSubContent}
                                </p>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center gap-4 ">
                                  <h4
                                    className={`text-xxs text-blackAlt font-medium mb-1 ${!children.endSubtitle ? 'hidden' : ''}`}
                                  >
                                    {children.endSubtitle}
                                  </h4>
                                  <span
                                    className={`font-small font-medium text-grey-mediumAlt ${children.hideRequireStatus && 'hidden'}`}
                                  >
                                    {children.required
                                      ? 'Required'
                                      : 'Optional'}
                                  </span>
                                </div>
                                <p
                                  className={`text-xxs text-grey-medium mb-2 ${!children.endSubContent ? 'hidden' : ''}`}
                                >
                                  {children.endSubContent}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between w-full items-start gap-4">
                            <h4
                              className={`text-xxs text-blackAlt font-medium mb-1 ${!children.subtitle ? 'hidden' : ''}`}
                            >
                              {children.subtitle}
                            </h4>
                            <span
                              className={`font-small font-medium  text-grey-mediumAlt ${children.hideRequireStatus && 'hidden'}`}
                            >
                              {children.required ? 'Required' : 'Optional'}
                            </span>
                          </div>
                        )}

                        <div
                          className={`text-xxs text-grey-medium mb-2 ${!children.subtitleContent ? 'hidden' : ''}`}
                          dangerouslySetInnerHTML={{
                            __html: children.subtitleContent,
                          }}
                        />

                        <div>
                          <FormBuilder
                            data={[
                              {
                                name: children.name,
                                placeholder: children.placeholder,
                                type: children.input,
                                required: children.required,
                                selectedFiles: children.selectedFiles,
                                supportedExtensions: ACCEPTED_IMAGE_TYPES,
                                data: children.data,
                                id: children.id,
                                getData: children.getData,
                                desc: children.desc,
                                descId: children.descId,
                                disabled: children.disabled,
                                wordCount: children.wordCount,
                                inputType: children.inputType,
                                subData: children.subData,
                                subName: children.subName,
                                subId: children.subId,
                                startPlaceholder: children.startPlaceholder,
                                endPlaceholder: children.endPlaceholder,
                                maxLength:
                                  children.wordCount === undefined &&
                                  selectedItem !== 'overview'
                                    ? 200
                                    : undefined,
                                hidden: children.hidden,
                                hide: children.hide,
                                minDate: children.minDate,
                                maxDate: children.maxDate,
                                hideRequired: children.hiddenrequire,
                                initialLoad: children.initialLoad,
                              },
                            ]}
                            // edit={isEdit && item.itemKey == subSectionKey}
                            edit={
                              item.itemKey
                                ? item.itemKey === subSectionKey && isEdit
                                : isEdit
                            }
                          />
                        </div>

                        <span
                          className={`font-small font-medium leading-none block mt-1 mb-3  text-grey-mediumAlt ${!children.lastUpdate && 'hidden'}`}
                        >
                          {children.lastUpdate}
                        </span>
                      </div>
                    )}
                  </>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </>
  )
}

export default FormCard
