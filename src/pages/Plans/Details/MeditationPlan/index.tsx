import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import CustomDrawer from '../../../../components/common/drawer'
import { useMeditationList } from '../../../Meditation/api'
import { useAssignMeditations } from './api'

type Props = {
  planName?: string
}

export default function MeditationPlanIndex({ planName }: Props) {
  const { id: routePlanId } = useParams()
  const planId = routePlanId as string
  const [assignOpen, setAssignOpen] = useState(false)
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(20)
  const [search, setSearch] = useState<string>('')
  const [selectedMeditations, setSelectedMeditations] = useState<any[]>([])
  const [assigning, setAssigning] = useState(false)
  const { mutateAsync: assignMeditationsAsync } = useAssignMeditations()

  useEffect(() => {
    if (!assignOpen) {
      setSelectedMeditations([])
      setSearch('')
      setPage(1)
    }
  }, [assignOpen])

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
      setSelectedMeditations([])
      refetchMeditations()
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          {planName || 'Meditation Plan'}
        </div>
        <div>
          <button
            className="px-3 py-1.5 text-sm border rounded btn-primary"
            onClick={() => setAssignOpen(true)}
          >
            Assign
          </button>
        </div>
      </div>
      <AssignedMeditationsSection
        planId={planId}
        meditations={meditations}
        loading={medLoading}
        getEmbedUrl={getEmbedUrl}
      />

      <CustomDrawer
        open={assignOpen}
        handleClose={() => setAssignOpen(false)}
        title={'Assign Meditation'}
        handleSubmit={handleAssign}
        disableSubmit={assigning || selectedMeditations.length === 0}
        actionLoader={assigning}
        actionLabel={'Assign'}
      >
        <div className="w-[900px] max-w-[95vw]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-3 flex flex-col">
              <div className="flex items-center justify-between mb-2">
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
              <div className="max-h-[60vh] overflow-y-auto divide-y">
                {medLoading && (
                  <div className="text-xs text-gray-500 p-2">Loading...</div>
                )}
                {!medLoading && meditations.length === 0 && (
                  <div className="text-xs text-gray-500 p-2">
                    No meditations found.
                  </div>
                )}
                {meditations.map((m: any) => (
                  <label
                    key={m?.id}
                    className={`w-full flex items-start gap-2 p-2 hover:bg-gray-50 cursor-pointer ${isSelected(m?.id) ? 'bg-primary/10' : ''}`}
                    onClick={(e) => {
                      if (
                        (e.target as HTMLElement).tagName.toLowerCase() !==
                        'input'
                      )
                        toggleSelected(m)
                    }}
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={isSelected(m?.id)}
                      onChange={() => toggleSelected(m)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {m?.name || m?.title || 'Untitled'}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {m?.description || ''}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
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
            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Preview</div>
              {selectedMeditations.length === 0 && (
                <div className="text-xs text-gray-500">
                  Select one or more meditations to preview.
                </div>
              )}
              {selectedMeditations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedMeditations.map((m, i) => {
                    const url = m?.video_url || ''
                    const embed = getEmbedUrl(url)
                    return (
                      <div key={m?.id} className="border rounded p-2">
                        <div className="px-1 pt-1 text-xs font-medium line-clamp-1">
                          {i + 1}. {m?.name || m?.title || 'Untitled'}
                        </div>
                        {embed ? (
                          <div className="w-full h-32 rounded overflow-hidden bg-black/5">
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
                            controls
                          />
                        ) : (
                          <div className="text-xs text-gray-600 px-1 pb-1">
                            No video URL available.
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
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
}: {
  planId?: string
  meditations: any[]
  loading: boolean
  getEmbedUrl: (url?: string) => string
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
      <div className="text-sm font-medium mb-2">Meditations</div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              return (
                <div
                  key={m?.id ?? `${title}-${i}`}
                  className="border rounded p-2 w-56"
                >
                  <div className="px-1 pt-1 text-xs font-medium line-clamp-1">
                    {i + 1}. {title}
                  </div>
                  {embed ? (
                    <div className="w-full h-36 rounded overflow-hidden bg-black/5">
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
                      className="w-full h-24 object-cover rounded"
                      src={String(url)}
                      controls
                    />
                  ) : (
                    <div className="text-xs text-gray-600 px-1 pb-1">
                      No video URL available.
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
