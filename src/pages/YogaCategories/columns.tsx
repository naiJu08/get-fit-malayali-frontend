import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

const truncateText = (value?: string, limit = 40) => {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.length <= limit) return trimmed
  return `${trimmed.slice(0, limit).trim()}…`
}

const stripHtml = (value?: string) =>
  (value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const getColumns = ({
  onNameClick,
  disableNameLink = false,
}: {
  onNameClick?: (row: any) => void
  disableNameLink?: boolean
}) => {
  const column = [
    {
      title: 'Name',
      field: 'name',
      renderCell: (row: any) => {
        const value = getNestedProperty(row, 'name') as string | undefined
        const raw = typeof value === 'string' ? value : ''
        const formatted = raw
          ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
          : ''
        const displayValue = truncateText(formatted, 50)

        if (!disableNameLink && onNameClick) {
          return {
            cell: (
              <button
                className="text-blue-600 hover:underline"
                onClick={() => onNameClick && onNameClick(row)}
                type="button"
              >
                {displayValue}
              </button>
            ),
            toolTip: formatted,
          }
        }

        return {
          cell: displayValue,
          toolTip: formatted,
        }
      },
      customCell: true,
      link: !disableNameLink && !!onNameClick,
      rowClick:
        !disableNameLink && onNameClick
          ? (row: any) => onNameClick && onNameClick(row)
          : undefined,
      ...defaultColumnProps,
    },
    {
      title: 'Description',
      field: 'description',
      renderCell: (row: any) => {
        const raw = getNestedProperty(row, 'description')
        const html = typeof raw === 'string' ? raw : ''
        const plain = stripHtml(html)
        const display = truncateText(plain, 120)
        return {
          cell: (
            <div
              className="max-w-xs truncate"
              title={plain}
              dangerouslySetInnerHTML={{ __html: display }}
            />
          ),
          toolTip: plain,
        }
      },
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Subcategories',
      field: 'subcategories',
      renderCell: (row: any) => {
        const subs = (row?.subcategories || []) as any[]
        if (!subs.length) {
          return { cell: '-', toolTip: 'No subcategories' }
        }
        const text = subs.map((s) => s.name).join(', ')
        return {
          cell: (
            <div className="flex flex-wrap gap-1">
              {subs.map((s) => (
                <span
                  key={s.id}
                  className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                >
                  {s.name}
                </span>
              ))}
            </div>
          ),
          toolTip: text,
        }
      },
      customCell: true,
      ...defaultColumnProps,
    },
  ]

  return column
}
