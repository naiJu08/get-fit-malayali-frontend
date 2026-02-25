import React, { useEffect, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { FileUploadProps } from '../../../common/types'
import {
  getFileNameFromUrl,
  isValidFile,
} from '../../../utilities/commonUtilities'
import InfoBox from '../../app/alertBox/infoBox'
import Icons from '../icons'
import DialogModal from '../modal/DialogModal'
import { useSnackbarManager } from '../snackbar'

const FileUpload: React.FC<FileUploadProps> = ({
  name,
  id,
  label,
  labelAddon,
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
  aspectRatio,
  requiredWidth,
  requiredHeight,
  dimensionLabel,
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
  const { setValue, watch } = useFormContext()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const resetInputValue = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleClearFile = (indexToRemove?: number, item?: any) => {
    if (isMultiple) {
      const newFiles = file.filter(
        (_: any, ind: number) => indexToRemove !== ind
      )
      setFile(newFiles)
      if (newFiles.length === 0) {
        resetInputValue()
      }
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
        // Clear both name and subName fields in react-hook-form
        setValue(name, '', { shouldValidate: false })
        if (subName) {
          setValue(subName, '', { shouldValidate: false })
        }
        resetInputValue()
      }
    } else {
      onChange?.('')
      setFile('')
      setAttachmentName?.('')
      // Clear both name and subName fields in react-hook-form
      setValue(name, '', { shouldValidate: false })
      if (subName) {
        setValue(subName, '', { shouldValidate: false })
      }
      resetInputValue()
    }
  }
  const getImageDimensions = (file: File) => {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.onerror = reject
        img.src = event?.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const validateImageDimensions = async (file: File) => {
    if (!file || !file.type?.startsWith('image/')) return true
    if (!aspectRatio && !requiredWidth && !requiredHeight) return true

    try {
      const { width, height } = await getImageDimensions(file)

      if (requiredWidth && width !== requiredWidth) {
        enqueueSnackbar(
          `Image must be ${requiredWidth}px wide. Uploaded width is ${width}px.`,
          { variant: 'error' }
        )
        return false
      }

      if (requiredHeight && height !== requiredHeight) {
        enqueueSnackbar(
          `Image must be ${requiredHeight}px tall. Uploaded height is ${height}px.`,
          { variant: 'error' }
        )
        return false
      }

      if (aspectRatio) {
        const expected = aspectRatio.width / aspectRatio.height
        const actual = width / height
        const tolerance = 0.01
        if (Math.abs(actual - expected) > tolerance) {
          const label =
            dimensionLabel ||
            `Aspect ratio ${aspectRatio.width}:${aspectRatio.height}`
          enqueueSnackbar(
            `Image must follow ${label}. Uploaded image is ${width}x${height}px.`,
            { variant: 'error' }
          )
          return false
        }
      }

      return true
    } catch (error) {
      enqueueSnackbar('Unable to validate image dimensions.', {
        variant: 'error',
      })
      return false
    }
  }

  const handleFileChange = async (e: any) => {
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
          const selectedFile = e?.target?.files[0]
          if (selectedFile.size < 5250000) {
            const dimensionsValid = await validateImageDimensions(selectedFile)
            if (!dimensionsValid) {
              e.target.value = ''
              setFile('')
              setAttachmentName?.('')
              return
            }
            onChange?.(e)
            setFile(selectedFile)
            setAttachmentName?.(selectedFile?.name)
            e.target.value = ''
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
    onChange?.('')
    setFile('')
    setAttachmentName?.('')
    // Clear both name and subName fields in react-hook-form
    setValue(name, '', { shouldValidate: false })
    if (subName) {
      setValue(subName, '', { shouldValidate: false })
    }
    setDeleteModal(false)
    resetInputValue()
  }
  const getSingleFileLabel = () => {
    if (isMultiple) return ''

    if (typeof file === 'object' && file) {
      return file?.name ?? (subName ? watch(subName) : '')
    }

    if (typeof file === 'string' && file) {
      const trimmed = file.trim()
      if (!trimmed) return ''

      try {
        return getFileNameFromUrl(trimmed)
      } catch (error) {
        const segments = trimmed.split('?')[0]?.split('/') ?? []
        return segments.pop() || trimmed
      }
    }

    if (subName) {
      const subValue = watch(subName)
      if (typeof subValue === 'string') {
        return subValue
      }
    }

    return ''
  }

  const singleFileLabel = getSingleFileLabel()
  const handleFilePreview = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const isBrowserFile = (input: unknown): input is File =>
      typeof File !== 'undefined' && input instanceof File

    let previewUrl = ''
    let cleanup: (() => void) | undefined

    if (file && typeof file === 'object') {
      if (file?.link) {
        previewUrl = file.link
      } else if (isBrowserFile(file)) {
        previewUrl = URL.createObjectURL(file)
        cleanup = () => URL.revokeObjectURL(previewUrl)
      }
    }

    if (!previewUrl) {
      const watchedValue = watch(name) || (subName ? watch(subName) : '')
      if (typeof watchedValue === 'string') {
        previewUrl = watchedValue
      }
    }

    if (!previewUrl) return

    const opened = window.open(previewUrl, '_blank', 'noopener')
    if (opened) {
      opened.opener = null
    }

    if (cleanup) {
      setTimeout(cleanup, 1000)
    }
  }

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
        {(label || labelAddon) && (
          <div className="flex justify-between items-center gap-4">
            {label && (
              <label className={`labels label-text`}>
                {label}
                {required ? <span className="text-error"> *</span> : <></>}
              </label>
            )}
            {labelAddon ? (
              <div className="text-xs text-primaryText whitespace-nowrap">
                {labelAddon}
              </div>
            ) : null}
          </div>
        )}
        <div
          className={`customFileUpload-field relative flex flex-col items-center  border-dashed border border-formBorder rounded-lg ${disabled ? 'bg-cardWrapperBg' : 'bg-bgGrey'}`}
        >
          <input
            id={id}
            ref={inputRef}
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
        {(dimensionLabel ||
          aspectRatio ||
          (requiredWidth && requiredHeight)) && (
          <p className="text-xxs text-gray-500 mt-1">
            {dimensionLabel ||
              `Recommended: ${aspectRatio ? `${aspectRatio.width}:${aspectRatio.height}` : ''} ${requiredWidth && requiredHeight ? `(${requiredWidth}x${requiredHeight}px)` : ''}`}
          </p>
        )}
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
          {singleFileLabel && !isMultiple && (
            <div
              className={`flex items-center justify-between gap-1.5 px-2.5 py-2  rounded-sm  ${disabled ? 'bg-cardWrapperBg' : 'bg-cardWrapperBg'}`}
            >
              <Icons
                name="paper-clip"
                className={`iconWidthSm ${disabled && 'text-disabledText stroke-disabledText '}`}
              />
              <a
                href="#/"
                onClick={handleFilePreview}
                className={`flex-1 text-sm font-medium overflow-hidden break-all ${disabled ? 'text-disabledText  cursor-not-allowed' : 'text-primaryText'}`}
              >
                {singleFileLabel}
              </a>
              {!disabled && (
                <Icons
                  name="close"
                  onClick={() => handleClearFile(0, file)}
                  className="iconBlack iconWidthSm cursor-pointer"
                />
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
