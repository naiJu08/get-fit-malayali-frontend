import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { getWorkoutDetails } from './api'
import CreateWorkout from './create'

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [editModalOpen, setEditModalOpen] = useState(false)

  const loadWorkout = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await getWorkoutDetails(String(id))
      setData(res)
      setError('')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadWorkout()
  }, [loadWorkout])

  const workout = data?.workout || data || {}
  const { categoryName, subcategoryName } = React.useMemo(() => {
    const categoryData = workout?.category
    const mainCategoryName =
      typeof categoryData?.main_category?.name === 'string'
        ? categoryData.main_category.name
        : undefined
    const parentCategoryName =
      typeof categoryData?.parent?.name === 'string'
        ? categoryData.parent.name
        : undefined
    const categoryNameDerived =
      mainCategoryName ??
      parentCategoryName ??
      (typeof categoryData?.name === 'string' ? categoryData.name : undefined)

    const explicitSubcategory =
      (typeof workout?.subcategory?.name === 'string'
        ? workout?.subcategory?.name
        : undefined) ??
      (typeof workout?.subcategory_name === 'string'
        ? workout?.subcategory_name
        : undefined) ??
      (typeof workout?.subcategory === 'string'
        ? workout?.subcategory
        : undefined)

    const subcategoryNameDerived =
      explicitSubcategory ??
      (mainCategoryName && typeof categoryData?.name === 'string'
        ? categoryData.name
        : undefined)

    return {
      categoryName: categoryNameDerived,
      subcategoryName: subcategoryNameDerived,
    }
  }, [workout])

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/workout')} aria-label="Back">
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold">Workout Details</h1>
          </div>
          {workout?.id && (
            <button
              type="button"
              className="inline-flex items-center rounded-lg bg-primaryGreen text-white px-4 py-2 text-sm font-medium hover:bg-primaryGreen/90 focus:outline-none focus:ring-2 focus:ring-primaryGreen/50"
              onClick={() => setEditModalOpen(true)}
            >
              <Icons name="edit" />
              <span className="ml-2">Edit Workout</span>
            </button>
          )}
        </div>

        {loading && (
          <div className="p-6">
            <InfoBox content="Loading user details..." />
          </div>
        )}
        {error && !loading && (
          <div className="p-6">
            <InfoBox content={error} />
          </div>
        )}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Name" value={capitalizeFirst(workout?.name)} />
            <DetailItem label="Description" value={workout?.description} />
            <DetailItem
              label="Intensity Level"
              value={workout?.intensity_level}
            />
            <DetailItem label="Category" value={categoryName} />
            <DetailItem label="Subcategory" value={subcategoryName} />
            <DetailItem label="Duration" value={workout?.duration_minutes} />
            {(() => {
              const raw = workout?.thumbnail_url
              const t = typeof raw === 'string' ? raw.trim() : ''
              const isUrl = typeof t === 'string' && /^https?:\/\/\S+$/i.test(t)
              if (!isUrl) return null

              return (
                <div className="">
                  <div className="border rounded-lg p-3 bg-white">
                    <div className="text-xs text-gray-500 mb-2">Thumbnail</div>

                    <div className="relative w-64">
                      <img
                        src={t}
                        alt="Yoga thumbnail"
                        className="w-[7.25rem] h-[7.25rem] object-cover rounded"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).style.display =
                            'none'
                        }}
                      />

                      <div className="mt-2 text-xs">
                        <a
                          href={t}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Open thumbnail
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
            {!loading &&
              !error &&
              (() => {
                const raw = workout?.video_url
                const v = typeof raw === 'string' ? raw.trim() : ''
                const isUrl =
                  typeof v === 'string' && /^https?:\/\/\S+$/i.test(v)
                if (!isUrl) return null

                const ytMatch = v.match(
                  /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
                )
                const vimeoMatch = v.match(/vimeo\.com\/(?:video\/)?(\d+)/)
                const gDriveMatch = v.match(
                  /drive\.google\.com\/file\/d\/([^/]+)/
                )
                const dropboxMatch = v.match(/dropbox\.com\/s\/([^?]+)/)

                const driveEmbed = gDriveMatch
                  ? `https://drive.google.com/file/d/${gDriveMatch[1]}/preview`
                  : null
                const dropboxRaw = dropboxMatch
                  ? `https://dl.dropboxusercontent.com/s/${dropboxMatch[1]}`
                  : null

                return (
                  <div className="">
                    <div className="border rounded-lg p-3 bg-white ">
                      <div className="text-xs text-gray-500 mb-2">Video</div>
                      <div className="relative w-64">
                        {ytMatch ? (
                          <div className="w-full aspect-video">
                            <iframe
                              className="w-full h-full rounded"
                              src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : vimeoMatch ? (
                          <div className="w-full aspect-video">
                            <iframe
                              className="w-full h-full rounded"
                              src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : gDriveMatch ? (
                          <div className="w-full aspect-video">
                            <iframe
                              className="w-full h-full rounded"
                              src={driveEmbed as string}
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <>
                            <video
                              className="w-64 rounded"
                              controls
                              muted
                              playsInline
                              src={dropboxRaw || v}
                              onError={() => {
                                /* Silent error: we still show the link below */
                              }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
          </div>
        )}

        {/* Video preview below all detail items */}
      </div>

      <CreateWorkout
        isDrawerOpen={editModalOpen}
        handleClose={() => setEditModalOpen(false)}
        handleRefresh={() => loadWorkout()}
        edit
        rowData={workout}
      />
    </>
  )
}

function DetailItem({ label, value }: { label: string; value: any }) {
  const isUrl = typeof value === 'string' && /^https?:\/\/\S+$/i.test(value)
  const content = React.isValidElement(value) ? (
    value
  ) : isUrl ? (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#2563eb' }}
    >
      {value}
    </a>
  ) : (
    <>{safeStr(value)}</>
  )

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">{content}</div>
    </div>
  )
}

function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}

function capitalizeFirst(v: any) {
  const s = safeStr(v)
  if (s === '--') return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}
