import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { getMeditationDetails } from './api'

export default function MeditationDetails() {
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
        const res = await getMeditationDetails(String(id))
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

  const meditation = data?.meditation || data || {}

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/meditation')} aria-label="Back">
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">Meditation Details</h1>
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
          <DetailItem label="Name" value={meditation?.title} />
          <DetailItem
            label="Description"
            value={meditation?.description || meditation?.description}
          />
          <DetailItem label="Duration" value={meditation?.duration_minutes} />
          {!loading &&
            !error &&
            (() => {
              const raw = meditation?.video_url
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
  return (
    <div className="border rounded-lg p-3 bg-white ">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">
        {isUrl ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2563eb' }}
          >
            {value}
          </a>
        ) : (
          safeStr(value)
        )}
      </div>
    </div>
  )
}

function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
