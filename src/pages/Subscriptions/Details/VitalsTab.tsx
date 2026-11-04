import moment from 'moment'
import { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import { useVitals } from '../../AdminUser/api'
import Icons from '../../../components/common/icons'
import Button from '../../../components/common/buttons/Button'

export default function SubscriptionVitalsTab({
  subscription,
}: {
  subscription: any
}) {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [allItems, setAllItems] = useState<any[]>([])

  const userId = subscription?.user_id
  const subscriptionId = subscription?.id

  const { data, isFetching } = useVitals({
    user_id: userId,
    subscription_id: subscriptionId,
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

    const tableWidth = pageWidth - leftMargin - rightMargin
    const baseColWidths = [0.18, 0.13, 0.17, 0.14, 0.12, 0.12, 0.14]
    const colWidths = baseColWidths.map((p) => p * tableWidth)

    let y = topMargin

    // Title
    pdf.setFontSize(16)
    pdf.setTextColor(40, 40, 40)
    pdf.text('Vitals Report', pageWidth / 2, y, { align: 'center' })
    y += 8

    // Subtitle with subscription context
    pdf.setFontSize(10)
    pdf.setTextColor(120, 120, 120)
    const subtitle = `Subscription #${subscriptionId ?? '-'} · Generated on ${moment().format(
      'DD MMM YYYY, HH:mm'
    )}`
    pdf.text(subtitle, pageWidth / 2, y, { align: 'center' })
    y += 8

    const drawHeader = () => {
      let x = leftMargin

      // Header background band
      pdf.setFillColor(219, 234, 254)
      pdf.setDrawColor(148, 163, 184)
      pdf.setLineWidth(0.2)
      pdf.rect(leftMargin, y, tableWidth, headerHeight, 'FD')

      // Header text
      pdf.setTextColor(30, 64, 175)
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

      pdf.setFontSize(16)
      pdf.setTextColor(40, 40, 40)
      pdf.text('Vitals Report', pageWidth / 2, y, { align: 'center' })
      y += 8

      pdf.setFontSize(10)
      pdf.setTextColor(120, 120, 120)
      const subtitleContinued = `Subscription #${subscriptionId ?? '-'} · Generated on ${moment().format(
        'DD MMM YYYY, HH:mm'
      )}`
      pdf.text(subtitleContinued, pageWidth / 2, y, { align: 'center' })
      y += 8

      drawHeader()
    }

    drawHeader()

    items.forEach((row: any, index: number) => {
      if (y + rowHeight > topMargin + usableHeight) {
        addNewPage()
      }

      let x = leftMargin

      const dateStr = row?.recorded_at
        ? moment(row.recorded_at).format('DD MMM YYYY')
        : '-'
      // const heartRate = row?.heart_rate != null ? `${row.heart_rate} bpm` : '-'
      // const bloodPressure = row?.blood_pressure ? row.blood_pressure : '-'
      // const sugar = row?.sugar_level != null ? `${row.sugar_level} mg/dL` : '-'
      const sleep = row?.sleep_hours != null ? `${row.sleep_hours} hrs` : '-'
      const water = row?.water_intake != null ? `${row.water_intake} L` : '-'
      const steps = row?.steps != null ? `${row.steps}` : '-'

      const values = [
        dateStr,
        // heartRate,
        // bloodPressure,
        // sugar,
        sleep,
        water,
        steps,
      ]

      pdf.setFontSize(9)
      pdf.setTextColor(31, 41, 55)

      values.forEach((val, colIndex) => {
        const w = colWidths[colIndex]

        if (colIndex === 0) {
          const isEvenRow = index % 2 === 0
          if (isEvenRow) {
            pdf.setFillColor(248, 250, 252)
          } else {
            pdf.setFillColor(239, 246, 255)
          }
          pdf.rect(leftMargin, y, tableWidth, rowHeight, 'F')
          pdf.setDrawColor(226, 232, 240)
          pdf.rect(leftMargin, y, tableWidth, rowHeight)
        }

        pdf.text(String(val), x + 2, y + rowHeight / 2 + 2)
        x += w
      })

      y += rowHeight
    })

    pdf.save('subscription-vitals.pdf')
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
        <div className="flex justify-end">
          <Button
            className="text-xs"
            label="Generate PDF"
            onClick={handleDownloadVitalsPdf}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        {items.map((row: any) => (
          <div
            key={row.id}
            className="border rounded-xl bg-disabledText p-4 shadow-sm hover:shadow-md transition-shadow duration-150"
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
                    {`${row.water_intake} G`}
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
