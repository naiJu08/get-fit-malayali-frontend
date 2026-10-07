import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomDrawer from '../../components/common/drawer'
import { getData, postData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { useSnackbarManager } from '../../components/common/snackbar'
import { shortDate } from '../../utilities/format'

type Props = {
  subscriptionId?: string | number | null
  currentName?: string
  currentTemplateId?: string | number | null
  onAssigned?: () => void
  readOnly?: boolean
}

interface WorkoutTemplateItem {
  id: string | number
  name: string
  description?: string
  duration_days?: number
  days_count?: number
  intensity_level?: string
  notes?: string
  thumbnail_url?: string
  created_at?: string
}

const getIntensityBadge = (level?: string) => {
  const norm = String(level || '').toLowerCase()
  if (norm.includes('begin')) {
    return {
      label: 'Beginner',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dot: 'bg-emerald-500',
    }
  }
  if (norm.includes('inter')) {
    return {
      label: 'Intermediate',
      bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      dot: 'bg-amber-500',
    }
  }
  if (norm.includes('adv')) {
    return {
      label: 'Advanced',
      bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dot: 'bg-rose-500',
    }
  }
  return {
    label: level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Standard',
    bg: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dot: 'bg-sky-500',
  }
}

// Deterministic pleasing gradient backgrounds for workout templates
const getGradientStyle = (id: number | string) => {
  const gradients = [
    'from-orange-500/20 via-amber-500/10 to-rose-500/20 text-orange-600',
    'from-emerald-500/20 via-teal-500/10 to-cyan-500/20 text-teal-600',
    'from-blue-500/20 via-indigo-500/10 to-violet-500/20 text-blue-600',
    'from-rose-500/20 via-pink-500/10 to-purple-500/20 text-rose-600',
    'from-amber-500/20 via-orange-500/10 to-yellow-500/20 text-amber-600',
    'from-cyan-500/20 via-blue-500/10 to-teal-500/20 text-cyan-600',
  ]
  const num = typeof id === 'number' ? id : parseInt(String(id), 10) || 0
  return gradients[Math.abs(num) % gradients.length]
}

export default function WorkoutTemplateAssign({
  subscriptionId,
  currentName,
  currentTemplateId,
  onAssigned,
  readOnly = false,
}: Props) {
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [templateId, setTemplateId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [templates, setTemplates] = useState<WorkoutTemplateItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const { enqueueSnackbar } = useSnackbarManager()

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchTemplates = async (
    pageNum: number,
    query: string,
    isInitial = false
  ) => {
    if (isInitial) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        per_page: '12',
      })
      if (query.trim()) params.set('search', query.trim())

      const res = await getData(
        `${apiUrl.WORKOUT_TEMPLATES}?${params.toString()}`
      )
      const items: WorkoutTemplateItem[] = res?.workout_templates ?? []
      const total = Number(res?.meta?.total_count ?? 0)
      const totalPages = Math.max(
        1,
        Number(res?.meta?.total_pages ?? Math.ceil(total / 12) ?? 1)
      )

      setTotalCount(total)
      setPage(pageNum)
      setHasMore(pageNum < totalPages)

      if (isInitial) {
        setTemplates(items)
      } else {
        setTemplates((prev) => {
          const seen = new Set(prev.map((item) => String(item.id)))
          const fresh = items.filter((item) => !seen.has(String(item.id)))
          return [...prev, ...fresh]
        })
      }
    } catch (err: any) {
      console.error('Failed to load workout templates', err)
      enqueueSnackbar('Failed to load workout templates', { variant: 'error' })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Load initial page whenever drawer opens or debounced search changes
  useEffect(() => {
    if (drawerOpen && subscriptionId) {
      setPage(1)
      fetchTemplates(1, debouncedSearch, true)
    }
  }, [drawerOpen, debouncedSearch, subscriptionId])

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (!sentinelRef.current || !drawerOpen) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchTemplates(page + 1, debouncedSearch, false)
        }
      },
      { threshold: 0.1, rootMargin: '120px' }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, page, debouncedSearch, drawerOpen])

  const selectedTemplate = useMemo(
    () => templates.find((t) => String(t.id) === String(templateId)),
    [templates, templateId]
  )

  if (!subscriptionId) return null

  const closeDrawer = () => {
    setDrawerOpen(false)
    setTemplateId('')
    setSearch('')
    setDebouncedSearch('')
  }

  const assign = async () => {
    if (!templateId) return
    try {
      setAssigning(true)
      await postData(
        `${apiUrl.SUBSCRIPTIONS}/${subscriptionId}/assign_workout_template`,
        { workout_template_id: Number(templateId) }
      )
      enqueueSnackbar('Workout template assigned successfully', {
        variant: 'success',
      })
      closeDrawer()
      onAssigned?.()
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.errors?.[0] ||
          error?.response?.data?.message ||
          'Unable to assign workout template',
        { variant: 'error' }
      )
    } finally {
      setAssigning(false)
    }
  }

  return (
    <>
      {/* Modern Banner Trigger */}
      <div className="border border-gray-200/80 rounded-xl p-3.5 bg-gradient-to-r from-gray-50/80 via-white to-orange-50/30 mb-3 shadow-xs transition-all hover:border-gray-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100/80 text-orange-600 flex items-center justify-center font-bold text-sm shadow-xs">
              🏋️
            </div>
            <div>
              <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Workout Template
              </div>
              <div className="text-xs text-gray-600 font-medium flex items-center gap-1.5 flex-wrap">
                <span>Current:</span>
                {currentName ? (
                  <div className="inline-flex items-center gap-1">
                    <span
                      onClick={() =>
                        currentTemplateId &&
                        navigate(`/workout-templates/${currentTemplateId}`)
                      }
                      className={`font-semibold text-primaryGreen bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 ${
                        currentTemplateId
                          ? 'cursor-pointer hover:underline hover:bg-teal-100/70'
                          : ''
                      }`}
                      title={
                        currentTemplateId
                          ? 'View Workout Template Details'
                          : undefined
                      }
                    >
                      {currentName}
                    </span>
                    {currentTemplateId && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/workout-templates/${currentTemplateId}`)
                        }
                        className="p-1 rounded-md text-teal-600 hover:text-teal-800 hover:bg-teal-100/80 transition-colors cursor-pointer"
                        title="Go to Workout Template"
                      >
                        <svg
                          className="w-3.5 h-3.5"
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
                    No template assigned
                  </span>
                )}
              </div>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-primaryGreen text-white text-xs font-semibold shadow-xs hover:bg-primaryGreen/90 transition-all flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    currentName
                      ? 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                      : 'M12 4v16m8-8H4'
                  }
                />
              </svg>
              {currentName ? 'Update Template' : 'Assign Template'}
            </button>
          )}
        </div>
      </div>

      {/* Assign Workout Template Drawer */}
      <CustomDrawer
        open={drawerOpen}
        handleClose={closeDrawer}
        className="w-screen max-w-[920px]"
        unmountOnClose
        title={
          currentName ? 'Update Workout Template' : 'Assign Workout Template'
        }
        handleSubmit={assign}
        disableSubmit={!templateId || assigning}
        actionLoader={assigning}
        actionLabel={
          selectedTemplate
            ? `Assign "${selectedTemplate.name}"`
            : currentName
              ? 'Update Template'
              : 'Assign Template'
        }
      >
        <div className="space-y-4">
          {/* Header Subtitle & Search Bar */}
          <div className="bg-gradient-to-r from-orange-50/50 via-white to-amber-50/50 border border-orange-100/80 rounded-xl p-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏋️</span>
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Select Workout Template
                </h4>
                <p className="text-[11px] text-gray-500">
                  {currentName
                    ? `Replacing active template: ${currentName}`
                    : 'Choose a workout template to assign to this subscription'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                {totalCount} {totalCount === 1 ? 'Template' : 'Templates'}
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-10 py-2.5 text-xs bg-white border border-gray-200 rounded-xl shadow-xs placeholder-gray-400 focus:outline-none focus:border-primaryGreen focus:ring-2 focus:ring-primaryGreen/20 transition-all"
              value={search}
              placeholder="Search workout templates by name..."
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Cards Grid Listing */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="border border-gray-100 rounded-2xl p-4 bg-white shadow-xs animate-pulse space-y-3"
                >
                  <div className="h-24 bg-gray-100 rounded-xl w-full" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3 text-xl">
                🔍
              </div>
              <h5 className="text-sm font-bold text-gray-800">
                No workout templates found
              </h5>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {search
                  ? `No workout templates match "${search}". Try searching with different keywords.`
                  : 'There are no active workout templates configured yet.'}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-300 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {templates.map((template) => {
                  const selected = String(template.id) === String(templateId)
                  const gradientClass = getGradientStyle(template.id)
                  const intensity = getIntensityBadge(template.intensity_level)

                  return (
                    <div
                      key={template.id}
                      onClick={() => setTemplateId(String(template.id))}
                      className={`group relative rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col bg-white ${
                        selected
                          ? 'border-primaryGreen ring-4 ring-primaryGreen/15 shadow-md bg-gradient-to-b from-teal-50/20 to-white'
                          : 'border-gray-200/80 hover:border-primaryGreen/50 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Top Thumbnail / Card Artwork Banner */}
                      <div
                        className={`relative h-28 w-full bg-gradient-to-br ${gradientClass} flex items-center justify-between p-3.5 overflow-hidden border-b border-gray-100`}
                      >
                        {template.thumbnail_url ? (
                          <img
                            src={template.thumbnail_url}
                            alt={template.name}
                            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <>
                            {/* Decorative background circles */}
                            <div className="absolute -right-4 -bottom-6 w-24 h-24 rounded-full bg-white/40 blur-sm pointer-events-none" />
                            <div className="absolute left-1/3 -top-6 w-20 h-20 rounded-full bg-white/30 blur-xs pointer-events-none" />

                            {/* Centered themed Icon */}
                            <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-md shadow-xs border border-white/60 flex items-center justify-center text-2xl z-10">
                              🏋️
                            </div>
                          </>
                        )}

                        {/* Top Left Badge: Intensity */}
                        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs backdrop-blur-sm ${intensity.bg}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${intensity.dot}`}
                            />
                            {intensity.label}
                          </span>
                        </div>

                        {/* Top Right: Selection Circle */}
                        <div className="absolute top-2.5 right-2.5 z-20">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              selected
                                ? 'bg-primaryGreen border-primaryGreen text-white shadow-xs'
                                : 'border-gray-300 bg-white/80 text-transparent group-hover:border-primaryGreen/70'
                            }`}
                          >
                            <svg
                              className={`w-3.5 h-3.5 ${
                                selected ? 'opacity-100' : 'opacity-0'
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Bottom Right Duration Pill */}
                        <div className="absolute bottom-2.5 right-2.5 z-20">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-gray-900/80 text-white backdrop-blur-md shadow-xs">
                            <svg
                              className="w-3 h-3 text-orange-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {template.duration_days ?? 0} Days
                          </span>
                        </div>
                      </div>

                      {/* Card Content Details */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs md:text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-primaryGreen transition-colors">
                              {template.name || 'Untitled Template'}
                            </h4>
                          </div>

                          {/* Trimmed minimal description */}
                          <p
                            className="mt-1 text-[11px] text-gray-500 line-clamp-2 leading-relaxed"
                            title={template.description}
                          >
                            {template.description
                              ? template.description.trim()
                              : 'No detailed description provided for this workout template.'}
                          </p>
                        </div>

                        {/* Metadata Pills Footer */}
                        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                          <div className="flex items-center gap-1 font-medium text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-primaryGreen" />
                            <span>
                              {template.days_count ??
                                template.duration_days ??
                                0}{' '}
                              Routines
                            </span>
                          </div>

                          {template.created_at && (
                            <span className="text-gray-400">
                              Added: {shortDate(template.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Infinite Scroll Sentinel & Loader */}
              <div
                ref={sentinelRef}
                className="py-4 flex flex-col items-center justify-center text-xs text-gray-400"
              >
                {loadingMore && (
                  <div className="flex items-center gap-2 text-primaryGreen font-medium">
                    <svg
                      className="w-4 h-4 animate-spin text-primaryGreen"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Loading more templates...</span>
                  </div>
                )}
                {!hasMore && templates.length > 0 && !loading && (
                  <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    ✓ All {templates.length} templates loaded
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CustomDrawer>
    </>
  )
}
