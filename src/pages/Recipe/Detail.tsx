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

    const addTableRow = (
      columns: string[],
      isIngredientsTable = false,
      isStriped = false
    ) => {
      if (yPosition > 260) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFontSize(10)

      let columnWidths: number[]

      if (isIngredientsTable && columns.length === 4) {
        columnWidths = [
          contentWidth * 0.25,
          contentWidth * 0.15,
          contentWidth * 0.15,
          contentWidth * 0.45,
        ]
      } else {
        columnWidths = columns.map(() => contentWidth / columns.length)
      }

      // Split text
      const splitColumns = columns.map((text, index) =>
        doc.splitTextToSize(text || '--', columnWidths[index] - 5)
      )

      const maxLines = Math.max(...splitColumns.map((col) => col.length))
      const rowHeight = maxLines * 5 + 2 // 🔥 dynamic height

      // ✅ Draw background BEFORE text
      if (isStriped) {
        doc.setFillColor(250, 250, 250)
        doc.rect(margin, yPosition - 4, contentWidth, rowHeight, 'F')
      }

      // Draw text
      splitColumns.forEach((lines, index) => {
        const x =
          margin + columnWidths.slice(0, index).reduce((a, b) => a + b, 0)

        lines.forEach((line: string, i: number) => {
          doc.text(line, x, yPosition + i * 5)
        })
      })

      yPosition += rowHeight
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
      recipe.ingredients.forEach((ing: any, index: number) => {
        addTableRow(
          [
            toTitleCase(ing?.name),
            safeStr(ing?.quantity),
            safeStr(ing?.unit),
            safeStr(ing?.details),
          ],
          true,
          index % 2 === 0 // alternate row color
        )
      })
      yPosition += 5
    }

    // Preparation Notes Section
    if (recipe?.preparation_notes) {
      yPosition += 10
      addSection('Preparation Notes')

      // Parse HTML content and render with formatting
      const renderStyledHTML = (html: string, indent = 0) => {
        // Create a comprehensive HTML parser
        const parseHTML = (html: string): any[] => {
          const result: any[] = []
          let currentText = ''
          const currentStyles = {
            bold: false,
            italic: false,
            underline: false,
            fontSize: 11,
            isHeading: false,
            uppercase: false,
            customFontSize: null as number | null,
          }
          let i = 0

          while (i < html.length) {
            if (html[i] === '<') {
              // Save any pending text
              if (currentText.trim()) {
                result.push({
                  type: 'text',
                  content: currentText.trim(),
                  styles: { ...currentStyles },
                })
                currentText = ''
              }

              // Parse tag
              const tagEnd = html.indexOf('>', i)
              if (tagEnd === -1) break

              const tagWithAttributes = html.substring(i + 1, tagEnd)
              const tag = tagWithAttributes.split(' ')[0].toLowerCase()

              // Parse font-size from style attribute
              let fontSize = null
              if (tagWithAttributes.includes('style=')) {
                const styleMatch = tagWithAttributes.match(
                  /style=["']([^"']*)["']/
                )
                if (styleMatch) {
                  const fontSizeMatch =
                    styleMatch[1].match(/font-size:\s*(\d+)px/)
                  if (fontSizeMatch) {
                    fontSize = parseInt(fontSizeMatch[1])
                  }
                }
              }

              if (tag.startsWith('/')) {
                // Closing tag
                const tagName = tag.substring(1)
                if (tagName === 'b' || tagName === 'strong')
                  currentStyles.bold = false
                if (tagName === 'i' || tagName === 'em')
                  currentStyles.italic = false
                if (tagName === 'u') currentStyles.underline = false
                if (tagName === 'uppercase') currentStyles.uppercase = false
                if (tagName === 'span' && tag.includes('uppercase'))
                  currentStyles.uppercase = false
                if (tagName === 'span') currentStyles.customFontSize = null // Reset custom font size
                if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
                  currentStyles.isHeading = false
                  currentStyles.fontSize = 11
                  currentStyles.bold = false
                }
                if (tagName === 'p') {
                  result.push({ type: 'paragraph-break' })
                }
              } else {
                // Opening tag
                if (tag === 'b' || tag === 'strong') currentStyles.bold = true
                if (tag === 'i' || tag === 'em') currentStyles.italic = true
                if (tag === 'u') currentStyles.underline = true
                if (tag === 'uppercase') currentStyles.uppercase = true
                if (tag.startsWith('span') && tag.includes('uppercase'))
                  currentStyles.uppercase = true
                if (tag === 'span' && fontSize !== null)
                  currentStyles.customFontSize = fontSize
                if (tag === 'h1') {
                  currentStyles.isHeading = true
                  currentStyles.fontSize = 16
                  currentStyles.bold = true
                }
                if (tag === 'h2') {
                  currentStyles.isHeading = true
                  currentStyles.fontSize = 14
                  currentStyles.bold = true
                }
                if (tag === 'h3') {
                  currentStyles.isHeading = true
                  currentStyles.fontSize = 12
                  currentStyles.bold = true
                }
                if (tag === 'p') {
                  result.push({ type: 'paragraph-start' })
                }
              }

              i = tagEnd + 1
            } else {
              currentText += html[i]
              i++
            }
          }

          // Save any remaining text
          if (currentText.trim()) {
            result.push({
              type: 'text',
              content: currentText.trim(),
              styles: { ...currentStyles },
            })
          }

          return result
        }

        const parsedContent = parseHTML(html)

        parsedContent.forEach((item) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = margin
          }

          if (item.type === 'paragraph-start') {
            yPosition += 4 // Add spacing before paragraph
          } else if (item.type === 'paragraph-break') {
            yPosition += 6 // Add spacing after paragraph
          } else if (item.type === 'text') {
            // Set font size - use custom font size if available, otherwise use default
            const fontSizeToUse =
              item.styles.customFontSize !== null
                ? item.styles.customFontSize
                : item.styles.fontSize
            doc.setFontSize(fontSizeToUse)

            doc.setFont(
              'helvetica',
              item.styles.bold && item.styles.italic
                ? 'bolditalic'
                : item.styles.bold
                  ? 'bold'
                  : item.styles.italic
                    ? 'italic'
                    : 'normal'
            )

            // Apply uppercase transformation if needed
            let displayText = item.content
            if (item.styles.uppercase) {
              displayText = displayText.toUpperCase()
            }

            const lines = doc.splitTextToSize(
              displayText,
              contentWidth - indent - 10
            )

            lines.forEach((line: string) => {
              const x = margin + indent + 5
              doc.text(line, x, yPosition)

              // Draw underline if needed
              if (item.styles.underline) {
                const textWidth = doc.getTextWidth(line)
                doc.line(x, yPosition + 1, x + textWidth, yPosition + 1)
              }

              // Adjust line spacing based on font size
              const lineSpacing =
                fontSizeToUse > 14 ? 8 : fontSizeToUse > 12 ? 7 : 6
              yPosition += item.styles.isHeading ? lineSpacing + 2 : lineSpacing
            })
          }
        })
      }

      renderStyledHTML(recipe.preparation_notes)
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
