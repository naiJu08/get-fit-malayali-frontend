// import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

import { useQuery } from '@tanstack/react-query'
import { AutoComplete } from 'qbs-core'

import Icons from '../../../../components/common/icons'
import InfoBox from '../../../../components/app/alertBox/infoBox'
import { useSnackbarManager } from '../../../../components/common/snackbar'
import {
  getWorkoutPlanDetails,
  deleteWorkoutPlanExercise,
  getWorkoutPlanSubcategories,
} from './api'
import CustomDrawer from '../../../../components/common/drawer'
import Tab from '../../../../components/common/tab/Tab'
import { TabItemProps } from '../../../../common/types'
import { useWorkoutList } from '../../../Workout/api'
import { useAuthStore } from '../../../../store/authStore'
import { useAddExercises } from './api'
import { TabContainer } from '../../../../components/common'
import apiUrl from '../../../../apis/api.url'
import { getData } from '../../../../apis/api.helpers'

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

  const groupedAssignedExercises = useMemo(() => {
    if (!Array.isArray(exercises) || exercises.length === 0) return []

    const groups = new Map<string, any[]>()

    exercises.forEach((ex: any) => {
      const catName =
        ex?.category?.main_category?.name ??
        ex?.category?.name ??
        ex?.workout?.category?.main_category?.name ??
        ex?.workout?.category_name ??
        'Others'

      const subName =
        ex?.category?.name ??
        ex?.workout?.category?.name ??
        ex?.workout?.subcategory_name ??
        ex?.workout?.subcategory?.name ??
        'Others'

      const legendText = `${catName} - ${subName}`

      if (!groups.has(legendText)) groups.set(legendText, [])
      groups.get(legendText)!.push(ex)
    })

    return Array.from(groups.entries()).map(([legend, items]) => ({
      legend,
      items,
    }))
  }, [exercises])

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
            <div className="flex flex-col gap-4">
              {groupedAssignedExercises.map((group) => (
                <fieldset
                  key={group.legend}
                  className="border border-gray-300 rounded-xl p-4 bg-white"
                >
                  <legend className="px-2 text-md font-semibold text-gray-600">
                    {group.legend}
                  </legend>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-3 place-items-stretch">
                    {group.items.map((ex: any) => {
                      const rawUrl =
                        ex?.video_url ||
                        ex?.workout_video_url ||
                        ex?.workout?.video_url ||
                        ''
                      const url = String(rawUrl || '')
                      const embed = getEmbedUrl(url)
                      const workoutIdForEx =
                        ex?.workout_id || ex?.workout?.id || ex?.id
                      const checked =
                        selectedExerciseIds.includes(workoutIdForEx)

                      return (
                        <div
                          key={ex?.id}
                          className="border rounded bg-white overflow-hidden w-full"
                        >
                          {embed ? (
                            <div className="w-full h-36 bg-black/5">
                              <iframe
                                src={embed}
                                title={`Workout Video ${
                                  ex?.workout_id ?? ex?.id
                                }`}
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
                </fieldset>
              ))}
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
  const [wpPerPage] = useState<number>(9999)
  const [wpSearch, setWpSearch] = useState<string>('')
  const [assigning, setAssigning] = useState<boolean>(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragGroup, setDragGroup] = useState<string | null>(null)
  // const { mutateAsync: addExerciseAsync } = useAddExercise()
  const { mutateAsync: addExercisesAsync } = useAddExercises()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'

  const { data: categoriesResponse } = useQuery(
    ['workout_categories_for_assign'],
    () => getData(apiUrl.CATEGORIES),
    {
      staleTime: 5 * 60 * 1000,
    }
  )

  const normalizedCategories = useMemo(() => {
    const categories =
      (categoriesResponse as any)?.categories ??
      (categoriesResponse as any)?.category ??
      categoriesResponse
    if (Array.isArray(categories)) return categories
    return []
  }, [categoriesResponse])

  const categoryOptions = useMemo(
    () =>
      normalizedCategories.map((cat: any) => ({
        id: cat?.id,
        name: cat?.name,
        subcategories: Array.isArray(cat?.subcategories)
          ? cat.subcategories
          : [],
      })),
    [normalizedCategories]
  )

  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | string | undefined
  >(undefined)
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('')
  const [selectedSubcategories, setSelectedSubcategories] = useState<any[]>([])

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

  // Derive selected subcategory IDs from multi-select
  const selectedSubcategoryIds = useMemo(
    () =>
      (selectedSubcategories || [])
        .map((s: any) => s?.id)
        .filter((id: any) => id != null),
    [selectedSubcategories]
  )

  // Build params for workouts API including category and subcategory filters
  const workoutListParams = useMemo(() => {
    const params: any = {
      page: wpPage,
      per_page: wpPerPage,
      search: wpSearch,
    }

    if (selectedCategoryId) {
      params.category_id = selectedCategoryId
    }

    if (selectedSubcategoryIds.length) {
      params.subcategory_ids = selectedSubcategoryIds.join(',')
    }

    return params
  }, [wpPage, wpPerPage, wpSearch, selectedCategoryId, selectedSubcategoryIds])

  // Load workouts for assignment from backend with category/subcategory filters
  const { data: workoutsResp, isFetching: workoutsLoading } = useWorkoutList(
    workoutListParams as any
  )

  const workouts = (workoutsResp as any)?.workouts ?? []

  useEffect(() => {
    if (!assignOpen) return
    if (!Array.isArray(workouts)) {
      setSelectedWorkouts([])
      return
    }

    // Only consider workouts from the current category/subcategory
    // filter as part of the selection for this Assign session.
    // Previously assigned workouts (from wp.exercises) are not
    // auto-included, so the Review drawer reflects only the
    // last-selected categories/subcategories.
    const map = new Map<any, any>()

    workouts.forEach((w: any) => {
      if (w && w.id != null) {
        map.set(w.id, w)
      }
    })

    setSelectedWorkouts(Array.from(map.values()))
  }, [assignOpen, workouts])

  // You can proceed to Review if either:
  // - at least one workout is explicitly selected by the user.
  const canProceedToReview = selectedWorkouts.length > 0
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

  const getWorkoutGroupKey = (w: any) => {
    const rawSub =
      w?.subcategory?.name ??
      w?.subcategory_name ??
      w?.subcategory ??
      w?.category?.name ??
      'Others'

    return String(rawSub || 'Others')
  }

  // Group workouts by subcategory for the Assign drawer so that
  // workouts sharing the same subcategory appear in a single wrapper.
  const groupedWorkouts = useMemo(() => {
    if (!Array.isArray(workouts) || workouts.length === 0) return []

    // Sort workouts by category/subcategory priority so that higher
    // priority categories are shown first in the Assign drawer.
    const sorted = workouts.slice().sort((a: any, b: any) => {
      const pa = a?.category?.priority ?? 9999
      const pb = b?.category?.priority ?? 9999
      if (pa === pb) return 0
      return pa < pb ? -1 : 1
    })

    const groups = new Map<string, any[]>()

    sorted.forEach((w: any) => {
      const key = getWorkoutGroupKey(w)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(w)
    })

    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      items,
    }))
  }, [workouts])

  // Group selected workouts by subcategory for the Review drawer so that
  // ordering is managed within each subcategory only.
  const groupedSelectedWorkouts = useMemo(() => {
    if (!Array.isArray(selectedWorkouts) || selectedWorkouts.length === 0)
      return []

    const groups = new Map<string, any[]>()
    const priorities = new Map<string, number>()

    selectedWorkouts.forEach((w: any) => {
      const key = getWorkoutGroupKey(w)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(w)

      // Capture the category priority for this group (first value wins).
      if (!priorities.has(key)) {
        const p = w?.category?.priority ?? 9999
        priorities.set(key, p)
      }
    })

    return Array.from(groups.entries())
      .map(([name, items]) => ({
        name,
        items,
        priority: priorities.get(name) ?? 9999,
      }))
      .sort((a, b) => a.priority - b.priority)
  }, [selectedWorkouts])

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
      // selection is now derived in the workouts/useEffect above
    }
  }, [assignOpen, wp?.exercises, selectedWorkouts.length])

  const handleNext = () => {
    // Only move to Review drawer if there is at least one explicitly
    // selected workout. The Review drawer always reflects exactly the
    // current selectedWorkouts list.
    if (!canProceedToReview) return
    // Before opening the Review drawer, sort the selected workouts
    // by category priority so that priority 1 appears first, then 2,
    // then 3, etc. This defines the initial order; the user can still
    // reorder via drag-and-drop afterwards.
    setSelectedWorkouts((prev) => {
      const next = prev.slice()
      next.sort((a: any, b: any) => {
        const pa = a?.category?.priority ?? 9999
        const pb = b?.category?.priority ?? 9999
        if (pa === pb) return 0
        return pa < pb ? -1 : 1
      })
      return next
    })

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

  const onDragStart = (index: number, groupName: string) => {
    setDragIndex(index)
    setDragGroup(groupName)
  }
  const onDragOver = (e: any) => {
    e.preventDefault()
  }
  const onDrop = (index: number, groupName: string) => {
    if (dragIndex === null || dragIndex === index || dragGroup !== groupName) {
      setDragIndex(null)
      setDragGroup(null)
      return
    }
    setSelectedWorkouts((prev) => {
      const next = prev.slice()
      const [item] = next.splice(dragIndex, 1)
      next.splice(index, 0, item)
      return next
    })
    setDragIndex(null)
    setDragGroup(null)
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
        disableSubmit={!canProceedToReview}
        hideSubmit={!canProceedToReview}
        actionLoader={false}
        actionLabel={'Next'}
      >
        <div className="w-full">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div className="text-md font-bold">Workouts</div>
              <div className="flex flex-col md:flex-row md:items-end gap-2 w-full md:w-auto">
                <div className="flex-1 min-w-[180px]">
                  <AutoComplete
                    placeholder="Select category"
                    desc="name"
                    descId="id"
                    type="custom_search_select"
                    data={categoryOptions}
                    value={selectedCategoryName}
                    name="assign_category"
                    onChange={(option: any) => {
                      const id = option?.id ?? option?.value ?? ''
                      const name = option?.name ?? option?.label ?? ''
                      setSelectedCategoryId(id || undefined)
                      setSelectedCategoryName(name || '')
                      setSelectedSubcategories([])
                    }}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <AutoComplete
                    placeholder="Select subcategories"
                    desc="value"
                    descId="id"
                    type="auto_suggestion"
                    isMultiple={true}
                    selectedItems={selectedSubcategories}
                    value={''}
                    async={true}
                    initialLoad={true}
                    paginationEnabled={false}
                    name="assign_subcategories"
                    getData={async (key?: string) => {
                      if (!selectedCategoryId) return []

                      const raw =
                        await getWorkoutPlanSubcategories(selectedCategoryId)

                      let options = Array.isArray(raw) ? raw : []

                      if (key) {
                        const lower = String(key).toLowerCase()
                        options = options.filter((o: any) =>
                          String(o.value || '')
                            .toLowerCase()
                            .includes(lower)
                        )
                      }

                      return options
                    }}
                    onChange={(value?: any | any[]) => {
                      if (!value) {
                        setSelectedSubcategories([])
                      } else if (Array.isArray(value)) {
                        setSelectedSubcategories(value)
                      } else {
                        setSelectedSubcategories([value])
                      }
                    }}
                  />
                </div>
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
              <div className="flex flex-col gap-4">
                {groupedWorkouts.map((group) => {
                  const first = group.items?.[0]
                  const categoryName =
                    first?.category?.main_category?.name ??
                    first?.category_name ??
                    'Others'
                  const legendText = categoryName
                    ? `${categoryName} - ${group.name}`
                    : group.name

                  return (
                    <fieldset
                      key={group.name}
                      className="border border-gray-300 rounded-xl p-4 bg-white"
                    >
                      {/* Category - Subcategory name on border */}
                      <legend className="px-2 text-md font-semibold text-gray-600">
                        {legendText}
                      </legend>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-4">
                        {group.items.map((w: any) => {
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
                                  (
                                    e.target as HTMLElement
                                  ).tagName.toLowerCase() !== 'input'
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
                                    allowFullScreen
                                  />
                                </div>
                              ) : url ? (
                                <video
                                  className="w-full h-32 object-cover"
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
                                  checked={checked}
                                  onChange={() => toggleSelected(w)}
                                  className="cursor-pointer"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </fieldset>
                  )
                })}
              </div>
            )}
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
          setDragGroup(null)
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
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <span className="text-blue-600 text-xl">🎬</span>
            <span className="text-gray-600  bg-clip-text ">
              Drag and drop the videos below into the order you want them to
              appear in the workoutplan, then click{' '}
              <span className="font-semibold">Assign</span> to save this
              sequence.
            </span>
          </h2>
          {selectedWorkouts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {groupedSelectedWorkouts.map((group) => {
                const first = group.items?.[0]
                const categoryName =
                  first?.category?.main_category?.name ??
                  first?.category_name ??
                  'Others'
                const legendText = categoryName
                  ? `${categoryName} - ${group.name}`
                  : group.name

                return (
                  <fieldset
                    key={group.name}
                    className="border border-gray-300 rounded-xl p-4 bg-white"
                  >
                    <legend className="px-2 text-md font-semibold text-gray-600">
                      {legendText}
                    </legend>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-5">
                      {group.items.map((w: any) => {
                        const index = selectedWorkouts.findIndex(
                          (it) => it?.id === w?.id
                        )
                        if (index === -1) return null

                        const embed = getEmbedUrl(w?.video_url)
                        const url = w?.video_url || ''

                        return (
                          <div
                            key={w?.id}
                            draggable
                            onDragStart={() => onDragStart(index, group.name)}
                            onDragOver={(e) => onDragOver(e)}
                            onDrop={() => onDrop(index, group.name)}
                            className="rounded-xl shadow-lg bg-white border hover:shadow-xl transition-shadow cursor-grab active:cursor-grabbing overflow-hidden"
                          >
                            <div className="px-4 py-2 bg-gray-50 border-b text-sm font-semibold flex justify-between items-center">
                              <span className="line-clamp-1">
                                {index + 1}. {w?.name}
                              </span>
                            </div>

                            {embed ? (
                              <iframe
                                className="w-full h-30"
                                src={embed}
                                allowFullScreen
                              ></iframe>
                            ) : url ? (
                              <video
                                src={url}
                                controls
                                muted
                                className="w-full h-30 object-cover"
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
                  </fieldset>
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
