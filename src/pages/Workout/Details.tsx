import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { getWorkoutDetails } from './api'

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await getWorkoutDetails(String(id))
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.response?.data?.message || 'Failed to load user')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    if (id) run()
    return () => {
      mounted = false
    }
  }, [id])

  const workout = data?.workout || data || {}

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/workout')} aria-label="Back">
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">Workout Details</h1>
        </div>
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
          <DetailItem label="Name" value={workout?.name} />
          <DetailItem
            label="Description"
            value={
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{
                  __html: workout?.description || '',
                }}
              />
            }
          />
          <DetailItem
            label="Intensity Level"
            value={workout?.intensity_level}
          />
          {/* <DetailItem label="Feedback Count" value={workout?.feedbacks_count} /> */}
          <DetailItem label="Duration" value={workout?.duration_minutes} />
          <DetailItem
            label="Thumbnail"
            value={
              workout?.thumbnail_url ? (
                <div className="w-[120px] h-[120px] overflow-hidden rounded-md border bg-gray-50">
                  <img
                    className="w-full h-full object-cover"
                    src={workout.thumbnail_url}
                    alt="Workout thumbnail"
                  />
                </div>
              ) : (
                <span>--</span>
              )
            }
          />

          {!loading &&
            !error &&
            (() => {
              const raw = workout?.video_url
              const v = typeof raw === 'string' ? raw.trim() : ''
              const isUrl = typeof v === 'string' && /^https?:\/\/\S+$/i.test(v)
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
