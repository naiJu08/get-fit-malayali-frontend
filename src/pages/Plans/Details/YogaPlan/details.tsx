import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

import Icons from '../../../../components/common/icons'
import InfoBox from '../../../../components/app/alertBox/infoBox'
import CustomDrawer from '../../../../components/common/drawer'
import {
  getYogaPlanDetails,
  useAddYogaExercise,
  useAddYogaExercises,
  deleteYogaPlanExercise,
} from './api'
import { TabContainer } from '../../../../components/common'
import Tab from '../../../../components/common/tab/Tab'
import { TabItemProps } from '../../../../common/types'
import { useYogaList } from '../../../Yoga/api'
import { useSnackbarManager } from '../../../../components/common/snackbar'
import { useAuthStore } from '../../../../store/authStore'
import YogaPlanForm from './create'

const YOGA_CATEGORY_OPTIONS: { label: string; value: string }[] = [
  { label: 'Basic', value: 'basic' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
]

function DetailsTabContent({
  yp,
  loading,
  error,
}: {
  yp: any
  loading: boolean
  error: string
}) {
  return (
    <>
      {loading && (
        <div className="p-6">
          <InfoBox content="Loading yoga plan details..." />
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
            <DetailItem label="Title" value={yp?.title} />
            <DetailItem label="Plan Id" value={safeStr(yp?.plan_id)} />
            <DetailItem label="Day Number" value={safeStr(yp?.day_number)} />
            <DetailItem
              label="Exercises"
              value={safeStr(yp?.exercises_count)}
            />
            <DetailItem
              label="Total Duration (mins)"
              value={safeStr(yp?.total_duration)}
            />
            <DetailItem label="Description" value={safeStr(yp?.description)} />
          </div>
        </>
      )}
    </>
  )
}

function AssignTabContent({
  yp,
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

  const toggleSelectedExercise = (yogaId: any) => {
    if (!yogaId) return
    setSelectedExerciseIds((prev) =>
      prev.includes(yogaId)
        ? prev.filter((x) => x !== yogaId)
        : [...prev, yogaId]
    )
  }

  const handleRemoveSelected = async () => {
    if (!yp?.id || selectedExerciseIds.length === 0) return
    try {
      const res: any = await deleteYogaPlanExercise(yp.id, selectedExerciseIds)
      setRemovedExerciseIds((prev) => [...prev, ...selectedExerciseIds])
      setSelectedExerciseIds([])
      const msg = res?.message || 'Exercises removed successfully'
      enqueueSnackbar(msg, { variant: 'success' })
    } catch (e: any) {
      enqueueSnackbar(
        e?.response?.data?.message || 'Failed to remove exercises',
        { variant: 'error' }
      )
    }
  }

  const exercises = Array.isArray(yp?.exercises)
    ? yp.exercises
        .slice()
        .sort(
          (a: any, b: any) =>
            (a?.sequence_number ?? 0) - (b?.sequence_number ?? 0)
        )
        .filter(
          (ex: any) =>
            !removedExerciseIds.includes(ex?.yoga_id || ex?.yoga?.id || ex?.id)
        )
    : []

  return (
    <>
      {loading && (
        <div className="p-6">
          <InfoBox content="Loading yoga plan details..." />
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
            <div className="flex items-center gap-2 text-[11px] text-gray-600">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Duration
              </span>
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-3 place-items-stretch">
              {exercises.map((ex: any) => {
                const rawUrl =
                  ex?.video_url ||
                  ex?.workout_video_url ||
                  ex?.workout?.video_url ||
                  ''
                const url = String(rawUrl || '')
                const embed = getEmbedUrl(url)
                const yogaIdForEx = ex?.yoga_id || ex?.yoga?.id || ex?.id
                const checked = selectedExerciseIds.includes(yogaIdForEx)
                const durationLabel = getYogaDurationLabel(ex)
                return (
                  <div
                    key={ex?.id}
                    className="border rounded bg-white overflow-hidden w-full"
                  >
                    <div className="relative w-full h-36 bg-black/5">
                      {embed ? (
                        <iframe
                          src={embed}
                          title={`Yoga Video ${ex?.yoga_id ?? ex?.workout_id ?? ex?.id}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : url ? (
                        <video
                          className="w-full h-full object-cover rounded"
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
                          <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-600/90 text-white px-2 py-0.5 font-medium backdrop-blur">
                            <span className="w-2 h-2 rounded-full bg-white" />
                            {durationLabel}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1 text-xs flex items-center justify-between gap-2">
                      <div className="font-medium line-clamp-1">
                        {getYogaDisplayName(
                          ex?.workout_name ||
                            ex?.name ||
                            ex?.title ||
                            ex?.yoga_name
                        )}
                      </div>
                      {!isNutritionist && (
                        <input
                          type="checkbox"
                          className="shrink-0"
                          checked={checked}
                          onChange={() => toggleSelectedExercise(yogaIdForEx)}
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

          {/* {selectedWorkouts?.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-semibold mb-3">
                Selected Yoga Preview
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
                      <div className="px-3 pb-2 text-xxs text-gray-500 break-all">
                        {url || '--'}
                      </div>
                      {embed ? (
                        <div className="aspect-video w-full">
                          <iframe
                            src={embed}
                            title={`Yoga Video ${w?.id}`}
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

export default function YogaPlanDetails() {
  const { id, plan_id } = useParams()
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
  const [autoSelectEnabled, setAutoSelectEnabled] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const selectAllNextYogasRef = useRef(false)
  const [assigning, setAssigning] = useState<boolean>(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [editPlanOpen, setEditPlanOpen] = useState(false)
  const { mutateAsync: addYogaExerciseAsync } = useAddYogaExercise()
  const { mutateAsync: addYogaExercisesAsync } = useAddYogaExercises()
  const { enqueueSnackbar } = useSnackbarManager()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await getYogaPlanDetails(String(id))
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.response?.data?.message || 'Failed to load yoga plan')
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

  const yp = data?.yoga_plan || data || {}
  const refreshDetails = async () => {
    try {
      setLoading(true)
      const res = await getYogaPlanDetails(String(id))
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  // Load yogas for assignment
  const yogaListParams: any = {
    page: 1,
    per_page: 99999,
  }
  if (categoryFilter) {
    yogaListParams.category = categoryFilter
  }
  const { data: yogasResp, isFetching: yogasLoading } =
    useYogaList(yogaListParams)
  const yogas = yogasResp?.yogas ?? []

  const assignedYogaIds = new Set(
    Array.isArray(yp?.exercises)
      ? yp.exercises
          .map((ex: any) => ex?.yoga_id || ex?.yoga?.id || null)
          .filter((exId: any) => exId !== null && exId !== undefined)
      : []
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

  const toSelectableYoga = (yoga: any) => ({
    id: yoga?.id,
    name: getYogaDisplayName(
      yoga?.name || yoga?.title || yoga?.yoga_name || yoga?.workout_name
    ),
    video_url:
      yoga?.video_url ||
      yoga?.yoga?.video_url ||
      yoga?.workout_video_url ||
      yoga?.workout?.video_url ||
      '',
  })

  const isSelected = (wid: any) => selectedWorkouts.some((w) => w?.id === wid)
  const toggleSelected = (w: any) => {
    setAutoSelectEnabled(false)
    setSelectedWorkouts((prev) =>
      prev.some((x) => x?.id === w?.id)
        ? prev.filter((x) => x?.id !== w?.id)
        : [...prev, toSelectableYoga(w)]
    )
  }

  useEffect(() => {
    if (!assignOpen) return

    setDragIndex(null)
    setReviewOpen(false)

    const hasPrefills =
      Array.isArray(yp?.exercises) && (yp?.exercises?.length ?? 0) > 0

    if (selectedWorkouts.length === 0 && hasPrefills) {
      const map = new Map<any, any>()
      yp?.exercises?.forEach((ex: any) => {
        const exId = ex?.yoga_id || ex?.yoga?.id || ex?.id
        if (!exId || map.has(exId)) return
        map.set(exId, {
          id: exId,
          name: getYogaDisplayName(
            ex?.workout_name ||
              ex?.yoga_name ||
              ex?.name ||
              ex?.title ||
              ex?.yoga?.name
          ),
          video_url:
            ex?.video_url ||
            ex?.workout_video_url ||
            ex?.workout?.video_url ||
            ex?.yoga?.video_url ||
            '',
        })
      })
      const prefills = Array.from(map.values())
      if (prefills.length > 0) {
        setSelectedWorkouts(prefills)
        if (autoSelectEnabled) {
          setAutoSelectEnabled(false)
        }
        return
      }
    }

    if (hasPrefills && autoSelectEnabled) {
      setAutoSelectEnabled(false)
    } else if (
      !hasPrefills &&
      selectedWorkouts.length === 0 &&
      !autoSelectEnabled
    ) {
      setAutoSelectEnabled(true)
    }
  }, [assignOpen, yp?.exercises, selectedWorkouts.length, autoSelectEnabled])

  useEffect(() => {
    if (!assignOpen) {
      selectAllNextYogasRef.current = false
      return
    }
    if (yogasLoading) return
    if (!selectAllNextYogasRef.current) return

    if (!Array.isArray(yogas) || yogas.length === 0) {
      setSelectedWorkouts([])
      selectAllNextYogasRef.current = false
      return
    }

    const unique = new Map<string, any>()
    yogas.forEach((item: any) => {
      const normalized = toSelectableYoga(item)
      const normalizedId = normalized?.id
      if (normalizedId == null) return
      const key = String(normalizedId)
      if (!unique.has(key)) {
        unique.set(key, normalized)
      }
    })

    setSelectedWorkouts(Array.from(unique.values()))
    selectAllNextYogasRef.current = false
  }, [assignOpen, yogasLoading, yogas, toSelectableYoga])

  useEffect(() => {
    if (!assignOpen || !autoSelectEnabled || yogasLoading) return

    const nextSelections = yogas
      .filter((y: any) => y?.id != null)
      .map((y: any) => toSelectableYoga(y))

    const hasDiff =
      nextSelections.length !== selectedWorkouts.length ||
      nextSelections.some(
        (item: any, idx: number) => item.id !== selectedWorkouts[idx]?.id
      )

    if (hasDiff) {
      setSelectedWorkouts(nextSelections)
    }
  }, [assignOpen, autoSelectEnabled, yogasLoading, yogas, selectedWorkouts])

  useEffect(() => {
    if (currentTab !== 'assign') {
      setAssignOpen(false)
      setReviewOpen(false)
    }
  }, [currentTab])

  const handleNext = () => {
    if (selectedWorkouts.length === 0) return
    setReviewOpen(true)
    setAssignOpen(false)
  }

  const handleBulkAssign = async () => {
    if (!yp?.id || selectedWorkouts.length === 0) return
    setAssigning(true)
    try {
      const selectedIds = new Set(
        selectedWorkouts
          .map((w: any) => w?.id)
          .filter((x: any) => x !== null && x !== undefined)
      )
      const toRemove = (
        Array.from(assignedYogaIds) as (string | number)[]
      ).filter((exId) => !selectedIds.has(exId))
      if (toRemove.length > 0) {
        await deleteYogaPlanExercise(yp.id, toRemove)
      }

      // Mirror workout-plan behavior: treat the checked list as the source of truth
      // (already assigned + newly checked), in the visual order.
      const items = selectedWorkouts
        .filter((w: any) => w?.id != null)
        .map((w: any, idx: number) => ({
          yoga_id: w.id,
          sequence_number: idx + 1,
        }))

      let bulkRes: any
      try {
        bulkRes = await addYogaExercisesAsync({
          id: yp.id,
          payload: {
            exercises: items,
            yogas: items,
          },
        })
      } catch (_bulkErr: any) {
        // Fallback to existing API behavior if backend doesn't support bulk payload.
        await Promise.all(
          items.map((it: any) =>
            addYogaExerciseAsync({
              id: yp.id,
              payload: {
                exercise: it,
              },
            })
          )
        )
      }
      await refreshDetails()
      setReviewOpen(false)
      setSearchParams({ tab: 'assign' })
      const successMsg = bulkRes?.message || 'Yoga added successfully'
      enqueueSnackbar(successMsg, { variant: 'success' })
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message || 'Failed to add yoga', {
        variant: 'error',
      })
    } finally {
      setAssigning(false)
      setDragIndex(null)
      setCategoryFilter('')
    }
  }

  // Drag and drop handlers for reordering selected videos in Review & Order
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

  const tabs: TabItemProps[] = [
    { id: 'details', label: 'Details' },
    { id: 'assign', label: 'Exercises' },
  ]

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              navigate(`/plans/${yp?.plan_id || plan_id}/yogaplan`)
            }
            aria-label="Back"
          >
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">
            Yoga Plan Details - {yp?.plan_name}
          </h1>
        </div>
        {currentTab === 'assign' && !isNutritionist && (
          <div>
            <button
              className="px-3 py-1 text-sm border rounded btn-primary"
              onClick={() => {
                setAssignOpen(true)
              }}
            >
              Assign
            </button>
          </div>
        )}
      </div>

      <div className="no-tab-bg mb-4">
        <TabContainer
          data={tabs}
          activeTab={currentTab}
          onClick={(item) => {
            const next = item.id === 'assign' ? 'assign' : 'details'
            setSearchParams(next === 'assign' ? { tab: 'assign' } : {})
          }}
        >
          {currentTab === 'details' && !isNutritionist && (
            <div className="flex justify-end mb-4">
              <button
                className="px-4 py-2 text-sm border rounded btn-primary"
                onClick={() => setEditPlanOpen(true)}
              >
                Edit Plan
              </button>
            </div>
          )}
          <Tab id="details">
            <DetailsTabContent yp={yp} loading={loading} error={error} />
          </Tab>
          <Tab id="assign">
            <AssignTabContent
              yp={yp}
              loading={loading}
              error={error}
              selectedWorkouts={selectedWorkouts}
              getEmbedUrl={getEmbedUrl}
            />
          </Tab>
        </TabContainer>
      </div>

      <CustomDrawer
        open={assignOpen}
        handleClose={() => {
          setAssignOpen(false)
          setCategoryFilter('')
        }}
        className="w-screen max-w-[100vw]"
        unmountOnClose
        title={'Assign Yoga'}
        handleSubmit={handleNext}
        disableSubmit={selectedWorkouts.length === 0}
        hideSubmit={selectedWorkouts.length === 0}
        actionLoader={false}
        actionLabel={'Next'}
      >
        <div className="w-full">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-end gap-4 md:ml-auto">
              {/* Duration */}
              <div className="flex items-center gap-2 text-[11px] text-gray-600 mb-1">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Duration
                </span>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600">Category</label>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={categoryFilter}
                  onChange={(e) => {
                    const nextCategory = e.target.value
                    const changed =
                      String(nextCategory ?? '') !==
                      String(categoryFilter ?? '')
                    setCategoryFilter(nextCategory)
                    if (assignOpen && changed) {
                      selectAllNextYogasRef.current = true
                      setSelectedWorkouts([])
                      setAutoSelectEnabled(false)
                    }
                  }}
                >
                  <option value="">All</option>
                  {YOGA_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {yogasLoading && (
              <div className="text-xs text-gray-500 p-2">Loading...</div>
            )}
            {!yogasLoading && yogas.length === 0 && (
              <div className="text-xs text-gray-500 p-2">No yoga found.</div>
            )}

            {!yogasLoading && yogas.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-4">
                {yogas.map((w: any) => {
                  const url = w?.video_url || ''
                  const embed = getEmbedUrl(url)
                  const checked = isSelected(w?.id)
                  const durationLabel = getYogaDurationLabel(w)
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
                      <div className="relative w-full h-40 bg-black/5">
                        {embed ? (
                          <iframe
                            src={embed}
                            title={`Yoga Video ${w?.id}`}
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
                            <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-600/90 text-white px-2 py-0.5 font-medium backdrop-blur">
                              <span className="w-2 h-2 rounded-full bg-white" />
                              {durationLabel}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2 text-sm flex items-start justify-between gap-2">
                        <div className="font-medium line-clamp-1">
                          {getYogaDisplayName(
                            w?.name ||
                              w?.title ||
                              w?.yoga_name ||
                              w?.workout_name
                          )}
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
          </div>
        </div>
      </CustomDrawer>

      <CustomDrawer
        open={reviewOpen}
        handleClose={() => setReviewOpen(false)}
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
              appear in the yogaplan, then click{' '}
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
                        {i + 1}. {getYogaDisplayName(w?.name)}
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

      <YogaPlanForm
        isOpen={editPlanOpen}
        handleClose={() => {
          setEditPlanOpen(false)
          refreshDetails()
        }}
        edit
        rowData={yp}
        planId={yp?.plan_id}
        onSuccess={(res?: any) => {
          const msg = res?.message || 'Yoga plan updated successfully'
          enqueueSnackbar(msg, { variant: 'success' })
        }}
      />
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

function getYogaDisplayName(value?: any) {
  const raw =
    value === null || value === undefined || value === ''
      ? 'Untitled'
      : String(value)
  return raw.slice(0, 1).toUpperCase() + raw.slice(1).toLowerCase()
}

function getYogaDurationLabel(item: any) {
  const raw =
    item?.duration_minutes ??
    item?.yoga_duration_minutes ??
    item?.duration ??
    item?.yoga?.duration_minutes ??
    item?.workout_duration ??
    item?.duration_min ??
    item?.duration_minute

  const value = raw === null || raw === undefined ? undefined : Number(raw)
  if (value === undefined || Number.isNaN(value) || value <= 0) return null

  if (value >= 1) {
    const whole = Number.isInteger(value)
    return `${whole ? value : value.toFixed(2)} min`
  }

  const seconds = Math.max(1, Math.round(value * 60))
  return `${seconds} sec`
}

// import moment from 'moment'
