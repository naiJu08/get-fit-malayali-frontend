import moment from 'moment'
import { AdminListResponse } from '../../common/types'
import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

export const getInactiveUserColumns = ({
  onNameClick,
}: {
  onNameClick?: (row: any) => void
}) => {
  const createRenderCell =
    (key: string, isCustom?: string) => (row: AdminListResponse) => {
      if (isCustom === 'capitalize') {
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
      } else if (isCustom === 'fulldate') {
        const propertyValue = getNestedProperty(row, key)

        return {
          cell: propertyValue
            ? moment(propertyValue).format('DD-MM-YYYY')
            : 'Never',
          toolTip: getNestedProperty(row, key) ?? '',
        }
      } else if (isCustom === 'subscription-status') {
        const subscription = getNestedProperty(row, 'subscription') as any
        const status = subscription?.status
        const planName = subscription?.plan_name

        if (!status) {
          return {
            cell: <span className="text-gray-500">No Subscription</span>,
            toolTip: 'No active subscription',
          }
        }

        const isActive = status.toLowerCase() === 'active'
        const pillClass = `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`

        return {
          cell: (
            <div className="flex flex-col">
              <span className={pillClass}>{status}</span>
              {planName && (
                <span className="text-xs text-gray-600 mt-1">{planName}</span>
              )}
            </div>
          ),
          toolTip: `${status} - ${planName || 'No plan'}`,
        }
      } else if (isCustom === 'days-inactive') {
        const daysInactive = getNestedProperty(row, 'days_inactive')
        const value = typeof daysInactive === 'number' ? daysInactive : 0

        let colorClass = 'text-gray-700'
        if (value >= 30) {
          colorClass = 'text-red-600 font-medium'
        } else if (value >= 14) {
          colorClass = 'text-orange-600'
        } else if (value >= 7) {
          colorClass = 'text-yellow-600'
        }

        return {
          cell: <span className={colorClass}>{value} days</span>,
          toolTip: `${value} days inactive`,
        }
      } else if (isCustom === 'subscription-name') {
        const subscription = getNestedProperty(row, 'subscription') as any
        const planName = subscription?.plan_name

        if (!planName) {
          return {
            cell: <span className="text-gray-500">No Plan</span>,
            toolTip: 'No subscription plan',
          }
        }

        return {
          cell: <span className="text-sm">{planName}</span>,
          toolTip: planName,
        }
      } else {
        return {
          cell: getNestedProperty(row, key),
          toolTip: getNestedProperty(row, key) ?? '',
        }
      }
    }

  const column: any[] = [
    {
      title: 'Name',
      field: 'name',
      renderCell: (row: any) => {
        const raw = getNestedProperty(row, 'name') as string | undefined
        const userId = getNestedProperty(row, 'id')
        const displayValue =
          typeof raw === 'string' && raw.length > 0
            ? raw.replace(
                /\w\S*/g,
                (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
              )
            : (raw ?? '')

        return {
          cell: (
            <a
              href={`/users/${userId}/details`}
              onClick={(e) => {
                e.preventDefault()
                if (onNameClick) {
                  onNameClick(row)
                }
              }}
              className="text-blue-600 hover:text-blue-800 cursor-pointer"
              title={`View details for ${displayValue}`}
            >
              {displayValue}
            </a>
          ),
          toolTip: displayValue,
        }
      },
      customCell: true,
      link: true,
      rowClick: (row: any) => onNameClick && onNameClick(row),
      ...defaultColumnProps,
    },
    {
      title: 'Phone Number',
      field: 'phone',
      renderCell: createRenderCell('phone'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Email',
      renderCell: createRenderCell('email'),
      field: 'email',
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Days Inactive',
      field: 'days_inactive',
      renderCell: createRenderCell('days_inactive', 'days-inactive'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Last Activity',
      field: 'last_activity_date',
      renderCell: createRenderCell('last_activity_date', 'fulldate'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Subscription',
      field: 'subscription',
      renderCell: createRenderCell('subscription', 'subscription-name'),
      customCell: true,
      ...defaultColumnProps,
    },
  ]

  return column
}
