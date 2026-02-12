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
    // {
    //   title: 'Name',
    //   field: 'name',
    //   ...defaultColumnProps,
    //   fixed: true,
    //   renderCell: createRenderCell('user.first_name', 'fullname'),
    //   customCell: true,
    //   sortKey: 'user__first_name',
    //   link: true,
    //   rowClick: (row: any) => onViewAction(row),
    // },
    // {
    //   title: 'Role',
    //   field: 'job_role',
    //   renderCell: createRenderCell('user.group.name'),
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
    {
      title: 'Name',
      field: 'name',
      renderCell: (row: any) => {
        const value = getNestedProperty(row, 'name') as string | undefined
        const raw = typeof value === 'string' ? value : ''
        const formatted = raw
          ? raw.replace(
              /\w\S*/g,
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
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
    // {
    //   title: 'Intensity Level',
    //   renderCell: createRenderCell('intensity_level'),
    //   field: 'intensity_level',
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
    // {
    //   title: 'Duration(in minutes)',
    //   field: 'duration_minutes',
    //   renderCell: createRenderCell('duration_minutes'),
    //   customCell: true,
    //   ...defaultColumnProps,
    //   sortable: true,
    //   sortKey: 'duration_minutes',
    // },
    // {
    //   title: 'Video URL',
    //   field: 'video_url',
    //   renderCell: createRenderCell('video_url', 'link'),
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
  ]

  return column
}
