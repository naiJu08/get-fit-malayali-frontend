import moment from 'moment'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Icons from '../../../../components/common/icons'
import InfoBox from '../../../../components/app/alertBox/infoBox'
import { getWorkoutPlanDetails } from './api'
import CustomDrawer from '../../../../components/common/drawer'
import TabContainer from '../../../../components/common/tab/TabContainer'
import { TabItemProps } from '../../../../common/types'
import { useWorkoutList } from '../../../Workout/api'
import { useAddExercise } from './api'

export default function WorkoutPlanDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'details' | 'assign'>('details')
  const [assignOpen, setAssignOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [selectedWorkouts, setSelectedWorkouts] = useState<any[]>([])
  const [wpPage, setWpPage] = useState<number>(1)
  const [wpPerPage, setWpPerPage] = useState<number>(20)
  const [wpSearch, setWpSearch] = useState<string>('')
  const [assigning, setAssigning] = useState<boolean>(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const { mutateAsync: addExerciseAsync } = useAddExercise()

  const refreshDetails = async () => {
    try {
      setLoading(true)
      const res = await getWorkoutPlanDetails(String(id))
      setData(res)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load workout plan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await getWorkoutPlanDetails(String(id))
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.response?.data?.message || 'Failed to load workout plan')
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

  const wp = data?.workout_plan || data || {}
  // Load workouts for assignment
  const { data: workoutsResp, isFetching: workoutsLoading } = useWorkoutList({
    page: wpPage,
    per_page: wpPerPage,
    search: wpSearch,
  } as any)
  const workouts = workoutsResp?.workouts ?? []
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

  const isSelected = (id: any) => selectedWorkouts.some((w) => w?.id === id)
  const toggleSelected = (w: any) => {
    setSelectedWorkouts((prev) =>
      prev.some((x) => x?.id === w?.id)
        ? prev.filter((x) => x?.id !== w?.id)
        : [...prev, w]
    )
  }

  // Open/close drawer based on Assign tab
  useEffect(() => {
    if (activeTab === 'assign') {
      setAssignOpen(true)
      // reset paging when opening
      setWpPage(1)
    } else {
      setAssignOpen(false)
      setSelectedWorkouts([])
      setReviewOpen(false)
    }
  }, [activeTab])

  const handleNext = () => {
    if (selectedWorkouts.length === 0) return
    setReviewOpen(true)
    setAssignOpen(false)
  }

  const handleBulkAssign = async () => {
    if (!wp?.id || selectedWorkouts.length === 0) return
    setAssigning(true)
    try {
      await Promise.all(
        selectedWorkouts.map((w, idx) =>
          addExerciseAsync({
            id: wp.id,
            payload: {
              exercise: {
                workout_id: w?.id,
                sequence_number: idx + 1,
              },
            },
          })
        )
      )
      await refreshDetails()
      setReviewOpen(false)
      setActiveTab('details')
    } finally {
      setAssigning(false)
    }
  }

  const handleAssignOne = async (workout: any, index: number) => {
    if (!wp?.id || !workout?.id) return
    setAssigning(true)
    try {
      await addExerciseAsync({
        id: wp.id,
        payload: {
          exercise: {
            workout_id: workout.id,
            sequence_number: index + 1,
          },
        },
      })
      await refreshDetails()
    } finally {
      setAssigning(false)
    }
  }

  const onDragStart = (index: number) => setDragIndex(index)
  const onDragOver = (e: any) => {
    e.preventDefault()
  }
  const onDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return
    setSelectedWorkouts((prev) => {
      const next = prev.slice()
      const [item] = next.splice(dragIndex, 1)
      next.splice(index, 0, item)
      return next
    })
    setDragIndex(null)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} aria-label="Back">
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">Workout Plan Details</h1>
        </div>
      </div>
      {(() => {
        const tabs: TabItemProps[] = [
          { id: 'details', label: 'Details' },
          { id: 'assign', label: 'Assign' },
        ]
        return (
          <div className="no-tab-bg mb-4">
            <TabContainer
              data={tabs}
              activeTab={activeTab}
              onClick={(item) => setActiveTab(item.id as any)}
            >
              <div style={{ display: 'none' }} />
            </TabContainer>
          </div>
        )
      })()}

      {loading && (
        <div className="p-6">
          <InfoBox content="Loading workout plan details..." />
        </div>
      )}
      {error && !loading && (
        <div className="p-6">
          <InfoBox content={error} />
        </div>
      )}
      {!loading && !error && activeTab === 'details' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailItem label="Title" value={wp?.title} />
            <DetailItem label="Plan Id" value={safeStr(wp?.plan_id)} />
            <DetailItem label="Day Number" value={safeStr(wp?.day_number)} />
            <DetailItem
              label="Exercises"
              value={safeStr(wp?.exercises_count)}
            />
            <DetailItem
              label="Total Duration (mins)"
              value={safeStr(wp?.total_duration)}
            />
            <DetailItem label="Description" value={safeStr(wp?.description)} />
            <DetailItem label="Created At" value={formatDate(wp?.created_at)} />
          </div>
          {Array.isArray(wp?.exercises) && wp.exercises.length > 0 && (
            <div className="mt-6">
              <div className="text-md font-semibold mb-4">Exercises</div>
              <div className="grid grid-cols-4 gap-3 place-items-start">
                {wp.exercises
                  .slice()
                  .sort(
                    (a: any, b: any) =>
                      (a?.sequence_number ?? 0) - (b?.sequence_number ?? 0)
                  )
                  .map((ex: any) => {
                    const rawUrl =
                      ex?.video_url ||
                      ex?.workout_video_url ||
                      ex?.workout?.video_url ||
                      ''
                    const url = String(rawUrl || '')
                    const embed = getEmbedUrl(url)
                    return (
                      <div
                        key={ex?.id}
                        className="border rounded bg-white overflow-hidden w-56"
                      >
                        {embed ? (
                          <div className="w-full h-36 bg-black/5">
                            <iframe
                              src={embed}
                              title={`Workout Video ${ex?.workout_id ?? ex?.id}`}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          </div>
                        ) : url ? (
                          <video
                            className=" h-36 object-cover"
                            src={url}
                            controls
                          />
                        ) : (
                          <div className="w-full h-36 flex items-center justify-center text-xxs text-gray-500 bg-gray-50">
                            No video
                          </div>
                        )}
                        <div className="px-2 py-1 text-xs font-medium line-clamp-1">
                          {ex?.workout_name || 'Untitled'}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
          {selectedWorkouts.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-semibold mb-3">
                Selected Workouts Preview
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedWorkouts.map((w, i) => {
                  const url = w?.video_url || ''
                  const embed = getEmbedUrl(url)
                  return (
                    <div key={w?.id} className="border rounded">
                      <div className="px-3 py-2 text-sm font-medium">
                        {i + 1}. {w?.name || 'Untitled'}
                      </div>
                      <div className="px-3 pb-2 text-xxs text-gray-500 break-all">
                        {url || '--'}
                      </div>
                      {embed ? (
                        <div className="aspect-video w-full">
                          <iframe
                            src={embed}
                            title={`Workout Video ${w?.id}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      ) : url ? (
                        <video className="w-full" src={String(url)} controls />
                      ) : (
                        <div className="text-sm text-gray-600 px-3 pb-3">
                          No video URL available.
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
      <CustomDrawer
        open={assignOpen}
        handleClose={() => setActiveTab('details')}
        title={'Assign Workout'}
        handleSubmit={handleNext}
        disableSubmit={selectedWorkouts.length === 0}
        actionLoader={false}
        actionLabel={'Next'}
      >
        <div className="w-[900px] max-w-[95vw]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-3 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Workouts</div>
                <div className="flex items-center gap-2">
                  <input
                    value={wpSearch}
                    onChange={(e) => {
                      setWpSearch(e.target.value)
                      setWpPage(1)
                    }}
                    placeholder="Search workouts..."
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={wpPerPage}
                    onChange={(e) => {
                      setWpPerPage(Number(e.target.value))
                      setWpPage(1)
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
                {workoutsLoading && (
                  <div className="text-xs text-gray-500 p-2">Loading...</div>
                )}
                {!workoutsLoading && workouts.length === 0 && (
                  <div className="text-xs text-gray-500 p-2">
                    No workouts found.
                  </div>
                )}
                {workouts.map((w: any) => (
                  <label
                    key={w?.id}
                    className={`w-full flex items-start gap-2 p-2 hover:bg-gray-50 cursor-pointer ${isSelected(w?.id) ? 'bg-primary/10' : ''}`}
                    onClick={(e) => {
                      // avoid double toggle when clicking input
                      if (
                        (e.target as HTMLElement).tagName.toLowerCase() !==
                        'input'
                      )
                        toggleSelected(w)
                    }}
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={isSelected(w?.id)}
                      onChange={() => toggleSelected(w)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {w?.name || 'Untitled'}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {w?.description || ''}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 text-xs text-gray-600">
                <div>
                  Page {workoutsResp?.meta?.current_page ?? wpPage} /{' '}
                  {workoutsResp?.meta?.total_pages ?? 1}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 border rounded disabled:opacity-50"
                    disabled={(workoutsResp?.meta?.current_page ?? wpPage) <= 1}
                    onClick={() => setWpPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <button
                    className="px-2 py-1 border rounded disabled:opacity-50"
                    disabled={
                      (workoutsResp?.meta?.current_page ?? wpPage) >=
                      (workoutsResp?.meta?.total_pages ?? 1)
                    }
                    onClick={() => setWpPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Video Preview</div>
              {selectedWorkouts.length === 0 && (
                <div className="text-xs text-gray-500">
                  Select one or more workouts to preview.
                </div>
              )}
              {selectedWorkouts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedWorkouts.map((w, i) => {
                    const url = w?.video_url || ''
                    const embed = getEmbedUrl(url)
                    return (
                      <div key={w?.id} className="border rounded p-2">
                        <div className="px-1 pt-1 text-xs font-medium line-clamp-1">
                          {i + 1}. {w?.name || 'Untitled'}
                        </div>
                        <div className="px-1 pb-1 text-xxs text-gray-500 break-all line-clamp-1">
                          {url || '--'}
                        </div>
                        {embed ? (
                          <div className="w-full h-32 rounded overflow-hidden bg-black/5">
                            <iframe
                              src={embed}
                              title={`Workout Video ${w?.id}`}
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

      {/* Review Drawer */}
      <CustomDrawer
        open={reviewOpen}
        handleClose={() => setReviewOpen(false)}
        title={'Review & Order'}
        handleSubmit={handleBulkAssign}
        disableSubmit={assigning || selectedWorkouts.length === 0}
        actionLoader={assigning}
        actionLabel={'Assign Selected'}
      >
        <div className="w-[900px] max-w-[95vw]">
          <div className="border rounded p-3">
            <div className="text-sm font-medium mb-2">
              Selected Videos (Drag to Reorder)
            </div>
            {selectedWorkouts.length === 0 && (
              <div className="text-xs text-gray-500">No workouts selected.</div>
            )}
            {selectedWorkouts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedWorkouts.map((w, i) => {
                  const url = w?.video_url || ''
                  const embed = getEmbedUrl(url)
                  return (
                    <div
                      key={w?.id}
                      className="border rounded p-2 cursor-move"
                      draggable
                      onDragStart={() => onDragStart(i)}
                      onDragOver={onDragOver}
                      onDrop={() => onDrop(i)}
                    >
                      <div className="px-1 pt-1 text-xs font-medium line-clamp-1 flex items-center justify-between gap-2">
                        <span>
                          {i + 1}. {w?.name || 'Untitled'}
                        </span>
                        <button
                          className="text-[10px] px-2 py-1 border rounded disabled:opacity-50"
                          disabled={assigning}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAssignOne(w, i)
                          }}
                        >
                          Assign
                        </button>
                      </div>
                      <div className="px-1 pb-1 text-xxs text-gray-500 break-all line-clamp-1">
                        {url || '--'}
                      </div>
                      {embed ? (
                        <div className="w-full h-24 rounded overflow-hidden bg-black/5">
                          <iframe
                            src={embed}
                            title={`Workout Video ${w?.id}`}
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
        </div>
      </CustomDrawer>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">{safeStr(value)}</div>
    </div>
  )
}

function formatDate(d: any) {
  if (!d) return '--'
  const m = moment(d)
  return m.isValid() ? m.format('YYYY-MM-DD') : String(d)
}
function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
