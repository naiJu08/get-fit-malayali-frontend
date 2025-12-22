import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import CustomDrawer from '../../../../components/common/drawer'
import { useMeditationList } from '../../../Meditation/api'
import { useAssignMeditations, useRemoveMeditationsFromPlan } from './api'
import { useAuthStore } from '../../../../store/authStore'
import { useSnackbarManager } from '../../../../components/common/snackbar'

type Props = {
  planName?: string
}

export default function MeditationPlanIndex({ planName }: Props) {
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
  const { mutateAsync: assignMeditationsAsync } = useAssignMeditations()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'

  useEffect(() => {
    if (!assignOpen && !reviewOpen) {
      setSelectedMeditations([])
      setSearch('')
      setPage(1)
      setDragIndex(null)
    }
  }, [assignOpen, reviewOpen])

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
  const meditations = medResp?.meditations ?? medResp?.items ?? []

  const isSelected = (id: any) =>
    selectedMeditations.some((m) => String(m?.id) === String(id))
  const toggleSelected = (m: any) => {
    setSelectedMeditations((prev) =>
      prev.some((x) => String(x?.id) === String(m?.id))
        ? prev.filter((x) => String(x?.id) !== String(m?.id))
        : [...prev, m]
    )
  }

  useEffect(() => {
    if (assignOpen) {
      setDragIndex(null)
      setReviewOpen(false)

      // Pre-select currently assigned meditations when opening the drawer.
      if (selectedMeditations.length === 0 && Array.isArray(meditations)) {
        const currentPlanId = planId ? String(planId) : undefined
        const assigned = (meditations || [])
          .map((m: any) => {
            const plans = (m?.assigned_plans || []) as any[]
            const match = plans.find(
              (p: any) => String(p?.plan_id) === currentPlanId
            )
            if (!match) return null
            return { ...m, sequence_number: match?.sequence_number }
          })
          .filter((x: any) => x)
          .slice()
          .sort(
            (a: any, b: any) =>
              (a?.sequence_number ?? 0) - (b?.sequence_number ?? 0)
          )
        if (assigned.length > 0) setSelectedMeditations(assigned)
      }
    }
  }, [assignOpen, meditations, planId, selectedMeditations.length])

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          {planName || 'Meditation Plan'}
        </div>
        {!isNutritionist && (
          <div>
            <button
              className="px-3 py-1.5 text-sm border rounded btn-primary"
              onClick={() => {
                setDragIndex(null)
                setReviewOpen(false)
                setAssignOpen(true)
                setSearch('')
                setPage(1)
              }}
            >
              Assign
            </button>
          </div>
        )}
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
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div className="text-sm font-medium">Meditations</div>
              <div className="flex items-center gap-2">
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

            {medLoading && (
              <div className="text-xs text-gray-500 p-2">Loading...</div>
            )}
            {!medLoading && meditations.length === 0 && (
              <div className="text-xs text-gray-500 p-2">
                No meditations found.
              </div>
            )}

            {!medLoading && meditations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {meditations.map((m: any) => {
                  const url = m?.video_url || m?.meditation_video_url || ''
                  const embed = getEmbedUrl(url)
                  const checked = isSelected(m?.id)
                  const title = m?.name || m?.title || 'Untitled'
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
                      {embed ? (
                        <div className="w-full h-40 bg-black/5">
                          <iframe
                            src={embed}
                            title={`Meditation Video ${m?.id}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      ) : url ? (
                        <video
                          className="w-full h-32 object-cover rounded"
                          src={String(url)}
                          muted
                          controls
                        />
                      ) : (
                        <div className="w-full h-36 flex items-center justify-center text-xxs text-gray-500 bg-gray-50">
                          No video
                        </div>
                      )}
                      <div className="px-3 py-2 text-sm flex items-start justify-between gap-2">
                        <div className="font-medium line-clamp-1">{title}</div>
                        <input
                          type="checkbox"
                          className="mt-0.5 shrink-0"
                          checked={checked}
                          onChange={() => toggleSelected(m)}
                        />
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
          setSelectedMeditations([])
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
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2 mb-3">
            <span className="text-blue-600 text-xl">🎬</span>
            <span className="text-gray-600  bg-clip-text ">
              Drag and drop the videos below into the order you want them to
              appear in the meditation plan, then click{' '}
              <span className="font-semibold">Assign</span> to save this
              sequence.
            </span>
          </h2>
          {selectedMeditations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {selectedMeditations.map((m: any, i: number) => {
                const rawUrl = m?.video_url || m?.meditation_video_url || ''
                const url = String(rawUrl || '')
                const embed = getEmbedUrl(url)
                const title = m?.name || m?.title || 'Untitled'
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

                    {embed ? (
                      <iframe
                        className="w-full h-48"
                        src={embed}
                        allowFullScreen
                      ></iframe>
                    ) : url ? (
                      <video
                        src={url}
                        controls
                        muted
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No video URL available.
                      </div>
                    )}

                    <div className="px-4 py-2 text-xs text-gray-600">
                      Hold and drag to rearrange
                    </div>
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

function AssignedMeditationsSection({
  planId,
  meditations,
  loading,
  getEmbedUrl,
  isNutritionist,
  refreshList,
}: {
  planId?: string
  meditations: any[]
  loading: boolean
  getEmbedUrl: (url?: string) => string
  isNutritionist: boolean
  refreshList: () => void
}) {
  const currentPlanId = planId ? String(planId) : undefined
  const [selectedMeditationIds, setSelectedMeditationIds] = useState<any[]>([])
  const [removedMeditationIds, setRemovedMeditationIds] = useState<any[]>([])
  const { enqueueSnackbar } = useSnackbarManager()
  const { mutateAsync: removeMeditationsAsync } = useRemoveMeditationsFromPlan()

  const toggleSelectedMeditation = (meditationId: any) => {
    if (!meditationId) return
    setSelectedMeditationIds((prev) =>
      prev.includes(meditationId)
        ? prev.filter((x) => x !== meditationId)
        : [...prev, meditationId]
    )
  }

  const handleRemoveSelected = async () => {
    if (!planId || selectedMeditationIds.length === 0) return
    try {
      const res: any = await removeMeditationsAsync({
        planId,
        meditationIds: selectedMeditationIds,
      })
      setRemovedMeditationIds((prev) => [...prev, ...selectedMeditationIds])
      setSelectedMeditationIds([])
      const msg = res?.message || 'Meditations removed successfully'
      enqueueSnackbar(msg, { variant: 'success' })
      refreshList?.()
    } catch (e: any) {
      console.error(e)
    }
  }

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
    .filter((m: any) => !removedMeditationIds.includes(m?.id))

  return (
    <div className="border rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Meditations</div>
        {!isNutritionist &&
          assigned.length > 0 &&
          selectedMeditationIds.length > 0 && (
            <button
              className="px-3 py-1 text-xs border rounded  btn-primary"
              onClick={handleRemoveSelected}
            >
              Remove Meditation
            </button>
          )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 place-items-stretch">
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
              const title = m?.name || m?.title || 'Untitled'
              const meditationId = m?.id
              const checked = selectedMeditationIds.includes(meditationId)
              return (
                <div
                  key={m?.id ?? `${title}-${i}`}
                  className="border rounded bg-white overflow-hidden w-full"
                >
                  {embed ? (
                    <div className="w-full h-40 bg-black/5">
                      <iframe
                        src={embed}
                        title={`Meditation Video ${m?.id ?? i}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : url ? (
                    <video
                      className="w-full h-32 object-cover"
                      src={String(url)}
                      controls
                    />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center text-xxs text-gray-500 bg-gray-50">
                      No video URL available.
                    </div>
                  )}

                  <div className="px-2 py-1 text-xs flex items-center justify-between gap-2">
                    <div className="font-medium line-clamp-1">{title}</div>
                    {!isNutritionist && (
                      <input
                        type="checkbox"
                        className="shrink-0"
                        checked={checked}
                        onChange={() => toggleSelectedMeditation(meditationId)}
                      />
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
