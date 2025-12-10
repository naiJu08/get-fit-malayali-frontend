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
import { useAddExercise } from './api'
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
            <div className="grid grid-cols-4 gap-3 place-items-start">
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
                    className="border rounded bg-white overflow-hidden w-80"
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
                        className=" h-40 w-full object-cover"
                        src={url}
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

          {/* {selectedWorkouts.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-semibold mb-3">
                Selected Workouts Preview
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedWorkouts.map((w: any, i: number) => {
                  const url = w?.video_url || ''
                  const embed = getEmbedUrl(url)
                  return (
                    <div key={w?.id} className="border rounded">
                      <div className="px-3 py-2 text-sm font-medium">
                        {i + 1}. {w?.name || 'Untitled'}
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
          )} */}
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
  const { mutateAsync: addExerciseAsync } = useAddExercise()
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
  const assignedWorkoutIds = new Set(
    Array.isArray(wp?.exercises)
      ? wp.exercises
          .map((ex: any) => ex?.workout_id || ex?.workout?.id || null)
          .filter((id: any) => id !== null && id !== undefined)
      : []
  )
  const workouts = (workoutsResp?.workouts ?? []).filter(
    (w: any) => !assignedWorkoutIds.has(w?.id)
  )
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
      setSelectedWorkouts([])
      setReviewOpen(false)
    }
  }, [currentTab])

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
      setSearchParams({ tab: 'assign' })
    } finally {
      setAssigning(false)
    }
  }

  // const handleAssignOne = async (workout: any, index: number) => {
  //   if (!wp?.id || !workout?.id) return
  //   setAssigning(true)
  //   try {
  //     await addExerciseAsync({
  //       id: wp.id,
  //       payload: {
  //         exercise: {
  //           workout_id: workout.id,
  //           sequence_number: index + 1,
  //         },
  //       },
  //     })
  //     await refreshDetails()
  //   } finally {
  //     setAssigning(false)
  //   }
  // }

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
                setAssignOpen(true)
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
          setSelectedWorkouts([])
          setWpSearch('')
          setWpPage(1)
        }}
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
        actionLabel={'Assign'}
      >
        <div className="w-[900px] max-w-[95vw]">
          <div className="border rounded p-3">
            <div className="text-sm font-medium mb-2">
              Selected Videos (Drag to Reorder)
              <p className="mt-2">
                Drag and drop videos to arrange the sequence
              </p>
            </div>
            {selectedWorkouts.length === 0 && (
              <div className="text-xs text-gray-500">No workouts selected.</div>
            )}
            {selectedWorkouts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                      {/* <div className="px-1 pt-1 text-xs font-medium line-clamp-1 flex items-center justify-between gap-2">
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
                      </div> */}
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

// function formatDate(d: any) {
//   if (!d) return '--'
//   const m = moment(d)
//   return m.isValid() ? m.format('YYYY-MM-DD') : String(d)
// }
function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
