import moment from 'moment'

import { AdminListResponse } from '../../common/types'
import { convertUTCtoBrowserTimeZone } from '../../utilities/format'
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
  const createRenderCell =
    (key: string, isCustom?: string) => (row: AdminListResponse) => {
      if (isCustom === 'fullname') {
        return {
          cell: <>{`${row?.user?.first_name} ${row?.user?.last_name}`}</>,
        }
      } else if (isCustom === 'lastlogin') {
        return {
          cell: (
            <>
              {row?.user?.last_login
                ? moment(row?.user?.last_login).format('DD-MM-YYYY')
                : ''}
            </>
          ),
        }
      } else if (isCustom === 'capitalize') {
        const propertyValue = getNestedProperty(row, key)
        const val = typeof propertyValue === 'string' ? propertyValue : ''
        const cap = val
          ? val.replace(
              /\w\S*/g,
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )
          : ''
        return {
          cell: cap,
          toolTip: cap,
        }
      } else if (isCustom === 'link') {
        const propertyValue = getNestedProperty(row, key)
        const url = typeof propertyValue === 'string' ? propertyValue : ''
        return {
          cell: url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2563eb' }}
            >
              {url}
            </a>
          ) : (
            ''
          ),
          toolTip: url,
        }
      } else if (isCustom === 'role-capitalize') {
        const propertyValue = getNestedProperty(row, key)
        const raw = typeof propertyValue === 'string' ? propertyValue : ''
        const lower = raw.toLowerCase()
        const display =
          lower === 'superadmin'
            ? 'Super Admin'
            : raw
              ? raw.replace(
                  /\w\S*/g,
                  (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                )
              : ''
        return {
          cell: display,
          toolTip: display,
        }
      } else if (isCustom === 'fulldate') {
        const propertyValue = getNestedProperty(row, key)

        return {
          cell: convertUTCtoBrowserTimeZone(propertyValue),
          toolTip: getNestedProperty(row, key) ?? '',
        }
      } else {
        return {
          cell: getNestedProperty(row, key),
          toolTip: getNestedProperty(row, key) ?? '',
        }
      }
    }

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
    // {
    //   title: 'Description',
    //   field: 'description',
    //   renderCell: (row: any) => {
    //     const raw = getNestedProperty(row, 'description')
    //     const html = typeof raw === 'string' ? raw : ''
    //     return {
    //       cell: (
    //         <div
    //           className="truncate max-w-xs"
    //           dangerouslySetInnerHTML={{ __html: html }}
    //         />
    //       ),
    //       toolTip: html
    //         .replace(/<[^>]*>/g, ' ')
    //         .replace(/&nbsp;/gi, ' ')
    //         .replace(/\s+/g, ' ')
    //         .trim(),
    //     }
    //   },
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
    {
      title: 'Intensity Level',
      renderCell: createRenderCell('intensity_level'),
      field: 'intensity_level',
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Duration(in minutes)',
      field: 'duration_minutes',
      renderCell: createRenderCell('duration_minutes'),
      customCell: true,
      ...defaultColumnProps,
      sortable: true,
      sortKey: 'duration_minutes',
    },
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
