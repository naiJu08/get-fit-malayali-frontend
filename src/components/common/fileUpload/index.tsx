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
  bottomAddon,
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
  const [isDragging, setIsDragging] = useState(false)
  const { enqueueSnackbar } = useSnackbarManager()
  const { setValue, watch } = useFormContext()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles && droppedFiles.length > 0) {
      if (inputRef.current) {
        try {
          inputRef.current.files = droppedFiles
        } catch (err) {
          // ignore
        }
      }
      handleFileChange({ target: { files: droppedFiles, value: '' } })
    }
  }

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
          const maxFileSizeInBytes =
            sizeLimit && sizeLimit > 0 ? sizeLimit * 1024 * 1024 : null

          if (!maxFileSizeInBytes || selectedFile.size < maxFileSizeInBytes) {
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
            enqueueSnackbar(`Maximum file size ${sizeLimit}mb`, {
              variant: 'error',
            })
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
          <div className="flex justify-between items-center gap-4 mb-1.5">
            {label && (
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                {label}
                {required ? <span className="text-red-500">*</span> : null}
              </label>
            )}
            {labelAddon ? (
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {labelAddon}
              </div>
            ) : null}
          </div>
        )}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`customFileUpload-field relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl transition-all duration-200 p-8 text-center ${
            disabled
              ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
              : isDragging
                ? 'bg-blue-100/70 border-blue-500 scale-[1.01] shadow-lg cursor-pointer'
                : 'bg-gradient-to-b from-[#F5FAFF] via-[#EEF5FE] to-[#F5FAFF] border-[#BFDBFE] hover:border-[#93C5FD] cursor-pointer group'
          }`}
        >
          <input
            id={id}
            ref={inputRef}
            disabled={disabled}
            multiple={isMultiple}
            onChange={handleFileChange}
            type={type}
            accept={accept}
          />
          <label
            className={`flex flex-col items-center justify-center w-full ${
              disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
            htmlFor={id}
          >
            {/* Top Soft Blue Icon Circle with Spark accents */}
            <div className="relative mb-3">
              {/* Decorative spark accent left */}
              <svg
                className="w-3.5 h-3.5 text-blue-400 absolute -left-4 top-2 opacity-70 group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
              {/* Decorative spark accent right */}
              <svg
                className="w-3.5 h-3.5 text-blue-400 absolute -right-4 top-2 opacity-70 group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>

              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-200 shadow-xs ${
                  disabled
                    ? 'bg-gray-100 text-gray-400'
                    : isDragging
                      ? 'bg-blue-600 text-white scale-110'
                      : 'bg-[#DBEAFE] text-[#2563EB] group-hover:scale-105'
                }`}
              >
                <Icons
                  className={`w-7 h-7 ${isDragging ? 'text-white' : 'text-[#2563EB]'}`}
                  name={iconName || 'cloud-upload'}
                />
              </div>
            </div>

            {/* Title & Subtitle */}
            <h4 className="text-base font-bold text-[#1E293B] tracking-tight mb-1">
              Upload {label ? label.replace(/\s*\*/g, '') : 'File'}
            </h4>
            <p className="text-xs text-[#64748B] font-normal mb-4">
              Drag & drop your{' '}
              {accept?.includes('video') ||
              label?.toLowerCase().includes('video')
                ? 'video'
                : accept?.includes('image') ||
                    label?.toLowerCase().includes('image')
                  ? 'image'
                  : 'file'}{' '}
              here, or browse to choose a file
            </p>

            {/* Vibrant Blue Action Button */}
            <div
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all mb-4 group-hover:bg-[#1D4ED8] ${
                disabled
                  ? 'opacity-40 cursor-not-allowed pointer-events-none'
                  : ''
              }`}
            >
              <Icons
                className="w-4 h-4 text-white"
                name={iconName || 'cloud-upload'}
              />
              <span>
                {buttonLabel && buttonLabel !== 'Browse & Upload'
                  ? buttonLabel
                  : 'Choose File'}
              </span>
            </div>

            {/* Format & Size Limit Specs Footer */}
            {(supportedFiles || sizeLimit) && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#64748B]">
                <svg
                  className="w-4 h-4 text-[#64748B] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>{supportedFiles}</span>
                {sizeLimit && sizeLimit > 0 ? (
                  <span className="text-[#94A3B8]">· Max {sizeLimit} MB</span>
                ) : null}
              </div>
            )}
          </label>
        </div>

        {(dimensionLabel ||
          aspectRatio ||
          (requiredWidth && requiredHeight)) && (
          <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
            <span>
              {dimensionLabel ||
                `Recommended size: ${
                  aspectRatio
                    ? `${aspectRatio.width}:${aspectRatio.height}`
                    : ''
                } ${
                  requiredWidth && requiredHeight
                    ? `(${requiredWidth}x${requiredHeight}px)`
                    : ''
                }`}
            </span>
          </p>
        )}

        {errors && errors[name] && (
          <div className="text-xs text-red-500 font-medium mt-1">
            {getErrors(errors[name])}
          </div>
        )}

        {/* Selected File / File List Preview */}
        <div className="flex flex-col gap-2 mt-3">
          {Array.isArray(file) &&
            file?.map((item, index: number) => (
              <div
                key={item.id || index}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Icons
                    name="paper-clip"
                    className="w-4 h-4 text-gray-500 flex-shrink-0"
                  />
                  <span className="font-medium text-gray-800 truncate">
                    {item?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleClearFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                  title="Remove file"
                >
                  <Icons name="close" className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

          {singleFileLabel && !isMultiple && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-blue-50/70 border border-blue-200 rounded-lg text-xs">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Icons
                  name="paper-clip"
                  className="w-4 h-4 text-blue-600 flex-shrink-0"
                />
                <a
                  href="#/"
                  onClick={handleFilePreview}
                  className="font-medium text-blue-700 hover:underline truncate"
                  title="Click to preview file"
                >
                  {singleFileLabel}
                </a>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleClearFile(0, file)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                  title="Remove file"
                >
                  <Icons name="close" className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        {bottomAddon && (
          <div className="mt-2 text-sm text-primaryText">{bottomAddon}</div>
        )}
      </div>
    </>
  )
}

export default FileUpload
