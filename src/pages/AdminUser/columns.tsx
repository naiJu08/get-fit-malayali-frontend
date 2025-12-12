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
  activeRole,
}:
  | {
      onNameClick?: (row: any) => void
      activeRole?: 'user' | 'nutritionist'
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
      } else if (isCustom === 'status-colored') {
        const propertyValue = getNestedProperty(row, key)
        const raw = typeof propertyValue === 'string' ? propertyValue : ''
        const lower = raw.toLowerCase()
        const display = raw
          ? raw.replace(
              /\w\S*/g,
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )
          : ''
        const isActive = lower === 'active'
        const pillClass = `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`
        return {
          cell: <span className={pillClass}>{display}</span>,
          toolTip: display,
        }
      } else {
        return {
          cell: getNestedProperty(row, key),
          toolTip: getNestedProperty(row, key) ?? '',
        }
      }
    }

  const isNutritionist = activeRole === 'nutritionist'

  const column: any[] = [
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
        const raw = getNestedProperty(row, 'name') as string | undefined
        const displayValue =
          typeof raw === 'string' && raw.length > 0
            ? raw.charAt(0).toUpperCase() + raw.slice(1)
            : (raw ?? '')

        return {
          cell: displayValue,
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
      title: 'Role',
      field: 'role',
      renderCell: createRenderCell('role', 'role-capitalize'),
      customCell: true,
      ...defaultColumnProps,
    },
    // BMI column will be conditionally added below
  ]

  if (!isNutritionist) {
    column.push({
      title: 'BMI',
      field: 'bmi',
      renderCell: createRenderCell('bmi'),
      customCell: true,
      ...defaultColumnProps,
    })
  }

  column.push({
    title: 'Status',
    field: 'status',
    renderCell: createRenderCell('status', 'status-colored'),
    ...defaultColumnProps,
    customCell: true,
  })

  return column
}
