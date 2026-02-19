import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import CustomDrawer from '../../../../components/common/drawer'
import { useMeditationList } from '../../../Meditation/api'
import { useAssignMeditations } from './api'
import { useAuthStore } from '../../../../store/authStore'
import Icons from '../../../../components/common/icons'

export type MeditationAssignCTAConfig = {
  handler: () => void
  visible: boolean
}

type Props = {
  planName?: string
  registerAssignCTA?: (config: MeditationAssignCTAConfig | null) => void
}

export default function MeditationPlanIndex({
  planName,
  registerAssignCTA,
}: Props) {
  const { id: routePlanId } = useParams()
  const planId = routePlanId as string
  const [assignOpen, setAssignOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(20)
  const [search, setSearch] = useState<string>('')
  const [selectedMeditations, setSelectedMeditations] = useState<any[]>([])
  const [assigning, setAssigning] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [preventAutoSeed, setPreventAutoSeed] = useState(false)
  const { mutateAsync: assignMeditationsAsync } = useAssignMeditations()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'

  const {
    data: medResp,
    isFetching: medLoading,
    refetch: refetchMeditations,
  } = useMeditationList({
    page,
    per_page: perPage,
    search,
    // plan_id: planId,
  } as any)
  const isSelected = (id: any) =>
    selectedMeditations.some((m) => String(m?.id) === String(id))
  const toggleSelected = (m: any) => {
    setSelectedMeditations((prev) =>
      prev.some((x) => String(x?.id) === String(m?.id))
        ? prev.filter((x) => String(x?.id) !== String(m?.id))
        : [...prev, m]
    )
  }
  const meditations = medResp?.meditations ?? medResp?.items ?? []
  const allVisibleSelected =
    Array.isArray(meditations) &&
    meditations.length > 0 &&
    meditations.every((m: any) => isSelected(m?.id))
  const assignedMeditations = useMemo(() => {
    if (!Array.isArray(meditations) || !planId) return []
    const currentPlanId = String(planId)
    return meditations
      .map((m: any) => {
        const plans = (m?.assigned_plans || []) as any[]
        const match = plans.find(
          (p: any) => String(p?.plan_id) === currentPlanId
        )
        if (!match) return null
        return { ...m, sequence_number: match?.sequence_number }
      })
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          (a?.sequence_number ?? 0) - (b?.sequence_number ?? 0)
      )
  }, [meditations, planId])

  const handleSelectAllVisible = () => {
    if (!Array.isArray(meditations) || meditations.length === 0) return
    setSelectedMeditations((prev) => {
      const existingIds = new Set(prev.map((item) => String(item?.id)))
      const next = [...prev]
      meditations.forEach((m: any) => {
        const id = String(m?.id)
        if (!existingIds.has(id)) {
          existingIds.add(id)
          next.push(m)
        }
      })
      return next
    })
  }

  const handleUnselectVisible = () => {
    if (selectedMeditations.length === 0) return
    setPreventAutoSeed(true)
    setSelectedMeditations([])
  }

  useEffect(() => {
    if (!assignOpen) {
      setPreventAutoSeed(false)
      return
    }

    setDragIndex(null)
    setReviewOpen(false)

    if (
      !preventAutoSeed &&
      selectedMeditations.length === 0 &&
      assignedMeditations.length > 0
    ) {
      setSelectedMeditations(assignedMeditations)
    }
  }, [
    assignOpen,
    assignedMeditations,
    selectedMeditations.length,
    preventAutoSeed,
  ])

  const getEmbedUrl = (url?: string) => {
    const u = String(url || '')
    if (!u) return ''
    if (u.includes('youtube.com/watch')) {
      try {
        const v = new URL(u).searchParams.get('v')
        return v ? `https://www.youtube.com/embed/${v}` : ''
      } catch {
        return ''
      }
    }
    if (u.includes('youtu.be/')) {
      const id = u.split('youtu.be/')[1]?.split(/[?&]/)[0]
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }
    return ''
  }

  const handleAssign = async () => {
    if (!planId || selectedMeditations.length === 0) return
    setAssigning(true)
    try {
      const payload = {
        meditations: selectedMeditations.map((m, idx) => ({
          meditation_id: m?.id,
          sequence_number: idx + 1,
        })),
      }
      await assignMeditationsAsync({ planId, payload })
      setAssignOpen(false)
      setReviewOpen(false)
      setSelectedMeditations([])
      setDragIndex(null)
      refetchMeditations()
    } finally {
      setAssigning(false)
    }
  }

  const handleNext = () => {
    if (selectedMeditations.length === 0) return
    setReviewOpen(true)
    setAssignOpen(false)
  }

  const onDragStart = (index: number) => setDragIndex(index)
  const onDragOver = (e: any) => {
    e.preventDefault()
  }
  const onDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return
    setSelectedMeditations((prev) => {
      const next = prev.slice()
      const [item] = next.splice(dragIndex, 1)
      next.splice(index, 0, item)
      return next
    })
    setDragIndex(null)
  }

  const openAssignDrawer = useCallback(() => {
    setDragIndex(null)
    setReviewOpen(false)
    setAssignOpen(true)
    setSearch('')
    setPage(1)
  }, [])

  useEffect(() => {
    if (!registerAssignCTA) return
    if (isNutritionist) {
      registerAssignCTA(null)
      return
    }
    registerAssignCTA({ handler: openAssignDrawer, visible: true })
    return () => {
      registerAssignCTA(null)
    }
  }, [registerAssignCTA, openAssignDrawer, isNutritionist])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          {planName || 'Meditation Plan'}
        </div>
        <div className="text-[11px] text-gray-600">
          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Duration
          </span>
        </div>
      </div>
      <AssignedMeditationsSection
        planId={planId}
        meditations={meditations}
        loading={medLoading}
        getEmbedUrl={getEmbedUrl}
        isNutritionist={isNutritionist}
        refreshList={() => refetchMeditations()}
      />

      <CustomDrawer
        open={assignOpen}
        handleClose={() => {
          setAssignOpen(false)
          setSearch('')
          setPage(1)
          setDragIndex(null)
          setSelectedMeditations(assignedMeditations)
          setPreventAutoSeed(false)
        }}
        className="w-screen max-w-[100vw]"
        unmountOnClose
        title={'Assign Meditation'}
        handleSubmit={handleNext}
        disableSubmit={selectedMeditations.length === 0}
        hideSubmit={selectedMeditations.length === 0}
        actionLoader={false}
        actionLabel={'Next'}
      >
        <div className="w-full">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">Meditations</div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                      placeholder="Search meditations..."
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value))
                        setPage(1)
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-gray-600">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                    onClick={handleSelectAllVisible}
                    disabled={
                      medLoading ||
                      meditations.length === 0 ||
                      allVisibleSelected
                    }
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                    onClick={handleUnselectVisible}
                    disabled={selectedMeditations.length === 0}
                  >
                    Unselect All
                  </button>
                </div>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Duration
                </span>
              </div>
            </div>

            {medLoading && (
              <div className="text-xs text-gray-500 p-2">Loading...</div>
            )}
            {!medLoading && meditations.length === 0 && (
              <div className="text-xs text-gray-500 p-2">
                No meditations found.
              </div>
            )}

            {!medLoading && meditations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 xl:grid-cols-8 gap-4">
                {meditations.map((m: any) => {
                  const url = m?.video_url || m?.meditation_video_url || ''
                  const embed = getEmbedUrl(url)
                  const checked = isSelected(m?.id)
                  const title = formatMeditationName(m?.name || m?.title)
                  const durationLabel = getMeditationDurationLabel(m)
                  return (
                    <div
                      key={m?.id}
                      className={`border rounded bg-white overflow-hidden w-full cursor-pointer ${
                        checked ? 'ring-2 ring-primary/30' : ''
                      }`}
                      onClick={(e) => {
                        if (
                          (e.target as HTMLElement).tagName.toLowerCase() !==
                          'input'
                        ) {
                          toggleSelected(m)
                        }
                      }}
                    >
                      <div className="relative w-full h-40 bg-black/5">
                        {embed ? (
                          <iframe
                            src={embed}
                            title={`Meditation Video ${m?.id}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : url ? (
                          <video
                            className="w-full h-full object-cover"
                            src={String(url)}
                            muted
                            controls
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xxs text-gray-500 bg-gray-50">
                            No video
                          </div>
                        )}

                        {durationLabel && (
                          <div className="absolute top-2 right-2 flex flex-wrap gap-1 text-[11px]">
                            <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-500 text-white px-2 py-0.5 font-medium backdrop-blur">
                              <span className="w-2 h-2 rounded-full bg-white" />
                              {durationLabel}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-5 text-sm flex flex-col gap-2">
                        <div className="font-medium line-clamp-1">{title}</div>
                        <div className="flex items-center justify-end">
                          <input
                            type="checkbox"
                            className="mt-0.5 shrink-0"
                            checked={checked}
                            onChange={() => toggleSelected(m)}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 text-xs text-gray-600">
              <div>
                Page {medResp?.meta?.current_page ?? page} /{' '}
                {medResp?.meta?.total_pages ?? 1}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  disabled={(medResp?.meta?.current_page ?? page) <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  disabled={
                    (medResp?.meta?.current_page ?? page) >=
                    (medResp?.meta?.total_pages ?? 1)
                  }
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </CustomDrawer>

      <CustomDrawer
        open={reviewOpen}
        handleClose={() => {
          setReviewOpen(false)
          setAssignOpen(true)
          setDragIndex(null)
        }}
        className="w-screen max-w-[100vw] h-screen"
        unmountOnClose
        title={'Review & Order Meditations'}
        handleSubmit={handleAssign}
        disableSubmit={assigning || selectedMeditations.length === 0}
        actionLoader={assigning}
        actionLabel={'Confirm'}
      >
        <div className="">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2 mb-3">
            {selectedMeditations.length > 1 && (
              <span className="text-gray-600  bg-clip-text ">
                Drag and drop the videos below into the order you want them to
                appear in the meditation plan, then click{' '}
                <span className="font-semibold">Assign</span> to save this
                sequence.
              </span>
            )}
          </h2>
          {selectedMeditations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-5">
              {selectedMeditations.map((m: any, i: number) => {
                const rawUrl = m?.video_url || m?.meditation_video_url || ''
                const url = String(rawUrl || '')
                const embed = getEmbedUrl(url)
                const title = formatMeditationName(m?.name || m?.title)
                return (
                  <div
                    key={m?.id ?? `${title}-${i}`}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={(e) => onDragOver(e)}
                    onDrop={() => onDrop(i)}
                    className="rounded-xl shadow-lg bg-white border hover:shadow-xl transition-shadow cursor-grab active:cursor-grabbing overflow-hidden"
                  >
                    <div className="px-4 py-2 bg-gray-50 border-b text-sm font-semibold flex justify-between items-center">
                      <span className="line-clamp-1">
                        {i + 1}. {title}
                      </span>
                    </div>

                    <div className="relative w-full h-48 bg-black/5">
                      {embed ? (
                        <iframe
                          className="w-full h-full"
                          src={embed}
                          allowFullScreen
                        ></iframe>
                      ) : url ? (
                        <video
                          src={url}
                          controls
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-sm text-gray-500 italic flex items-center justify-center h-full">
                          No video URL available.
                        </div>
                      )}
                    </div>

                    {selectedMeditations.length > 1 && (
                      <div className="px-4 py-2 text-xs text-gray-600 flex flex-col gap-1">
                        <span>Hold and drag to rearrange</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No videos selected yet.
            </div>
          )}
        </div>
      </CustomDrawer>
    </div>
  )
}

function formatMeditationName(value?: any) {
  const raw =
    value === null || value === undefined || value === ''
      ? 'Untitled'
      : String(value)
  return raw.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function getMeditationDurationLabel(item: any) {
  const secondsCandidates = [
    item?.duration_seconds,
    item?.meditation_duration_seconds,
    item?.duration_secs,
  ]

  for (const candidate of secondsCandidates) {
    const parsed = toPositiveInteger(candidate)
    if (parsed) {
      return formatMeditationDuration(parsed)
    }
  }

  const minuteLikeRaw =
    item?.duration_minutes ??
    item?.meditation_duration_minutes ??
    item?.meditation?.duration_minutes ??
    item?.duration ??
    item?.meditation_duration

  const totalSeconds = minuteLikeRawToSeconds(minuteLikeRaw)
  if (!totalSeconds) return null
  return formatMeditationDuration(totalSeconds)
}

function toPositiveInteger(value: any) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null
  return Math.round(num)
}

function minuteLikeRawToSeconds(raw: any) {
  if (raw === null || raw === undefined || raw === '') return null

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return null

    if (trimmed.includes(':')) {
      const [minPart, secPart] = trimmed.split(':')
      const minutes = Number(minPart)
      const seconds = Number(secPart)
      if (
        Number.isFinite(minutes) &&
        minutes >= 0 &&
        Number.isFinite(seconds) &&
        seconds >= 0
      ) {
        return minutes * 60 + seconds
      }
    }

    const decimalIndex = trimmed.indexOf('.')
    if (decimalIndex !== -1) {
      const minutesPart = trimmed.slice(0, decimalIndex) || '0'
      const secondsPart = trimmed.slice(decimalIndex + 1)
      if (/^\d{1,2}$/.test(secondsPart)) {
        const minutes = Number(minutesPart)
        const seconds = Number(secondsPart)
        if (
          Number.isFinite(minutes) &&
          minutes >= 0 &&
          Number.isFinite(seconds) &&
          seconds >= 0 &&
          seconds < 60
        ) {
          return minutes * 60 + seconds
        }
      }
    }
  }

  const numeric = Number(raw)
  if (!Number.isFinite(numeric) || numeric <= 0) return null
  return Math.round(numeric * 60)
}

function formatMeditationDuration(totalSeconds: number) {
  if (totalSeconds < 60) {
    return `${totalSeconds} sec`
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (seconds === 0) {
    return `${minutes} min`
  }

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

function AssignedMeditationsSection({
  planId,
  meditations,
  loading,
  getEmbedUrl,
}: {
  planId?: string
  meditations: any[]
  loading: boolean
  getEmbedUrl: (url?: string) => string
  isNutritionist: boolean
  refreshList: () => void
}) {
  const currentPlanId = planId ? String(planId) : undefined
  const assigned = (meditations || [])
    .map((m: any) => {
      const plans = (m?.assigned_plans || []) as any[]
      const match = plans.find((p: any) => String(p?.plan_id) === currentPlanId)
      if (!match) return null
      return {
        ...m,
        sequence_number: match?.sequence_number,
      }
    })
    .filter((x: any) => x)

  return (
    <div className="border rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Meditations</div>
      </div>
      {loading && (
        <div className="text-xs text-gray-500">
          Loading assigned meditations...
        </div>
      )}
      {!loading && assigned.length === 0 && (
        <div className="text-xs text-gray-500">
          There is no meditations assigned yet.
        </div>
      )}
      {!loading && assigned.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 xl-grid-cols-8 gap-3 place-items-stretch">
          <div className="col-span-full flex items-center justify-end text-[11px] text-gray-600 gap-4"></div>
          {assigned
            .slice()
            .sort(
              (a: any, b: any) =>
                (a?.sequence_number ?? 0) - (b?.sequence_number ?? 0)
            )
            .map((m: any, i: number) => {
              const rawUrl = m?.video_url || m?.meditation_video_url || ''
              const url = String(rawUrl || '')
              const embed = getEmbedUrl(url)
              const title = formatMeditationName(m?.name || m?.title)
              const durationLabel = getMeditationDurationLabel(m)
              return (
                <div
                  key={m?.id ?? `${title}-${i}`}
                  className="border rounded bg-white overflow-hidden w-full"
                >
                  {embed ? (
                    <div className="relative w-full h-40 bg-black/5">
                      <iframe
                        src={embed}
                        title={`Meditation Video ${m?.id ?? i}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                      {durationLabel && (
                        <div className="absolute top-2 right-2 flex flex-wrap gap-1 text-[11px]">
                          <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-500 text-white px-2 py-0.5 font-medium backdrop-blur">
                            <Icons name="clock" className="w-3 h-3" />
                            {durationLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : url ? (
                    <div className="relative">
                      <video
                        className="w-full h-32 object-cover"
                        src={String(url)}
                        controls
                      />
                      {durationLabel && (
                        <div className="absolute top-2 right-2 flex flex-wrap gap-1 text-[11px]">
                          <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-500 text-white px-2 py-0.5 font-medium backdrop-blur">
                            <span className="w-2 h-2 rounded-full bg-white" />
                            {durationLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full h-40 flex items-center justify-center text-xxs text-gray-500 bg-gray-50">
                      No video URL available.
                      {durationLabel && (
                        <div className="absolute top-2 right-2 flex flex-wrap gap-1 text-[11px]">
                          <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-600/90 text-white px-2 py-0.5 font-medium backdrop-blur">
                            <Icons name="clock" className="w-3 h-3" />
                            {durationLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="px-2 py-3 text-xs flex flex-col gap-1">
                    <div className="font-medium line-clamp-1">{title}</div>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
