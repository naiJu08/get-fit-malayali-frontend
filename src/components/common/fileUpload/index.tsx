import React, { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { FileUploadProps } from '../../../common/types'
import { isValidFile } from '../../../utilities/commonUtilities'
import InfoBox from '../../app/alertBox/infoBox'
import Icons from '../icons'
import DialogModal from '../modal/DialogModal'
import { useSnackbarManager } from '../snackbar'

const FileUpload: React.FC<FileUploadProps> = ({
  name,
  id,
  label,
  fullwidth = true,
  type = 'file',
  disabled = false,
  required = false,
  isMultiple = false,
  errors,
  value,
  onChange,
  supportedFiles,
  sizeLimit,
  buttonLabel,
  supportedExtensions,
  iconName,
  handleDeleteFile,
  needConfirmation,
  setAttachmentName,
  accept = '*',
  subName,
}) => {
  const getErrors = (err: any) => {
    let errMsg = ''
    if (err.message) {
      errMsg = err?.message
    }
    return errMsg
  }
  const [file, setFile] = useState<any>(value)
  const [deleteModal, setDeleteModal] = useState(false)
  const [item, setItem] = useState<any>([])
  const { enqueueSnackbar } = useSnackbarManager()
  const handleClearFile = (indexToRemove?: number, item?: any) => {
    if (isMultiple) {
      const newFiles = file.filter(
        (_: any, ind: number) => indexToRemove !== ind
      )
      setFile(newFiles)
    } else if (item?.link) {
      if (needConfirmation === true) {
        setDeleteModal(true)
        setItem(item)
        setAttachmentName?.('')
      } else {
        handleDeleteFile?.(item)
        onChange?.('')
        setFile('')
        setAttachmentName?.('')
      }
    } else {
      onChange?.('')
      setFile('')
      setAttachmentName?.('')
    }
  }
  const handleFileChange = (e: any) => {
    if (e.target.files.length) {
      let isValid = true
      if (supportedFiles?.length) {
        isValid = isValidFile(e?.target?.files[0].type, supportedExtensions)
      } else {
        isValid = true
      }
      if (isValid) {
        if (isMultiple) {
          const files = e.target.files
          const existingFiles = file ?? []
          const filesArray = Array.from(files)

          setFile([...existingFiles, ...filesArray])
        } else {
          if (e?.target?.files[0].size < 5250000) {
            onChange?.(e)
            setFile(e?.target?.files[0])
            setAttachmentName?.(e?.target?.files[0]?.name)
          } else {
            enqueueSnackbar('Maximum file size 5mb', { variant: 'error' })
            setFile('')
          }
        }
      } else {
        enqueueSnackbar('Invalid file type', { variant: 'error' })
      }
    }
  }
  useEffect(() => {
    if (isMultiple) {
      onChange?.(file)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  // keep internal state in sync with external value for single-file mode
  useEffect(() => {
    if (!isMultiple) {
      setFile(value)
    }
  }, [isMultiple, value])
  const handleDeleteConfirmation = () => {
    handleDeleteFile?.(item)
    setFile('')
    setDeleteModal(false)
  }
  const { watch } = useFormContext()

  return (
    <>
      <DialogModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title={'Are you sure?'}
        onSubmit={() => handleDeleteConfirmation()}
        secondaryAction={() => setDeleteModal(false)}
        secondaryActionLabel="No, Cancel"
        actionLabel="Yes, I am"
        body={
          <InfoBox
            content={
              'Deleting this item is an irreversible action. Are you sure you want to proceed with the deletion?'
            }
          />
        }
      />
      <div className={`customFileUpload ${fullwidth ? 'w-full' : 'w-auto'}`}>
        {label && (
          <div className="flex justify-between items-center">
            <label className={`labels label-text`}>
              {label}
              {required ? <span className="text-error"> *</span> : <></>}
            </label>
          </div>
        )}
        <div
          className={`customFileUpload-field relative flex flex-col items-center  border-dashed border border-formBorder rounded-lg ${disabled ? 'bg-cardWrapperBg' : 'bg-bgGrey'}`}
        >
          <input
            id={id}
            disabled={disabled}
            multiple={isMultiple}
            onChange={handleFileChange}
            // value={value}
            type={type}
            accept={accept}
          />
          <label
            className={`flex flex-col items-center justify-center gap-2  p-4 w-full min-h-[120px] ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} `}
            htmlFor={id}
          >
            {/* <Icons name="question-circle" /> */}
            <p
              className={` text-xxs leading-4  ${disabled ? 'text-input-disabled' : 'text-primaryText'}`}
            >
              {supportedFiles}
              <span
                className={`text-primary text-xxs leading-4 ${disabled && 'opacity-60'}`}
              >
                (Max {sizeLimit} MB)
              </span>
            </p>
            {/* <p className="text-[#999696] font-bold text-sm">Drag and Drop</p>
          <p className="text-secondary font-bold text-sm uppercase">Or</p> */}
            <div
              className={`relative   rounded-[4px] shadow-buttonShadow   btn text-sm p-1.5 min-w-[65px] btn-primary ${disabled && 'opacity-30'}`}
            >
              <div className="flex items-center justify-center gap-1  m-auto ">
                <Icons className="iconWhite" name={`${iconName}`} />
                <div className="  font-medium  text-bgWhite text-xxs ">
                  {buttonLabel}
                </div>
              </div>
            </div>
          </label>
        </div>
        {errors && errors[name] && (
          <div className="text-error text-error-label mt-[1px]">
            {getErrors(errors[name])}
          </div>
        )}
        <div className="flex flex-col gap-2 mt-4">
          {Array.isArray(file) &&
            file?.map((item, index: number) => (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-1.5 px-2.5 py-2 bg-cardWrapperBg rounded-sm ${disabled ? 'bg-cardWrapperBg' : 'bg-cardWrapperBg'}`}
              >
                <Icons
                  name="paper-clip"
                  className={`iconWidthSm iconBlack ${disabled && 'opacity-30'}`}
                />
                <p className="flex-1 text-primaryText text-sm font-medium break-all">
                  {item?.name}
                </p>
                <Icons
                  onClick={() => handleClearFile(index)}
                  name="close"
                  className={`iconBlack iconWidthSm`}
                />
              </div>
            ))}
          {((typeof file === 'object' && file) || watch(subName)) &&
            !isMultiple && (
              <div
                className={`flex items-center justify-between gap-1.5 px-2.5 py-2  rounded-sm  ${disabled ? 'bg-cardWrapperBg' : 'bg-cardWrapperBg'}`}
              >
                <Icons
                  name="paper-clip"
                  className={`iconWidthSm ${disabled && 'text-disabledText stroke-disabledText '}`}
                />
                <a
                  href="#/"
                  onClick={() =>
                    typeof file === 'object' && file?.link
                      ? window.open(file.link)
                      : watch(name)
                        ? window.open(watch(name))
                        : ''
                  }
                  className={`flex-1 text-sm font-medium overflow-hidden break-all ${disabled ? 'text-disabledText  cursor-not-allowed' : 'text-primaryText'}`}
                >
                  {file?.name ?? watch(subName)}
                </a>
                {!disabled && handleDeleteFile ? (
                  <Icons
                    name="close"
                    onClick={() => handleClearFile(0, file)}
                    className="iconBlack iconWidthSm cursor-pointer"
                  />
                ) : (
                  ''
                )}
              </div>
            )}
          {/* {typeof file === 'object' && file && !isMultiple && (
            <div className="flex items-center justify-between gap-1.5 px-2.5 py-2 bg-cardWrapperBg rounded-sm">
              <Icons name="paper-clip" className="iconWidthSm iconBlack" />
              <a
                href="#/"
                onClick={() => (file?.link ? window.open(file.link) : '')}
                className="flex-1 text-primaryText text-sm font-medium overflow-hidden cursor-pointer break-all"
              >
                {console.log('file?.name', file?.name)}
                {file?.name ?? watch(subName)}
              </a>
              {!disabled ? (
                <Icons
                  name="close"
                  onClick={() => handleClearFile(0, file)}
                  className="iconBlack iconWidthSm cursor-pointer"
                />
              ) : (
                ''
              )}
            </div>
          )} */}
        </div>
      </div>
    </>
  )
}

export default FileUpload
