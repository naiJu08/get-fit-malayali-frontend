import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomDrawer from '../../components/common/drawer'
import { getData, postData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { useSnackbarManager } from '../../components/common/snackbar'
import moment from 'moment'

type Props = {
  subscriptionId?: string | number | null
  currentName?: string
  currentTemplateId?: string | number | null
  selectedDayDate?: string | Date | null
  onAssigned?: () => void
  readOnly?: boolean
}

interface DietTemplateItem {
  id: string | number
  name: string
  description?: string
  duration_days?: number
  days_count?: number
  meals_count?: number
  total_meals?: number
  diet_template_category_id?: number | string
  diet_template_category_name?: string
  thumbnail_url?: string
  created_at?: string
}

interface DietTemplateCategory {
  id: string | number
  name: string
}

const toTitleCase = (str?: string) => {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function DietTemplateAssign({
  subscriptionId,
  currentName,
  currentTemplateId,
  selectedDayDate,
  onAssigned,
  readOnly = false,
}: Props) {
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [templateId, setTemplateId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [categories, setCategories] = useState<DietTemplateCategory[]>([])
  const [page, setPage] = useState(1)
  const [templates, setTemplates] = useState<DietTemplateItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const { enqueueSnackbar } = useSnackbarManager()

  // Fetch categories once when drawer opens
  useEffect(() => {
    if (drawerOpen) {
      getData(`${apiUrl.TEMPLATE_CATEGORIES}?page=1&per_page=100&status=active`)
        .then((res: any) => {
          const list =
            res?.diet_template_categories ||
            res?.data?.diet_template_categories ||
            []
          setCategories(list)
        })
        .catch((err) => {
          console.error('Failed to fetch diet template categories', err)
        })
    }
  }, [drawerOpen])

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
    catId: string,
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
      if (catId) params.set('diet_template_category_id', catId)

      const res = await getData(`${apiUrl.DIET_TEMPLATE}?${params.toString()}`)
      const items: DietTemplateItem[] =
        res?.diet_plan_templates || res?.diet_templates || []
      const total = Number(res?.meta?.total_count ?? items.length)
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
      console.error('Failed to load diet templates', err)
      enqueueSnackbar('Failed to load diet templates', { variant: 'error' })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Load initial page whenever drawer opens, search changes, or category filter changes
  useEffect(() => {
    if (drawerOpen && subscriptionId) {
      setPage(1)
      fetchTemplates(1, debouncedSearch, categoryFilter, true)
    }
  }, [drawerOpen, debouncedSearch, categoryFilter, subscriptionId])

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (!sentinelRef.current || !drawerOpen) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchTemplates(page + 1, debouncedSearch, categoryFilter, false)
        }
      },
      { threshold: 0.1, rootMargin: '120px' }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [
    hasMore,
    loading,
    loadingMore,
    page,
    debouncedSearch,
    categoryFilter,
    drawerOpen,
  ])

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
    setCategoryFilter('')
  }

  const assign = async () => {
    if (!templateId) return
    const formattedStartDate = selectedDayDate
      ? moment(selectedDayDate).format('YYYY-MM-DD')
      : undefined

    try {
      setAssigning(true)
      await postData(
        `${apiUrl.SUBSCRIPTIONS}/${subscriptionId}/assign_diet_plan_template`,
        {
          diet_plan_template_id: Number(templateId),
          start_date: formattedStartDate,
        }
      )
      enqueueSnackbar('Diet template assigned successfully', {
        variant: 'success',
      })
      closeDrawer()
      onAssigned?.()
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.errors?.[0] ||
          error?.response?.data?.message ||
          'Unable to assign diet template',
        { variant: 'error' }
      )
    } finally {
      setAssigning(false)
    }
  }

  return (
    <>
      {/* Modern Banner Trigger */}
      <div className="border border-gray-200/80 rounded-xl p-3.5 bg-gradient-to-r from-gray-50/80 via-white to-emerald-50/30 mb-3 shadow-xs transition-all hover:border-gray-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center font-bold text-sm shadow-xs">
              🥗
            </div>
            <div>
              <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Diet Template
              </div>
              <div className="text-xs text-gray-600 font-medium flex items-center gap-1.5 flex-wrap">
                <span>Current:</span>
                {currentName ? (
                  <div className="inline-flex items-center gap-1">
                    <span
                      onClick={() =>
                        currentTemplateId &&
                        navigate(`/diet-template/${currentTemplateId}`)
                      }
                      className={`font-semibold text-primaryGreen bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 ${
                        currentTemplateId
                          ? 'cursor-pointer hover:underline hover:bg-teal-100/70'
                          : ''
                      }`}
                      title={
                        currentTemplateId
                          ? 'View Diet Template Details'
                          : undefined
                      }
                    >
                      {toTitleCase(currentName)}
                    </span>
                    {currentTemplateId && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/diet-template/${currentTemplateId}`)
                        }
                        className="text-gray-400 hover:text-primaryGreen transition-colors p-0.5"
                        title="Open Template"
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
                  <span className="text-gray-400 italic">None assigned</span>
                )}
              </div>
            </div>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                setTemplateId(
                  currentTemplateId ? String(currentTemplateId) : ''
                )
                setDrawerOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primaryGreen text-white text-xs font-semibold rounded-lg hover:bg-primaryGreen/90 shadow-xs focus:outline-none focus:ring-2 focus:ring-primaryGreen/50 transition-all active:scale-[0.98]"
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

      {/* Assign Diet Template Drawer */}
      <CustomDrawer
        open={drawerOpen}
        handleClose={closeDrawer}
        className="w-screen max-w-[920px]"
        unmountOnClose
        title={currentName ? 'Update Diet Template' : 'Assign Diet Template'}
        handleSubmit={assign}
        disableSubmit={!templateId || assigning}
        actionLoader={assigning}
        actionLabel={
          selectedTemplate
            ? `Assign "${toTitleCase(selectedTemplate.name)}"`
            : currentName
              ? 'Update Template'
              : 'Assign Template'
        }
      >
        <div className="space-y-4">
          {/* Header Subtitle Banner */}
          <div className="bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50 border border-emerald-100/80 rounded-xl p-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">🥗</span>
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Select Diet Template
                </h4>
                <p className="text-[11px] text-gray-500">
                  {currentName
                    ? `Replacing active template: ${toTitleCase(currentName)}`
                    : 'Choose a diet template to assign to this subscription'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {totalCount} {totalCount === 1 ? 'Template' : 'Templates'}
              </span>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
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
                placeholder="Search diet templates by name"
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

            {categories.length > 0 && (
              <div className="w-full sm:w-60">
                <select
                  className="w-full py-2.5 px-3 text-xs bg-white border border-gray-200 rounded-xl shadow-xs focus:outline-none focus:border-primaryGreen focus:ring-2 focus:ring-primaryGreen/20 transition-all text-gray-700"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Cards Grid Listing */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="border border-gray-100 rounded-xl p-4 bg-white shadow-xs animate-pulse space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-gray-100 rounded-full w-28" />
                    <div className="h-5 w-5 bg-gray-100 rounded-full" />
                  </div>
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
                No diet templates found
              </h5>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {search || categoryFilter
                  ? 'No diet templates match your search or filter criteria. Try clearing them.'
                  : 'There are no active diet templates configured yet.'}
              </p>
              {(search || categoryFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setCategoryFilter('')
                  }}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-300 transition-colors"
                >
                  Clear Search & Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {templates.map((template) => {
                  const selected = String(template.id) === String(templateId)
                  const categoryName =
                    template.diet_template_category_name || 'Diet Template'

                  return (
                    <div
                      key={template.id}
                      onClick={() => setTemplateId(String(template.id))}
                      className={`group relative rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 bg-white ${
                        selected
                          ? 'border-primaryGreen ring-4 ring-primaryGreen/15 shadow-md bg-gradient-to-b from-teal-50/20 to-white'
                          : 'border-gray-200 hover:border-primaryGreen/50 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Top Row: Category Pill & Duration Badge + Selection Circle */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {categoryName}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200/60">
                            <svg
                              className="w-3 h-3 text-gray-500"
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

                        {/* Selection Circle */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                            selected
                              ? 'bg-primaryGreen border-primaryGreen text-white shadow-xs'
                              : 'border-gray-300 bg-white text-transparent group-hover:border-primaryGreen/70'
                          }`}
                        >
                          <svg
                            className={`w-3 h-3 ${
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

                      {/* Card Content Details */}
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-primaryGreen transition-colors">
                          {toTitleCase(template.name) || 'Untitled Template'}
                        </h4>

                        {/* Minimal Trimmed Description Preview */}
                        <p
                          className="text-xs text-gray-500 line-clamp-2 leading-relaxed"
                          title={template.description}
                        >
                          {template.description
                            ? template.description.trim()
                            : 'No detailed description provided for this diet template.'}
                        </p>
                      </div>

                      {/* Footer Metadata */}
                      <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                        <span className="font-medium text-gray-600">
                          {template.duration_days ?? 0} Days Plan
                        </span>

                        <span className="text-gray-400">
                          {template.created_at
                            ? `Added: ${moment(template.created_at).format('DD-MM-YYYY')}`
                            : `ID: #${template.id}`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Infinite Scroll Loading Spinner */}
              {loadingMore && (
                <div className="py-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primaryGreen border-t-transparent rounded-full animate-spin" />
                  <span>Loading more templates...</span>
                </div>
              )}

              {/* Sentinel trigger element for infinite scroll */}
              <div ref={sentinelRef} className="h-4 w-full" />
            </div>
          )}
        </div>
      </CustomDrawer>
    </>
  )
}
