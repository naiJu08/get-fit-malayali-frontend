import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { getMeditationDetails } from './api'
import CreateMeditation from './create'

export default function MeditationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [editModalOpen, setEditModalOpen] = useState(false)

  const loadMeditation = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await getMeditationDetails(String(id))
      setData(res)
      setError('')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadMeditation()
  }, [loadMeditation])

  const meditation = data?.meditation || data || {}

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/meditation')} aria-label="Back">
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold">Meditation Details</h1>
          </div>
          {meditation?.id && (
            <button
              type="button"
              className="inline-flex items-center rounded-lg bg-primaryGreen text-white px-4 py-2 text-sm font-medium hover:bg-primaryGreen/90 focus:outline-none focus:ring-2 focus:ring-primaryGreen/50"
              onClick={() => setEditModalOpen(true)}
            >
              <Icons name="edit" />
              <span className="ml-2">Edit Meditation</span>
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <DetailItem
                label="Name"
                value={capitalizeFirst(meditation?.title)}
              />
              <DetailItem
                label="Description"
                value={meditation?.description || meditation?.description}
              />
              <DetailItem
                label="Duration"
                value={meditation?.duration_minutes}
              />
              {(() => {
                const raw = meditation?.thumbnail_url
                const t = typeof raw === 'string' ? raw.trim() : ''
                const isUrl =
                  typeof t === 'string' && /^https?:\/\/\S+$/i.test(t)
                if (!isUrl) return null

                return (
                  <div className="">
                    <div className="border rounded-lg p-3 bg-white ">
                      <div className="text-xs text-gray-500 mb-2">
                        Thumbnail
                      </div>
                      <div className="relative w-64">
                        <img
                          src={t}
                          alt="Yoga thumbnail"
                          className="w-[7.25rem] h-[7.25rem] object-cover rounded"
                          onError={(e) => {
                            ;(
                              e.currentTarget as HTMLImageElement
                            ).style.display = 'none'
                          }}
                        />
                        <div className="mt-2 text-xs">
                          <a
                            href={t}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2563eb' }}
                          >
                            Open thumbnail
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </>
        )}

        {/* Video preview below all detail items */}
      </div>

      <CreateMeditation
        isDrawerOpen={editModalOpen}
        handleClose={() => setEditModalOpen(false)}
        handleRefresh={() => loadMeditation()}
        edit
        rowData={meditation}
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
    safeStr(value)
  )
  return (
    <div className="border rounded-lg p-3 bg-white ">
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

  return s
    .split(' ')
    .map(
      (word: string) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ')
}
