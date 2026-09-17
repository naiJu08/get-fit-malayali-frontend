import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import {
  getData,
  postFormData,
  patchFormData,
  deleteData,
} from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import ListingHeader from '../../components/common/ListingTiles'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage } from '../../utilities/parsers'
import { compressVideo, resetFfmpeg } from '../Workout/create'

export default function DiastasisRecti() {
  const { enqueueSnackbar } = useSnackbarManager()

  const [item, setItem] = useState<any>(null)
  const [description, setDescription] = useState('')
  const [video, setVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isCompressingVideo, setIsCompressingVideo] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState<number | null>(
    null
  )
  const [compressedFile, setCompressedFile] = useState<File | null>(null)
  const compressionCancelledRef = useRef(false)
  const [isEditing, setIsEditing] = useState(false)

  const loadContent = async () => {
    try {
      setInitialLoading(true)
      const res: any = await getData(apiUrl.DIASTASIS_RECTI_CONTENTS)
      const content = res?.diastasis_recti_contents?.[0] || null
      setItem(content)
      setDescription(content?.description || '')
    } catch (err: any) {
      enqueueSnackbar(
        getErrorMessage(err) || 'Failed to load Diastasis Recti content',
        { variant: 'error' }
      )
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    loadContent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Create or clean up local preview URL when video file changes
  useEffect(() => {
    if (!video) {
      setVideoPreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(compressedFile || video)
    setVideoPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [video, compressedFile])

  const handleVideoCompression = useCallback(
    async (selectedFile: File) => {
      compressionCancelledRef.current = false
      setIsCompressingVideo(true)
      setCompressionProgress(0)
      setCompressedFile(null)

      try {
        const compressed = await compressVideo(
          selectedFile,
          setCompressionProgress
        )
        if (!compressionCancelledRef.current) {
          setCompressedFile(compressed)
        }
        return compressed
      } catch {
        if (!compressionCancelledRef.current) {
          enqueueSnackbar(
            'Video compression failed. Please try another video.',
            {
              variant: 'error',
            }
          )
        }
        return null
      } finally {
        setIsCompressingVideo(false)
        compressionCancelledRef.current = false
      }
    },
    [enqueueSnackbar]
  )

  const handleVideoFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      enqueueSnackbar('Please select a valid video file (MP4, WebM, MOV)', {
        variant: 'error',
      })
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      enqueueSnackbar('Video file size exceeds 100MB limit', {
        variant: 'error',
      })
      return
    }
    setVideo(file)
    await handleVideoCompression(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleVideoFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleVideoFile(file)
    }
  }

  const handleReset = () => {
    if (isCompressingVideo) {
      compressionCancelledRef.current = true
      resetFfmpeg()
    }
    setDescription(item?.description || '')
    setVideo(null)
    setCompressedFile(null)
    setIsCompressingVideo(false)
    setCompressionProgress(null)
    setIsEditing(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      enqueueSnackbar('Please enter instructional description and guidelines', {
        variant: 'error',
      })
      return
    }

    if (isCompressingVideo) {
      enqueueSnackbar('Please wait for video compression to complete', {
        variant: 'warning',
      })
      return
    }

    setSaving(true)
    const fd = new FormData()
    fd.append('description', description.trim())
    if (compressedFile) {
      fd.append('video', compressedFile)
    } else if (video) {
      fd.append('video', video)
    }

    try {
      let res: any
      if (item?.id) {
        res = await patchFormData(
          `${apiUrl.DIASTASIS_RECTI_CONTENTS}/${item.id}`,
          fd
        )
      } else {
        res = await postFormData(apiUrl.DIASTASIS_RECTI_CONTENTS, fd)
      }

      const updated =
        res?.data?.diastasis_recti_content || res?.diastasis_recti_content
      setItem(updated)
      setDescription(updated?.description || description)
      setVideo(null)
      setCompressedFile(null)
      setCompressionProgress(null)
      setIsEditing(false)
      enqueueSnackbar(
        item?.id
          ? 'Diastasis Recti guidance updated successfully'
          : 'Diastasis Recti guidance published successfully',
        { variant: 'success' }
      )
    } catch (err: any) {
      enqueueSnackbar(
        getErrorMessage(err) || 'Failed to save Diastasis Recti guidance',
        { variant: 'error' }
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!item?.id) return
    setDeleting(true)
    try {
      await deleteData(`${apiUrl.DIASTASIS_RECTI_CONTENTS}/${item.id}`)
      setItem(null)
      setDescription('')
      setVideo(null)
      setCompressedFile(null)
      setCompressionProgress(null)
      setShowDeleteModal(false)
      enqueueSnackbar('Diastasis Recti guidance removed successfully', {
        variant: 'success',
      })
    } catch (err: any) {
      enqueueSnackbar(
        getErrorMessage(err) || 'Failed to delete Diastasis Recti guidance',
        { variant: 'error' }
      )
    } finally {
      setDeleting(false)
    }
  }

  const charCount = description.length
  const wordCount = useMemo(() => {
    const trimmed = description.trim()
    return trimmed ? trimmed.split(/\s+/).length : 0
  }, [description])

  const activeVideoSrc = videoPreview || item?.video_url
  const canEdit = !item || isEditing

  const formattedDate = useMemo(() => {
    if (!item?.updated_at) return null
    try {
      return new Date(item.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return null
    }
  }, [item?.updated_at])

  return (
    <div className="flex flex-col min-h-full bg-mainBgColor">
      {/* Standard Page Header */}
      <ListingHeader
        data={{ title: 'Diastasis Recti', icon: 'diastasis-icon' }}
        checkPermission={false}
        bulkChangeButton={
          <div className="flex items-center gap-2.5">
            {item ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active & Published
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Not Yet Published
              </span>
            )}
            {item && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Update</span>
              </button>
            )}
            {item && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                title="Delete this content"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Delete</span>
              </button>
            )}
          </div>
        }
      />

      {/* Core Content: Two-Column Layout */}
      <div className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
        {initialLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse">
              <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 animate-pulse">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-48 bg-slate-100 rounded-xl" />
              <div className="h-10 w-36 bg-slate-200 rounded-xl" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Compression Progress Banner */}
            {isCompressingVideo && (
              <div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-4 shadow-lg">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <svg
                      className="h-5 w-5 animate-pulse text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm">
                      Optimizing Video
                    </h3>
                    <p className="max-w-[280px] truncate text-xs text-gray-500">
                      {video?.name}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white shadow">
                    {compressionProgress ?? 0}%
                  </div>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${compressionProgress ?? 0}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-500">
                    {(compressionProgress ?? 0) < 30 && 'Preparing video...'}
                    {(compressionProgress ?? 0) >= 30 &&
                      (compressionProgress ?? 0) < 70 &&
                      'Compressing video...'}
                    {(compressionProgress ?? 0) >= 70 &&
                      (compressionProgress ?? 0) < 100 &&
                      'Finalizing output...'}
                    {(compressionProgress ?? 0) === 100 &&
                      'Compression complete'}
                  </span>
                  <span className="font-semibold text-blue-600">
                    Please wait
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Video */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-700">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Demonstration Video
                      </h3>
                      <p className="text-xs text-slate-500">
                        Educational video for self-assessment
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    MP4, WebM up to 100MB
                  </span>
                </div>

                <div className="p-5">
                  {activeVideoSrc ? (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-md">
                        <video
                          controls
                          className="w-full max-h-72 object-contain mx-auto bg-black"
                          src={activeVideoSrc}
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-900/80 text-white backdrop-blur-sm border border-white/10 shadow-sm">
                            {video ? (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                                New Selection
                              </>
                            ) : (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Active Video
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
                        <div className="flex items-center gap-2 text-slate-600 truncate">
                          <svg
                            className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {video ? (
                            <span className="truncate">
                              <span className="font-semibold text-slate-800">
                                {video.name}
                              </span>{' '}
                              ({(video.size / (1024 * 1024)).toFixed(1)} MB)
                            </span>
                          ) : (
                            <span>Video published and attached.</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                          {canEdit && (
                            <label className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer text-xs shadow-sm">
                              Replace
                              <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={handleFileChange}
                              />
                            </label>
                          )}
                          {video && !isCompressingVideo && (
                            <button
                              type="button"
                              onClick={() => {
                                setVideo(null)
                                setCompressedFile(null)
                                setCompressionProgress(null)
                              }}
                              className="px-2 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                        isDragging
                          ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                          : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 bg-slate-50/50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-200/80 flex items-center justify-center text-emerald-600 mb-3">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.75}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-semibold text-slate-700">
                          <span className="text-emerald-600">
                            Click to upload
                          </span>{' '}
                          or drag and drop
                        </p>
                        <p className="text-xs text-slate-400">
                          MP4, WebM, or MOV up to 100MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Right Column: Description & Details */}
              <div className="space-y-5">
                {/* Description Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-teal-100/70 text-teal-700">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          Instructional Description{' '}
                          <span className="text-rose-500">*</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Assessment protocol and exercise guidelines
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <textarea
                      required
                      rows={10}
                      disabled={!canEdit}
                      className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all leading-relaxed shadow-sm resize-y min-h-[200px] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                      placeholder="Provide structured guidance on Diastasis Recti assessment, proper breathing technique, and safe exercise practices..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-0.5">
                      <span>Markdown supported</span>
                      <span>
                        {wordCount} words &bull; {charCount} chars
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trainer Tip */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/70 to-teal-50/60 border border-emerald-100 flex items-start gap-2.5">
                  <div className="p-1 rounded-md bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-emerald-950">
                      Trainer Tip:
                    </span>{' '}
                    Always remind postpartum clients that gap closure is less
                    critical than functional tension and midline firmness along
                    the linea alba.
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-between">
                  <div>
                    {formattedDate && (
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Last updated {formattedDate}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 hover:bg-slate-300 rounded-xl transition-colors cursor-pointer"
                        disabled={saving || isCompressingVideo}
                      >
                        Cancel
                      </button>
                    )}
                    {!item &&
                      (description !== (item?.description || '') || video) && (
                        <button
                          type="button"
                          onClick={handleReset}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                          disabled={saving || isCompressingVideo}
                        >
                          Reset
                        </button>
                      )}
                    {canEdit && (
                      <button
                        disabled={
                          saving || isCompressingVideo || !description.trim()
                        }
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {saving ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span>
                              {item ? 'Update Guidance' : 'Publish Guidance'}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Diastasis Recti Guidance?"
        subTitle="This will permanently delete the active video demonstration and instructional guidelines. This process cannot be undone."
        confirmLabel="Yes, Delete Content"
        cancelLabel="Cancel"
      />
    </div>
  )
}
