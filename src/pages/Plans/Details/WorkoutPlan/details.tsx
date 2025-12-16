// import moment from 'moment'
import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

import Icons from '../../../../components/common/icons'
import InfoBox from '../../../../components/app/alertBox/infoBox'
import { useSnackbarManager } from '../../../../components/common/snackbar'
import { getWorkoutPlanDetails, deleteWorkoutPlanExercise } from './api'
import CustomDrawer from '../../../../components/common/drawer'
// import TabContainer from '../../../../components/common/tab/TabContainer'
import Tab from '../../../../components/common/tab/Tab'
import { TabItemProps } from '../../../../common/types'
import { useWorkoutList } from '../../../Workout/api'
import { useAuthStore } from '../../../../store/authStore'
import { useAddExercises } from './api'
import { TabContainer } from '../../../../components/common'

function DetailsTabContent({
  wp,
  loading,
  error,
}: {
  wp: any
  loading: boolean
  error: string
}) {
  return (
    <>
      {/* Details Content */}
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
      {!loading && !error && (
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
          </div>
        </>
      )}
    </>
  )
}

function AssignTabContent({
  wp,
  loading,
  error,
  // selectedWorkouts,
  getEmbedUrl,
  refreshDetails,
}: any) {
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<any[]>([])
  const [removedExerciseIds, setRemovedExerciseIds] = useState<any[]>([])
  const { enqueueSnackbar } = useSnackbarManager()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'

  const toggleSelectedExercise = (workoutId: any) => {
    if (!workoutId) return
    setSelectedExerciseIds((prev) =>
      prev.includes(workoutId)
        ? prev.filter((x) => x !== workoutId)
        : [...prev, workoutId]
    )
  }

  const handleRemoveSelected = async () => {
    if (!wp?.id || selectedExerciseIds.length === 0) return
    try {
      const res: any = await deleteWorkoutPlanExercise(
        wp.id,
        selectedExerciseIds
      )
      setRemovedExerciseIds((prev) => [...prev, ...selectedExerciseIds])
      setSelectedExerciseIds([])
      const msg = res?.message || 'Exercises removed successfully'
      enqueueSnackbar(msg, { variant: 'success' })
      await refreshDetails?.()
    } catch (e: any) {
      console.error(e)
    }
  }

  const exercises = Array.isArray(wp?.exercises)
    ? wp.exercises
        .slice()
        .sort(
          (a: any, b: any) =>
            (a?.sequence_number ?? 0) - (b?.sequence_number ?? 0)
        )
        .filter(
          (ex: any) =>
            !removedExerciseIds.includes(
              ex?.workout_id || ex?.workout?.id || ex?.id
            )
        )
    : []

  return (
    <>
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
      {!loading && !error && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-md font-semibold">Exercises</div>
            {!isNutritionist &&
              exercises.length > 0 &&
              selectedExerciseIds.length > 0 && (
                <button
                  className="px-3 py-1 text-xs border rounded  btn-primary"
                  onClick={handleRemoveSelected}
                >
                  Remove Exercise
                </button>
              )}
          </div>
          {exercises.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 place-items-stretch">
              {exercises.map((ex: any) => {
                const rawUrl =
                  ex?.video_url ||
                  ex?.workout_video_url ||
                  ex?.workout?.video_url ||
                  ''
                const url = String(rawUrl || '')
                const embed = getEmbedUrl(url)
                const workoutIdForEx =
                  ex?.workout_id || ex?.workout?.id || ex?.id
                const checked = selectedExerciseIds.includes(workoutIdForEx)
                return (
                  <div
                    key={ex?.id}
                    className="border rounded bg-white overflow-hidden w-full"
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
                    <div className="px-2 py-1 text-xs flex items-center justify-between gap-2">
                      <div className="font-medium line-clamp-1">
                        {ex?.workout_name || 'Untitled'}
                      </div>
                      {!isNutritionist && (
                        <input
                          type="checkbox"
                          className="shrink-0"
                          checked={checked}
                          onChange={() =>
                            toggleSelectedExercise(workoutIdForEx)
                          }
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-600">No exercises assigned.</div>
          )}
        </>
      )}
    </>
  )
}

export default function WorkoutPlanDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const currentTab = (
    searchParams.get('tab') === 'assign' ? 'assign' : 'details'
  ) as 'details' | 'assign'
  const [assignOpen, setAssignOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [selectedWorkouts, setSelectedWorkouts] = useState<any[]>([])
  const [wpPage, setWpPage] = useState<number>(1)
  const [wpPerPage, setWpPerPage] = useState<number>(20)
  const [wpSearch, setWpSearch] = useState<string>('')
  const [assigning, setAssigning] = useState<boolean>(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  // const { mutateAsync: addExerciseAsync } = useAddExercise()
  const { mutateAsync: addExercisesAsync } = useAddExercises()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'

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
    if (currentTab !== 'assign') {
      setAssignOpen(false)
      setReviewOpen(false)
    }
  }, [currentTab])

  useEffect(() => {
    if (assignOpen) {
      setDragIndex(null)
      setReviewOpen(false)

      // On first open (or after successful assign when selection was cleared),
      // pre-select workouts that are already assigned in this plan.
      if (selectedWorkouts.length === 0 && Array.isArray(wp?.exercises)) {
        const map = new Map<any, any>()
        wp.exercises.forEach((ex: any) => {
          const id = ex?.workout_id || ex?.workout?.id || ex?.id
          if (!id) return
          if (!map.has(id)) {
            map.set(id, {
              id,
              name: ex?.workout_name || ex?.workout?.name,
              video_url:
                ex?.video_url ||
                ex?.workout_video_url ||
                ex?.workout?.video_url ||
                '',
            })
          }
        })
        setSelectedWorkouts(Array.from(map.values()))
      }
    }
  }, [assignOpen, wp?.exercises, selectedWorkouts.length])

  const handleNext = () => {
    if (selectedWorkouts.length === 0) return
    setReviewOpen(true)
    setAssignOpen(false)
  }

  const handleBulkAssign = async () => {
    if (!wp?.id || selectedWorkouts.length === 0) return
    setAssigning(true)
    try {
      // Always send all currently checked workouts from the Review drawer
      // in their visual order with sequence_number 1..N
      await addExercisesAsync({
        id: wp.id,
        payload: {
          exercises: selectedWorkouts
            .filter((w: any) => w?.id != null)
            .map((w: any, idx: number) => ({
              workout_id: w.id,
              sequence_number: idx + 1,
            })),
        },
      })

      await refreshDetails()
      setSelectedWorkouts([])
      setReviewOpen(false)
      setSearchParams({ tab: 'assign' })
    } finally {
      setAssigning(false)
      setDragIndex(null)
      setWpSearch('')
      setWpPage(1)
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
          <button
            onClick={() => navigate(`/plans/${wp?.plan_id}/workout-plan`)}
            aria-label="Back"
          >
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">
            Workout Plan Details - {wp?.plan_name}
          </h1>
        </div>
        {currentTab === 'assign' && !isNutritionist && (
          <div>
            <button
              className="px-3 py-1 text-sm border rounded btn-primary"
              onClick={() => {
                setDragIndex(null)
                setReviewOpen(false)
                setAssignOpen(true)
                setWpSearch('')
                setWpPage(1)
              }}
            >
              Assign
            </button>
          </div>
        )}
      </div>

      {(() => {
        const tabs: TabItemProps[] = [
          { id: 'details', label: 'Details' },
          { id: 'assign', label: 'Exercises' },
        ]
        return (
          <div className="no-tab-bg mb-4">
            <TabContainer
              data={tabs}
              activeTab={currentTab}
              onClick={(item) => {
                const next = item.id === 'assign' ? 'assign' : 'details'
                // preserve current pathname; update tab query param
                setSearchParams(next === 'assign' ? { tab: 'assign' } : {})
              }}
            >
              <Tab id="details">
                <DetailsTabContent wp={wp} loading={loading} error={error} />
              </Tab>
              <Tab id="assign">
                <AssignTabContent
                  wp={wp}
                  loading={loading}
                  error={error}
                  selectedWorkouts={selectedWorkouts}
                  getEmbedUrl={getEmbedUrl}
                  refreshDetails={refreshDetails}
                />
              </Tab>
            </TabContainer>
          </div>
        )
      })()}

      <CustomDrawer
        open={assignOpen}
        handleClose={() => {
          setAssignOpen(false)
          setWpSearch('')
          setWpPage(1)
        }}
        className="w-screen max-w-[100vw]"
        unmountOnClose
        title={'Assign Workout'}
        handleSubmit={handleNext}
        disableSubmit={selectedWorkouts.length === 0}
        hideSubmit={selectedWorkouts.length === 0}
        actionLoader={false}
        actionLabel={'Next'}
      >
        <div className="w-full">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
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

            {workoutsLoading && (
              <div className="text-xs text-gray-500 p-2">Loading...</div>
            )}
            {!workoutsLoading && workouts.length === 0 && (
              <div className="text-xs text-gray-500 p-2">
                No workouts found.
              </div>
            )}

            {!workoutsLoading && workouts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {workouts.map((w: any) => {
                  const url = w?.video_url || ''
                  const embed = getEmbedUrl(url)
                  const checked = isSelected(w?.id)
                  return (
                    <div
                      key={w?.id}
                      className={`border rounded bg-white overflow-hidden w-full cursor-pointer ${
                        checked ? 'ring-2 ring-primary/30' : ''
                      }`}
                      onClick={(e) => {
                        if (
                          (e.target as HTMLElement).tagName.toLowerCase() !==
                          'input'
                        ) {
                          toggleSelected(w)
                        }
                      }}
                    >
                      {embed ? (
                        <div className="w-full h-40 bg-black/5">
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
                          muted
                          controls
                        />
                      ) : (
                        <div className="w-full h-36 flex items-center justify-center text-xxs text-gray-500 bg-gray-50">
                          No video
                        </div>
                      )}
                      <div className="px-3 py-2 text-sm flex items-start justify-between gap-2">
                        <div className="font-medium line-clamp-1">
                          {w?.name || 'Untitled'}
                        </div>
                        <input
                          type="checkbox"
                          className="mt-0.5 shrink-0"
                          checked={checked}
                          onChange={() => toggleSelected(w)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

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
        </div>
      </CustomDrawer>

      {/* Review Drawer */}
      <CustomDrawer
        open={reviewOpen}
        handleClose={() => {
          setReviewOpen(false)
          setSelectedWorkouts([])
          setDragIndex(null)
        }}
        className="w-screen max-w-[100vw] h-screen"
        unmountOnClose
        title={'Review & Order Exercises'}
        handleSubmit={handleBulkAssign}
        disableSubmit={assigning || selectedWorkouts.length === 0}
        actionLoader={assigning}
        actionLabel={'Confirm'}
      >
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2 mb-3">
            <span className="text-blue-600 text-xl">🎬</span>
            <span className="text-gray-600  bg-clip-text ">
              Drag and drop the videos below into the order you want them to
              appear in the workoutplan, then click{' '}
              <span className="font-semibold">Assign</span> to save this
              sequence.
            </span>
          </h2>
          {selectedWorkouts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {selectedWorkouts.map((w, i) => {
                const embed = getEmbedUrl(w?.video_url)
                const url = w?.video_url || ''
                return (
                  <div
                    key={w?.id}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={(e) => onDragOver(e)}
                    onDrop={() => onDrop(i)}
                    className="rounded-xl shadow-lg bg-white border hover:shadow-xl transition-shadow cursor-grab active:cursor-grabbing overflow-hidden"
                  >
                    <div className="px-4 py-2 bg-gray-50 border-b text-sm font-semibold flex justify-between items-center">
                      <span className="line-clamp-1">
                        {i + 1}. {w?.name}
                      </span>
                    </div>

                    {/* Video preview */}
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

                    {/* Footer */}
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

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">{safeStr(value)}</div>
    </div>
  )
}

function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
