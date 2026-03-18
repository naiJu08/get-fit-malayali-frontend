import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { getRecipeDetails } from './api'
import CreateRecipe from './create'
import jsPDF from 'jspdf'

const toTitleCase = (value: any) => {
  if (value === null || value === undefined) return '--'
  const str = String(value)
  if (!str) return '--'
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const RecipeDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const refreshRecipe = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  const recipe = data?.recipe || data || {}

  const downloadPDF = useCallback(() => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - 2 * margin
    let yPosition = margin

    // Helper functions
    const addSection = (title: string) => {
      if (yPosition > 240) {
        doc.addPage()
        yPosition = margin
      }

      // Section header with underline
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin, yPosition)

      // Draw underline
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2)

      yPosition += 12
      doc.setFont('helvetica', 'normal')
    }

    const addField = (label: string, value: string, indent = 0) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFontSize(11)
      let valueText: string[]

      if (label) {
        doc.setFont('helvetica', 'bold')
        doc.text(`${label}:`, margin + indent, yPosition)

        doc.setFont('helvetica', 'normal')
        valueText = doc.splitTextToSize(value, contentWidth - indent - 50)
        doc.text(valueText, margin + indent + 50, yPosition)
      } else {
        // No label - start text from left margin
        doc.setFont('helvetica', 'normal')
        valueText = doc.splitTextToSize(value, contentWidth - indent)
        doc.text(valueText, margin + indent, yPosition)
      }

      yPosition += Math.max(8, valueText.length * 5)
    }

    const addTableRow = (columns: string[], isIngredientsTable = false) => {
      if (yPosition > 260) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFontSize(10)
      let columnWidths: number[]

      if (isIngredientsTable && columns.length === 3) {
        // Ingredients table: wider name column (50%), narrower quantity (25%), unit (25%)
        columnWidths = [
          contentWidth * 0.5,
          contentWidth * 0.25,
          contentWidth * 0.25,
        ]
      } else {
        // Default: equal width columns
        columnWidths = columns.map(() => contentWidth / columns.length)
      }

      columns.forEach((text, index) => {
        const x =
          margin + columnWidths.slice(0, index).reduce((a, b) => a + b, 0)
        doc.text(text, x, yPosition)
      })

      yPosition += 7
    }

    // Add border to entire page
    doc.setDrawColor(200, 200, 200)
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

    // Header Section
    doc.setFillColor(240, 240, 240)
    doc.rect(10, margin - 10, pageWidth - 20, 30, 'F')

    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('Recipe Details', margin, yPosition)

    doc.setFontSize(18)
    doc.setTextColor(100, 100, 100)
    doc.text(toTitleCase(recipe?.name), margin, yPosition + 10)

    yPosition += 35
    doc.setTextColor(0, 0, 0)

    // Basic Information Section
    yPosition += 1 // Add consistent top spacing
    addSection('Basic Information')

    const basicInfo = [
      ['Category', toTitleCase(recipe?.meal_category)],
      ['Serving Unit', toTitleCase(recipe?.serving_unit)],
      ['Serving Quantity', safeStr(recipe?.quantity)],
      ['Serving Count', safeStr(recipe?.serving_people_count)],
      ['Size', safeStr(recipe?.size)],
      [
        'Total Calories',
        String(recipe?.nutrition?.calories ?? recipe?.calories ?? '--'),
      ],
    ]

    basicInfo.forEach(([label, value]) => {
      addField(label, value)
    })

    // Description Section
    if (recipe?.description) {
      yPosition += 10 // Add consistent top spacing
      addSection('Description')
      addField('', recipe?.description)
    }

    // Nutrition Information Section
    yPosition += 10 // Add consistent top spacing
    addSection('Nutrition Information')

    // Create nutrition table
    const nutritionData = [
      ['Nutrient', 'Amount'],
      ['Protein', safeStr(recipe?.nutrition?.protein)],
      ['Carbohydrates', safeStr(recipe?.nutrition?.carbs)],
      ['Fat', safeStr(recipe?.nutrition?.fat)],
      ['Fiber', safeStr(recipe?.nutrition?.fiber)],
      [
        'Total Calories',
        String(recipe?.nutrition?.calories ?? recipe?.calories ?? '--'),
      ],
    ]

    // Table header
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPosition - 5, contentWidth, 8, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    nutritionData[0].forEach((header, index) => {
      const x = margin + index * (contentWidth / 2)
      doc.text(header, x, yPosition)
    })
    yPosition += 8

    // Table rows
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    for (let i = 1; i < nutritionData.length; i++) {
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(margin, yPosition - 5, contentWidth, 7, 'F')
      }
      nutritionData[i].forEach((data, index) => {
        const x = margin + index * (contentWidth / 2)
        doc.text(data, x, yPosition)
      })
      yPosition += 7
    }
    yPosition += 5

    // Ingredients Section
    if (Array.isArray(recipe?.ingredients) && recipe.ingredients.length > 0) {
      yPosition += 10 // Add consistent top spacing
      addSection('Ingredients')

      // Table header
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, yPosition - 5, contentWidth, 8, 'F')
      doc.setFont('helvetica', 'bold')
      addTableRow(
        ['Ingredient Name', 'Quantity', 'Unit', 'Specifications'],
        true
      )

      // Table rows
      doc.setFont('helvetica', 'normal')
      let rowIndex = 0
      recipe.ingredients.forEach((ing: any) => {
        if (yPosition > 260) {
          doc.addPage()
          yPosition = margin
          // Reset rowIndex for new page to maintain alternating pattern
          rowIndex = 0
        }

        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(margin, yPosition - 5, contentWidth, 7, 'F')
        }
        addTableRow(
          [
            toTitleCase(ing?.name),
            safeStr(ing?.quantity),
            safeStr(ing?.unit),
            safeStr(ing?.details),
          ],
          true
        )
        rowIndex++
      })
      yPosition += 5
    }

    // Preparation Notes Section
    // Preparation Notes Section
    // Preparation Notes Section
    if (recipe?.preparation_notes) {
      yPosition += 10
      addSection('Preparation Notes')

      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = recipe.preparation_notes

      const renderElement = (
        el: HTMLElement,
        indent = 0,
        isOrdered = false,
        orderIndex = 1
      ) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = margin
        }

        const tag = el.tagName.toLowerCase()

        // HEADINGS & PARAGRAPHS
        if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'p') {
          let fontSize = 11
          let fontStyle: 'normal' | 'bold' = 'normal'

          if (tag === 'h1') {
            fontSize = 16
            fontStyle = 'bold'
          } else if (tag === 'h2') {
            fontSize = 14
            fontStyle = 'bold'
          } else if (tag === 'h3') {
            fontSize = 12
            fontStyle = 'bold'
          }

          doc.setFontSize(fontSize)
          doc.setFont('helvetica', fontStyle)

          const lines: string[] = doc.splitTextToSize(
            el.textContent || '',
            contentWidth - indent - 10
          )

          lines.forEach((line: string) => {
            if (yPosition > 270) {
              doc.addPage()
              yPosition = margin
            }
            doc.text(line, margin + indent + 5, yPosition)
            yPosition += 6
          })

          yPosition += 4
        }

        // UNORDERED LIST
        else if (tag === 'ul') {
          Array.from(el.children).forEach((li) => {
            renderElement(li as HTMLElement, indent + 5, false)
          })
        }

        // ORDERED LIST
        else if (tag === 'ol') {
          Array.from(el.children).forEach((li, index) => {
            renderElement(li as HTMLElement, indent + 5, true, index + 1)
          })
        }

        // LIST ITEM
        else if (tag === 'li') {
          doc.setFontSize(11)
          doc.setFont('helvetica', 'normal')

          // ✅ FIXED HERE
          const prefix = isOrdered ? `${orderIndex}. ` : '• '

          const cleanText = (el.textContent || '')
            .replace(/\u00A0/g, ' ') // remove &nbsp;
            .replace(/\s+/g, ' ') // collapse multiple spaces
            .trim()

          const text = prefix + cleanText

          const lines: string[] = doc.splitTextToSize(
            text,
            contentWidth - indent - 10
          )

          lines.forEach((line: string) => {
            if (yPosition > 270) {
              doc.addPage()
              yPosition = margin
            }
            doc.text(line, margin + indent + 5, yPosition)
            yPosition += 6
          })

          yPosition += 2
        }
      }

      Array.from(tempDiv.children).forEach((el) =>
        renderElement(el as HTMLElement)
      )
    }

    // Additional Information Section
    if (recipe?.additional_info) {
      yPosition += 10 // Add consistent top spacing
      addSection('Additional Information')

      const additionalText = recipe?.additional_info
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")

      const additionalInfo = doc.splitTextToSize(
        additionalText,
        contentWidth - 10
      )
      doc.setFontSize(11)
      additionalInfo.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(line, margin + 10, yPosition)
        yPosition += 6
      })
    }

    // Footer
    const footerY = pageHeight - 20
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
      margin,
      footerY
    )
    doc.text(
      `Get Fit Malayali - Recipe Details`,
      pageWidth - margin - 60,
      footerY
    )

    // Save the PDF
    doc.save(`${recipe?.name || 'recipe'}-details.pdf`)
  }, [recipe])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!id) return
      try {
        setLoading(true)
        const res = await getRecipeDetails(String(id))
        if (!mounted) return
        setData(res)
        setError('')
      } catch (e: any) {
        if (!mounted) return
        setError(e?.response?.data?.message || 'Failed to load recipe')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    run()

    return () => {
      mounted = false
    }
  }, [id, reloadKey])

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/recipe')} aria-label="Back">
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">Recipe Details</h1>
        </div>
        <div className="flex items-center gap-2">
          {recipe?.id && (
            <button
              type="button"
              className="inline-flex items-center rounded-lg bg-white border border-primaryGreen text-primaryGreen px-4 py-2 text-sm font-medium"
              onClick={downloadPDF}
            >
              <Icons name="download" />
              <span className="ml-2">Download PDF</span>
            </button>
          )}
          {recipe?.id && (
            <button
              type="button"
              className="inline-flex items-center rounded-lg bg-primaryGreen text-white px-4 py-2 text-sm font-medium hover:bg-primaryGreen/90 focus:outline-none focus:ring-2 focus:ring-primaryGreen/50"
              onClick={() => setEditDrawerOpen(true)}
            >
              <Icons name="edit" />
              <span className="ml-2">Edit Recipe</span>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="p-6">
          <InfoBox content="Loading recipe details..." />
        </div>
      )}
      {error && !loading && (
        <div className="p-6">
          <InfoBox content={error} />
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Name" value={toTitleCase(recipe?.name)} />
            <DetailItem
              label="Category"
              value={toTitleCase(recipe?.meal_category)}
            />
            <DetailItem
              label=" Total Calories"
              value={recipe?.nutrition?.calories ?? recipe?.calories}
            />
            <DetailItem
              label="Serving Unit"
              value={toTitleCase(recipe?.serving_unit)}
            />
            <DetailItem
              label="Serving Quantity"
              value={recipe?.quantity?.toString() ?? ''}
            />
            <DetailItem
              label="Serving Count"
              value={recipe?.serving_people_count?.toString() ?? ''}
            />
            <DetailItem label="Size" value={recipe?.size ?? ''} />

            <DetailItem label="Description" value={recipe?.description} />

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
                  <span className="text-gray-500">Total calories: </span>
                  {safeStr(recipe?.nutrition?.calories)}
                </div>
                <div>
                  <span className="text-gray-500">Protein: </span>
                  {safeStr(recipe?.nutrition?.protein)}
                </div>
                <div>
                  <span className="text-gray-500">Carbs: </span>
                  {safeStr(recipe?.nutrition?.carbs)}
                </div>
                <div>
                  <span className="text-gray-500">Fat: </span>
                  {safeStr(recipe?.nutrition?.fat)}
                </div>
                <div>
                  <span className="text-gray-500">Fiber: </span>
                  {safeStr(recipe?.nutrition?.fiber)}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 border rounded-lg p-3 bg-white">
            <div className="text-xs text-gray-500 mb-2">
              Additional Information
            </div>
            <div
              className="text-sm"
              dangerouslySetInnerHTML={{
                __html:
                  recipe?.additional_info?.replace(/\n/g, '<br>') ||
                  'No additional information',
              }}
            />
          </div>
          {/* Ingredients */}
          <div className="mt-4 border rounded-lg p-3 bg-white">
            <div className="text-xs text-gray-500 mb-2">Ingredients</div>
            {Array.isArray(recipe?.ingredients) &&
            recipe.ingredients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-1 pr-4">Name</th>
                      <th className="py-1 pr-4">Quantity</th>
                      <th className="py-1 pr-4">Unit</th>
                      <th className="py-1 pr-4">Specifications</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipe.ingredients.map((ing: any) => (
                      <tr
                        key={ing?.id ?? `${ing?.name}-${ing?.unit}`}
                        className="border-t"
                      >
                        <td className="py-1 pr-4">{toTitleCase(ing?.name)}</td>
                        <td className="py-1 pr-4">{safeStr(ing?.quantity)}</td>
                        <td className="py-1 pr-4">{safeStr(ing?.unit)}</td>
                        <td className="py-1 pr-4">{safeStr(ing?.details)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm">--</div>
            )}
          </div>

          {/* Preparation Notes */}
          <div className="mt-4 border rounded-lg p-3 bg-white">
            <div className="text-xs text-gray-500 mb-2">Preparation Notes</div>
            <div
              className="
    max-w-none
    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4
    [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3
    [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2
    [&_p]:mb-2
    [&_ul]:list-disc [&_ul]:ml-5
    [&_ol]:list-decimal [&_ol]:ml-5
    [&_li]:mb-1
  "
              dangerouslySetInnerHTML={{
                __html:
                  capitalizeFirstLetters(recipe?.preparation_notes) || '--',
              }}
            />
          </div>
        </>
      )}
      <CreateRecipe
        isDrawerOpen={editDrawerOpen}
        handleClose={() => setEditDrawerOpen(false)}
        handleRefresh={refreshRecipe}
        edit
        rowData={recipe}
      />
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: any }) {
  const isUrl = typeof value === 'string' && /^https?:\/\/\S+$/i.test(value)
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">
        {isUrl ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2563eb' }}
          >
            {value}
          </a>
        ) : (
          safeStr(value)
        )}
      </div>
    </div>
  )
}

function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}

function capitalizeFirstLetters(html: string): string {
  if (!html || html === '--') return html

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  // Process all text nodes
  const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT)

  const textNodes: Text[] = []
  let node: Text | null = null

  // Collect all text nodes
  while ((node = walker.nextNode() as Text)) {
    if (node.textContent && node.textContent.trim()) {
      textNodes.push(node)
    }
  }

  // Process each text node - capitalize only first letter of the line
  textNodes.forEach((textNode) => {
    const text = textNode.textContent || ''
    // Capitalize only the first letter of the text (first letter of the line)
    const capitalizedText = text.replace(/^\w/, (char) => char.toUpperCase())
    textNode.textContent = capitalizedText
  })

  return tempDiv.innerHTML
}

export default RecipeDetail
