import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

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
        const displayValue =
          typeof value === 'string' && value.length > 0
            ? value.charAt(0).toUpperCase() + value.slice(1)
            : (value ?? '')

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
            toolTip: displayValue,
          }
        }

        return {
          cell: displayValue,
          toolTip: displayValue,
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
        return {
          cell: (
            <div
              className="truncate max-w-xs"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ),
          toolTip: html
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
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
