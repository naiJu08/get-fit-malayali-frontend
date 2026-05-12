import React from 'react'
import moment from 'moment'
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
    (key: string, isCustom?: string) => (row: any) => {
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
          ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
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
      } else if (isCustom === 'boolean') {
        const value = getNestedProperty(row, key)
        const isActive =
          (typeof value === 'boolean' && value === true) ||
          (typeof value === 'number' && value === 1) ||
          (typeof value === 'string' &&
            (value === '1' || value.toLowerCase() === 'true'))
        return {
          cell: (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          ),
          toolTip: isActive ? 'Active' : 'Inactive',
        }
      } else if (isCustom === 'status_badge') {
        const raw = getNestedProperty(row, key)
        const value = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
        const isActive = value === 'active'
        const label = isActive ? 'Active' : 'Inactive'
        return {
          cell: (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {label}
            </span>
          ),
          toolTip: label,
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
    {
      title: 'Name',
      field: 'name',
      renderCell: (row: any) => {
        const value = getNestedProperty(row, 'name') as string | undefined
        const displayValue =
          typeof value === 'string' && value.length > 0
            ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
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
      title: 'Time',
      field: 'time',
      renderCell: createRenderCell('time'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Sequence',
      field: 'sequence_number',
      renderCell: createRenderCell('sequence_number'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Status',
      field: 'status',
      renderCell: createRenderCell('status', 'status_badge'),
      customCell: true,
      ...defaultColumnProps,
    },
  ]

  return column
}
