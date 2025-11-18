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
}:
  | {
      onNameClick?: (row: any) => void
      disableNameLink?: boolean
    }
  | AdminListResponse
  | any) => {
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
      title: 'Title',
      field: 'title',
      renderCell: (row: any) => {
        const value = getNestedProperty(row, 'title')
        if (!disableNameLink && onNameClick) {
          return {
            cell: (
              <button
                className="text-blue-600 hover:underline"
                onClick={() => onNameClick && onNameClick(row)}
                type="button"
              >
                {value ?? ''}
              </button>
            ),
            toolTip: value ?? '',
          }
        }
        return {
          cell: <span>{value ?? ''}</span>,
          toolTip: value ?? '',
        }
      },
      customCell: true,
      link: true,
      // rowClick: (row: any) => onNameClick && onNameClick(row),
      // ...defaultColumnProps,
      rowClick:
        !disableNameLink && onNameClick
          ? (row: any) => onNameClick && onNameClick(row)
          : undefined,
      ...defaultColumnProps,
    },
    {
      title: 'Description',
      field: 'description',
      renderCell: createRenderCell('description'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Duration',
      renderCell: createRenderCell('duration_minutes'),
      field: 'duration_minutes',
      customCell: true,
      ...defaultColumnProps,
    },
    // {
    //   title: 'Average Rating',
    //   field: 'average_rating',
    //   renderCell: createRenderCell('average_rating'),
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
    {
      title: 'Video URL',
      field: 'video_url',
      renderCell: createRenderCell('video_url', 'link'),
      customCell: true,
      ...defaultColumnProps,
    },
  ]

  return column
}
