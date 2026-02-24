import moment from 'moment'
import { useVitals } from '../api'
import Icons from '../../../components/common/icons'
import { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import Button from '../../../components/common/buttons/Button'

export default function Vitals({
  user,
  subscriptionId,
}: {
  user: any
  subscriptionId?: string | number | null
}) {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [allItems, setAllItems] = useState<any[]>([])

  const { data, isFetching } = useVitals({
    user_id: user?.id,
    subscription_id: subscriptionId as any,
    page,
    per_page: pageSize,
  } as any)

  const items = allItems
  const totalPages = data?.total_pages ?? 1

  useEffect(() => {
    if (!data?.items) return

    setAllItems((prev) => {
      // on first page, reset; on subsequent pages, append
      if (page === 1) {
        return data.items
      }

      const existingIds = new Set(prev.map((i: any) => i.id))
      const newItems = data.items.filter((i: any) => !existingIds.has(i.id))
      return [...prev, ...newItems]
    })
  }, [data?.items, page])

  const handleDownloadVitalsPdf = () => {
    if (!items || items.length === 0) return

    const pdf = new jsPDF('p', 'mm', 'a4')

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const leftMargin = 12
    const rightMargin = 12
    const topMargin = 18
    const bottomMargin = 15
    const headerHeight = 9
    const rowHeight = 7
    const usableHeight = pageHeight - topMargin - bottomMargin

    const columns = ['Date', 'Sleep', 'Water', 'Steps']

    // Distribute columns across available width
    const tableWidth = pageWidth - leftMargin - rightMargin
    const baseColWidths = [0.18, 0.13, 0.17, 0.14, 0.12, 0.12, 0.14] // percentages
    const colWidths = baseColWidths.map((p) => p * tableWidth)

    let y = topMargin

    // Title
    pdf.setFontSize(16)
    pdf.setTextColor(40, 40, 40)
    pdf.text('Vitals Report', pageWidth / 2, y, { align: 'center' })
    y += 8

    // Subtitle (optional date range / generated time)
    pdf.setFontSize(10)
    pdf.setTextColor(120, 120, 120)
    pdf.text(
      `Generated on ${moment().format('DD MMM YYYY, HH:mm')}`,
      pageWidth / 2,
      y,
      {
        align: 'center',
      }
    )
    y += 8

    const drawHeader = () => {
      let x = leftMargin

      // Header background band across the full table width
      pdf.setFillColor(219, 234, 254) // light blue
      pdf.setDrawColor(148, 163, 184) // slate-400 border
      pdf.setLineWidth(0.2)
      pdf.rect(leftMargin, y, tableWidth, headerHeight, 'FD')

      // Header text
      pdf.setTextColor(30, 64, 175) // blue-800
      pdf.setFontSize(10)

      columns.forEach((col, index) => {
        const w = colWidths[index]
        pdf.text(col, x + 2, y + headerHeight / 2 + 2)
        x += w
      })

      y += headerHeight
    }

    const addNewPage = () => {
      pdf.addPage()
      y = topMargin

      // Repeat title & subtitle on new pages
      pdf.setFontSize(16)
      pdf.setTextColor(40, 40, 40)
      pdf.text('Vitals Report', pageWidth / 2, y, { align: 'center' })
      y += 8

      pdf.setFontSize(10)
      pdf.setTextColor(120, 120, 120)
      pdf.text(
        `Generated on ${moment().format('DD MMM YYYY, HH:mm')}`,
        pageWidth / 2,
        y,
        {
          align: 'center',
        }
      )
      y += 8

      drawHeader()
    }

    drawHeader()

    items.forEach((row: any) => {
      if (y + rowHeight > topMargin + usableHeight) {
        addNewPage()
      }

      let x = leftMargin

      const dateStr = row?.recorded_at
        ? moment(row.recorded_at).format('DD MMM YYYY')
        : '-'

      const sleep = row?.sleep_hours != null ? `${row.sleep_hours} hrs` : '-'
      const water = row?.water_intake != null ? `${row.water_intake} L` : '-'
      const steps = row?.steps != null ? `${row.steps}` : '-'

      const values = [dateStr, sleep, water, steps]

      pdf.setFontSize(9)
      pdf.setTextColor(31, 41, 55) // gray-800

      values.forEach((val, index) => {
        const w = colWidths[index]

        // Row background (alternating for zebra effect)
        if (index === 0) {
          pdf.setFillColor(y % (rowHeight * 2) === 0 ? 248 : 241, 250, 252) // light blues
          pdf.rect(x, y, tableWidth, rowHeight, 'F')
          pdf.setDrawColor(226, 232, 240)
          pdf.rect(leftMargin, y, tableWidth, rowHeight)
        }

        pdf.text(String(val), x + 2, y + rowHeight / 2 + 2)
        x += w
      })

      y += rowHeight
    })

    pdf.save('vitals.pdf')
  }

  return (
    <div className="flex flex-col gap-4">
      {isFetching && (
        <div className="p-6 text-sm text-gray-600">Loading vitals...</div>
      )}
      {!isFetching && items.length === 0 && (
        <div className="p-10 min-h-[60vh] flex flex-col items-center justify-center text-gray-500">
          <Icons name="no-data-icon" />
          <div className="mt-3 text-sm">No vitals to display</div>
        </div>
      )}

      {!isFetching && items.length > 0 && (
        <>
          <div className="flex justify-end">
            <Button
              className="text-xs"
              label="Generate PDF"
              onClick={handleDownloadVitalsPdf}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        {items.map((row: any) => (
          <div
            key={row.id}
            className="vitals-card border rounded-xl bg-disabledText p-4 shadow-sm hover:shadow-md transition-shadow duration-150"
          >
            <div className="grid grid-cols-7 gap-2 text-sm">
              <div className="rounded-lg p-3 bg-transparent h-full flex flex-col items-center justify-center text-center">
                {row?.recorded_at ? (
                  <>
                    <div className="text-gray-900 font-semibold text-5xl tabular-nums leading-tight mt-2 font-averia">
                      {moment(row.recorded_at).format('YYYY')}
                    </div>
                    <div className="text-gray-700 font-semibold uppercase tracking-wide text-3xl font-averia">
                      {moment(row.recorded_at).format('MMMM')}
                    </div>
                    <div className="text-gray-900 font-bold text-5xl tabular-nums leading-tight font-averia">
                      {moment(row.recorded_at).format('DD')}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-lg">—</div>
                )}
              </div>

              {row?.heart_rate != null && (
                <div className="border rounded-lg p-3 bg-rose-50">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                    <Icons name="heart-rate-icon" />
                    <span>Heart Rate</span>
                  </div>
                  <div className="mt-1 text-gray-800 font-semibold text-center">
                    {`${row.heart_rate} bpm`}
                  </div>
                </div>
              )}

              {row?.blood_pressure !== undefined &&
                row?.blood_pressure !== null &&
                row?.blood_pressure !== '' && (
                  <div className="border rounded-lg p-3 bg-blue-50">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                      <Icons name="blood-pressure-icon" />
                      <span>Blood Pressure</span>
                    </div>
                    <div className="mt-1 text-gray-800 font-semibold text-center">
                      {row?.blood_pressure}
                    </div>
                  </div>
                )}

              {row?.sugar_level != null && (
                <div className="border rounded-lg p-3 bg-amber-50">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                    <Icons name="sugar-level-icon" />
                    <span>Sugar Level</span>
                  </div>
                  <div className="mt-1 text-gray-800 font-semibold text-center">
                    {`${row.sugar_level} mg/dL`}
                  </div>
                </div>
              )}

              {row?.sleep_hours != null && (
                <div className="border rounded-lg p-3 bg-indigo-50">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                    <Icons name="sleep-time-icon" />
                    <span>Sleep</span>
                  </div>
                  <div className="mt-1 text-gray-800 font-semibold text-center">
                    {`${row.sleep_hours} hrs`}
                  </div>
                </div>
              )}

              {row?.water_intake != null && (
                <div className="border rounded-lg p-3 bg-sky-50">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                    <Icons name="water-intake-icon" />
                    <span>Water Intake</span>
                  </div>
                  <div className="mt-1 text-gray-800 font-semibold text-center">
                    {`${row.water_intake} L`}
                  </div>
                </div>
              )}
              {row?.steps != null && (
                <div className="border rounded-lg p-3 bg-sky-50">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                    <Icons name="steps-icon" />
                    <span>Steps</span>
                  </div>
                  <div className="mt-1 text-gray-800 font-semibold text-center">
                    {`${row.steps}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && page < totalPages && (
        <div className="flex justify-center mt-2">
          <button
            className="px-4 py-2 border rounded text-sm disabled:opacity-50"
            disabled={isFetching}
            onClick={() => {
              if (page < totalPages && !isFetching) {
                setPage((p) => p + 1)
              }
            }}
          >
            {isFetching ? 'Loading more...' : 'View more'}
          </button>
        </div>
      )}
    </div>
  )
}
