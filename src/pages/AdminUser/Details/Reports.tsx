import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DialogModal } from '../../../components/common'
import { QueryParams } from '../../../common/types'
import { getRecipeDetails, useRecipes } from '../../Recipe/api'
import { useSubscriptionReport } from '../api'

type PieSlice = {
  label: string
  value: number
  color: string
}

type PieChartProps = {
  data: PieSlice[]
  size?: number
  strokeWidth?: number
}

const PieChart = ({ data, size = 120, strokeWidth = 18 }: PieChartProps) => {
  const total = data.reduce(
    (acc, item) => acc + Math.max(0, item.value || 0),
    0
  )
  const hasData = total > 0
  const chartSize = Math.max(size, 0)
  const radius = Math.max((chartSize - strokeWidth) / 2, 0)
  const circumference = 2 * Math.PI * radius
  const center = chartSize / 2
  let offset = 0

  return (
    <div className="relative" style={{ width: chartSize, height: chartSize }}>
      <svg
        width={chartSize}
        height={chartSize}
        viewBox={`0 0 ${chartSize} ${chartSize}`}
        className="rotate-[-90deg]"
      >
        {!hasData ? (
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        ) : (
          data.map((slice) => {
            const value = Math.max(0, slice.value || 0)
            const dashLength = (value / total) * circumference
            const circle = (
              <circle
                key={slice.label}
                cx={center}
                cy={center}
                r={radius}
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                fill="transparent"
              />
            )
            offset += dashLength
            return circle
          })
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-600">
          {hasData ? total : '--'}
        </span>
      </div>
    </div>
  )
}

const buildCompletionPie = (
  completed?: number,
  pending?: number
): PieSlice[] => {
  const completedValue = Number(completed ?? 0)
  const pendingValue = Number(pending ?? 0)
  return [
    {
      label: 'Completed',
      value: completedValue,
      color: '#22c55e',
    },
    {
      label: 'Pending',
      value: pendingValue,
      color: '#facc15',
    },
  ]
}

const safeValue = (value: any) => {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '—'
    return `${value}`
  }
  return String(value)
}

export default function Reports({
  user,
  subscriptionId,
}: {
  user: any
  subscriptionId?: string | number | null
}) {
  const { data, isFetching, error } = useSubscriptionReport(subscriptionId, {
    enabled: !!subscriptionId,
  })

  const report = (data as any)?.subscription_report
  const pdfContainerRef = useRef<HTMLDivElement | null>(null)
  const [exporting, setExporting] = useState(false)
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([])
  const [selectedRecipeDetails, setSelectedRecipeDetails] = useState<any[]>([])
  const [recipeSelectionLoading, setRecipeSelectionLoading] = useState(false)
  const [recipePage, setRecipePage] = useState(1)
  const [recipeRowsPerPage, setRecipeRowsPerPage] = useState(10)

  const recipeQueryParams = useMemo<QueryParams>(
    () => ({
      page: recipePage,
      per_page: recipeRowsPerPage,
      search: recipeSearch || undefined,
    }),
    [recipePage, recipeRowsPerPage, recipeSearch]
  )

  const { data: recipeListData, isFetching: isRecipeListLoading } =
    useRecipes(recipeQueryParams)

  const recipeOptions = recipeListData?.recipes ?? []
  const recipeMeta = recipeListData?.meta
  const currentRecipePage = recipeMeta?.current_page ?? recipePage
  const totalRecipeCount = recipeMeta?.total_count ?? 0
  const totalRecipePages =
    recipeMeta?.total_pages ??
    (recipeRowsPerPage
      ? Math.max(1, Math.ceil(totalRecipeCount / Number(recipeRowsPerPage)))
      : 1)

  const recipePageRef = useRef<HTMLDivElement>(null)
  const includeRecipePageRef = useRef(false)
  const hasRecipeSections = selectedRecipeDetails.length > 0

  const waitForNextFrame = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined') {
        resolve()
        return
      }
      window.requestAnimationFrame(() => resolve())
    })
  }, [])

  const toggleRecipeSelection = useCallback((id: string | number) => {
    const key = String(id)
    setSelectedRecipeIds((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    )
  }, [])

  useEffect(() => {
    if (
      typeof recipeMeta?.total_pages === 'number' &&
      recipeMeta.total_pages > 0
    ) {
      if (recipePage > recipeMeta.total_pages) {
        setRecipePage(recipeMeta.total_pages)
      } else if (recipePage < 1) {
        setRecipePage(1)
      }
    }
  }, [recipeMeta?.total_pages, recipePage])

  const handleRecipePageChange = useCallback(
    (direction: 'prev' | 'next') => {
      setRecipePage((prev) => {
        const target = direction === 'prev' ? prev - 1 : prev + 1
        if (target < 1) return 1
        if (totalRecipePages && target > totalRecipePages)
          return totalRecipePages
        return target
      })
    },
    [totalRecipePages]
  )

  const handleRecipeRowsChange = useCallback((value: number) => {
    setRecipeRowsPerPage(value)
    setRecipePage(1)
  }, [])

  const handleDownloadPdf = useCallback(
    async (recipes: any[]) => {
      if (!pdfContainerRef.current) return

      try {
        setExporting(true)

        const [html2canvasModule, jsPDFModule] = await Promise.all([
          import('html2canvas'),
          import('jspdf'),
        ])

        const html2canvas = html2canvasModule.default
        const JsPDF = jsPDFModule.default

        const pdf = new JsPDF('p', 'pt', 'a4')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()

        // PAGE 1
        const canvas1 = await html2canvas(pdfContainerRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        })

        const img1 = canvas1.toDataURL('image/png')
        const imgHeight1 = (canvas1.height * pdfWidth) / canvas1.width
        let heightLeft = imgHeight1
        let position = 0

        pdf.addImage(img1, 'PNG', 0, position, pdfWidth, imgHeight1)
        heightLeft -= pdfHeight

        while (heightLeft > 0) {
          position = heightLeft - imgHeight1
          pdf.addPage()
          pdf.addImage(img1, 'PNG', 0, position, pdfWidth, imgHeight1)
          heightLeft -= pdfHeight
        }

        // PAGE 2 — recipe
        // PAGE 2 — recipe
        // PAGE 2+ — Recipes (NO SCREENSHOT, PURE PDF CONTENT)
        if (recipes && recipes.length > 0) {
          pdf.addPage()

          let y = 40
          const marginX = 40
          const lineHeight = 14
          const maxWidth = pdfWidth - marginX * 2

          pdf.setFontSize(16)
          pdf.text('Recipe Details', marginX, y)
          y += 20

          recipes.forEach((recipe: any, index: number) => {
            if (index !== 0) {
              pdf.addPage()
              y = 40
            }

            const nutrition = recipe?.nutrition ?? {}

            pdf.setFontSize(14)
            pdf.text(recipe?.name || 'Recipe', marginX, y)
            y += 16

            pdf.setFontSize(10)

            const writeBlock = (label: string, value: any) => {
              const text = `${label}: ${safeValue(value)}`
              const lines = pdf.splitTextToSize(text, maxWidth)
              pdf.text(lines, marginX, y)
              y += lines.length * lineHeight + 4
            }

            writeBlock('Description', recipe?.description)
            writeBlock('Preparation Notes', recipe?.preparation_notes)
            writeBlock('Category', recipe?.meal_category)
            writeBlock('Serving Unit', recipe?.serving_unit)
            writeBlock('Calories', nutrition?.calories ?? recipe?.calories)

            y += 6

            pdf.setFontSize(12)
            pdf.text('Nutrition', marginX, y)
            y += 14

            pdf.setFontSize(10)
            writeBlock('Protein', nutrition?.protein)
            writeBlock('Carbs', nutrition?.carbs)
            writeBlock('Fat', nutrition?.fat)
            writeBlock('Fiber', nutrition?.fiber)

            y += 6

            pdf.setFontSize(12)
            pdf.text('Ingredients', marginX, y)
            y += 14

            pdf.setFontSize(10)

            if (
              Array.isArray(recipe?.ingredients) &&
              recipe.ingredients.length > 0
            ) {
              recipe.ingredients.forEach((ing: any) => {
                const ingText = `• ${safeValue(ing?.name)} - ${safeValue(
                  ing?.quantity
                )} ${safeValue(ing?.unit)}`

                const lines = pdf.splitTextToSize(ingText, maxWidth)

                // page break if needed
                if (y + lines.length * lineHeight > pdfHeight - 40) {
                  pdf.addPage()
                  y = 40
                }

                pdf.text(lines, marginX, y)
                y += lines.length * lineHeight
              })
            } else {
              pdf.text('--', marginX, y)
              y += lineHeight
            }
          })
        }

        const rawName =
          (
            (report as any)?.user?.name ??
            user?.name ??
            'Report'
          )?.toString?.() ?? 'Report'
        const cleanedName =
          rawName.trim().replace(/[\\/:*?"<>|]/g, '') || 'Report'
        const underscoredName = cleanedName.replace(/\s+/g, '_')
        pdf.save(`Report_${underscoredName}.pdf`)
      } finally {
        setExporting(false)
        setSelectedRecipeIds([])
        setSelectedRecipeDetails([])
      }
    },
    [report, selectedRecipeDetails, user, waitForNextFrame]
  )

  const closeRecipeModal = useCallback(() => {
    if (!recipeSelectionLoading) {
      setRecipeModalOpen(false)
      setRecipeSearch('')
      setSelectedRecipeIds([])
      setRecipePage(1)
    }
  }, [recipeSelectionLoading])

  const proceedWithRecipes = useCallback(
    async (recipes: any[]) => {
      setSelectedRecipeDetails(recipes)
      const includeRecipePage = recipes.length > 0
      includeRecipePageRef.current = includeRecipePage

      // wait for React state commit
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0)
      })

      // wait for DOM paint
      await waitForNextFrame()

      // wait for images inside recipes to load
      if (includeRecipePage && recipePageRef.current) {
        const images = recipePageRef.current.querySelectorAll('img')
        await Promise.all(
          Array.from(images).map(
            (img) =>
              new Promise<void>((res) => {
                if (img.complete) return res()
                img.onload = () => res()
                img.onerror = () => res()
              })
          )
        )
      }

      await handleDownloadPdf(recipes)
    },
    [handleDownloadPdf, waitForNextFrame]
  )

  const handleRecipeConfirm = useCallback(async () => {
    setRecipeSelectionLoading(true)
    try {
      let details: any[] = []
      if (selectedRecipeIds.length > 0) {
        const responses = await Promise.all(
          selectedRecipeIds.map(async (recipeId) => {
            try {
              const res = await getRecipeDetails(recipeId)
              return res?.recipe ?? res ?? null
            } catch (err) {
              console.error('Failed to fetch recipe detail', err)
              return null
            }
          })
        )
        details = responses.filter(Boolean)
      }
      setRecipeModalOpen(false)
      await proceedWithRecipes(details)
    } catch (error) {
      console.error('Failed to include recipes in PDF', error)
    } finally {
      setRecipeSelectionLoading(false)
      setRecipeSearch('')
      setRecipePage(1)
    }
  }, [proceedWithRecipes, selectedRecipeIds])

  const handleSkipRecipes = useCallback(async () => {
    setRecipeSelectionLoading(true)
    try {
      setRecipeModalOpen(false)
      await proceedWithRecipes([])
    } catch (error) {
      console.error('Failed to generate PDF', error)
    } finally {
      setRecipeSelectionLoading(false)
      setRecipeSearch('')
      setRecipePage(1)
    }
  }, [proceedWithRecipes])

  if (!subscriptionId) {
    return (
      <div className="p-6 text-sm text-gray-600">
        No active subscription to show report for.
      </div>
    )
  }

  if (isFetching) {
    return (
      <div className="p-6 text-sm text-gray-600">
        Loading subscription report...
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="p-10 min-h-[40vh] flex flex-col items-center justify-center text-gray-500 text-sm">
        {(error as any)?.response?.data?.message || 'No report data available'}
      </div>
    )
  }

  const { subscription, plan, user: reportUser } = report
  const workout = report.workout_summary || {}
  const yoga = report.yoga_summary || {}
  const meditation = report.meditation_summary || {}
  const vitals = report.vitals || {}
  const weightBmi = report.weight_and_bmi || {}

  const workoutPie = buildCompletionPie(
    workout.total_completed_count,
    workout.total_pending_count
  )
  const yogaPie = buildCompletionPie(
    yoga.total_completed_count,
    yoga.total_pending_count
  )
  const meditationPie: PieSlice[] = [
    {
      label: 'Completed',
      value: Number(meditation.completed_count ?? 0),
      color: '#22c55e',
    },
    {
      label: 'Missed',
      value: Number(meditation.missed_count ?? 0),
      color: '#ef4444',
    },
  ]

  const canDownloadWithRecipes = selectedRecipeIds.length > 0

  const renderRecipePreviewCards = (recipes: any[]) => (
    <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-4">
      <div className="text-xs font-semibold uppercase text-gray-700">
        Selected Recipes
      </div>
      <div className="flex flex-col gap-4">
        {recipes.map((recipe) => {
          const key = recipe?.id || recipe?.name || Math.random()
          const nutrition = recipe?.nutrition ?? {}
          const infoCards = [
            { key: 'name', label: 'Name', value: recipe?.name },
            { key: 'desc', label: 'Description', value: recipe?.description },
            {
              key: 'notes',
              label: 'Preparation Notes',
              value: recipe?.preparation_notes,
            },
            { key: 'cat', label: 'Category', value: recipe?.meal_category },
            {
              key: 'serve',
              label: 'Serving Unit',
              value: recipe?.serving_unit,
            },
            {
              key: 'cal',
              label: 'Total Calories',
              value: nutrition?.calories ?? recipe?.calories,
            },
          ]

          return (
            <div
              key={key}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {infoCards.map((field) => (
                  <div
                    key={field.key}
                    className="border rounded-lg p-3 bg-white"
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {field.label}
                    </div>
                    <div className="text-sm text-gray-900">
                      {safeValue(field.value)}
                    </div>
                  </div>
                ))}

                <div className="border rounded-lg p-3 bg-white">
                  <div className="text-xs text-gray-500 mb-2">Image</div>
                  <div className="text-sm">
                    {recipe?.image_url ? (
                      <div className="w-[160px] h-[160px] overflow-hidden rounded-md border">
                        <img
                          className="w-full h-full object-cover"
                          src={recipe?.image_url}
                          alt="Recipe"
                        />
                      </div>
                    ) : (
                      <span>--</span>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-white">
                  <div className="text-xs text-gray-500 mb-2">Nutrition</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Protein: </span>
                      {safeValue(nutrition?.protein)}
                    </div>
                    <div>
                      <span className="text-gray-500">Carbs: </span>
                      {safeValue(nutrition?.carbs)}
                    </div>
                    <div>
                      <span className="text-gray-500">Fat: </span>
                      {safeValue(nutrition?.fat)}
                    </div>
                    <div>
                      <span className="text-gray-500">Fiber: </span>
                      {safeValue(nutrition?.fiber)}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-6 pt-6"
                style={{
                  pageBreakBefore: 'always',
                  breakInside: 'avoid',
                }}
              >
                <div className="text-base font-semibold text-gray-900 mb-4">
                  Ingredients
                </div>

                {Array.isArray(recipe?.ingredients) &&
                recipe.ingredients.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {recipe.ingredients.map((ing: any, idx: number) => (
                      <div
                        key={ing?.id ?? `${ing?.name}-${idx}`}
                        className="border rounded-lg px-4 py-3 bg-white shadow-sm"
                        style={{
                          breakInside: 'avoid',
                          pageBreakInside: 'avoid',
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {safeValue(ing?.name)}
                          </span>

                          <span className="text-sm text-gray-600">
                            {safeValue(ing?.quantity)} {safeValue(ing?.unit)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No ingredients available
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderPdfRecipeSection = (recipes: any[]) => (
    <div className="mt-8">
      <h3 className="font-semibold mb-3">Recipe Details</h3>
      <div className="flex flex-col gap-4">
        {recipes.map((recipe, index) => {
          const nutrition = recipe?.nutrition ?? {}
          const infoCards = [
            { key: 'name', label: 'Name', value: recipe?.name },
            { key: 'desc', label: 'Description', value: recipe?.description },
            {
              key: 'notes',
              label: 'Preparation Notes',
              value: recipe?.preparation_notes,
            },
            { key: 'cat', label: 'Category', value: recipe?.meal_category },
            {
              key: 'serve',
              label: 'Serving Unit',
              value: recipe?.serving_unit,
            },
            {
              key: 'cal',
              label: 'Total Calories',
              value: nutrition?.calories ?? recipe?.calories,
            },
          ]

          return (
            <div
              key={recipe?.id ?? `${recipe?.name}-${index}`}
              className="border rounded-lg p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {infoCards.map((field) => (
                  <div
                    key={field.key}
                    className="border rounded-md p-3 bg-gray-50"
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {field.label}
                    </div>
                    <div className="text-sm text-gray-900">
                      {safeValue(field.value)}
                    </div>
                  </div>
                ))}

                <div className="border rounded-md p-3 bg-gray-50">
                  <div className="text-xs text-gray-500 mb-2">Nutrition</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Protein: </span>
                      {safeValue(nutrition?.protein)}
                    </div>
                    <div>
                      <span className="text-gray-500">Carbs: </span>
                      {safeValue(nutrition?.carbs)}
                    </div>
                    <div>
                      <span className="text-gray-500">Fat: </span>
                      {safeValue(nutrition?.fat)}
                    </div>
                    <div>
                      <span className="text-gray-500">Fiber: </span>
                      {safeValue(nutrition?.fiber)}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-3 border rounded-md p-3 bg-gray-50"
                style={{ pageBreakBefore: 'always' }}
              >
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  Ingredients
                </div>
                {Array.isArray(recipe?.ingredients) &&
                recipe.ingredients.length > 0 ? (
                  <div className="flex flex-col divide-y text-sm">
                    {recipe.ingredients.map((ing: any) => (
                      <div
                        key={ing?.id ?? `${ing?.name}-${ing?.unit}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-1"
                      >
                        <span className="font-medium text-gray-900">
                          {safeValue(ing?.name)}
                        </span>
                        <span className="text-gray-500">
                          {safeValue(ing?.quantity)} {safeValue(ing?.unit)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm">--</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      {/* Modal */}
      <DialogModal
        isOpen={recipeModalOpen}
        onClose={closeRecipeModal}
        title="Include Recipes?"
        subTitle="Attach recipe details to this report before downloading the PDF."
        small={false}
        headborder
        body={
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={recipeSearch}
                onChange={(event) => setRecipeSearch(event.target.value)}
                placeholder="Search recipes"
                disabled={recipeSelectionLoading}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
             focus:outline-none focus:ring-0 focus:border-gray-300"
              />
              <button
                type="button"
                onClick={() => setRecipeSearch('')}
                disabled={recipeSelectionLoading || recipeSearch.length === 0}
                className="text-sm px-3 py-2 border border-gray-300 rounded-md text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
            <div className="border rounded-lg max-h-80 overflow-y-auto divide-y">
              {isRecipeListLoading ? (
                <div className="p-4 text-sm text-gray-500">
                  Loading recipes…
                </div>
              ) : recipeOptions.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  No recipes found.
                </div>
              ) : (
                recipeOptions.map((recipe: any) => {
                  const recipeId = String(recipe?.id)
                  const checked = selectedRecipeIds.includes(recipeId)
                  return (
                    <label
                      key={recipeId}
                      className="flex items-center gap-3 p-3 text-sm cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() => toggleRecipeSelection(recipeId)}
                        disabled={recipeSelectionLoading}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {recipe?.name || 'Untitled'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {recipe?.meal_category || '—'}
                        </span>
                      </div>
                    </label>
                  )
                })
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600 border rounded-md px-3 py-2 bg-gray-50">
              <span>
                Showing{' '}
                {(currentRecipePage - 1) * Number(recipeRowsPerPage) + 1}
                {'-'}
                {Math.min(
                  currentRecipePage * Number(recipeRowsPerPage),
                  totalRecipeCount
                )}{' '}
                of {totalRecipeCount} recipes
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1 border rounded-md text-gray-600 disabled:opacity-50"
                  onClick={() => handleRecipePageChange('prev')}
                  disabled={currentRecipePage <= 1 || isRecipeListLoading}
                >
                  Previous
                </button>
                <span className="font-medium text-gray-700">
                  Page {currentRecipePage} of {totalRecipePages}
                </span>
                <button
                  type="button"
                  className="px-3 py-1 border rounded-md text-gray-600 disabled:opacity-50"
                  onClick={() => handleRecipePageChange('next')}
                  disabled={
                    currentRecipePage >= totalRecipePages || isRecipeListLoading
                  }
                >
                  Next
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <select
                  className="border rounded-md px-2 py-1 bg-white"
                  value={recipeRowsPerPage}
                  onChange={(event) =>
                    handleRecipeRowsChange(Number(event.target.value))
                  }
                  disabled={isRecipeListLoading}
                >
                  {[5, 10, 20, 30].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-xs text-gray-600 flex items-center justify-between">
              <span>
                {canDownloadWithRecipes
                  ? `Selected recipes: ${selectedRecipeIds.length}`
                  : 'Select at least one recipe to attach it to the report.'}
              </span>
            </div>
          </div>
        }
        actionBody={
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleRecipeConfirm}
              disabled={recipeSelectionLoading || !canDownloadWithRecipes}
              className="inline-flex justify-center rounded-md bg-primaryGreen px-4 py-2 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {recipeSelectionLoading ? 'Preparing…' : 'Download with recipes'}
            </button>

            <button
              type="button"
              onClick={handleSkipRecipes}
              disabled={recipeSelectionLoading}
              className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {recipeSelectionLoading ? 'Working…' : 'Download without recipes'}
            </button>
          </div>
        }
      />

      {/* Main */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setRecipeModalOpen(true)}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md bg-primaryGreen px-3 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>

        {/* Header card */}
        <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-xs uppercase text-gray-500 mb-1">
                Subscription
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {plan?.name || 'Plan'}
              </div>
              <div className="text-sm text-gray-600">{plan?.category}</div>
            </div>
            <div className="text-sm text-gray-600">
              <div>
                <span className="font-medium text-gray-700">User :</span>{' '}
                {reportUser?.name || user?.name
                  ? (reportUser?.name || user?.name)
                      .toString()
                      .charAt(0)
                      .toUpperCase() +
                    (reportUser?.name || user?.name).toString().slice(1)
                  : '—'}
              </div>
              <div>
                <span className="font-medium text-gray-700">Duration :</span>{' '}
                {subscription?.start_date} to {subscription?.end_date}
              </div>
              <div>
                <span className="font-medium text-gray-700">Status :</span>{' '}
                {subscription?.status
                  ? subscription.status.charAt(0).toUpperCase() +
                    subscription.status.slice(1)
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Summary cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-xs font-semibold uppercase text-gray-700">
                  Workout Summary
                </div>
                <div className="text-sm text-gray-700">
                  Days with activity: {workout.total_days_with_activity ?? 0}
                </div>
                <div className="text-sm text-gray-700">
                  Completed: {workout.total_completed_count ?? 0}
                </div>
                <div className="text-sm text-gray-700">
                  Pending: {workout.total_pending_count ?? 0}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-center justify-center gap-2">
                <PieChart data={workoutPie} />
                <div className="flex flex-col items-start text-[11px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: '#22c55e' }}
                    />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: '#facc15' }}
                    />
                    <span>Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-xs font-semibold uppercase text-gray-700">
                  Yoga Summary
                </div>
                <div className="text-sm text-gray-700">
                  Days with activity: {yoga.total_days_with_activity ?? 0}
                </div>
                <div className="text-sm text-gray-700">
                  Completed: {yoga.total_completed_count ?? 0}
                </div>
                <div className="text-sm text-gray-700">
                  Pending: {yoga.total_pending_count ?? 0}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-center justify-center gap-2">
                <PieChart data={yogaPie} />
                <div className="flex flex-col items-start text-[11px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: '#22c55e' }}
                    />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: '#facc15' }}
                    />
                    <span>Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-xs font-semibold uppercase text-gray-700">
                  Meditation Summary
                </div>
                <div className="text-sm text-gray-700">
                  Sessions: {meditation.total_sessions ?? 0}
                </div>
                <div className="text-sm text-gray-700">
                  Completed: {meditation.completed_count ?? 0}
                </div>
                <div className="text-sm text-gray-700">
                  Missed: {meditation.missed_count ?? 0}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-center justify-center gap-2">
                <PieChart data={meditationPie} />
                <div className="flex flex-col items-start text-[11px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: '#22c55e' }}
                    />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: '#ef4444' }}
                    />
                    <span>Missed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase text-gray-700">
              Vitals
            </div>
            <div className="text-sm text-gray-700">
              Entries: {vitals.entries_count ?? 0}
            </div>
            <div className="text-sm text-gray-700">
              Avg heart rate: {vitals.avg_heart_rate ?? '—'}
            </div>
            <div className="text-sm text-gray-700">
              Avg sugar level: {vitals.avg_sugar_level ?? '—'}
            </div>
          </div>

          <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase text-gray-700">
              Weight & BMI
            </div>
            <div className="text-sm text-gray-700">
              Start weight: {weightBmi.start_weight ?? '—'}
            </div>
            <div className="text-sm text-gray-700">
              End weight: {weightBmi.end_weight ?? '—'}
            </div>
            <div className="text-sm text-gray-700">
              Weight change: {weightBmi.weight_delta ?? '—'}
            </div>
            <div className="text-sm text-gray-700">
              Avg BMI: {weightBmi.avg_bmi ?? '—'}
            </div>
          </div>
        </div>

        {hasRecipeSections && renderRecipePreviewCards(selectedRecipeDetails)}

        {report.overall_analysis && (
          <div className="border rounded-xl bg-white shadow-sm p-4">
            <div className="text-xs font-semibold uppercase text-gray-700 mb-1">
              Overall Analysis
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {report.overall_analysis}
            </div>
          </div>
        )}
      </div>

      {/* PDF */}
      <div
        ref={pdfContainerRef}
        className="bg-white p-6 text-sm text-gray-800"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '800px',
        }}
      >
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-center mb-6 text-gray-800">
            Subscription Details
          </h2>

          <table className="w-full border-separate border-spacing-y-3 text-sm">
            <tbody>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-500 w-1/4">Plan Name</td>
                <td className="px-4 py-3 font-semibold text-gray-800 w-1/4">
                  {plan?.name || '—'}
                </td>

                <td className="px-4 py-3 text-gray-500 w-1/4">Category</td>
                <td className="px-4 py-3 font-semibold text-gray-800 w-1/4">
                  {plan?.category || '—'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-500 w-1/4">Name</td>
                <td className="px-4 py-3 font-semibold text-gray-800 w-1/4">
                  {reportUser?.name || user?.name
                    ? (reportUser?.name || user?.name)
                        .toString()
                        .toLowerCase()
                        .replace(/\b\w/g, (char: any) => char.toUpperCase())
                    : '—'}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-500">Start Date</td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {subscription?.start_date || '—'}
                </td>

                <td className="px-4 py-3 text-gray-500">End Date</td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {subscription?.end_date || '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ACTIVITY SUMMARY */}
        <h3 className="font-semibold mb-2">Activity Summary</h3>
        <table className="w-full border border-collapse mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left">Activity</th>
              <th className="border px-3 py-2 text-left">Days/Sessions</th>
              <th className="border px-3 py-2 text-left">Completed</th>
              <th className="border px-3 py-2 text-left">Pending/Missed</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-3 py-2">Workout</td>
              <td className="border px-3 py-2">
                {workout.total_days_with_activity ?? 0}
              </td>
              <td className="border px-3 py-2">
                {workout.total_completed_count ?? 0}
              </td>
              <td className="border px-3 py-2">
                {workout.total_pending_count ?? 0}
              </td>
            </tr>
            <tr>
              <td className="border px-3 py-2">Yoga</td>
              <td className="border px-3 py-2">
                {yoga.total_days_with_activity ?? 0}
              </td>
              <td className="border px-3 py-2">
                {yoga.total_completed_count ?? 0}
              </td>
              <td className="border px-3 py-2">
                {yoga.total_pending_count ?? 0}
              </td>
            </tr>
            <tr>
              <td className="border px-3 py-2">Meditation</td>
              <td className="border px-3 py-2">
                {meditation.total_sessions ?? 0}
              </td>
              <td className="border px-3 py-2">
                {meditation.completed_count ?? 0}
              </td>
              <td className="border px-3 py-2">
                {meditation.missed_count ?? 0}
              </td>
            </tr>
          </tbody>
        </table>

        {/* VITALS */}
        <h3 className="font-semibold mb-2">Vitals</h3>
        <table className="w-full border border-collapse mb-6">
          <tbody>
            <tr>
              <td className="border px-3 py-2 font-medium">Entries</td>
              <td className="border px-3 py-2">{vitals.entries_count ?? 0}</td>
            </tr>
            <tr>
              <td className="border px-3 py-2 font-medium">Avg Heart Rate</td>
              <td className="border px-3 py-2">
                {vitals.avg_heart_rate ?? '—'}
              </td>
            </tr>
            <tr>
              <td className="border px-3 py-2 font-medium">Avg Sugar Level</td>
              <td className="border px-3 py-2">
                {vitals.avg_sugar_level ?? '—'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* WEIGHT */}
        <h3 className="font-semibold mb-2">Weight & BMI</h3>
        <table className="w-full border border-collapse mb-6">
          <tbody>
            <tr>
              <td className="border px-3 py-2 font-medium">Start Weight</td>
              <td className="border px-3 py-2">
                {weightBmi.start_weight ?? '—'}
              </td>
            </tr>
            <tr>
              <td className="border px-3 py-2 font-medium">End Weight</td>
              <td className="border px-3 py-2">
                {weightBmi.end_weight ?? '—'}
              </td>
            </tr>
            <tr>
              <td className="border px-3 py-2 font-medium">Weight Change</td>
              <td className="border px-3 py-2">
                {weightBmi.weight_delta ?? '—'}
              </td>
            </tr>
            <tr>
              <td className="border px-3 py-2 font-medium">Avg BMI</td>
              <td className="border px-3 py-2">{weightBmi.avg_bmi ?? '—'}</td>
            </tr>
          </tbody>
        </table>

        {report.overall_analysis && (
          <>
            <h3 className="font-semibold mb-2">Overall Analysis</h3>
            <div className="border p-3 whitespace-pre-line">
              {report.overall_analysis}
            </div>
          </>
        )}
      </div>
      <div
        ref={recipePageRef}
        className="bg-white p-5"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '800px',
        }}
      >
        {hasRecipeSections
          ? renderPdfRecipeSection(selectedRecipeDetails)
          : null}
      </div>
    </>
  )
}
