import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import InfoBox from '../../../components/app/alertBox/infoBox'
import { getData } from '../../../apis/api.helpers'
import apiUrl from '../../../apis/api.url'
import { useAuthStore } from '../../../store/authStore'
import { shortDate } from '../../../utilities/format'

type Props = {
  subscriptionId?: string | number | null
  role?: string
}

export interface AssignmentHistoryItem {
  id: string | number
  type: 'diet' | 'workout' | 'yoga'
  template_id?: string | number | null
  template_name?: string | null
  start_date: string
  end_date: string
  assigned_by_role?: string | null
  assigned_by_id?: string | number | null
  created_at?: string
}

type FilterType = 'all' | 'diet' | 'workout' | 'yoga'

const AssignmentsHistory: React.FC<Props> = ({ subscriptionId, role }) => {
  const navigate = useNavigate()
  const currentLoginRole = useAuthStore((s: any) =>
    s.roleData?.name?.toLowerCase?.()
  )
  const effectiveRole = (role || currentLoginRole || '').toLowerCase()

  const isSuperAdmin =
    effectiveRole === 'superadmin' || effectiveRole === 'admin'
  const isNutritionist = effectiveRole === 'nutritionist'
  const isPhysiotherapist =
    effectiveRole === 'physiotherapist' || effectiveRole === 'physio'
  const isYogist =
    effectiveRole === 'yogist' ||
    effectiveRole === 'yoga_trainer' ||
    effectiveRole === 'yoga'

  // superadmin and nutritionist see full history
  const canSeeDiet = isSuperAdmin || isNutritionist
  const canSeeWorkout = isSuperAdmin || isNutritionist || isPhysiotherapist
  const canSeeYoga = isSuperAdmin || isNutritionist || isYogist

  const [dietHistory, setDietHistory] = useState<AssignmentHistoryItem[]>([])
  const [workoutHistory, setWorkoutHistory] = useState<AssignmentHistoryItem[]>(
    []
  )
  const [yogaHistory, setYogaHistory] = useState<AssignmentHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Determine initial filter based on restricted single-role access
  useEffect(() => {
    if (isPhysiotherapist && !isSuperAdmin && !isNutritionist) {
      setActiveFilter('workout')
    } else if (isYogist && !isSuperAdmin && !isNutritionist) {
      setActiveFilter('yoga')
    } else {
      setActiveFilter('all')
    }
  }, [isPhysiotherapist, isYogist, isSuperAdmin, isNutritionist])

  useEffect(() => {
    if (!subscriptionId && subscriptionId !== 0) return

    let mounted = true
    const fetchHistories = async () => {
      try {
        setLoading(true)
        setError(null)

        const promises: Promise<any>[] = []

        if (canSeeDiet) {
          promises.push(
            getData(
              `${apiUrl.SUBSCRIPTIONS}/${subscriptionId}/diet_template_history`
            ).catch((err) => {
              console.warn('Failed to load diet history', err)
              return { diet_template_history: [] }
            })
          )
        } else {
          promises.push(Promise.resolve(null))
        }

        if (canSeeWorkout) {
          promises.push(
            getData(
              `${apiUrl.SUBSCRIPTIONS}/${subscriptionId}/workout_template_history`
            ).catch((err) => {
              console.warn('Failed to load workout history', err)
              return { workout_template_history: [] }
            })
          )
        } else {
          promises.push(Promise.resolve(null))
        }

        if (canSeeYoga) {
          promises.push(
            getData(
              `${apiUrl.SUBSCRIPTIONS}/${subscriptionId}/yoga_template_history`
            ).catch((err) => {
              console.warn('Failed to load yoga history', err)
              return { yoga_template_history: [] }
            })
          )
        } else {
          promises.push(Promise.resolve(null))
        }

        const [dietRes, workoutRes, yogaRes] = await Promise.all(promises)

        if (!mounted) return

        if (dietRes) {
          const rawDiet =
            dietRes?.diet_template_history ||
            (Array.isArray(dietRes) ? dietRes : [])
          const formattedDiet: AssignmentHistoryItem[] = rawDiet.map(
            (item: any) => ({
              id: `diet-${item.id}`,
              type: 'diet',
              template_id: item.diet_plan_template_id,
              template_name:
                item.diet_plan_template_name || item.diet_plan_template?.name,
              start_date: item.start_date,
              end_date: item.end_date,
              assigned_by_role: item.assigned_by_role,
              assigned_by_id: item.assigned_by_id,
              created_at: item.created_at,
            })
          )
          setDietHistory(formattedDiet)
        }

        if (workoutRes) {
          const rawWorkout =
            workoutRes?.workout_template_history ||
            (Array.isArray(workoutRes) ? workoutRes : [])
          const formattedWorkout: AssignmentHistoryItem[] = rawWorkout.map(
            (item: any) => ({
              id: `workout-${item.id}`,
              type: 'workout',
              template_id: item.workout_template_id,
              template_name:
                item.workout_template_name || item.workout_template?.name,
              start_date: item.start_date,
              end_date: item.end_date,
              assigned_by_role: item.assigned_by_role,
              assigned_by_id: item.assigned_by_id,
              created_at: item.created_at,
            })
          )
          setWorkoutHistory(formattedWorkout)
        }

        if (yogaRes) {
          const rawYoga =
            yogaRes?.yoga_template_history ||
            (Array.isArray(yogaRes) ? yogaRes : [])
          const formattedYoga: AssignmentHistoryItem[] = rawYoga.map(
            (item: any) => ({
              id: `yoga-${item.id}`,
              type: 'yoga',
              template_id: item.yoga_template_id,
              template_name:
                item.yoga_template_name || item.yoga_template?.name,
              start_date: item.start_date,
              end_date: item.end_date,
              assigned_by_role: item.assigned_by_role,
              assigned_by_id: item.assigned_by_id,
              created_at: item.created_at,
            })
          )
          setYogaHistory(formattedYoga)
        }
      } catch (err: any) {
        if (!mounted) return
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Failed to load assignments history'
        )
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchHistories()

    return () => {
      mounted = false
    }
  }, [subscriptionId, canSeeDiet, canSeeWorkout, canSeeYoga])

  // Combine and sort assignments
  const allAssignments = useMemo(() => {
    const combined: AssignmentHistoryItem[] = []
    if (canSeeDiet) combined.push(...dietHistory)
    if (canSeeWorkout) combined.push(...workoutHistory)
    if (canSeeYoga) combined.push(...yogaHistory)

    return combined.sort((a, b) => {
      const dateA = new Date(a.start_date || a.created_at || '').getTime()
      const dateB = new Date(b.start_date || b.created_at || '').getTime()
      return dateB - dateA
    })
  }, [
    dietHistory,
    workoutHistory,
    yogaHistory,
    canSeeDiet,
    canSeeWorkout,
    canSeeYoga,
  ])

  // Filtered by active filter & search query
  const filteredAssignments = useMemo(() => {
    return allAssignments.filter((item) => {
      if (activeFilter !== 'all' && item.type !== activeFilter) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const nameMatch = (item.template_name || '')
          .toLowerCase()
          .includes(query)
        const roleMatch = (item.assigned_by_role || '')
          .toLowerCase()
          .includes(query)
        const typeMatch = item.type.toLowerCase().includes(query)
        return nameMatch || roleMatch || typeMatch
      }
      return true
    })
  }, [allAssignments, activeFilter, searchQuery])

  const typeDetails = {
    diet: {
      label: 'Diet',
      emoji: '🥗',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
      routePrefix: '/diet-templates',
    },
    workout: {
      label: 'Workout',
      emoji: '🏋️',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      dotClass: 'bg-blue-500',
      routePrefix: '/workout-templates',
    },
    yoga: {
      label: 'Yoga',
      emoji: '🧘',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      dotClass: 'bg-purple-500',
      routePrefix: '/yoga-templates',
    },
  }

  const getStatus = (startStr: string, endStr: string) => {
    const today = moment().startOf('day')
    const start = moment(startStr).startOf('day')
    const end = moment(endStr).endOf('day')

    if (today.isBetween(start, end, undefined, '[]')) {
      return {
        label: 'Active Today',
        className:
          'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold',
      }
    }
    if (today.isBefore(start)) {
      return {
        label: 'Upcoming',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      }
    }
    return {
      label: 'Past',
      className: 'bg-gray-100 text-gray-600 border-gray-200',
    }
  }

  const calculateDuration = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return null
    const start = moment(startStr)
    const end = moment(endStr)
    const days = end.diff(start, 'days') + 1
    return days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}` : null
  }

  if (!subscriptionId && subscriptionId !== 0) {
    return (
      <div className="p-4">
        <InfoBox content="No active subscription found for this user." />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-10 bg-gray-100 rounded-xl animate-pulse w-1/3" />
        <div className="h-64 bg-gray-50 border rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <InfoBox content={error} />
      </div>
    )
  }

  const showFilterTabs =
    (canSeeDiet && canSeeWorkout) ||
    (canSeeDiet && canSeeYoga) ||
    (canSeeWorkout && canSeeYoga)

  return (
    <div className="p-4 space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-50 via-white to-blue-50/40 border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center text-xl shadow-xs font-bold">
            📋
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-gray-900">
              Assignments History
            </h3>
            <p className="text-xs text-gray-500">
              Timeline of diet, workout, and yoga template assignments for this
              subscription.
            </p>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {canSeeDiet && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span>🥗</span> {dietHistory.length} Diet
            </span>
          )}
          {canSeeWorkout && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span>🏋️</span> {workoutHistory.length} Workout
            </span>
          )}
          {canSeeYoga && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <span>🧘</span> {yogaHistory.length} Yoga
            </span>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-gray-200/80 rounded-xl shadow-2xs">
        {showFilterTabs ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({allAssignments.length})
            </button>
            {canSeeDiet && (
              <button
                type="button"
                onClick={() => setActiveFilter('diet')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeFilter === 'diet'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <span>🥗</span> Diet ({dietHistory.length})
              </button>
            )}
            {canSeeWorkout && (
              <button
                type="button"
                onClick={() => setActiveFilter('workout')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeFilter === 'workout'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <span>🏋️</span> Workout ({workoutHistory.length})
              </button>
            )}
            {canSeeYoga && (
              <button
                type="button"
                onClick={() => setActiveFilter('yoga')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeFilter === 'yoga'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <span>🧘</span> Yoga ({yogaHistory.length})
              </button>
            )}
          </div>
        ) : (
          <div className="text-xs font-semibold text-gray-700 flex items-center gap-2">
            <span>
              {isPhysiotherapist
                ? '🏋️ Workout Assignments'
                : isYogist
                  ? '🧘 Yoga Assignments'
                  : '🥗 Diet Assignments'}
            </span>
            <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
              {filteredAssignments.length}
            </span>
          </div>
        )}

        {/* Search input */}
        <div className="relative min-w-[200px] max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
          />
          <span className="absolute left-2.5 top-2 text-gray-400 text-xs">
            🔍
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      {filteredAssignments.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3 text-xl">
            📋
          </div>
          <h5 className="text-sm font-bold text-gray-800">
            No assignments found
          </h5>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No assignments match "${searchQuery}".`
              : 'There are no assignment history records recorded for this subscription yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                    Template Name
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                    End Date
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                    Assigned By
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                    Assigned On
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssignments.map((row) => {
                  const meta = typeDetails[row.type]
                  const status = getStatus(row.start_date, row.end_date)
                  const duration = calculateDuration(
                    row.start_date,
                    row.end_date
                  )

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Type Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`}
                          />
                          {meta.emoji} {meta.label}
                        </span>
                      </td>

                      {/* Template Name */}
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {row.template_name ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() =>
                                row.template_id &&
                                navigate(
                                  `${meta.routePrefix}/${row.template_id}`
                                )
                              }
                              className={`line-clamp-1 ${
                                row.template_id
                                  ? 'cursor-pointer hover:text-blue-600 hover:underline'
                                  : ''
                              }`}
                              title={row.template_name}
                            >
                              {row.template_name}
                            </span>
                            {row.template_id && (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `${meta.routePrefix}/${row.template_id}`
                                  )
                                }
                                className="text-gray-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                                title="View template"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">
                            Untitled Template
                          </span>
                        )}
                      </td>

                      {/* Start Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">
                        {row.start_date ? shortDate(row.start_date) : '--'}
                      </td>

                      {/* End Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">
                        {row.end_date ? shortDate(row.end_date) : '--'}
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {duration ? (
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md text-[11px] font-medium text-gray-700">
                            {duration}
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      {/* Assigned By */}
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {row.assigned_by_role ? (
                          <span className="capitalize bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium border border-slate-200">
                            {row.assigned_by_role}
                          </span>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </td>

                      {/* Assigned On */}
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 text-[11px]">
                        {row.created_at ? shortDate(row.created_at) : '--'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssignmentsHistory
